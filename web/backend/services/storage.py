import json
import os
from typing import Optional
from web.backend.config import SONGS_DIR


def _path(song_id: str, songs_dir: str) -> str:
    return os.path.join(songs_dir, f"{song_id}.json")


def save_song(data: dict, songs_dir: str = SONGS_DIR) -> None:
    os.makedirs(songs_dir, exist_ok=True)
    with open(_path(data["id"], songs_dir), "w") as f:
        json.dump(data, f, indent=2)


def load_song(song_id: str, songs_dir: str = SONGS_DIR) -> Optional[dict]:
    p = _path(song_id, songs_dir)
    if not os.path.exists(p):
        return None
    with open(p) as f:
        return json.load(f)


def list_songs(songs_dir: str = SONGS_DIR) -> list:
    if not os.path.exists(songs_dir):
        return []
    results = []
    for f in sorted(os.listdir(songs_dir)):
        if f.endswith(".json"):
            with open(os.path.join(songs_dir, f)) as fh:
                results.append(json.load(fh))
    return results


def delete_song(song_id: str, songs_dir: str = SONGS_DIR) -> None:
    p = _path(song_id, songs_dir)
    if os.path.exists(p):
        os.remove(p)


def toggle_section_complete(song_id: str, section_id: str, songs_dir: str = SONGS_DIR) -> Optional[dict]:
    data = load_song(song_id, songs_dir)
    if data is None:
        return None
    found = False
    for s in data["sections"]:
        if s["id"] == section_id:
            s["completed"] = not s.get("completed", False)
            found = True
            break
    if not found:
        return None
    data["completed_count"] = sum(1 for s in data["sections"] if s.get("completed"))
    save_song(data, songs_dir)
    return data
