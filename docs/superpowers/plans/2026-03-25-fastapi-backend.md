# FastAPI Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wrap the existing guitar-teacher Python CLI in a FastAPI REST API that the Next.js frontend (separate plan) will call.

**Architecture:** A FastAPI app that imports and calls the existing guitar-teacher functions directly — no code duplication. The API handles auth (pin → JWT), theory lookups, GP file analysis, lesson generation, and GitHub repo read/write via the GitHub Contents API. Long-running jobs (lesson generation) use a background task with a polling status endpoint.

**Tech Stack:** FastAPI, uvicorn, PyJWT, httpx (GitHub API), python-multipart (file uploads), existing guitar-teacher + gp2tab packages.

**Spec:** `docs/superpowers/specs/2026-03-25-guitar-teacher-web-platform-design.md`

---

## File Structure

```
guitar-teacher/
├── guitar_teacher/
│   ├── api/                        # NEW — FastAPI app
│   │   ├── __init__.py
│   │   ├── app.py                  # FastAPI app factory, CORS, middleware
│   │   ├── auth.py                 # Pin auth, JWT create/verify
│   │   ├── deps.py                 # Shared dependencies (TheoryEngine, GitHub client)
│   │   ├── github_client.py        # GitHub Contents API wrapper
│   │   ├── jobs.py                 # Background job tracking for long-running tasks
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── theory.py           # /theory/* endpoints
│   │       ├── analysis.py         # /analyze, /lessons/generate endpoints
│   │       ├── songs.py            # /songs/* endpoints (repo read/write)
│   │       └── queue.py            # /queue/* endpoints (file shelf + processing)
│   ├── core/                       # UNCHANGED
│   ├── lessons/                    # UNCHANGED
│   ├── llm/                        # UNCHANGED
│   ├── cli.py                      # UNCHANGED
│   └── config.py                   # UNCHANGED
├── tests/
│   ├── api/                        # NEW — API tests
│   │   ├── conftest.py             # TestClient fixture, mock GitHub client
│   │   ├── test_auth.py
│   │   ├── test_theory_router.py
│   │   ├── test_analysis_router.py
│   │   ├── test_songs_router.py
│   │   ├── test_queue_router.py
│   │   └── test_github_client.py
│   └── ...                         # UNCHANGED existing tests
└── pyproject.toml                  # MODIFIED — add fastapi deps
```

---

### Task 1: Project Setup — Add FastAPI Dependencies

**Files:**
- Modify: `guitar-teacher/pyproject.toml`
- Create: `guitar-teacher/guitar_teacher/api/__init__.py`
- Create: `guitar-teacher/guitar_teacher/api/routers/__init__.py`

- [ ] **Step 1: Add `api` optional dependency group to pyproject.toml**

Add after the existing `[project.optional-dependencies]` llm group:

```toml
[project.optional-dependencies]
llm = ["anthropic>=0.40", "openai>=1.0", "httpx>=0.27"]
api = [
    "fastapi>=0.115",
    "uvicorn[standard]>=0.34",
    "pyjwt>=2.9",
    "httpx>=0.27",
    "python-multipart>=0.0.18",
]
test = [
    "pytest>=8.0",
    "pytest-asyncio>=0.24",
]
```

Also add asyncio mode to pytest config:

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
```

Also add a script entry for the API server:

```toml
[project.scripts]
guitar-teacher = "guitar_teacher.cli:main"
guitar-teacher-api = "guitar_teacher.api.app:start"
```

- [ ] **Step 2: Create empty `__init__.py` files**

Create `guitar_teacher/api/__init__.py` (empty) and `guitar_teacher/api/routers/__init__.py` (empty).

- [ ] **Step 3: Install the new dependencies**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && pip install -e ".[api,llm]"`
Expected: Installs fastapi, uvicorn, pyjwt, httpx, python-multipart successfully.

- [ ] **Step 4: Verify existing tests still pass**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/ -x -q`
Expected: All existing tests pass (no regressions).

- [ ] **Step 5: Commit**

```bash
cd /Users/leo/hobby/tab
git add guitar-teacher/pyproject.toml guitar-teacher/guitar_teacher/api/
git commit -m "feat(api): add FastAPI dependency group and api package skeleton"
```

---

### Task 2: Auth Module — Pin Validation and JWT

**Files:**
- Create: `guitar-teacher/guitar_teacher/api/auth.py`
- Create: `guitar-teacher/tests/api/__init__.py`
- Create: `guitar-teacher/tests/api/conftest.py`
- Create: `guitar-teacher/tests/api/test_auth.py`

- [ ] **Step 1: Write failing tests for auth**

```python
# tests/api/conftest.py
import pytest
import os

os.environ.setdefault("AUTH_PIN", "1234")
os.environ.setdefault("AUTH_SECRET", "test-secret-key")
os.environ.setdefault("GITHUB_TOKEN", "fake-token")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:3000")


# tests/api/__init__.py
# empty


# tests/api/test_auth.py
import pytest
from guitar_teacher.api.auth import create_token, verify_token, check_pin


def test_check_pin_correct():
    assert check_pin("1234") is True


def test_check_pin_wrong():
    assert check_pin("0000") is False


def test_create_and_verify_token():
    token = create_token()
    payload = verify_token(token)
    assert payload is not None
    assert "exp" in payload


def test_verify_token_invalid():
    payload = verify_token("garbage.token.here")
    assert payload is None


