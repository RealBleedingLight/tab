"""GP file queue endpoints — upload, list, process."""
import asyncio
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from pydantic import BaseModel

from guitar_teacher.api.deps import require_auth
from guitar_teacher.api.github_client import GitHubClient
from guitar_teacher.api.jobs import job_tracker

router = APIRouter(prefix="/queue", tags=["queue"], dependencies=[Depends(require_auth)])


def get_github() -> GitHubClient:
    return GitHubClient()


class ProcessRequest(BaseModel):
    model: Optional[str] = None
    order: str = "difficulty"


@router.get("")
async def list_queue():
    gh = get_github()
    try:
        items = await gh.list_directory("queue")
        files = [item for item in items if item["type"] == "file"]
        return {"files": files}
    finally:
        await gh.close()


@router.post("/upload")
async def upload_to_queue(file: UploadFile = File(...)):
    gh = get_github()
    try:
        data = await file.read()
        await gh.upload_binary(
            f"queue/{file.filename}",
            data,
            message=f"Queue: upload {file.filename}",
        )
        return {"status": "uploaded", "filename": file.filename}
    finally:
        await gh.close()


@router.post("/process/{filename}", status_code=202)
async def process_file(filename: str, req: ProcessRequest, background_tasks: BackgroundTasks):
    job_id = job_tracker.create(f"Processing {filename}")
    background_tasks.add_task(_run_processing, job_id, filename, req.model, req.order)
    return {"job_id": job_id, "status": "accepted"}


@router.get("/status/{job_id}")
def get_status(job_id: str):
    status = job_tracker.get(job_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return status


async def _run_processing(job_id: str, filename: str, model: Optional[str], order: str):
    """Background task: download GP file, analyze, generate lessons, commit."""
    import tempfile
    import os
    from guitar_teacher.core.analyzer import analyze_file
    from guitar_teacher.lessons.generator import generate_lessons

    job_tracker.update(job_id, status="running", progress="Downloading file from repo")
    gh = get_github()

    try:
        result = await gh.read_binary(f"queue/{filename}")
        if result is None:
            job_tracker.update(job_id, status="failed", error=f"File not found: queue/{filename}")
            return

        file_bytes, _sha = result

        name_part = os.path.splitext(filename)[0]
        parts = name_part.split(" - ", 1)
        if len(parts) != 2:
            job_tracker.update(job_id, status="failed", error=f"Filename must be 'Artist - Song.ext', got: {filename}")
            return

        artist_slug = parts[0].strip().lower().replace(" ", "-")
        song_slug = parts[1].strip().lower().replace(" ", "-")

        job_tracker.update(job_id, progress="Analyzing file")

        with tempfile.NamedTemporaryFile(suffix=os.path.splitext(filename)[1], delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        try:
            analysis = analyze_file(tmp_path)
        finally:
            os.unlink(tmp_path)

        job_tracker.update(job_id, progress=f"Generating lessons ({len(analysis.sections)} sections)")

        with tempfile.TemporaryDirectory() as tmp_dir:
            generate_lessons(analysis, tmp_dir, section_order=order)

            song_path = f"songs/{artist_slug}/{song_slug}"
            file_count = 0
            for root, dirs, files in os.walk(tmp_dir):
                for fname in files:
                    local_path = os.path.join(root, fname)
                    rel_path = os.path.relpath(local_path, tmp_dir)
                    repo_path = f"{song_path}/{rel_path}"

                    with open(local_path, "r") as f:
                        content = f.read()

                    file_count += 1
                    job_tracker.update(job_id, progress=f"Uploading file {file_count}: {rel_path}")
                    await gh.write_file(repo_path, content, message=f"Add {rel_path} for {name_part}")

        job_tracker.update(job_id, status="completed", result={
            "artist": artist_slug,
            "song": song_slug,
            "sections": len(analysis.sections),
            "key": analysis.key,
        })

    except Exception as e:
        job_tracker.update(job_id, status="failed", error=str(e))
    finally:
        await gh.close()
