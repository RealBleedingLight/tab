# Guitar Teacher Web Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web app wrapping the existing guitar-teacher CLI — upload GP files, view processed songs section-by-section, and look up music theory with fretboard diagrams.

**Architecture:** FastAPI backend (Python) imports guitar-teacher directly and runs gp2tab via subprocess; stores processed songs as JSON files on disk; serves a Next.js + shadcn/ui frontend via separate deployments (Railway + Vercel).

**Tech Stack:** FastAPI, Python 3.11, gp2tab (local editable install), guitar-teacher (local editable install), Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Railway, Vercel

---

## File Map

### Backend (`web/backend/`)

| File | Responsibility |
|------|---------------|
| `main.py` | FastAPI app factory, CORS, router mounting |
| `config.py` | Env var loading (ALLOWED_ORIGINS, DATA_DIR, THEORY_DIR) |
| `models.py` | Pydantic response models for all endpoints |
| `routers/theory.py` | GET /theory/scales, /theory/scale/{root}/{type}, /theory/chord/{chord}, /theory/key/{root}/{type} |
| `routers/songs.py` | GET /songs, /songs/{id}, POST /songs/{id}/sections/{sid}/complete, DELETE /songs/{id} |
| `routers/upload.py` | POST /upload — accept GP file, run processor, save result |
| `services/processor.py` | Orchestrate gp2tab subprocess + analyze_file() → song dict |
| `services/storage.py` | Read/write song JSON files from DATA_DIR |
| `data/songs/` | JSON files, one per processed song |
| `requirements.txt` | FastAPI, uvicorn, python-multipart |
| `tests/` | pytest tests for each router and the storage service |

### Deployment

| File | Responsibility |
|------|---------------|
| `Dockerfile` | At repo root — installs gp2tab + guitar-teacher + backend deps |
| `railway.json` | Railway build + deploy config |

### Frontend (`web/frontend/`)

| File | Responsibility |
|------|---------------|
| `src/lib/types.ts` | TypeScript types mirroring backend Pydantic models |
| `src/lib/api.ts` | Typed fetch wrappers for all backend endpoints |
| `src/app/layout.tsx` | Root layout with nav |
| `src/app/page.tsx` | Home: upload zone + recent songs grid |
| `src/app/songs/[id]/page.tsx` | Song detail: section sidebar + content area |
| `src/app/theory/page.tsx` | Theory reference: scale/chord/key tabs |
| `src/components/FretboardDiagram.tsx` | SVG fretboard, renders scale/chord dot positions |
| `src/components/UploadZone.tsx` | Drag-drop file upload with processing state |
| `src/components/SongCard.tsx` | Song grid card (title, key, tempo, progress) |
| `src/components/SectionSidebar.tsx` | Scrollable section list with completion checkboxes |
| `src/components/SectionContent.tsx` | Scale, techniques, and metadata for selected section |
| `src/components/TabViewer.tsx` | Monospace pre-formatted tab display |

---

## Task 1: Project scaffolding

**Files:**
- Create: `web/backend/main.py`
- Create: `web/backend/requirements.txt`
- Create: `web/backend/config.py`
- Create: `web/frontend/` (Next.js app)

- [ ] **Step 1: Create backend directory structure**

```bash
mkdir -p web/backend/routers web/backend/services web/backend/data/songs web/backend/tests
touch web/backend/__init__.py web/backend/routers/__init__.py web/backend/services/__init__.py web/backend/tests/__init__.py
```

- [ ] **Step 2: Write `web/backend/requirements.txt`**

```
fastapi==0.115.0
uvicorn[standard]==0.32.0
python-multipart==0.0.12
pydantic==2.9.0
pytest==8.3.0
httpx==0.28.1
```

- [ ] **Step 3: Write `web/backend/config.py`**

```python
import os
from guitar_teacher.config import get_theory_dir

DATA_DIR = os.environ.get("DATA_DIR", os.path.join(os.path.dirname(__file__), "data"))
SONGS_DIR = os.path.join(DATA_DIR, "songs")
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
THEORY_DIR = os.environ.get("GUITAR_TEACHER_THEORY_DIR", get_theory_dir())

os.makedirs(SONGS_DIR, exist_ok=True)
```

- [ ] **Step 4: Write `web/backend/main.py`**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from web.backend.config import ALLOWED_ORIGINS