def test_verify_token_expired():
    from guitar_teacher.api.auth import _create_token_with_expiry
    import time
    token = _create_token_with_expiry(seconds=-1)
    payload = verify_token(token)
    assert payload is None
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/api/test_auth.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'guitar_teacher.api.auth'`

- [ ] **Step 3: Implement auth module**

```python
# guitar_teacher/api/auth.py
"""Pin-based authentication with JWT tokens."""
import os
import time
from typing import Optional, Dict

import jwt

_EXPIRY_SECONDS = 86400  # 24 hours


def _get_secret() -> str:
    return os.environ.get("AUTH_SECRET", "change-me")


def _get_pin() -> str:
    return os.environ.get("AUTH_PIN", "")


def check_pin(pin: str) -> bool:
    """Validate pin against AUTH_PIN env var."""
    return pin == _get_pin()


def create_token() -> str:
    """Create a JWT token valid for 24 hours."""
    return _create_token_with_expiry(seconds=_EXPIRY_SECONDS)


def _create_token_with_expiry(seconds: int) -> str:
    """Create a JWT with custom expiry (exposed for testing)."""
    payload = {
        "sub": "guitar-teacher",
        "iat": int(time.time()),
        "exp": int(time.time()) + seconds,
    }
    return jwt.encode(payload, _get_secret(), algorithm="HS256")


def verify_token(token: str) -> Optional[Dict]:
    """Verify and decode a JWT. Returns payload or None."""
    try:
        return jwt.decode(token, _get_secret(), algorithms=["HS256"])
    except (jwt.InvalidTokenError, jwt.ExpiredSignatureError):
        return None
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/api/test_auth.py -v`
Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/leo/hobby/tab
git add guitar-teacher/guitar_teacher/api/auth.py guitar-teacher/tests/api/
git commit -m "feat(api): add pin auth and JWT token module"
```

---

### Task 3: App Factory — FastAPI App with CORS and Auth Middleware

**Files:**
- Create: `guitar-teacher/guitar_teacher/api/app.py`
- Create: `guitar-teacher/guitar_teacher/api/deps.py`
- Create: `guitar-teacher/tests/api/test_app.py`

- [ ] **Step 1: Write failing tests**

```python
# tests/api/test_app.py
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/api/test_app.py -v`
Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3: Implement deps.py**

```python
# guitar_teacher/api/deps.py
"""Shared dependencies for FastAPI routes."""
from functools import lru_cache
from fastapi import Request, HTTPException, Cookie
from typing import Optional

from guitar_teacher.core.theory import TheoryEngine
from guitar_teacher.config import get_theory_dir
from guitar_teacher.api.auth import verify_token


@lru_cache(maxsize=1)
def get_engine() -> TheoryEngine:
    """Singleton TheoryEngine instance."""
    return TheoryEngine(get_theory_dir())


def require_auth(token: Optional[str] = Cookie(default=None)):
    """Dependency that validates JWT from cookie."""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload
```

- [ ] **Step 4: Implement app.py**

```python
# guitar_teacher/api/app.py
"""FastAPI application factory."""
import os

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from guitar_teacher.api.auth import check_pin, create_token, verify_token
from guitar_teacher.api.deps import require_auth


class LoginRequest(BaseModel):
    pin: str


def create_app() -> FastAPI:
    app = FastAPI(title="Guitar Teacher API", version="0.1.0")

    # CORS
    origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # --- Public routes ---

    @app.get("/health")
    def health():
        return {"status": "ok", "version": "0.1.0"}

    @app.post("/auth/login")
    def login(req: LoginRequest):
        from fastapi.responses import JSONResponse
        if not check_pin(req.pin):
            return JSONResponse(status_code=401, content={"detail": "Invalid pin"})
        token = create_token()
        response = JSONResponse(content={"token": token})
        response.set_cookie(
            key="token", value=token, httponly=True,
            max_age=86400, samesite="none", secure=True,
        )
        return response

    @app.get("/auth/verify")
    def verify(payload=Depends(require_auth)):
        return {"status": "valid"}

    # --- Protected route placeholder (songs router added later) ---
    # Routers will be included here in subsequent tasks

    return app


def start():
    """Entry point for `guitar-teacher-api` command."""
    import uvicorn
    app = create_app()
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/api/test_app.py -v`
Expected: 6 of 7 pass. `test_protected_endpoint_with_token` may need adjustment once the songs router is added. For now, it will get 404 (not 401), which satisfies `assert resp.status_code != 401`.

- [ ] **Step 6: Run all tests to check for regressions**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/ -x -q`
Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
cd /Users/leo/hobby/tab
git add guitar-teacher/guitar_teacher/api/app.py guitar-teacher/guitar_teacher/api/deps.py guitar-teacher/tests/api/test_app.py
git commit -m "feat(api): add FastAPI app factory with CORS, health, and auth endpoints"
```

---

### Task 4: GitHub Client — Read/Write Repo via GitHub Contents API

**Files:**
- Create: `guitar-teacher/guitar_teacher/api/github_client.py`
- Create: `guitar-teacher/tests/api/test_github_client.py`

- [ ] **Step 1: Write failing tests**

