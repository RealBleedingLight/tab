from pathlib import Path
import pytest
from web.backend.services.processor import make_song_id, process_gp_file

# Path to sample tab.json — lives in the main repo, not the worktree
# Worktree is at <repo>/.worktrees/guitar-teacher-web, so parents[5] reaches <repo>/
_WORKTREE_ROOT = Path(__file__).parents[4]  # .worktrees/guitar-teacher-web -> .worktrees
_REPO_ROOT = _WORKTREE_ROOT.parent          # .worktrees -> repo root
SAMPLE_JSON = _REPO_ROOT / "songs/guthrie-govan/man-of-steel/tab.json"


def test_make_song_id():
    assert make_song_id("Man of Steel", "Guthrie Govan") == "guthrie-govan-man-of-steel"
    assert make_song_id("Tornado Of Souls", "Megadeth") == "megadeth-tornado-of-souls"
    assert make_song_id("  Hello World  ", "Some  Artist") == "some-artist-hello-world"


@pytest.mark.skipif(not SAMPLE_JSON.exists(), reason="Sample JSON not found")
def test_process_json_file():
    result = process_gp_file(str(SAMPLE_JSON))
    assert result["id"] == "guthrie-govan-man-of-steel"
    assert len(result["sections"]) > 0
    assert result["tempo"] > 0
    for s in result["sections"]:
        assert "id" in s
        assert "bar_start" in s
        assert "bar_end" in s
        assert "difficulty" in s
        assert "techniques" in s
        assert isinstance(s["techniques"], list)