def create_app() -> FastAPI:
    app = FastAPI(title="Guitar Teacher API", version="1.0.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    from web.backend.routers import theory, songs, upload
    app.include_router(theory.router, prefix="/theory")
    app.include_router(songs.router, prefix="/songs")
    app.include_router(upload.router)

    @app.get("/health")
    def health():
        return {"status": "ok"}

    return app


app = create_app()
```

- [ ] **Step 5: Install backend deps**

```bash
cd /path/to/tab/repo
pip install -e ./gp2tab
pip install -e "./guitar-teacher"
pip install -r web/backend/requirements.txt
```

- [ ] **Step 6: Scaffold Next.js frontend**

```bash
cd web
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
cd frontend
npx shadcn@latest init -d
npx shadcn@latest add button card badge tabs separator scroll-area
```

- [ ] **Step 7: Verify backend starts**

```bash
# From repo root
uvicorn web.backend.main:app --reload
# Expected: Uvicorn running on http://127.0.0.1:8000
curl http://localhost:8000/health
# Expected: {"status":"ok"}
```

- [ ] **Step 8: Commit**

```bash
git add web/
git commit -m "feat: scaffold web/backend and web/frontend"
```

---

## Task 2: Backend data models + storage service

**Files:**
- Create: `web/backend/models.py`
- Create: `web/backend/services/storage.py`
- Create: `web/backend/tests/test_storage.py`

- [ ] **Step 1: Write `web/backend/models.py`**

```python
from pydantic import BaseModel
from typing import List, Optional


class SectionSummary(BaseModel):
    id: str
    name: str
    bar_start: int
    bar_end: int
    difficulty: float
    techniques: List[str]
    overall_scale: str
    completed: bool = False


class SongSummary(BaseModel):
    id: str
    title: str
    artist: str
    key: str
    tempo: int
    tuning: List[str]
    section_count: int
    completed_count: int
    processed_at: str


class SongDetail(SongSummary):
    sections: List[SectionSummary]
    full_tab: str


class FretPosition(BaseModel):
    string: int     # 0 = low E, 5 = high e
    fret: int
    is_root: bool


class ScaleResponse(BaseModel):
    root: str
    scale_type: str
    name: str
    notes: List[str]
    character: str
    common_in: List[str]
    improvisation_tip: str
    teaching_note: str
    fretboard: List[FretPosition]


class ChordResponse(BaseModel):
    root: str
    symbol: str
    name: str
    notes: List[str]
    intervals: List[int]
    character: str
    fretboard: List[FretPosition]


class KeyDegree(BaseModel):
    numeral: str
    chord_name: str
    notes: List[str]


class KeyResponse(BaseModel):
    root: str
    scale_type: str
    degrees: List[KeyDegree]


class ScaleListItem(BaseModel):
    key: str
    name: str
    category: str


class ChordTypeItem(BaseModel):
    key: str
    name: str
    symbol: str
```

- [ ] **Step 2: Write failing test for storage**

```python
# web/backend/tests/test_storage.py
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
    # Toggle again
    result2 = toggle_section_complete("test-artist-test-song", "section-a", songs_dir=songs_dir)
    section2 = next(s for s in result2["sections"] if s["id"] == "section-a")
    assert section2["completed"] is False
```

- [ ] **Step 3: Run to verify failure**

```bash
cd web/backend
pytest tests/test_storage.py -v
# Expected: ImportError — storage module not written yet
```

- [ ] **Step 4: Write `web/backend/services/storage.py`**

```python
import json
import os
from typing import Optional
from web.backend.config import SONGS_DIR


def _path(song_id: str, songs_dir: str) -> str:
    return os.path.join(songs_dir, f"{song_id}.json")


def save_song(data: dict, songs_dir: str = SONGS_DIR) -> None:
    os.makedirs(songs_dir, exist_ok=True)
    with open(_path(data["id"], songs_dir), "w") as f:
        json.dump(data, f, indent=2)


def load_song(song_id: str, songs_dir: str = SONGS_DIR) -> Optional[dict]:
    p = _path(song_id, songs_dir)
    if not os.path.exists(p):
        return None
    with open(p) as f:
        return json.load(f)


def list_songs(songs_dir: str = SONGS_DIR) -> list:
    if not os.path.exists(songs_dir):
        return []
    return [
        json.load(open(os.path.join(songs_dir, f)))
        for f in sorted(os.listdir(songs_dir))
        if f.endswith(".json")
    ]


def delete_song(song_id: str, songs_dir: str = SONGS_DIR) -> None:
    p = _path(song_id, songs_dir)
    if os.path.exists(p):
        os.remove(p)


def toggle_section_complete(song_id: str, section_id: str, songs_dir: str = SONGS_DIR) -> Optional[dict]:
    data = load_song(song_id, songs_dir)
    if data is None:
        return None
    for s in data["sections"]:
        if s["id"] == section_id:
            s["completed"] = not s.get("completed", False)
            break
    data["completed_count"] = sum(1 for s in data["sections"] if s.get("completed"))
    save_song(data, songs_dir)
    return data
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
pytest tests/test_storage.py -v
# Expected: 5 passed
```

- [ ] **Step 6: Commit**

```bash
git add web/backend/models.py web/backend/services/storage.py web/backend/tests/
git commit -m "feat: backend data models and file storage service"
```

---

## Task 3: Backend theory router

**Files:**
- Create: `web/backend/routers/theory.py`
- Create: `web/backend/tests/test_theory_router.py`

- [ ] **Step 1: Write failing tests**

```python
# web/backend/tests/test_theory_router.py
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
    assert data["degrees"][0]["numeral"] == "I"
```

- [ ] **Step 2: Run to verify failure**

```bash
pytest tests/test_theory_router.py -v
# Expected: routing errors — router not written yet
```

- [ ] **Step 3: Write `web/backend/routers/theory.py`**

```python
import re
from typing import List
from fastapi import APIRouter, HTTPException

from guitar_teacher.core.theory import TheoryEngine
from guitar_teacher.core.note_utils import note_to_pitch_class
from web.backend.config import THEORY_DIR
from web.backend.models import (
    ScaleResponse, ChordResponse, KeyResponse, KeyDegree,
    FretPosition, ScaleListItem, ChordTypeItem,
)

router = APIRouter(tags=["theory"])

# Standard tuning open string pitch classes: low E(0) A(1) D(2) G(3) B(4) high e(5)
_OPEN_STRINGS = [
    note_to_pitch_class("E"),   # 4
    note_to_pitch_class("A"),   # 9
    note_to_pitch_class("D"),   # 2
    note_to_pitch_class("G"),   # 7
    note_to_pitch_class("B"),   # 11
    note_to_pitch_class("E"),   # 4
]

_DEGREE_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII"]
_QUALITY_NUMERAL = {
    "major":      lambda x: x.upper(),
    "minor":      lambda x: x.lower(),
    "diminished": lambda x: x.lower() + "°",
    "augmented":  lambda x: x.upper() + "+",
}

_engine = None


def get_engine() -> TheoryEngine:
    global _engine
    if _engine is None:
        _engine = TheoryEngine(THEORY_DIR)
    return _engine


def _fretboard(note_pcs: set, root_pc: int, frets: int = 12) -> List[FretPosition]:
    positions = []
    for string_idx, open_pc in enumerate(_OPEN_STRINGS):
        for fret in range(frets + 1):
            pc = (open_pc + fret) % 12
            if pc in note_pcs:
                positions.append(FretPosition(
                    string=string_idx,
                    fret=fret,
                    is_root=(pc == root_pc % 12),
                ))
    return positions


@router.get("/scales", response_model=List[ScaleListItem])
def list_scales():
    engine = get_engine()
    return [ScaleListItem(key=s.key, name=s.name, category=s.category)
            for s in engine.scales.values()]


@router.get("/scale/{root}/{scale_type}", response_model=ScaleResponse)
def get_scale(root: str, scale_type: str):
    engine = get_engine()
    result = engine.get_scale(root, scale_type)
    if result is None:
        raise HTTPException(404, detail=f"Scale '{scale_type}' not found")
    note_pcs = {note_to_pitch_class(n) for n in result.notes}
    root_pc = note_to_pitch_class(root)
    return ScaleResponse(
        root=root,
        scale_type=scale_type,
        name=result.scale.name,
        notes=result.notes,
        character=result.scale.character,
        common_in=result.scale.common_in,
        improvisation_tip=result.scale.improvisation_tip,
        teaching_note=result.scale.teaching_note,
        fretboard=_fretboard(note_pcs, root_pc),
    )


@router.get("/chords", response_model=List[ChordTypeItem])
def list_chords():
    engine = get_engine()
    return [ChordTypeItem(key=c.key, name=c.name, symbol=c.symbol)
            for c in engine.chords.values()]


def _parse_chord(chord_name: str):
    """'Am7' → root='A', type='m7'. 'C' → root='C', type='major'."""
    m = re.match(r"^([A-Ga-g][#b]?)(.*)$", chord_name)
    if not m:
        return None, None
    root = m.group(1).capitalize()
    chord_type = m.group(2).strip() or "major"
    return root, chord_type


@router.get("/chord/{chord_name}", response_model=ChordResponse)
def get_chord(chord_name: str):
    engine = get_engine()
    root, chord_type = _parse_chord(chord_name)
    if root is None:
        raise HTTPException(400, detail="Invalid chord name")
    result = engine.get_chord(root, chord_type)
    if result is None:
        raise HTTPException(404, detail=f"Chord '{chord_name}' not found")
    note_pcs = {note_to_pitch_class(n) for n in result.notes}
    root_pc = note_to_pitch_class(root)
    return ChordResponse(
        root=root,
        symbol=result.chord.symbol,
        name=result.chord.name,
        notes=result.notes,
        intervals=result.chord.intervals,
        character=result.chord.character,
        fretboard=_fretboard(note_pcs, root_pc),
    )


@router.get("/key/{root}/{scale_type}", response_model=KeyResponse)
def get_key(root: str, scale_type: str):
    engine = get_engine()
    chords = engine.chords_in_key(root, scale_type)
    if not chords:
        raise HTTPException(404, detail=f"Key '{root} {scale_type}' not found")
    degrees = []
    for i, cr in enumerate(chords):
        base = _DEGREE_NUMERALS[i] if i < 7 else str(i + 1)
        fn = _QUALITY_NUMERAL.get(cr.chord.key, lambda x: x.upper())
        numeral = fn(base)
        chord_name = cr.root + (cr.chord.symbol if cr.chord.symbol else "")
        degrees.append(KeyDegree(numeral=numeral, chord_name=chord_name, notes=cr.notes))
    return KeyResponse(root=root, scale_type=scale_type, degrees=degrees)
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_theory_router.py -v
# Expected: 7 passed
```

- [ ] **Step 5: Commit**

```bash
git add web/backend/routers/theory.py web/backend/tests/test_theory_router.py
git commit -m "feat: theory API — scales, chords, keys with fretboard positions"
```

---

## Task 4: Processing service + upload router

**Files:**
- Create: `web/backend/services/processor.py`
- Create: `web/backend/routers/upload.py`
- Create: `web/backend/tests/test_processor.py`

- [ ] **Step 1: Write failing test for processor**

```python
# web/backend/tests/test_processor.py
from pathlib import Path
import pytest
from web.backend.services.processor import make_song_id, process_gp_file

SAMPLE_JSON = Path(__file__).parents[4] / "songs/guthrie-govan/man-of-steel/tab.json"


def test_make_song_id():
    assert make_song_id("Man of Steel", "Guthrie Govan") == "guthrie-govan-man-of-steel"
    assert make_song_id("Tornado Of Souls", "Megadeth") == "megadeth-tornado-of-souls"


@pytest.mark.skipif(not SAMPLE_JSON.exists(), reason="Sample JSON not found")
def test_process_json_file():
    result = process_gp_file(str(SAMPLE_JSON))
    assert result["id"] == "guthrie-govan-man-of-steel"
    assert len(result["sections"]) > 0
    assert result["tempo"] > 0
    assert "sections" in result
    for s in result["sections"]:
        assert "id" in s
        assert "bar_start" in s
        assert "difficulty" in s
```

- [ ] **Step 2: Run to verify failure**

```bash
pytest tests/test_processor.py -v
# Expected: ImportError
```

- [ ] **Step 3: Write `web/backend/services/processor.py`**

```python
import json
import re
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from guitar_teacher.core.analyzer import analyze_file
from guitar_teacher.core.theory import TheoryEngine
from web.backend.config import THEORY_DIR

_engine: Optional[TheoryEngine] = None


def _get_engine() -> TheoryEngine:
    global _engine
    if _engine is None:
        _engine = TheoryEngine(THEORY_DIR)
    return _engine


def make_song_id(title: str, artist: str) -> str:
    def slug(s):
        return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return f"{slug(artist)}-{slug(title)}"


def _run_gp2tab_tab(gp_path: str, output_dir: str) -> str:
    """Run gp2tab to produce tab.txt in output_dir. Returns tab text."""
    result = subprocess.run(
        ["python", "-m", "gp2tab", gp_path, "-o", output_dir, "--format", "tab"],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"gp2tab failed: {result.stderr}")
    tab_path = Path(output_dir) / "tab.txt"
    if not tab_path.exists():
        raise RuntimeError("gp2tab did not produce tab.txt")
    return tab_path.read_text()


def process_gp_file(file_path: str) -> dict:
    """
    Process a .gp* or gp2tab .json file.
    Returns a dict matching SongDetail structure ready for storage.
    """
    path = Path(file_path)
    is_json = path.suffix == ".json"

    # Get tab text
    if is_json:
        # tab.txt may live alongside the JSON (typical workflow)
        tab_sibling = path.parent / "tab.txt"
        full_tab = tab_sibling.read_text() if tab_sibling.exists() else ""
    else:
        with tempfile.TemporaryDirectory() as tmpdir:
            full_tab = _run_gp2tab_tab(str(path), tmpdir)

    # Analyze
    analysis = analyze_file(str(path))

    # Build sections list
    sections = []
    for sa in analysis.sections:
        section_id = re.sub(r"[^a-z0-9]+", "-", sa.name.lower()).strip("-")
        sections.append({
            "id": section_id,
            "name": sa.name,
            "bar_start": sa.bar_range[0],
            "bar_end": sa.bar_range[1],
            "difficulty": round(sa.difficulty, 1),
            "techniques": list(sa.primary_techniques),
            "overall_scale": sa.overall_scale,
            "completed": False,
        })

    song_id = make_song_id(analysis.title, analysis.artist)

    return {
        "id": song_id,
        "title": analysis.title,
        "artist": analysis.artist,
        "key": analysis.key,
        "tempo": analysis.tempo,
        "tuning": list(analysis.tuning),
        "section_count": len(sections),
        "completed_count": 0,
        "processed_at": datetime.now(timezone.utc).isoformat(),
        "sections": sections,
        "full_tab": full_tab,
    }
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_processor.py -v
# Expected: test_make_song_id passes; test_process_json_file passes or skips
```

- [ ] **Step 5: Write `web/backend/routers/upload.py`**

```python
import os
import tempfile
from fastapi import APIRouter, File, UploadFile, HTTPException
from web.backend.services.processor import process_gp_file
from web.backend.services.storage import save_song
from web.backend.models import SongSummary

router = APIRouter(tags=["upload"])

ALLOWED = {".gp", ".gp3", ".gp4", ".gp5", ".gpx", ".json"}


@router.post("/upload", response_model=SongSummary, status_code=201)
async def upload_file(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED:
        raise HTTPException(400, detail=f"Unsupported file type '{ext}'")

    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        song_data = process_gp_file(tmp_path)
    except Exception as e:
        raise HTTPException(422, detail=f"Processing failed: {e}")
    finally:
        os.unlink(tmp_path)

    save_song(song_data)
    return SongSummary(**{k: song_data[k] for k in SongSummary.model_fields})
```

- [ ] **Step 6: Manual smoke test**

```bash
# Terminal 1
uvicorn web.backend.main:app --reload

# Terminal 2 — use a real file from the songs/ directory
curl -X POST http://localhost:8000/upload \
  -F "file=@songs/guthrie-govan/man-of-steel/tab.json" \
  -H "accept: application/json"
# Expected: 201 with JSON containing title, key, tempo, section_count
```

- [ ] **Step 7: Commit**

```bash
git add web/backend/services/processor.py web/backend/routers/upload.py web/backend/tests/test_processor.py
git commit -m "feat: processing pipeline and upload endpoint"
```

---

## Task 5: Backend songs router

**Files:**
- Create: `web/backend/routers/songs.py`
- Create: `web/backend/tests/test_songs_router.py`

- [ ] **Step 1: Write failing tests**

```python
# web/backend/tests/test_songs_router.py
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
    assert "full_tab" not in data[0]


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
```

- [ ] **Step 2: Run to verify failure**

```bash
pytest tests/test_songs_router.py -v
# Expected: routing errors
```

- [ ] **Step 3: Write `web/backend/routers/songs.py`**

```python
from typing import List
from fastapi import APIRouter, HTTPException
from web.backend.services import storage as storage_mod
from web.backend.models import SongSummary, SongDetail

router = APIRouter(tags=["songs"])


@router.get("", response_model=List[SongSummary])
def list_songs():
    return [SongSummary(**{k: s[k] for k in SongSummary.model_fields})
            for s in storage_mod.list_songs()]


@router.get("/{song_id}", response_model=SongDetail)
def get_song(song_id: str):
    song = storage_mod.load_song(song_id)
    if song is None:
        raise HTTPException(404, detail="Song not found")
    return SongDetail(**song)


@router.post("/{song_id}/sections/{section_id}/complete", response_model=SongDetail)
def toggle_complete(song_id: str, section_id: str):
    result = storage_mod.toggle_section_complete(song_id, section_id)
    if result is None:
        raise HTTPException(404, detail="Song not found")
    return SongDetail(**result)


@router.delete("/{song_id}", status_code=204)
def delete_song(song_id: str):
    if storage_mod.load_song(song_id) is None:
        raise HTTPException(404, detail="Song not found")
    storage_mod.delete_song(song_id)
```

- [ ] **Step 4: Run all backend tests**

```bash
pytest tests/ -v
# Expected: all tests passing
```

- [ ] **Step 5: Commit**

```bash
git add web/backend/routers/songs.py web/backend/tests/test_songs_router.py
git commit -m "feat: songs CRUD API with section completion toggle"
```

---

## Task 6: Frontend foundation — types, API client, layout

**Files:**
- Create: `web/frontend/src/lib/types.ts`
- Create: `web/frontend/src/lib/api.ts`
- Modify: `web/frontend/src/app/layout.tsx`
- Create: `web/frontend/.env.local.example`

- [ ] **Step 1: Write `web/frontend/src/lib/types.ts`**

```typescript
export interface FretPosition {
  string: number   // 0 = low E, 5 = high e
  fret: number
  is_root: boolean
}

export interface SectionSummary {
  id: string
  name: string
  bar_start: number
  bar_end: number
  difficulty: number
  techniques: string[]
  overall_scale: string
  completed: boolean
}

export interface SongSummary {
  id: string
  title: string
  artist: string
  key: string
  tempo: number
  tuning: string[]
  section_count: number
  completed_count: number
  processed_at: string
}

export interface SongDetail extends SongSummary {
  sections: SectionSummary[]
  full_tab: string
}

export interface ScaleResponse {
  root: string
  scale_type: string
  name: string
  notes: string[]
  character: string
  common_in: string[]
  improvisation_tip: string
  teaching_note: string
  fretboard: FretPosition[]
}

export interface ChordResponse {
  root: string
  symbol: string
  name: string
  notes: string[]
  intervals: number[]
  character: string
  fretboard: FretPosition[]
}

export interface KeyDegree {
  numeral: string
  chord_name: string
  notes: string[]
}

export interface KeyResponse {
  root: string
  scale_type: string
  degrees: KeyDegree[]
}

export interface ScaleListItem {
  key: string
  name: string
  category: string
}

export interface ChordTypeItem {
  key: string
  name: string
  symbol: string
}
```

- [ ] **Step 2: Write `web/frontend/src/lib/api.ts`**

```typescript
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, options)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${res.status}: ${text}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  songs: {
    list: () =>
      request<import("./types").SongSummary[]>("/songs"),
    get: (id: string) =>
      request<import("./types").SongDetail>(`/songs/${id}`),
    delete: (id: string) =>
      request<void>(`/songs/${id}`, { method: "DELETE" }),
    toggleComplete: (songId: string, sectionId: string) =>
      request<import("./types").SongDetail>(`/songs/${songId}/sections/${sectionId}/complete`, { method: "POST" }),
    upload: (file: File) => {
      const form = new FormData()
      form.append("file", file)
      return request<import("./types").SongSummary>("/upload", { method: "POST", body: form })
    },
  },
  theory: {
    scales: () =>
      request<import("./types").ScaleListItem[]>("/theory/scales"),
    scale: (root: string, type: string) =>
      request<import("./types").ScaleResponse>(`/theory/scale/${root}/${type}`),
    chords: () =>
      request<import("./types").ChordTypeItem[]>("/theory/chords"),
    chord: (name: string) =>
      request<import("./types").ChordResponse>(`/theory/chord/${name}`),
    key: (root: string, type: string) =>
      request<import("./types").KeyResponse>(`/theory/key/${root}/${type}`),
  },
}
```

- [ ] **Step 3: Write `web/frontend/src/app/layout.tsx`**

```tsx
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Link from "next/link"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Guitar Teacher",
  description: "Practice solos. Learn theory.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-100 min-h-screen`}>
        <header className="border-b border-zinc-800 px-6 py-4">
          <nav className="max-w-6xl mx-auto flex items-center gap-8">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Guitar Teacher
            </Link>
            <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
              Songs
            </Link>
            <Link href="/theory" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
              Theory
            </Link>
          </nav>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Create env example and local copy**