```python
# tests/api/test_github_client.py
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from guitar_teacher.api.github_client import GitHubClient


@pytest.fixture
def client():
    return GitHubClient(token="fake-token", repo="user/repo")


@pytest.mark.asyncio
async def test_read_file(client):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "content": "SGVsbG8gd29ybGQ=",  # base64 "Hello world"
        "sha": "abc123",
    }
    with patch.object(client._client, "get", new_callable=AsyncMock, return_value=mock_response):
        content, sha = await client.read_file("test.md")
    assert content == "Hello world"
    assert sha == "abc123"


@pytest.mark.asyncio
async def test_read_file_not_found(client):
    mock_response = MagicMock()
    mock_response.status_code = 404
    with patch.object(client._client, "get", new_callable=AsyncMock, return_value=mock_response):
        result = await client.read_file("missing.md")
    assert result is None


@pytest.mark.asyncio
async def test_write_file(client):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"content": {"sha": "new-sha"}}
    with patch.object(client._client, "put", new_callable=AsyncMock, return_value=mock_response):
        sha = await client.write_file("test.md", "new content", message="update", sha="old-sha")
    assert sha == "new-sha"


@pytest.mark.asyncio
async def test_write_file_create_new(client):
    mock_response = MagicMock()
    mock_response.status_code = 201
    mock_response.json.return_value = {"content": {"sha": "created-sha"}}
    with patch.object(client._client, "put", new_callable=AsyncMock, return_value=mock_response):
        sha = await client.write_file("new.md", "content", message="create")
    assert sha == "created-sha"


@pytest.mark.asyncio
async def test_list_directory(client):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = [
        {"name": "file1.md", "type": "file", "path": "dir/file1.md"},
        {"name": "subdir", "type": "dir", "path": "dir/subdir"},
    ]
    with patch.object(client._client, "get", new_callable=AsyncMock, return_value=mock_response):
        items = await client.list_directory("dir")
    assert len(items) == 2
    assert items[0]["name"] == "file1.md"


@pytest.mark.asyncio
async def test_read_binary(client):
    mock_response = MagicMock()
    mock_response.status_code = 200
    import base64
    mock_response.json.return_value = {
        "content": base64.b64encode(b"\x00\x01\x02binary").decode(),
        "sha": "bin-sha",
    }
    with patch.object(client._client, "get", new_callable=AsyncMock, return_value=mock_response):
        data, sha = await client.read_binary("file.gp")
    assert data == b"\x00\x01\x02binary"
    assert sha == "bin-sha"


@pytest.mark.asyncio
async def test_append_to_file(client):
    """Append should read-modify-write."""
    read_response = MagicMock()
    read_response.status_code = 200
    read_response.json.return_value = {
        "content": "ZXhpc3Rpbmc=",  # base64 "existing"
        "sha": "old-sha",
    }
    write_response = MagicMock()
    write_response.status_code = 200
    write_response.json.return_value = {"content": {"sha": "new-sha"}}

    with patch.object(client._client, "get", new_callable=AsyncMock, return_value=read_response), \
         patch.object(client._client, "put", new_callable=AsyncMock, return_value=write_response) as mock_put:
        sha = await client.append_to_file("log.md", "\nnew entry", message="append")

    assert sha == "new-sha"
    # Verify the written content is "existing" + "\nnew entry"
    call_args = mock_put.call_args
    import base64
    written = base64.b64decode(call_args[1]["json"]["content"]).decode()
    assert written == "existing\nnew entry"
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/api/test_github_client.py -v`
Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3: Implement GitHub client**

```python
# guitar_teacher/api/github_client.py
"""GitHub Contents API client for reading/writing repo files."""
import base64
import os
from typing import Optional, Tuple, List, Dict

import httpx

_API_BASE = "https://api.github.com"


class GitHubClient:
    """Async client for GitHub Contents API operations."""

    def __init__(
        self,
        token: Optional[str] = None,
        repo: Optional[str] = None,
    ):
        self.token = token or os.environ.get("GITHUB_TOKEN", "")
        self.repo = repo or os.environ.get("GITHUB_REPO", "")
        self._client = httpx.AsyncClient(
            base_url=f"{_API_BASE}/repos/{self.repo}/contents",
            headers={
                "Authorization": f"Bearer {self.token}",
                "Accept": "application/vnd.github.v3+json",
            },
            timeout=30.0,
        )

    async def read_file(self, path: str) -> Optional[Tuple[str, str]]:
        """Read a file. Returns (content, sha) or None if not found."""
        resp = await self._client.get(f"/{path}")
        if resp.status_code == 404:
            return None
        data = resp.json()
        content = base64.b64decode(data["content"]).decode("utf-8")
        return content, data["sha"]

    async def write_file(
        self, path: str, content: str, message: str, sha: Optional[str] = None,
    ) -> str:
        """Create or update a file. Returns new SHA."""
        body = {
            "message": message,
            "content": base64.b64encode(content.encode("utf-8")).decode("ascii"),
        }
        if sha:
            body["sha"] = sha
        resp = await self._client.put(f"/{path}", json=body)
        return resp.json()["content"]["sha"]

    async def append_to_file(self, path: str, text: str, message: str) -> str:
        """Append text to an existing file (read-modify-write). Returns new SHA."""
        result = await self.read_file(path)
        if result is None:
            return await self.write_file(path, text, message=message)
        existing, sha = result
        return await self.write_file(path, existing + text, message=message, sha=sha)

    async def list_directory(self, path: str) -> List[Dict]:
        """List directory contents. Returns list of {name, type, path}."""
        resp = await self._client.get(f"/{path}")
        if resp.status_code == 404:
            return []
        return resp.json()

    async def upload_binary(self, path: str, data: bytes, message: str) -> str:
        """Upload a binary file (e.g., GP file). Returns SHA."""
        body = {
            "message": message,
            "content": base64.b64encode(data).decode("ascii"),
        }
        resp = await self._client.put(f"/{path}", json=body)
        return resp.json()["content"]["sha"]

    async def read_binary(self, path: str) -> Optional[Tuple[bytes, str]]:
        """Read a binary file. Returns (bytes, sha) or None if not found."""
        resp = await self._client.get(f"/{path}")
        if resp.status_code == 404:
            return None
        data = resp.json()
        content = base64.b64decode(data["content"])
        return content, data["sha"]

    async def delete_file(self, path: str, sha: str, message: str) -> None:
        """Delete a file from the repo."""
        await self._client.delete(f"/{path}", json={"message": message, "sha": sha})

    async def close(self):
        await self._client.aclose()
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && pip install pytest-asyncio && python -m pytest tests/api/test_github_client.py -v`
Expected: All 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/leo/hobby/tab
git add guitar-teacher/guitar_teacher/api/github_client.py guitar-teacher/tests/api/test_github_client.py
git commit -m "feat(api): add async GitHub Contents API client"
```

---

### Task 5: Theory Router — Scale, Chord, Key, Interval Endpoints

**Files:**
- Create: `guitar-teacher/guitar_teacher/api/routers/theory.py`
- Create: `guitar-teacher/tests/api/test_theory_router.py`

- [ ] **Step 1: Write failing tests**

```python
# tests/api/test_theory_router.py
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
    assert "fretboard" in data  # note positions for SVG rendering


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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/api/test_theory_router.py -v`
Expected: FAIL — 404 on all theory routes (router not registered yet).

- [ ] **Step 3: Implement theory router**

```python
# guitar_teacher/api/routers/theory.py
"""Theory lookup endpoints."""
import re
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query

