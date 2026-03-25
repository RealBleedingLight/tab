import pytest
from fastapi.testclient import TestClient
from guitar_teacher.api.app import create_app


@pytest.fixture
def client():
    app = create_app()
    return TestClient(app)


@pytest.fixture
def auth_token():
    from guitar_teacher.api.auth import create_token
    return create_token()


def test_health_endpoint(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert "version" in resp.json()


def test_auth_login_correct_pin(client):
    resp = client.post("/auth/login", json={"pin": "1234"})
    assert resp.status_code == 200
    assert "token" in resp.json()


def test_auth_login_wrong_pin(client):
    resp = client.post("/auth/login", json={"pin": "0000"})
    assert resp.status_code == 401


def test_auth_verify_valid(client, auth_token):
    resp = client.get("/auth/verify", cookies={"token": auth_token})
    assert resp.status_code == 200


def test_auth_verify_missing(client):
    resp = client.get("/auth/verify")
    assert resp.status_code == 401


def test_protected_endpoint_without_token(client):
    resp = client.get("/songs")
    assert resp.status_code == 401


def test_protected_endpoint_with_token(client, auth_token):
    # /songs will fail because GitHub client is fake, but should not be 401
    resp = client.get("/songs", cookies={"token": auth_token})
    assert resp.status_code != 401
