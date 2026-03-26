import os
import pytest
from web.backend.services.storage import save_song, load_song, list_songs, delete_song, toggle_section_complete

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
    ],
    "full_tab": "e|---|\nB|---|",
}


@pytest.fixture
def songs_dir(tmp_path):
    return str(tmp_path / "songs")


def test_save_and_load_song(songs_dir):
    save_song(SAMPLE, songs_dir=songs_dir)
    result = load_song("test-artist-test-song", songs_dir=songs_dir)
    assert result["title"] == "Test Song"
    assert result["id"] == "test-artist-test-song"


def test_list_songs(songs_dir):
    save_song(SAMPLE, songs_dir=songs_dir)
    songs = list_songs(songs_dir=songs_dir)
    assert len(songs) == 1
    assert songs[0]["id"] == "test-artist-test-song"


def test_delete_song(songs_dir):
    save_song(SAMPLE, songs_dir=songs_dir)
    delete_song("test-artist-test-song", songs_dir=songs_dir)
    assert list_songs(songs_dir=songs_dir) == []


def test_load_missing_returns_none(songs_dir):
    os.makedirs(songs_dir, exist_ok=True)
    assert load_song("nonexistent", songs_dir=songs_dir) is None


def test_toggle_section_complete(songs_dir):
    save_song(SAMPLE, songs_dir=songs_dir)
    result = toggle_section_complete("test-artist-test-song", "section-a", songs_dir=songs_dir)
    section = next(s for s in result["sections"] if s["id"] == "section-a")
    assert section["completed"] is True
    assert result["completed_count"] == 1
    # Toggle again → uncomplete
    result2 = toggle_section_complete("test-artist-test-song", "section-a", songs_dir=songs_dir)
    section2 = next(s for s in result2["sections"] if s["id"] == "section-a")
    assert section2["completed"] is False