from guitar_teacher.api.deps import get_engine, require_auth
from guitar_teacher.core.note_utils import note_to_pitch_class, pitch_class_to_name

router = APIRouter(prefix="/theory", tags=["theory"], dependencies=[Depends(require_auth)])


def _fretboard_data(notes, root=None, tuning=None, fret_range=(0, 15)):
    """Return note positions for SVG fretboard rendering."""
    if tuning is None:
        tuning = ["E", "A", "D", "G", "B", "E"]
    note_pcs = {note_to_pitch_class(n) for n in notes}
    root_pc = note_to_pitch_class(root) if root else None
    positions = []
    for string_idx, open_note in enumerate(tuning):
        open_pc = note_to_pitch_class(open_note)
        for fret in range(fret_range[0], fret_range[1] + 1):
            pc = (open_pc + fret) % 12
            if pc in note_pcs:
                name = pitch_class_to_name(pc)
                positions.append({
                    "string": string_idx,
                    "fret": fret,
                    "note": name,
                    "is_root": pc == root_pc,
                })
    return positions


@router.get("/scale/{root}/{scale_type}")
def get_scale(root: str, scale_type: str):
    engine = get_engine()
    result = engine.get_scale(root, scale_type)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Scale not found: {root} {scale_type}")
    return {
        "root": result.root,
        "name": result.scale.name,
        "notes": result.notes,
        "intervals": result.scale.intervals,
        "category": result.scale.category,
        "character": result.scale.character,
        "common_in": result.scale.common_in,
        "chord_fit": result.scale.chord_fit,
        "teaching_note": result.scale.teaching_note,
        "improvisation_tip": result.scale.improvisation_tip,
        "fretboard": _fretboard_data(result.notes, root=result.root),
    }


@router.get("/chord/{chord_name}")
def get_chord(chord_name: str):
    engine = get_engine()
    m = re.match(r'^([A-G][#b]?)(.*)$', chord_name)
    if not m:
        raise HTTPException(status_code=404, detail=f"Cannot parse: {chord_name}")
    root, chord_type = m.group(1), m.group(2) or "major"
    result = engine.get_chord(root, chord_type)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Chord not found: {chord_name}")
    voicings = None
    if result.chord.common_voicings:
        voicings = result.chord.common_voicings
    return {
        "root": result.root,
        "symbol": result.symbol,
        "name": result.chord.name,
        "notes": result.notes,
        "intervals": result.chord.intervals,
        "character": result.chord.character,
        "voicings": voicings,
    }


@router.get("/key/{root}/{scale_type}")
def get_key(root: str, scale_type: str):
    engine = get_engine()
    chords = engine.chords_in_key(root, scale_type)
    if not chords:
        raise HTTPException(status_code=404, detail=f"Key not found: {root} {scale_type}")
    roman_base = ["I", "II", "III", "IV", "V", "VI", "VII"]
    return {
        "key": f"{root} {scale_type}",
        "chords": [
            {
                "numeral": _roman_numeral(roman_base[i] if i < len(roman_base) else str(i + 1), c.chord),
                "root": c.root,
                "symbol": c.symbol,
                "notes": c.notes,
            }
            for i, c in enumerate(chords)
        ],
    }


def _roman_numeral(base: str, chord) -> str:
    """Apply correct casing: uppercase for major/aug, lowercase for minor/dim."""
    if chord.key in ("minor", "diminished", "min7b5"):
        result = base.lower()
        if chord.key == "diminished":
            result += "\u00b0"  # degree symbol
        return result
    return base


@router.get("/identify-key")
def identify_key(notes: List[str] = Query()):
    engine = get_engine()
    matches = engine.detect_key(list(notes))
    if not matches:
        raise HTTPException(status_code=404, detail="No key matches found")
    return {
        "matches": [
            {
                "root": m.root,
                "scale_name": m.scale.name,
                "score": round(m.score, 2),
                "notes_matched": m.notes_matched,
                "total_notes": m.total_notes,
                "outside_notes": m.outside_notes,
            }
            for m in matches[:5]
        ],
    }


@router.get("/suggest-scales")
def suggest_scales(chords: List[str] = Query()):
    engine = get_engine()
    suggestions = engine.suggest_scales(list(chords))
    if not suggestions:
        raise HTTPException(status_code=404, detail="No scale suggestions found")
    return {
        "suggestions": [
            {
                "root": s.root,
                "name": s.name,
                "notes": s.notes,
                "score": round(s.score, 2),
            }
            for s in suggestions[:5]
        ],
    }


