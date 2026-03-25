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


def test_list_queue(client, cookies):
    mock_gh = AsyncMock()
    mock_gh.list_directory.return_value = [
        {"name": "Megadeth - Tornado of Souls.gp", "type": "file", "path": "queue/Megadeth - Tornado of Souls.gp"},
    ]
    with patch("guitar_teacher.api.routers.queue.get_github", return_value=mock_gh):
        resp = client.get("/queue", cookies=cookies)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["files"]) == 1
    assert data["files"][0]["name"] == "Megadeth - Tornado of Souls.gp"


def test_upload_to_queue(client, cookies):
    mock_gh = AsyncMock()
    mock_gh.upload_binary.return_value = "sha123"

    with patch("guitar_teacher.api.routers.queue.get_github", return_value=mock_gh):
        resp = client.post(
            "/queue/upload",
            cookies=cookies,
            files={"file": ("TestSong.gp", b"fake-gp-data", "application/octet-stream")},
        )
    assert resp.status_code == 200
    mock_gh.upload_binary.assert_called_once()


def test_process_returns_job_id(client, cookies):
    mock_gh = AsyncMock()
    mock_gh.read_file.return_value = None

    with patch("guitar_teacher.api.routers.queue.get_github", return_value=mock_gh):
        resp = client.post(
            "/queue/process/TestSong.gp",
            cookies=cookies,
            json={"model": "claude", "order": "difficulty"},
        )
    assert resp.status_code == 202
    data = resp.json()
    assert "job_id" in data


def test_queue_status(client, cookies):
    mock_gh = AsyncMock()
    with patch("guitar_teacher.api.routers.queue.get_github", return_value=mock_gh):
        resp = client.post(
            "/queue/process/TestSong.gp",
            cookies=cookies,
            json={"model": "claude", "order": "difficulty"},
        )
    job_id = resp.json()["job_id"]

    resp = client.get(f"/queue/status/{job_id}", cookies=cookies)
    assert resp.status_code == 200
    assert "status" in resp.json()
