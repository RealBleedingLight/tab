"""Shared utilities for gp2tab."""

_NOTE_NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"]

_DURATION_MAP = {
    "whole": 4.0, "half": 2.0, "quarter": 1.0,
    "eighth": 0.5, "16th": 0.25, "32nd": 0.125,
}


def midi_to_note_name(midi: int) -> str:
    """Convert MIDI pitch to string name. Octave < 4 = uppercase, >= 4 = lowercase."""
    note_index = midi % 12
    octave = (midi // 12) - 1
    name = _NOTE_NAMES[note_index]
    if octave >= 4:
        name = name.lower()
    return name


def duration_beats(duration: str, dotted: bool = False) -> float:
    """Return the beat count for a duration. Dotted adds 50%."""
    beats = _DURATION_MAP[duration]
    if dotted:
        beats *= 1.5
    return beats


def string_name(string_num: int, tuning: list) -> str:
    """Convert string number (1=highest) to name from tuning list (low-to-high)."""
    return tuning[len(tuning) - string_num]