@router.get("/interval/{note1}/{note2}")
def get_interval(note1: str, note2: str):
    engine = get_engine()
    result = engine.interval_between(note1, note2)
    return {
        "note1": note1,
        "note2": note2,
        "name": result.name,
        "short_name": result.short_name,
        "semitones": result.semitones,
        "quality": result.quality,
    }
```

- [ ] **Step 4: Register theory router in app.py**

Add to `create_app()` in `app.py`, after the auth routes:

```python
    from guitar_teacher.api.routers.theory import router as theory_router
    app.include_router(theory_router)
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/api/test_theory_router.py -v`
Expected: All 9 tests PASS.

- [ ] **Step 6: Run all tests**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/ -x -q`
Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
cd /Users/leo/hobby/tab
git add guitar-teacher/guitar_teacher/api/routers/theory.py guitar-teacher/guitar_teacher/api/app.py guitar-teacher/tests/api/test_theory_router.py
git commit -m "feat(api): add theory router — scale, chord, key, interval endpoints"
```

---

### Task 6: Songs Router — Read Song Data and Save Progress

**Files:**
- Create: `guitar-teacher/guitar_teacher/api/routers/songs.py`
- Create: `guitar-teacher/tests/api/test_songs_router.py`

- [ ] **Step 1: Write failing tests**

```python
# tests/api/test_songs_router.py
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
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
    mock_gh.list_directory.return_value = [
        {"name": "megadeth", "type": "dir", "path": "songs/megadeth"},
    ]
    # Nested call for artist dir
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
    mock_gh.read_file.return_value = ("# Lesson 5\n\nContent here", "sha123")

    with patch("guitar_teacher.api.routers.songs.get_github", return_value=mock_gh):
        resp = client.get("/songs/megadeth/tornado-of-souls/lessons/5", cookies=cookies)
    assert resp.status_code == 200
    assert "content" in resp.json()


def test_save_progress(client, cookies):
    mock_gh = _mock_github()
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/api/test_songs_router.py -v`
Expected: FAIL

- [ ] **Step 3: Implement songs router**

```python
# guitar_teacher/api/routers/songs.py
"""Song data and progress endpoints."""
import os
import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from guitar_teacher.api.deps import require_auth
from guitar_teacher.api.github_client import GitHubClient

router = APIRouter(prefix="/songs", tags=["songs"], dependencies=[Depends(require_auth)])


def get_github() -> GitHubClient:
    """Get a GitHubClient instance."""
    return GitHubClient()


class SaveProgressRequest(BaseModel):
    context_content: str
    log_entry: str
    commit_message: str


@router.get("")
async def list_songs():
    gh = get_github()
    try:
        artists = await gh.list_directory("songs")
        songs = []
        for artist_dir in artists:
            if artist_dir["type"] != "dir":
                continue
            song_dirs = await gh.list_directory(artist_dir["path"])
            for song_dir in song_dirs:
                if song_dir["type"] != "dir":
                    continue
                context = None
                result = await gh.read_file(f"{song_dir['path']}/.context.md")
                if result:
                    context = result[0]
                songs.append({
                    "artist": artist_dir["name"],
                    "song": song_dir["name"],
                    "path": song_dir["path"],
                    "context": context,
                })
        return {"songs": songs}
    finally:
        await gh.close()


@router.get("/{artist}/{song}/context")
async def get_context(artist: str, song: str):
    gh = get_github()
    try:
        result = await gh.read_file(f"songs/{artist}/{song}/.context.md")
        if result is None:
            raise HTTPException(status_code=404, detail="Context file not found")
        content, sha = result
        return {"content": content, "sha": sha}
    finally:
        await gh.close()


@router.get("/{artist}/{song}/lessons/{number}")
async def get_lesson(artist: str, song: str, number: int):
    gh = get_github()
    try:
        # List lessons dir to find the file matching the number
        lessons = await gh.list_directory(f"songs/{artist}/{song}/lessons")
        target = None
        for item in lessons:
            if item["type"] == "file" and item["name"].startswith(f"{number:02d}-"):
                target = item["path"]
                break
        if target is None:
            raise HTTPException(status_code=404, detail=f"Lesson {number} not found")
        result = await gh.read_file(target)
        if result is None:
            raise HTTPException(status_code=404, detail=f"Lesson {number} not found")
        content, sha = result
        return {"content": content, "sha": sha, "filename": os.path.basename(target)}
    finally:
        await gh.close()


@router.post("/{artist}/{song}/save-progress")
async def save_progress(artist: str, song: str, req: SaveProgressRequest):
    gh = get_github()
    try:
        # Read current .context.md to get SHA for update
        context_result = await gh.read_file(f"songs/{artist}/{song}/.context.md")
        context_sha = context_result[1] if context_result else None

        # Write .context.md
        await gh.write_file(
            f"songs/{artist}/{song}/.context.md",
            req.context_content,
            message=req.commit_message,
            sha=context_sha,
        )

        # Append to practice-log.md
        # Note: This creates a second commit. The GitHub Contents API doesn't support
        # multi-file commits. Acceptable for single-user app. If the second write fails
        # (SHA conflict), context is saved but log is not — caller should retry.
        await gh.append_to_file(
            f"songs/{artist}/{song}/practice-log.md",
            req.log_entry,
            message=f"{req.commit_message} (log)",
        )

        return {"status": "saved"}
    finally:
        await gh.close()
