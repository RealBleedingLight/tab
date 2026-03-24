"""Format Song model as LLM-optimized condensed text."""
from gp2tab.models import Song
from gp2tab.utils import string_name


def format_llm(song: Song) -> str:
    lines = []
    lines.append(f"SONG: {song.title}")
    lines.append(f"ARTIST: {song.artist}")
    lines.append(f"TUNING: {' '.join(song.tuning)}")
    lines.append(f"TEMPO: {song.tempo} BPM")
    ts = song.bars[0].time_signature if song.bars else "4/4"
    lines.append(f"TIME: {ts}")
    lines.append(f"BARS: {len(song.bars)}")
    lines.append("")

    i = 0
    while i < len(song.bars):
        bar = song.bars[i]
        if bar.is_rest:
            j = i
            while j < len(song.bars) and song.bars[j].is_rest:
                j += 1
            if j - i > 1:
                lines.append(f"=== BAR {bar.number}-{song.bars[j-1].number} === REST")
            else:
                lines.append(f"=== BAR {bar.number} === REST")
            lines.append("")
            i = j
            continue

        header = f"=== BAR {bar.number} ==="
        if bar.section:
            header += f" [{bar.section}]"
        if bar.warnings:
            header += f" WARNING: {bar.warnings[0]}"
        lines.append(header)

        for note in bar.notes:
            parts = []
            parts.append(f"{note.beat:<5g}")
            sname = string_name(note.string, song.tuning)
            parts.append(f"{sname}:{note.fret}")
            parts.append(note.duration)
            if note.dotted:
                parts.append("dotted")
            for tech in note.techniques:
                if tech.type in ("bend", "bend_release", "pre_bend", "pre_bend_release") and tech.value is not None:
                    parts.append(f"{tech.type}({_format_bend_value(tech.value)})")
                else:
                    parts.append(tech.type)
            if note.tie == "start":
                parts.append("tie>")
            elif note.tie == "continue":
                parts.append("<tie>")
            elif note.tie == "end":
                parts.append("<tie")
            if note.tuplet:
                if note.tuplet.get("actual") == 3:
                    parts.append("triplet")
                else:
                    parts.append(f"tuplet({note.tuplet['actual']}:{note.tuplet['normal']})")
            if note.grace:
                parts.append("grace")
            lines.append("  ".join(parts))

        lines.append("")
        i += 1

    return "\n".join(lines)


def _format_bend_value(value: float) -> str:
    if value == 0.5:
        return "1/2"
    elif value == 1.0:
        return "1"
    elif value == 1.5:
        return "1 1/2"
    elif value == 2.0:
        return "2"
    return str(value)
