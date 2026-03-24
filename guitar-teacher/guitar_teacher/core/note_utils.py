"""Pitch math utilities: note names, pitch classes, fret-to-note conversion."""
from typing import List

_SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
_FLAT_NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"]

_NAME_TO_PC: dict = {}
for i, name in enumerate(_SHARP_NAMES):
    _NAME_TO_PC[name] = i
    _NAME_TO_PC[name.lower()] = i
for i, name in enumerate(_FLAT_NAMES):
    _NAME_TO_PC[name] = i
    _NAME_TO_PC[name.lower()] = i


def note_to_pitch_class(name: str) -> int:
    name = name.strip()
    if name not in _NAME_TO_PC:
        raise ValueError(f"Unknown note name: {name!r}")
    return _NAME_TO_PC[name]


def pitch_class_to_name(pc: int, prefer_flats: bool = False) -> str:
    pc = pc % 12
    return _FLAT_NAMES[pc] if prefer_flats else _SHARP_NAMES[pc]


def fret_to_pitch_class(string_num: int, fret: int, tuning: List[str]) -> int:
    open_note = tuning[len(tuning) - string_num]
    open_pc = note_to_pitch_class(open_note)
    return (open_pc + fret) % 12


def fret_to_note(string_num: int, fret: int, tuning: List[str], prefer_flats: bool = False) -> str:
    pc = fret_to_pitch_class(string_num, fret, tuning)
    return pitch_class_to_name(pc, prefer_flats)


def interval_semitones(note1: str, note2: str) -> int:
    pc1 = note_to_pitch_class(note1)
    pc2 = note_to_pitch_class(note2)
    return (pc2 - pc1) % 12
