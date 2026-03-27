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

_CHORD_RE = re.compile(r'^([A-G][#b]?)(.*)$')

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
    return [
        ScaleListItem(key=key, name=scale.name, category=scale.category)
        for key, scale in engine.scales.items()
    ]


@router.get("/scale/{root}/{scale_type}", response_model=ScaleResponse)
def get_scale(root: str, scale_type: str):
    engine = get_engine()
    result = engine.get_scale(root, scale_type)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Scale '{scale_type}' not found")

    note_pcs = {note_to_pitch_class(n) for n in result.notes}
    root_pc = note_to_pitch_class(result.root)

    return ScaleResponse(
        root=result.root,
        scale_type=result.scale.key,
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
    return [
        ChordTypeItem(key=key, name=chord.name, symbol=chord.symbol)
        for key, chord in engine.chords.items()
    ]


@router.get("/chord/{chord_name}", response_model=ChordResponse)
def get_chord(chord_name: str):
    # Parse root + type from chord name like "Am7", "Cmaj7", "E"
    m = _CHORD_RE.match(chord_name)
    if not m:
        raise HTTPException(status_code=404, detail=f"Cannot parse chord name '{chord_name}'")

    root = m.group(1)
    chord_type = m.group(2) if m.group(2) else "major"

    engine = get_engine()
    result = engine.get_chord(root, chord_type)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Chord '{chord_name}' not found")

    note_pcs = {note_to_pitch_class(n) for n in result.notes}
    root_pc = note_to_pitch_class(result.root)

    return ChordResponse(
        root=result.root,
        symbol=result.symbol,
        name=result.chord.name,
        notes=result.notes,
        intervals=result.chord.intervals,
        character=result.chord.character,
        fretboard=_fretboard(note_pcs, root_pc),
    )


@router.get("/key/{root}/{scale_type}", response_model=KeyResponse)
def get_key(root: str, scale_type: str):
    engine = get_engine()
    if engine.get_scale(root, scale_type) is None:
        raise HTTPException(status_code=404, detail=f"Scale '{scale_type}' not found")
    chord_results = engine.chords_in_key(root, scale_type)

    degrees = []
    for i, cr in enumerate(chord_results):
        base = _DEGREE_NUMERALS[i] if i < len(_DEGREE_NUMERALS) else str(i + 1)
        quality_fn = _QUALITY_NUMERAL.get(cr.chord.key, lambda x: x.upper())
        numeral = quality_fn(base)

        chord_name = cr.root + cr.symbol
        degrees.append(KeyDegree(
            numeral=numeral,
            chord_name=chord_name,
            notes=cr.notes,
        ))

    return KeyResponse(root=root, scale_type=scale_type, degrees=degrees)
