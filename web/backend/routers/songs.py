from typing import List
from fastapi import APIRouter, HTTPException
from web.backend.services import storage as storage_mod
from web.backend.models import SongSummary, SongDetail

router = APIRouter(tags=["songs"])


@router.get("", response_model=List[SongSummary])
def list_songs():
    return [SongSummary(**{k: s[k] for k in SongSummary.model_fields})
            for s in storage_mod.list_songs(songs_dir=storage_mod.SONGS_DIR)]


@router.get("/{song_id}", response_model=SongDetail)
def get_song(song_id: str):
    song = storage_mod.load_song(song_id, songs_dir=storage_mod.SONGS_DIR)
    if song is None:
        raise HTTPException(404, detail="Song not found")
    return SongDetail(**song)


@router.post("/{song_id}/sections/{section_id}/complete", response_model=SongDetail)
def toggle_complete(song_id: str, section_id: str):
    result = storage_mod.toggle_section_complete(song_id, section_id, songs_dir=storage_mod.SONGS_DIR)
    if result is None:
        raise HTTPException(404, detail="Song not found")
    return SongDetail(**result)


@router.delete("/{song_id}", status_code=204)
def delete_song(song_id: str):
    if storage_mod.load_song(song_id, songs_dir=storage_mod.SONGS_DIR) is None:
        raise HTTPException(404, detail="Song not found")
    storage_mod.delete_song(song_id, songs_dir=storage_mod.SONGS_DIR)
