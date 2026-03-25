import pytest
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


def test_get_scale(client, cookies):
    resp = client.get("/theory/scale/D/dorian", cookies=cookies)
    assert resp.status_code == 200
    data = resp.json()
    assert data["root"] == "D"
    assert "notes" in data
    assert "character" in data
    assert "fretboard" in data


def test_get_scale_not_found(client, cookies):
    resp = client.get("/theory/scale/D/nonexistent", cookies=cookies)
    assert resp.status_code == 404


def test_get_chord(client, cookies):
    resp = client.get("/theory/chord/Am7", cookies=cookies)
    assert resp.status_code == 200
    data = resp.json()
    assert data["root"] == "A"
    assert "notes" in data


def test_get_chord_not_found(client, cookies):
    resp = client.get("/theory/chord/Xzz9", cookies=cookies)
    assert resp.status_code == 404


def test_get_key(client, cookies):
    resp = client.get("/theory/key/C/major", cookies=cookies)
    assert resp.status_code == 200
    data = resp.json()
    assert "chords" in data
    assert len(data["chords"]) == 7


def test_identify_key(client, cookies):
    resp = client.get("/theory/identify-key?notes=D&notes=E&notes=F&notes=G&notes=A&notes=Bb&notes=C", cookies=cookies)
    assert resp.status_code == 200
    data = resp.json()
    assert "matches" in data
    assert len(data["matches"]) > 0


def test_suggest_scales(client, cookies):
    resp = client.get("/theory/suggest-scales?chords=Dm7&chords=G7&chords=Cmaj7", cookies=cookies)
    assert resp.status_code == 200
    data = resp.json()
    assert "suggestions" in data


def test_interval(client, cookies):
    resp = client.get("/theory/interval/C/E", cookies=cookies)
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Major 3rd"
    assert data["semitones"] == 4