```

- [ ] **Step 4: Register songs router in app.py**

Add to `create_app()`:

```python
    from guitar_teacher.api.routers.songs import router as songs_router
    app.include_router(songs_router)
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/api/test_songs_router.py -v`
Expected: All 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
cd /Users/leo/hobby/tab
git add guitar-teacher/guitar_teacher/api/routers/songs.py guitar-teacher/guitar_teacher/api/app.py guitar-teacher/tests/api/test_songs_router.py
git commit -m "feat(api): add songs router — list, context, lessons, save progress"
```

---

### Task 7: Background Jobs Module

**Files:**
- Create: `guitar-teacher/guitar_teacher/api/jobs.py`
- Create: `guitar-teacher/tests/api/test_jobs.py`

- [ ] **Step 1: Write failing tests**

```python
# tests/api/test_jobs.py
import pytest
from guitar_teacher.api.jobs import JobTracker


@pytest.fixture
def tracker():
    return JobTracker()


def test_create_job(tracker):
    job_id = tracker.create("test-job")
    assert job_id is not None
    status = tracker.get(job_id)
    assert status["status"] == "pending"
    assert status["description"] == "test-job"


def test_update_progress(tracker):
    job_id = tracker.create("test-job")
    tracker.update(job_id, status="running", progress="Step 3 of 10")
    status = tracker.get(job_id)
    assert status["status"] == "running"
    assert status["progress"] == "Step 3 of 10"


def test_complete_job(tracker):
    job_id = tracker.create("test-job")
    tracker.update(job_id, status="completed", result={"lessons": 22})
    status = tracker.get(job_id)
    assert status["status"] == "completed"
    assert status["result"]["lessons"] == 22


def test_fail_job(tracker):
    job_id = tracker.create("test-job")
    tracker.update(job_id, status="failed", error="Something went wrong")
    status = tracker.get(job_id)
    assert status["status"] == "failed"
    assert status["error"] == "Something went wrong"


def test_get_nonexistent(tracker):
    assert tracker.get("nonexistent") is None
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/api/test_jobs.py -v`
Expected: FAIL

- [ ] **Step 3: Implement jobs module**

```python
# guitar_teacher/api/jobs.py
"""Simple in-memory job tracker for long-running tasks."""
import uuid
from typing import Optional, Dict, Any


class JobTracker:
    """Track background job progress. Single-process, in-memory."""

    def __init__(self):
        self._jobs: Dict[str, Dict[str, Any]] = {}

    def create(self, description: str) -> str:
        """Create a new job. Returns job ID."""
        job_id = str(uuid.uuid4())[:8]
        self._jobs[job_id] = {
            "id": job_id,
            "description": description,
            "status": "pending",
            "progress": None,
            "result": None,
            "error": None,
        }
        return job_id

    def update(self, job_id: str, **kwargs) -> None:
        """Update job fields (status, progress, result, error)."""
        if job_id in self._jobs:
            self._jobs[job_id].update(kwargs)

    def get(self, job_id: str) -> Optional[Dict]:
        """Get job status. Returns None if not found."""
        return self._jobs.get(job_id)


# Global instance (single process on Railway)
job_tracker = JobTracker()
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/api/test_jobs.py -v`
Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/leo/hobby/tab
git add guitar-teacher/guitar_teacher/api/jobs.py guitar-teacher/tests/api/test_jobs.py
git commit -m "feat(api): add in-memory job tracker for background tasks"
```

---

### Task 8: Queue Router — Upload GP Files and Process Them

**Files:**
- Create: `guitar-teacher/guitar_teacher/api/routers/queue.py`
- Create: `guitar-teacher/tests/api/test_queue_router.py`

- [ ] **Step 1: Write failing tests**

```python
# tests/api/test_queue_router.py
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
    mock_gh.read_file.return_value = None  # Will be read during processing

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
    # First create a job by processing
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/api/test_queue_router.py -v`
Expected: FAIL

- [ ] **Step 3: Implement queue router**

```python
# guitar_teacher/api/routers/queue.py
"""GP file queue endpoints — upload, list, process."""
import asyncio
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from pydantic import BaseModel

from guitar_teacher.api.deps import require_auth
from guitar_teacher.api.github_client import GitHubClient
from guitar_teacher.api.jobs import job_tracker

router = APIRouter(prefix="/queue", tags=["queue"], dependencies=[Depends(require_auth)])


def get_github() -> GitHubClient:
    return GitHubClient()


class ProcessRequest(BaseModel):
    model: Optional[str] = None
    order: str = "difficulty"


@router.get("")
async def list_queue():
    gh = get_github()
    try:
        items = await gh.list_directory("queue")
        files = [item for item in items if item["type"] == "file"]
        return {"files": files}
    finally:
        await gh.close()


@router.post("/upload")
async def upload_to_queue(file: UploadFile = File(...)):
    gh = get_github()
    try:
        data = await file.read()
        await gh.upload_binary(
            f"queue/{file.filename}",
            data,
            message=f"Queue: upload {file.filename}",
        )
        return {"status": "uploaded", "filename": file.filename}
    finally:
        await gh.close()


@router.post("/process/{filename}", status_code=202)
async def process_file(filename: str, req: ProcessRequest, background_tasks: BackgroundTasks):
    job_id = job_tracker.create(f"Processing {filename}")
    background_tasks.add_task(_run_processing, job_id, filename, req.model, req.order)
    return {"job_id": job_id, "status": "accepted"}