```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > web/frontend/.env.local.example
cp web/frontend/.env.local.example web/frontend/.env.local
```

- [ ] **Step 5: Verify build**

```bash
cd web/frontend
npm run build
# Expected: compiled successfully with no type errors
```

- [ ] **Step 6: Commit**

```bash
git add web/frontend/src/lib/ web/frontend/src/app/layout.tsx web/frontend/.env.local.example
git commit -m "feat: frontend types, API client, and root layout"
```

---

## Task 7: Theory page + FretboardDiagram component

**Files:**
- Create: `web/frontend/src/components/FretboardDiagram.tsx`
- Create: `web/frontend/src/app/theory/page.tsx`

- [ ] **Step 1: Write `web/frontend/src/components/FretboardDiagram.tsx`**

```tsx
"use client"
import type { FretPosition } from "@/lib/types"

interface Props {
  positions: FretPosition[]
  frets?: number
}

// Display order: high e on top (string index 5 → 0)
const DISPLAY_ORDER = [5, 4, 3, 2, 1, 0]
const STRING_NAMES = ["E", "A", "D", "G", "B", "e"]

const FRET_W = 48
const STRING_H = 30
const LEFT = 28
const TOP = 16

export function FretboardDiagram({ positions, frets = 12 }: Props) {
  const width = LEFT + frets * FRET_W + FRET_W + 16
  const height = TOP + 5 * STRING_H + 32

  const posMap = new Map<string, FretPosition>()
  for (const p of positions) posMap.set(`${p.string}-${p.fret}`, p)

  return (
    <svg width={width} height={height} className="select-none overflow-visible">
      {/* Fret lines */}
      {Array.from({ length: frets + 1 }, (_, i) => {
        const x = LEFT + i * FRET_W + FRET_W / 2
        return (
          <line key={i}
            x1={x} y1={TOP}
            x2={x} y2={TOP + 5 * STRING_H}
            stroke={i === 0 ? "#a1a1aa" : "#3f3f46"}
            strokeWidth={i === 0 ? 2.5 : 1}
          />
        )
      })}

      {/* Fret markers (3, 5, 7, 9, 12) */}
      {[3, 5, 7, 9, 12].filter(f => f <= frets).map(f => (
        <text key={f}
          x={LEFT + f * FRET_W}
          y={height - 4}
          textAnchor="middle" fontSize={10} fill="#52525b">
          {f}
        </text>
      ))}

      {/* Strings */}
      {DISPLAY_ORDER.map((stringIdx, row) => {
        const y = TOP + row * STRING_H
        return (
          <g key={stringIdx}>
            <text x={LEFT - 8} y={y + 4}
              textAnchor="end" fontSize={11} fill="#71717a">
              {STRING_NAMES[stringIdx]}
            </text>
            <line
              x1={LEFT + FRET_W / 2} y1={y}
              x2={LEFT + frets * FRET_W + FRET_W / 2} y2={y}
              stroke="#3f3f46" strokeWidth={1}
            />
            {Array.from({ length: frets + 1 }, (_, fret) => {
              const pos = posMap.get(`${stringIdx}-${fret}`)
              if (!pos) return null
              const cx = LEFT + fret * FRET_W + FRET_W / 2
              return (
                <g key={fret}>
                  <circle cx={cx} cy={y} r={11}
                    fill={pos.is_root ? "#2563eb" : "#27272a"}
                    stroke={pos.is_root ? "#3b82f6" : "#71717a"}
                    strokeWidth={1.5}
                  />
                  {pos.is_root && (
                    <text x={cx} y={y + 4}
                      textAnchor="middle" fontSize={9}
                      fill="white" fontWeight="bold">
                      R
                    </text>
                  )}
                </g>
              )
            })}
          </g>
        )
      })}
    </svg>
  )
}
```

