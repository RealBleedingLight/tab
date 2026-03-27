import pytest
from fastapi.testclient import TestClient
from web.backend.main import app
import web.backend.services.storage as storage_mod

client = TestClient(app)

SAMPLE = {
    "id": "test-artist-test-song",
    "title": "Test Song",
    "artist": "Test Artist",
    "key": "E minor",
    "tempo": 120,
    "tuning": ["E", "A", "D", "G", "B", "e"],
    "section_count": 2,
    "completed_count": 0,
    "processed_at": "2026-01-01T00:00:00+00:00",
    "sections": [
        {"id": "section-a", "name": "Section A", "bar_start": 1, "bar_end": 4,
         "difficulty": 3.0, "techniques": ["bend"], "overall_scale": "E minor", "completed": False},
        {"id": "section-b", "name": "Section B", "bar_start": 5, "bar_end": 8,
         "difficulty": 5.0, "techniques": ["hammer_on"], "overall_scale": "E minor", "completed": False},
    ],
    "full_tab": "e|---|\nB|---|",
}


@pytest.fixture(autouse=True)
def seed(tmp_path, monkeypatch):
    songs_dir = str(tmp_path / "songs")
    monkeypatch.setattr(storage_mod, "SONGS_DIR", songs_dir)
    storage_mod.save_song(SAMPLE, songs_dir=songs_dir)


def test_list_songs():
    r = client.get("/songs")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 1
    assert data[0]["id"] == "test-artist-test-song"
    assert "full_tab" not in data[0]  # list returns summaries only


def test_get_song():
    r = client.get("/songs/test-artist-test-song")
    assert r.status_code == 200
    data = r.json()
    assert data["id"] == "test-artist-test-song"
    assert len(data["sections"]) == 2


def test_get_missing_song_returns_404():
    r = client.get("/songs/nonexistent")
    assert r.status_code == 404


def test_toggle_section_complete():
    r = client.post("/songs/test-artist-test-song/sections/section-a/complete")
    assert r.status_code == 200
    data = r.json()
    section = next(s for s in data["sections"] if s["id"] == "section-a")
    assert section["completed"] is True
    assert data["completed_count"] == 1

    r2 = client.post("/songs/test-artist-test-song/sections/section-a/complete")
    data2 = r2.json()
    section2 = next(s for s in data2["sections"] if s["id"] == "section-a")
    assert section2["completed"] is False


def test_delete_song():
    r = client.delete("/songs/test-artist-test-song")
    assert r.status_code == 204
    assert client.get("/songs/test-artist-test-song").status_code == 404
