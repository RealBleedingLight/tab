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
