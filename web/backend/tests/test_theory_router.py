import pytest
from fastapi.testclient import TestClient
from web.backend.main import app

client = TestClient(app)


def test_list_scales():
    r = client.get("/theory/scales")
    assert r.status_code == 200
    data = r.json()
    assert len(data) > 10
    assert any(s["key"] == "natural_minor" for s in data)


def test_get_scale():
    r = client.get("/theory/scale/E/natural_minor")
    assert r.status_code == 200
    data = r.json()
    assert data["root"] == "E"
    assert "E" in data["notes"]
    assert len(data["fretboard"]) > 0
    for pos in data["fretboard"]:
        assert 0 <= pos["string"] <= 5
        assert 0 <= pos["fret"] <= 12


def test_get_scale_unknown_returns_404():
    r = client.get("/theory/scale/E/fake_scale")
    assert r.status_code == 404


def test_list_chords():
    r = client.get("/theory/chords")
    assert r.status_code == 200
    assert len(r.json()) > 10


def test_get_chord():
    r = client.get("/theory/chord/Am7")
    assert r.status_code == 200
    data = r.json()
    assert data["root"] == "A"
    assert "A" in data["notes"]
    assert "C" in data["notes"]
    assert len(data["fretboard"]) > 0


def test_get_chord_unknown_returns_404():
    r = client.get("/theory/chord/Xfoo")
    assert r.status_code == 404


def test_get_key():
    r = client.get("/theory/key/A/natural_minor")
    assert r.status_code == 200
    data = r.json()
    assert len(data["degrees"]) == 7
    assert data["degrees"][0]["numeral"] == "i"  # A natural minor: i ii° III iv v VI VII°
