"""Song data and progress endpoints."""
import os

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from guitar_teacher.api.deps import require_auth
from guitar_teacher.api.github_client import GitHubClient

router = APIRouter(prefix="/songs", tags=["songs"], dependencies=[Depends(require_auth)])


def get_github() -> GitHubClient:
    """Get a GitHubClient instance."""
    return GitHubClient()


class SaveProgressRequest(BaseModel):
    context_content: str
    log_entry: str
    commit_message: str


@router.get("")
async def list_songs():
    gh = get_github()
    try:
        artists = await gh.list_directory("songs")
        songs = []
        for artist_dir in artists:
            if artist_dir["type"] != "dir":
                continue
            song_dirs = await gh.list_directory(artist_dir["path"])
            for song_dir in song_dirs:
                if song_dir["type"] != "dir":
                    continue
                context = None
                result = await gh.read_file(f"{song_dir['path']}/.context.md")
                if result:
                    context = result[0]
                songs.append({
                    "artist": artist_dir["name"],
                    "song": song_dir["name"],
                    "path": song_dir["path"],
                    "context": context,
                })
        return {"songs": songs}
    finally:
        await gh.close()


@router.get("/{artist}/{song}/context")
async def get_context(artist: str, song: str):
    gh = get_github()
    try:
        result = await gh.read_file(f"songs/{artist}/{song}/.context.md")
        if result is None:
            raise HTTPException(status_code=404, detail="Context file not found")
        content, sha = result
        return {"content": content, "sha": sha}
    finally:
        await gh.close()


@router.get("/{artist}/{song}/lessons/{number}")
async def get_lesson(artist: str, song: str, number: int):
    gh = get_github()
    try:
        lessons = await gh.list_directory(f"songs/{artist}/{song}/lessons")
        target = None
        for item in lessons:
            if item["type"] == "file" and item["name"].startswith(f"{number:02d}-"):
                target = item["path"]
                break
        if target is None:
            raise HTTPException(status_code=404, detail=f"Lesson {number} not found")
        result = await gh.read_file(target)
        if result is None:
            raise HTTPException(status_code=404, detail=f"Lesson {number} not found")
        content, sha = result
        return {"content": content, "sha": sha, "filename": os.path.basename(target)}
    finally:
        await gh.close()


@router.delete("/{artist}/{song}")
async def delete_song(artist: str, song: str):
    gh = get_github()
    try:
        await gh.delete_directory(f"songs/{artist}/{song}", message=f"Delete {artist}/{song}")
        return {"status": "deleted"}
    finally:
        await gh.close()


@router.post("/{artist}/{song}/save-progress")
async def save_progress(artist: str, song: str, req: SaveProgressRequest):
    gh = get_github()
    try:
        context_result = await gh.read_file(f"songs/{artist}/{song}/.context.md")
        context_sha = context_result[1] if context_result else None

        await gh.write_file(
            f"songs/{artist}/{song}/.context.md",
            req.context_content,
            message=req.commit_message,
            sha=context_sha,
        )

        await gh.append_to_file(
            f"songs/{artist}/{song}/practice-log.md",
            req.log_entry,
            message=f"{req.commit_message} (log)",
        )

        return {"status": "saved"}
    finally:
        await gh.close()