- [ ] **Step 2: Write `web/frontend/src/app/theory/page.tsx`**

```tsx
"use client"
import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { FretboardDiagram } from "@/components/FretboardDiagram"
import { api } from "@/lib/api"
import type { ScaleListItem, ChordTypeItem, ScaleResponse, ChordResponse, KeyResponse } from "@/lib/types"

const NOTES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]

const sel = "bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"

export default function TheoryPage() {
  const [scales, setScales] = useState<ScaleListItem[]>([])
  const [chords, setChords] = useState<ChordTypeItem[]>([])

  // Scale state
  const [scaleRoot, setScaleRoot] = useState("E")
  const [scaleType, setScaleType] = useState("natural_minor")
  const [scaleResult, setScaleResult] = useState<ScaleResponse | null>(null)

  // Chord state
  const [chordRoot, setChordRoot] = useState("A")
  const [chordTypeKey, setChordTypeKey] = useState("minor_7th")
  const [chordResult, setChordResult] = useState<ChordResponse | null>(null)

  // Key state
  const [keyRoot, setKeyRoot] = useState("A")
  const [keyType, setKeyType] = useState("natural_minor")
  const [keyResult, setKeyResult] = useState<KeyResponse | null>(null)

  useEffect(() => {
    api.theory.scales().then(setScales)
    api.theory.chords().then(setChords)
  }, [])

  useEffect(() => {
    api.theory.scale(scaleRoot, scaleType).then(setScaleResult).catch(() => setScaleResult(null))
  }, [scaleRoot, scaleType])

  useEffect(() => {
    const chord = chords.find(c => c.key === chordTypeKey)
    if (!chord) return
    const name = chordRoot + chord.symbol
    api.theory.chord(name).then(setChordResult).catch(() => setChordResult(null))
  }, [chordRoot, chordTypeKey, chords])

  useEffect(() => {
    api.theory.key(keyRoot, keyType).then(setKeyResult).catch(() => setKeyResult(null))
  }, [keyRoot, keyType])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Theory Reference</h1>

      <Tabs defaultValue="scale">
        <TabsList className="mb-6">
          <TabsTrigger value="scale">Scales</TabsTrigger>
          <TabsTrigger value="chord">Chords</TabsTrigger>
          <TabsTrigger value="key">Keys</TabsTrigger>
        </TabsList>

        {/* SCALES */}
        <TabsContent value="scale" className="space-y-6">
          <div className="flex gap-3 flex-wrap">
            <select className={sel} value={scaleRoot} onChange={e => setScaleRoot(e.target.value)}>
              {NOTES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <select className={sel} value={scaleType} onChange={e => setScaleType(e.target.value)}>
              {scales.map(s => <option key={s.key} value={s.key}>{s.name}</option>)}
            </select>
          </div>
          {scaleResult && (
            <>
              <div>
                <h2 className="text-xl font-semibold">{scaleResult.root} {scaleResult.name}</h2>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {scaleResult.notes.map(n => <Badge key={n} variant="outline">{n}</Badge>)}
                </div>
                <p className="text-zinc-400 text-sm mt-2">{scaleResult.character}</p>
              </div>
              <div className="overflow-x-auto bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <FretboardDiagram positions={scaleResult.fretboard} />
              </div>
              {scaleResult.improvisation_tip && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-sm">
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-2">Improv tip</p>
                  <p className="text-zinc-300">{scaleResult.improvisation_tip}</p>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* CHORDS */}
        <TabsContent value="chord" className="space-y-6">
          <div className="flex gap-3 flex-wrap">
            <select className={sel} value={chordRoot} onChange={e => setChordRoot(e.target.value)}>
              {NOTES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <select className={sel} value={chordTypeKey} onChange={e => setChordTypeKey(e.target.value)}>
              {chords.map(c => <option key={c.key} value={c.key}>{c.name}</option>)}
            </select>
          </div>
          {chordResult && (
            <>
              <div>
                <h2 className="text-xl font-semibold">
                  {chordResult.root}{chordResult.symbol}
                  <span className="text-zinc-400 font-normal ml-2 text-base">— {chordResult.name}</span>
                </h2>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {chordResult.notes.map(n => <Badge key={n} variant="outline">{n}</Badge>)}
                </div>
                <p className="text-zinc-400 text-sm mt-2">{chordResult.character}</p>
              </div>
              <div className="overflow-x-auto bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <FretboardDiagram positions={chordResult.fretboard} />
              </div>
            </>
          )}
        </TabsContent>

        {/* KEYS */}
        <TabsContent value="key" className="space-y-6">
          <div className="flex gap-3 flex-wrap">
            <select className={sel} value={keyRoot} onChange={e => setKeyRoot(e.target.value)}>
              {NOTES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <select className={sel} value={keyType} onChange={e => setKeyType(e.target.value)}>
              {scales.map(s => <option key={s.key} value={s.key}>{s.name}</option>)}
            </select>
          </div>
          {keyResult && (
            <>
              <h2 className="text-xl font-semibold">
                {keyResult.root} {keyType.replace(/_/g, " ")}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {keyResult.degrees.map(d => (
                  <div key={d.numeral}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                    <p className="text-zinc-500 text-xs font-mono mb-1">{d.numeral}</p>
                    <p className="font-semibold text-lg">{d.chord_name}</p>
                    <p className="text-zinc-400 text-sm">{d.notes.join("  ")}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

- [ ] **Step 3: Verify in dev**

```bash
# With backend running
cd web/frontend && npm run dev
# Visit http://localhost:3000/theory
# Select scale root and type → fretboard renders with blue root dots
# Switch to Chords tab → chord fretboard renders
# Switch to Keys tab → diatonic chord grid renders
```

- [ ] **Step 4: Commit**

```bash
git add web/frontend/src/components/FretboardDiagram.tsx web/frontend/src/app/theory/
git commit -m "feat: theory page with SVG fretboard for scales, chords, and keys"
```

---

## Task 8: Home page — upload + songs grid

**Files:**
- Create: `web/frontend/src/components/UploadZone.tsx`
- Create: `web/frontend/src/components/SongCard.tsx`
- Create: `web/frontend/src/app/page.tsx`

- [ ] **Step 1: Write `web/frontend/src/components/UploadZone.tsx`**

```tsx
"use client"
import { useRef, useState } from "react"
import { api } from "@/lib/api"
import type { SongSummary } from "@/lib/types"

