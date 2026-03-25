"""Analysis and lesson generation endpoints."""
import os
import tempfile
from dataclasses import asdict

from fastapi import APIRouter, Depends, UploadFile, File, BackgroundTasks
from pydantic import BaseModel
from typing import Optional

from guitar_teacher.api.deps import require_auth
from guitar_teacher.api.github_client import GitHubClient
from guitar_teacher.api.jobs import job_tracker
from guitar_teacher.core.analyzer import analyze_file
from guitar_teacher.lessons.generator import generate_lessons

router = APIRouter(tags=["analysis"], dependencies=[Depends(require_auth)])


def get_github() -> GitHubClient:
    return GitHubClient()


class GenerateRequest(BaseModel):
    file_path: str  # Path to GP/JSON file in repo (e.g., "queue/Artist - Song.gp")
    artist_slug: str
    song_slug: str
    order: str = "difficulty"


@router.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    """Upload a GP or JSON file and get SoloAnalysis back."""
    data = await file.read()
    suffix = os.path.splitext(file.filename or "file.json")[1]

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(data)
        tmp_path = tmp.name

    try:
        analysis = analyze_file(tmp_path)
    finally:
        os.unlink(tmp_path)

    return asdict(analysis)


@router.post("/lessons/generate", status_code=202)
async def generate(req: GenerateRequest, background_tasks: BackgroundTasks):
    """Generate lessons from a SoloAnalysis and commit to repo. Returns job ID."""
    job_id = job_tracker.create(f"Generating lessons for {req.artist_slug}/{req.song_slug}")
    background_tasks.add_task(_run_generation, job_id, req)
    return {"job_id": job_id, "status": "accepted"}


async def _run_generation(job_id: str, req: GenerateRequest):
    """Background: download GP/JSON from repo, analyze, generate lessons, upload."""
    job_tracker.update(job_id, status="running", progress="Downloading file from repo")
    gh = get_github()

    try:
        result = await gh.read_binary(req.file_path)
        if result is None:
            job_tracker.update(job_id, status="failed", error=f"File not found: {req.file_path}")
            return

        file_bytes, _sha = result
        suffix = os.path.splitext(req.file_path)[1]

        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        job_tracker.update(job_id, progress="Analyzing file")
        try:
            analysis = analyze_file(tmp_path)
        finally:
            os.unlink(tmp_path)

        with tempfile.TemporaryDirectory() as tmp_dir:
            generate_lessons(analysis, tmp_dir, section_order=req.order)

            song_path = f"songs/{req.artist_slug}/{req.song_slug}"
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
                    await gh.write_file(repo_path, content, message=f"Add {rel_path}")

        job_tracker.update(job_id, status="completed", result={
            "artist": req.artist_slug,
            "song": req.song_slug,
        })
    except Exception as e:
        job_tracker.update(job_id, status="failed", error=str(e))
    finally:
        await gh.close()