@router.get("/status/{job_id}")
def get_status(job_id: str):
    status = job_tracker.get(job_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return status


async def _run_processing(job_id: str, filename: str, model: Optional[str], order: str):
    """Background task: download GP file, analyze, generate lessons, commit."""
    import tempfile
    import os
    from guitar_teacher.core.analyzer import analyze_file
    from guitar_teacher.lessons.generator import generate_lessons

    job_tracker.update(job_id, status="running", progress="Downloading file from repo")
    gh = get_github()

    try:
        # Download GP file from queue/ as binary
        result = await gh.read_binary(f"queue/{filename}")
        if result is None:
            job_tracker.update(job_id, status="failed", error=f"File not found: queue/{filename}")
            return

        file_bytes, _sha = result

        # Parse artist/song from filename (format: "Artist - Song.ext")
        name_part = os.path.splitext(filename)[0]
        parts = name_part.split(" - ", 1)
        if len(parts) != 2:
            job_tracker.update(job_id, status="failed", error=f"Filename must be 'Artist - Song.ext', got: {filename}")
            return

        artist_slug = parts[0].strip().lower().replace(" ", "-")
        song_slug = parts[1].strip().lower().replace(" ", "-")

        job_tracker.update(job_id, progress="Analyzing file")

        with tempfile.NamedTemporaryFile(suffix=os.path.splitext(filename)[1], delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        try:
            analysis = analyze_file(tmp_path)
        finally:
            os.unlink(tmp_path)

        job_tracker.update(job_id, progress=f"Generating lessons ({len(analysis.sections)} sections)")

        # Generate lessons to temp dir
        with tempfile.TemporaryDirectory() as tmp_dir:
            generate_lessons(analysis, tmp_dir, section_order=order)

            # Upload all generated files to repo
            song_path = f"songs/{artist_slug}/{song_slug}"
            file_count = 0
            for root, dirs, files in os.walk(tmp_dir):
                for fname in files:
                    local_path = os.path.join(root, fname)
                    rel_path = os.path.relpath(local_path, tmp_dir)
                    repo_path = f"{song_path}/{rel_path}"

                    with open(local_path, "r") as f:
                        content = f.read()

                    file_count += 1
                    job_tracker.update(
                        job_id,
                        progress=f"Uploading file {file_count}: {rel_path}",
                    )
                    await gh.write_file(repo_path, content, message=f"Add {rel_path} for {name_part}")

        job_tracker.update(job_id, status="completed", result={
            "artist": artist_slug,
            "song": song_slug,
            "sections": len(analysis.sections),
            "key": analysis.key,
        })

    except Exception as e:
        job_tracker.update(job_id, status="failed", error=str(e))
    finally:
        await gh.close()
```

- [ ] **Step 4: Register queue router in app.py**

Add to `create_app()`:

```python
    from guitar_teacher.api.routers.queue import router as queue_router
    app.include_router(queue_router)
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/api/test_queue_router.py -v`
Expected: All 4 tests PASS.

- [ ] **Step 6: Run all tests**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/ -x -q`
Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
cd /Users/leo/hobby/tab
git add guitar-teacher/guitar_teacher/api/routers/queue.py guitar-teacher/guitar_teacher/api/app.py guitar-teacher/tests/api/test_queue_router.py
git commit -m "feat(api): add queue router — upload, list, process GP files with background jobs"
```

---

### Task 9: Analysis Router — Direct File Upload Endpoint

**Files:**
- Create: `guitar-teacher/guitar_teacher/api/routers/analysis.py`
- Create: `guitar-teacher/tests/api/test_analysis_router.py`

- [ ] **Step 1: Write failing tests**

```python
# tests/api/test_analysis_router.py
import pytest
import json
import os
from fastapi.testclient import TestClient
from guitar_teacher.api.app import create_app
from guitar_teacher.api.auth import create_token

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "..", "fixtures")


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
    # If it parsed as JSON, it's serializable
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/api/test_analysis_router.py -v`
Expected: FAIL

- [ ] **Step 3: Implement analysis router**

```python
# guitar_teacher/api/routers/analysis.py
"""Analysis and lesson generation endpoints."""
import os
import tempfile
from dataclasses import asdict

from fastapi import APIRouter, Depends, UploadFile, File, BackgroundTasks
from pydantic import BaseModel
from typing import Optional

from guitar_teacher.api.deps import require_auth
from guitar_teacher.api.github_client import GitHubClient
from guitar_teacher.api.jobs import job_tracker
from guitar_teacher.core.analyzer import analyze_file
from guitar_teacher.lessons.generator import generate_lessons

router = APIRouter(tags=["analysis"], dependencies=[Depends(require_auth)])


def get_github() -> GitHubClient:
    return GitHubClient()


class GenerateRequest(BaseModel):
    file_path: str  # Path to GP/JSON file in repo (e.g., "queue/Artist - Song.gp")
    artist_slug: str
    song_slug: str
    order: str = "difficulty"


@router.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    """Upload a GP or JSON file and get SoloAnalysis back."""
    data = await file.read()
    suffix = os.path.splitext(file.filename or "file.json")[1]

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(data)
        tmp_path = tmp.name

    try:
        analysis = analyze_file(tmp_path)
    finally:
        os.unlink(tmp_path)

    # Convert dataclasses to dicts for JSON serialization
    result = asdict(analysis)
    return result


@router.post("/lessons/generate", status_code=202)
async def generate(req: GenerateRequest, background_tasks: BackgroundTasks):
    """Generate lessons from a SoloAnalysis and commit to repo. Returns job ID."""
    job_id = job_tracker.create(f"Generating lessons for {req.artist_slug}/{req.song_slug}")
    background_tasks.add_task(_run_generation, job_id, req)
    return {"job_id": job_id, "status": "accepted"}


async def _run_generation(job_id: str, req: GenerateRequest):
    """Background: download GP/JSON from repo, analyze, generate lessons, upload."""
    job_tracker.update(job_id, status="running", progress="Downloading file from repo")
    gh = get_github()

    try:
        # Download the file from repo
        result = await gh.read_binary(req.file_path)
        if result is None:
            job_tracker.update(job_id, status="failed", error=f"File not found: {req.file_path}")
            return

        file_bytes, _sha = result
        suffix = os.path.splitext(req.file_path)[1]

        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        job_tracker.update(job_id, progress="Analyzing file")
        try:
            analysis = analyze_file(tmp_path)
        finally:
            os.unlink(tmp_path)

        with tempfile.TemporaryDirectory() as tmp_dir:
            generate_lessons(analysis, tmp_dir, section_order=req.order)

            song_path = f"songs/{req.artist_slug}/{req.song_slug}"
            file_count = 0
            for root, dirs, files in os.walk(tmp_dir):
                for fname in files:
                    local_path = os.path.join(root, fname)
                    rel_path = os.path.relpath(local_path, tmp_dir)
                    repo_path = f"{song_path}/{rel_path}"

                    with open(local_path, "r") as f:
                        content = f.read()

                    file_count += 1
                    job_tracker.update(job_id, progress=f"Uploading file {file_count}: {rel_path}")
                    await gh.write_file(repo_path, content, message=f"Add {rel_path}")

        job_tracker.update(job_id, status="completed", result={
            "artist": req.artist_slug,
            "song": req.song_slug,
        })
    except Exception as e:
        job_tracker.update(job_id, status="failed", error=str(e))
    finally:
        await gh.close()
```

- [ ] **Step 4: Register analysis router in app.py**

Add to `create_app()`:

```python
    from guitar_teacher.api.routers.analysis import router as analysis_router
    app.include_router(analysis_router)
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/api/test_analysis_router.py -v`
Expected: All 3 tests PASS.

- [ ] **Step 6: Commit**

```bash
cd /Users/leo/hobby/tab
git add guitar-teacher/guitar_teacher/api/routers/analysis.py guitar-teacher/guitar_teacher/api/app.py guitar-teacher/tests/api/test_analysis_router.py
git commit -m "feat(api): add analysis router — direct GP/JSON file upload and analysis"
```

---

### Task 10: Dockerfile and Local Dev Setup

**Files:**
- Create: `guitar-teacher/Dockerfile`
- Create: `guitar-teacher/.env.example`

- [ ] **Step 1: Create Dockerfile**

The Dockerfile lives at the **repo root** (not inside guitar-teacher/) so both packages are in the build context.

```dockerfile
# Dockerfile (repo root: /Users/leo/hobby/tab/Dockerfile)
FROM python:3.12-slim

WORKDIR /app

# Copy both packages
COPY gp2tab /app/gp2tab
COPY guitar-teacher /app/guitar-teacher

# Install
RUN pip install --no-cache-dir /app/gp2tab "/app/guitar-teacher[api,llm]"

# Run
ENV PORT=8000
EXPOSE 8000
CMD ["uvicorn", "guitar_teacher.api.app:create_app", "--factory", "--host", "0.0.0.0", "--port", "8000"]
```

Build from repo root: `docker build -t guitar-teacher-api .`

For Railway: set the root directory to the repo root in Railway's project settings. Railway will use this Dockerfile automatically.

- [ ] **Step 2: Create .env.example**

```bash
# guitar_teacher/.env.example
AUTH_PIN=your-pin-here
AUTH_SECRET=generate-a-random-secret
GITHUB_TOKEN=ghp_your_personal_access_token
GITHUB_REPO=RealBleedingLight/tab
ALLOWED_ORIGINS=http://localhost:3000
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AI...
OPENAI_API_KEY=sk-...
```

- [ ] **Step 3: Test local startup**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && source .venv/bin/activate && AUTH_PIN=1234 AUTH_SECRET=dev-secret GITHUB_TOKEN=fake GITHUB_REPO=test/repo ALLOWED_ORIGINS=http://localhost:3000 python -c "from guitar_teacher.api.app import create_app; app = create_app(); print('App created successfully')"`
Expected: Prints "App created successfully" with no errors.

- [ ] **Step 4: Run the full test suite one final time**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/ -v`
Expected: ALL tests pass — both existing and new API tests.

- [ ] **Step 5: Commit**

```bash
cd /Users/leo/hobby/tab
git add Dockerfile guitar-teacher/.env.example
git commit -m "feat(api): add Dockerfile and env example for deployment"
```

---

## Summary

After completing all 10 tasks, the backend provides:

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Health check |
| `POST /auth/login` | Pin → JWT |
| `GET /auth/verify` | Validate token |
| `GET /theory/*` | 6 theory lookup endpoints |
| `POST /analyze` | Direct file analysis |
| `GET /songs` | List all songs with progress |
| `GET /songs/{a}/{s}/context` | Read .context.md |
| `GET /songs/{a}/{s}/lessons/{n}` | Read lesson file |
| `POST /songs/{a}/{s}/save-progress` | Save session to git |
| `GET /queue` | List queued GP files |
| `POST /queue/upload` | Upload GP file |
| `POST /queue/process/{f}` | Start lesson generation (async) |
| `GET /queue/status/{id}` | Poll job progress |
| `POST /ai/enhance` | *Deferred to Plan 3: AI Pipeline* |

Next plans: **Plan 2: Next.js Frontend**, **Plan 3: AI Pipeline with Quality Gates**.
