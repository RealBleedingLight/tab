import pytest
import json
import os
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


@pytest.fixture
def sample_json():
    """Create a minimal valid gp2tab JSON for testing."""
    return json.dumps({
        "title": "Test Solo",
        "artist": "Test Artist",
        "tuning": ["E", "A", "D", "G", "B", "E"],
        "tempo": 120,
        "sections": [],
        "bars": [
            {
                "number": 1,
                "time_signature": "4/4",
                "notes": [
                    {"string": 1, "fret": 5, "beat": 1.0, "duration": "quarter", "techniques": []},
                    {"string": 1, "fret": 7, "beat": 2.0, "duration": "quarter", "techniques": []},
                    {"string": 1, "fret": 8, "beat": 3.0, "duration": "quarter", "techniques": []},
                    {"string": 2, "fret": 5, "beat": 4.0, "duration": "quarter", "techniques": []},
                ],
            },
            {
                "number": 2,
                "time_signature": "4/4",
                "notes": [
                    {"string": 2, "fret": 7, "beat": 1.0, "duration": "quarter", "techniques": []},
                    {"string": 2, "fret": 8, "beat": 2.0, "duration": "quarter", "techniques": []},
                    {"string": 1, "fret": 5, "beat": 3.0, "duration": "quarter", "techniques": []},
                    {"string": 1, "fret": 7, "beat": 4.0, "duration": "quarter", "techniques": []},
                ],
            },
        ],
    })


def test_analyze_json_upload(client, cookies, sample_json):
    resp = client.post(
        "/analyze",
        cookies=cookies,
        files={"file": ("test.json", sample_json.encode(), "application/json")},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "Test Solo"
    assert data["artist"] == "Test Artist"
    assert "sections" in data
    assert "key" in data
    assert "tempo" in data


def test_analyze_returns_serializable(client, cookies, sample_json):
    """Ensure all dataclass fields are JSON-serializable."""
    resp = client.post(
        "/analyze",
        cookies=cookies,
        files={"file": ("test.json", sample_json.encode(), "application/json")},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data["sections"], list)


def test_lessons_generate_returns_job_id(client, cookies):
    from unittest.mock import AsyncMock, patch
    mock_gh = AsyncMock()
    with patch("guitar_teacher.api.routers.analysis.get_github", return_value=mock_gh):
        resp = client.post(
            "/lessons/generate",
            cookies=cookies,
            json={
                "file_path": "queue/Test Artist - Test Song.gp",
                "artist_slug": "test-artist",
                "song_slug": "test-song",
                "order": "difficulty",
            },
        )
    assert resp.status_code == 202
    assert "job_id" in resp.json()
