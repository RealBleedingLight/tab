import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from guitar_teacher.api.app import create_app
from guitar_teacher.api.auth import create_token


@pytest.fixture
def client():
    app = create_app()
    return TestClient(app)


@pytest.fixture
def cookies():
    return {"token": create_token()}


def _mock_github():
    """Return a mock GitHubClient."""
    mock = AsyncMock()
    return mock


def test_list_songs(client, cookies):
    mock_gh = _mock_github()

    async def list_side_effect(path):
        if path == "songs":
            return [{"name": "megadeth", "type": "dir", "path": "songs/megadeth"}]
        elif path == "songs/megadeth":
            return [{"name": "tornado-of-souls", "type": "dir", "path": "songs/megadeth/tornado-of-souls"}]
        return []
    mock_gh.list_directory.side_effect = list_side_effect
    mock_gh.read_file.return_value = ("---\ncurrent_lesson: 5\ntotal_lessons: 22\n---", "sha")

    with patch("guitar_teacher.api.routers.songs.get_github", return_value=mock_gh):
        resp = client.get("/songs", cookies=cookies)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["songs"]) == 1
    assert data["songs"][0]["artist"] == "megadeth"


def test_get_context(client, cookies):
    mock_gh = _mock_github()
    mock_gh.read_file.return_value = ("current_lesson: 5\ntempo: 80", "sha123")

    with patch("guitar_teacher.api.routers.songs.get_github", return_value=mock_gh):
        resp = client.get("/songs/megadeth/tornado-of-souls/context", cookies=cookies)
    assert resp.status_code == 200
    assert "content" in resp.json()


def test_get_lesson(client, cookies):
    mock_gh = _mock_github()
    mock_gh.list_directory.return_value = [
        {"name": "05-picking.md", "type": "file", "path": "songs/megadeth/tornado-of-souls/lessons/05-picking.md"}
    ]
    mock_gh.read_file.return_value = ("# Lesson 5\n\nContent here", "sha123")

    with patch("guitar_teacher.api.routers.songs.get_github", return_value=mock_gh):
        resp = client.get("/songs/megadeth/tornado-of-souls/lessons/5", cookies=cookies)
    assert resp.status_code == 200
    assert "content" in resp.json()


def test_save_progress(client, cookies):
    mock_gh = _mock_github()
    mock_gh.read_file.return_value = ("current_lesson: 5", "sha-old")
    mock_gh.write_file.return_value = "new-sha"
    mock_gh.append_to_file.return_value = "new-sha2"

    with patch("guitar_teacher.api.routers.songs.get_github", return_value=mock_gh):
        resp = client.post(
            "/songs/megadeth/tornado-of-souls/save-progress",
            cookies=cookies,
            json={
                "context_content": "current_lesson: 6\ntempo: 85",
                "log_entry": "\n## 2026-03-25\n- Lesson 5 complete",
                "commit_message": "Practice session: tornado-of-souls lesson 5",
            },
        )
    assert resp.status_code == 200
    mock_gh.write_file.assert_called_once()
    mock_gh.append_to_file.assert_called_once()