interface Props {
  onUploaded: (song: SongSummary) => void
}

export function UploadZone({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<"idle" | "processing" | "error">("idle")
  const [error, setError] = useState("")
  const [dragging, setDragging] = useState(false)

  async function handleFile(file: File) {
    setState("processing")
    setError("")
    try {
      const song = await api.songs.upload(file)
      setState("idle")
      onUploaded(song)
    } catch (e: unknown) {
      setState("error")
      setError(e instanceof Error ? e.message : "Upload failed")
    }
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
        ${dragging ? "border-blue-500 bg-blue-500/5" : "border-zinc-700 hover:border-zinc-500"}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".gp,.gp3,.gp4,.gp5,.gpx,.json"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
      {state === "processing" ? (
        <div className="space-y-2">
          <div className="animate-pulse text-blue-400 font-medium">Processing file…</div>
          <p className="text-zinc-500 text-sm">Analyzing sections and generating theory</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-zinc-300 font-medium">Drop a Guitar Pro file here</p>
          <p className="text-zinc-500 text-sm">.gp .gp5 .gpx .json — or click to browse</p>
          {state === "error" && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write `web/frontend/src/components/SongCard.tsx`**

```tsx
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import type { SongSummary } from "@/lib/types"

export function SongCard({ song }: { song: SongSummary }) {
  const pct = song.section_count > 0
    ? Math.round((song.completed_count / song.section_count) * 100)
    : 0

  return (
    <Link href={`/songs/${song.id}`} className="block h-full">
      <div className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl p-5 transition-colors h-full flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-zinc-100 leading-tight truncate">{song.title}</h3>
            <p className="text-zinc-500 text-sm mt-0.5 truncate">{song.artist}</p>
          </div>
          {pct === 100 && (
            <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded font-medium shrink-0">
              Done
            </span>
          )}
        </div>

        <div className="flex gap-2 flex-wrap mb-4">
          <Badge variant="outline" className="text-xs">{song.key}</Badge>
          <Badge variant="outline" className="text-xs">{song.tempo} bpm</Badge>
          <Badge variant="outline" className="text-xs">{song.section_count} sections</Badge>
        </div>

        <div className="mt-auto">
          <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
            <span>Progress</span>
            <span>{song.completed_count}/{song.section_count}</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 3: Write `web/frontend/src/app/page.tsx`**

```tsx
"use client"
import { useState, useEffect } from "react"
import { UploadZone } from "@/components/UploadZone"
import { SongCard } from "@/components/SongCard"
import { api } from "@/lib/api"
import type { SongSummary } from "@/lib/types"

export default function HomePage() {
  const [songs, setSongs] = useState<SongSummary[]>([])

  useEffect(() => {
    api.songs.list().then(setSongs).catch(() => {})
  }, [])

  function onUploaded(song: SongSummary) {
    setSongs(prev => {
      const exists = prev.some(s => s.id === song.id)
      return exists
        ? prev.map(s => s.id === song.id ? song : s)
        : [song, ...prev]
    })
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold mb-2">Guitar Teacher</h1>
        <p className="text-zinc-400">Upload a Guitar Pro file to generate section-by-section practice content.</p>
      </div>

      <UploadZone onUploaded={onUploaded} />

      {songs.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Your Songs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {songs.map(song => <SongCard key={song.id} song={song} />)}
          </div>
        </section>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Verify in dev**

```bash
cd web/frontend && npm run dev
# With backend running, visit http://localhost:3000
# Upload a .json file from songs/ — card appears after processing
# Click card → navigates to /songs/[id] (page not built yet, 404 expected)
```

- [ ] **Step 5: Commit**

```bash
git add web/frontend/src/components/UploadZone.tsx web/frontend/src/components/SongCard.tsx web/frontend/src/app/page.tsx
git commit -m "feat: home page with upload zone and songs grid"
```

---

## Task 9: Song detail page

**Files:**
- Create: `web/frontend/src/components/TabViewer.tsx`
- Create: `web/frontend/src/components/SectionSidebar.tsx`
- Create: `web/frontend/src/components/SectionContent.tsx`
- Create: `web/frontend/src/app/songs/[id]/page.tsx`

- [ ] **Step 1: Write `web/frontend/src/components/TabViewer.tsx`**

```tsx
interface Props {
  tab: string
  className?: string
}

export function TabViewer({ tab, className = "" }: Props) {
  return (
    <pre className={`font-mono text-xs leading-5 text-zinc-300 overflow-x-auto whitespace-pre bg-zinc-950 border border-zinc-800 rounded-xl p-4 ${className}`}>
      {tab || "No tab available for this file."}
    </pre>
  )
}
```

- [ ] **Step 2: Write `web/frontend/src/components/SectionSidebar.tsx`**

```tsx
import type { SectionSummary } from "@/lib/types"

interface Props {
  sections: SectionSummary[]
  selectedId: string | null
  onSelect: (id: string) => void
  onToggleComplete: (id: string) => void
}

function diffColor(d: number) {
  if (d < 4) return "text-green-400"
  if (d < 7) return "text-yellow-400"
  return "text-red-400"
}

export function SectionSidebar({ sections, selectedId, onSelect, onToggleComplete }: Props) {
  return (
    <div className="space-y-0.5">
      {sections.map(s => (
        <div
          key={s.id}
          onClick={() => onSelect(s.id)}
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-colors
            ${selectedId === s.id
              ? "bg-zinc-800 text-zinc-100"
              : "hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200"}`}
        >
          <button
            onClick={e => { e.stopPropagation(); onToggleComplete(s.id) }}
            className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-[10px] transition-colors
              ${s.completed ? "bg-green-600 border-green-600 text-white" : "border-zinc-600 hover:border-zinc-400"}`}
          >
            {s.completed && "✓"}
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{s.name}</p>
            <p className="text-xs text-zinc-600">bars {s.bar_start}–{s.bar_end}</p>
          </div>

          <span className={`text-xs font-mono shrink-0 ${diffColor(s.difficulty)}`}>
            {s.difficulty.toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Write `web/frontend/src/components/SectionContent.tsx`**

```tsx
import { Badge } from "@/components/ui/badge"
import type { SectionSummary } from "@/lib/types"

const TECHNIQUE_LABELS: Record<string, string> = {
  bend: "Bend", bend_release: "Bend & Release", pre_bend: "Pre-Bend",
  hammer_on: "Hammer-on", pull_off: "Pull-off", slide: "Slide",
  vibrato: "Vibrato", tapping: "Tapping", sweep: "Sweep Picking",
  harmonic: "Harmonic", palm_mute: "Palm Mute",
  tremolo: "Tremolo Picking", whammy: "Whammy Bar",
}

function techLabel(t: string) {
  return TECHNIQUE_LABELS[t] ?? t.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
}

function diffLabel(d: number): { text: string; cls: string } {
  if (d < 3) return { text: "Beginner", cls: "bg-green-950 text-green-300 border border-green-800" }
  if (d < 5) return { text: "Intermediate", cls: "bg-yellow-950 text-yellow-300 border border-yellow-800" }
  if (d < 7) return { text: "Advanced", cls: "bg-orange-950 text-orange-300 border border-orange-800" }
  return { text: "Expert", cls: "bg-red-950 text-red-300 border border-red-800" }
}

export function SectionContent({ section }: { section: SectionSummary }) {
  const diff = diffLabel(section.difficulty)

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{section.name}</h2>
          <p className="text-zinc-500 text-sm mt-1">Bars {section.bar_start}–{section.bar_end}</p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-md font-medium shrink-0 ${diff.cls}`}>
          {diff.text} · {section.difficulty.toFixed(1)}
        </span>
      </div>

      <div className="grid gap-4">
        {/* Scale */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-2">Key / Scale</p>
          <p className="text-zinc-200 font-medium">{section.overall_scale || "—"}</p>
        </div>

        {/* Techniques */}
        {section.techniques.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">Techniques</p>
            <div className="flex flex-wrap gap-2">
              {section.techniques.map(t => (
                <Badge key={t} variant="secondary">{techLabel(t)}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Write `web/frontend/src/app/songs/[id]/page.tsx`**

```tsx
"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SectionSidebar } from "@/components/SectionSidebar"
import { SectionContent } from "@/components/SectionContent"
import { TabViewer } from "@/components/TabViewer"
import { api } from "@/lib/api"
import type { SongDetail } from "@/lib/types"

export default function SongPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [song, setSong] = useState<SongDetail | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showFullTab, setShowFullTab] = useState(false)

  useEffect(() => {
    api.songs.get(id).then(s => {
      setSong(s)
      if (s.sections.length > 0) setSelectedId(s.sections[0].id)
    }).catch(() => router.push("/"))
  }, [id, router])

  async function toggleComplete(sectionId: string) {
    const updated = await api.songs.toggleComplete(id, sectionId)
    setSong(updated)
  }

  async function handleDelete() {
    if (!confirm(`Delete "${song?.title}"?`)) return
    await api.songs.delete(id)
    router.push("/")
  }

  if (!song) {
    return <div className="text-zinc-500 animate-pulse">Loading…</div>
  }

  const selectedSection = song.sections.find(s => s.id === selectedId)
  const pct = song.section_count > 0
    ? Math.round((song.completed_count / song.section_count) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{song.title}</h1>
          <p className="text-zinc-400 mt-1">{song.artist}</p>
          <div className="flex gap-2 mt-3 flex-wrap">
            <Badge variant="outline">{song.key}</Badge>
            <Badge variant="outline">{song.tempo} bpm</Badge>
            <Badge variant="outline">{song.tuning.join(" ")}</Badge>
            <Badge variant="outline">
              {song.completed_count}/{song.section_count} done
            </Badge>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setShowFullTab(t => !t)}>
            {showFullTab ? "Section view" : "Full tab"}
          </Button>
          <Button
            variant="ghost" size="sm"
            className="text-red-400 hover:text-red-300 hover:bg-red-950"
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }} />
      </div>

      {/* Content */}
      {showFullTab ? (
        <TabViewer tab={song.full_tab} />
      ) : (
        <div className="grid grid-cols-[200px_1fr] gap-6 items-start">
          <div className="border-r border-zinc-800 pr-4 sticky top-8">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3 px-3">
              Sections
            </p>
            <SectionSidebar
              sections={song.sections}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onToggleComplete={toggleComplete}
            />
          </div>

          <div>
            {selectedSection
              ? <SectionContent section={selectedSection} />
              : <p className="text-zinc-500">Select a section to begin.</p>
            }
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: End-to-end test in dev**

```bash
# With backend running
cd web/frontend && npm run dev
# 1. Upload a file on home page → card appears
# 2. Click card → song detail loads
# 3. Click sections in sidebar → content updates
# 4. Click checkbox → section marked complete, progress bar updates
# 5. Click "Full tab" → tab text rendered in monospace
# 6. Click "Section view" → back to section view
# 7. Click Delete → confirm → redirected home
```

- [ ] **Step 6: Commit**

```bash
git add web/frontend/src/components/ web/frontend/src/app/songs/
git commit -m "feat: song detail page with section viewer, tab toggle, and completion"
```

---

## Task 10: Deployment

**Files:**
- Create: `Dockerfile` (repo root)
- Create: `railway.json`
- Create: `web/frontend/.env.production.example`

- [ ] **Step 1: Write `Dockerfile` at repo root**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*

# Install local packages first (layer caching)
COPY gp2tab/ ./gp2tab/
COPY guitar-teacher/ ./guitar-teacher/
RUN pip install --no-cache-dir -e ./gp2tab
RUN pip install --no-cache-dir -e ./guitar-teacher

# Install backend
COPY web/backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY web/backend/ ./web/backend/

ENV DATA_DIR=/app/data
RUN mkdir -p /app/data/songs

EXPOSE 8000
CMD ["uvicorn", "web.backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 2: Write `railway.json`**

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "healthcheckPath": "/health",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

- [ ] **Step 3: Test Docker build locally**

```bash
docker build -t guitar-teacher-api .
docker run -p 8000:8000 guitar-teacher-api
curl http://localhost:8000/health
# Expected: {"status":"ok"}
curl http://localhost:8000/theory/scales | python3 -m json.tool | head -20
# Expected: list of scale objects
```

- [ ] **Step 4: Deploy backend to Railway**

```
1. railway.app → New Project → Deploy from GitHub repo
2. Set environment variables in Railway dashboard:
   DATA_DIR=/app/data
   ALLOWED_ORIGINS=https://PLACEHOLDER.vercel.app   ← update after Vercel deploy
3. Deploy — note the Railway service URL
```

- [ ] **Step 5: Create frontend production env example**

```bash
echo "NEXT_PUBLIC_API_URL=https://your-railway-url.up.railway.app" > web/frontend/.env.production.example
```

- [ ] **Step 6: Deploy frontend to Vercel**

```
1. vercel.com → Import Git Repository
2. Set Root Directory: web/frontend
3. Environment variable:
   NEXT_PUBLIC_API_URL=https://your-railway-url.up.railway.app
4. Deploy — note the Vercel domain
```

- [ ] **Step 7: Update ALLOWED_ORIGINS in Railway**

```
In Railway → Variables → update:
ALLOWED_ORIGINS=https://your-app.vercel.app
Redeploy Railway service
```

- [ ] **Step 8: Smoke test production**

```bash
# Visit https://your-app.vercel.app
# Upload songs/guthrie-govan/man-of-steel/tab.json
# Verify: sections appear, theory tab works, fretboard renders
curl https://your-railway-url.up.railway.app/health
# Expected: {"status":"ok"}
```

- [ ] **Step 9: Final commit**

```bash
git add Dockerfile railway.json web/frontend/.env.production.example
git commit -m "feat: Docker and Railway/Vercel deployment config"
```

---

## Spec Coverage

| Requirement | Task |
|-------------|------|
| Upload GP file | Task 4 |
| View processed songs list | Task 8 |
| Select a section | Task 9 |
| See tab (full) | Task 9 — full tab toggle |
| Theory per section (scale) | Task 9 — SectionContent |
| Technique breakdown per section | Task 9 — SectionContent |
| Mark sections complete | Task 5 (API) + Task 9 (UI) |
| Scale on fretboard | Task 7 |
| Chord on fretboard | Task 7 |
| Key → diatonic chords | Task 7 |
| Railway + Vercel deploy | Task 10 |
