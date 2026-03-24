"""Format Song model as structured JSON."""
import json
from gp2tab.models import Song


def format_json(song: Song) -> str:
    data = {
        "title": song.title,
        "artist": song.artist,
        "tuning": song.tuning,
        "tempo": song.tempo,
        "total_bars": len(song.bars),
        "sections": [
            {"name": s.name, "start_bar": s.start_bar, "end_bar": s.end_bar}
            for s in song.sections
        ],
        "bars": [_bar_to_dict(bar) for bar in song.bars],
    }
    return json.dumps(data, indent=2)


def _bar_to_dict(bar):
    d = {
        "number": bar.number,
        "time_signature": bar.time_signature,
        "is_rest": bar.is_rest,
        "is_partial": bar.is_partial,
        "notes": [_note_to_dict(n) for n in bar.notes],
        "warnings": bar.warnings,
    }
    if bar.tempo is not None:
        d["tempo"] = bar.tempo
    if bar.section is not None:
        d["section"] = bar.section
    return d


def _note_to_dict(note):
    return {
        "beat": note.beat,
        "string": note.string,
        "fret": note.fret,
        "duration": note.duration,
        "dotted": note.dotted,
        "techniques": [
            {"type": t.type, "value": t.value}
            for t in note.techniques
        ],
        "tie": note.tie,
        "tuplet": note.tuplet,
        "grace": note.grace,
    }
