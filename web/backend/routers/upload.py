import os
import tempfile
from fastapi import APIRouter, File, UploadFile, HTTPException
from web.backend.services.processor import process_gp_file
from web.backend.services.storage import save_song
from web.backend.models import SongSummary

router = APIRouter(tags=["upload"])

ALLOWED = {".gp", ".gp3", ".gp4", ".gp5", ".gpx", ".json"}


@router.post("/upload", response_model=SongSummary, status_code=201)
async def upload_file(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED:
        raise HTTPException(400, detail=f"Unsupported file type '{ext}'")

    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        song_data = process_gp_file(tmp_path)
    except Exception as e:
        raise HTTPException(422, detail=f"Processing failed: {e}")
    finally:
        os.unlink(tmp_path)

    save_song(song_data)
    return SongSummary(**{k: song_data[k] for k in SongSummary.model_fields})
