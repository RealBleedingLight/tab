"""Format Song model as ASCII tab."""
from gp2tab.models import Song, Bar, Note
from gp2tab.utils import string_name


_BEND_FMT = {0.5: "1/2", 1.0: "1", 1.5: "1 1/2", 2.0: "2"}


def format_tab(song: Song, width: int = 120) -> str:
    lines = []
    lines.append(_render_header(song))
    lines.append("")

    bar_buffers = [_render_bar(bar, song.tuning) for bar in song.bars]

    # Pack bars into systems
    system = []
    system_width = 3  # "e|" prefix = 2 chars + margin
    for buf in bar_buffers:
        needed = buf["width"]
        if system and system_width + needed > width - 1:
            lines.append(_render_system(system, song.tuning))
            lines.append("")
            system = []
            system_width = 3
        system.append(buf)
        system_width += needed
    if system:
        lines.append(_render_system(system, song.tuning))
        lines.append("")

    return "\n".join(lines)


def _render_header(song: Song) -> str:
    tuning_str = " ".join(song.tuning)
    ts = song.bars[0].time_signature if song.bars else "4/4"
    sep = "=" * 78
    return f"""{sep}
  {song.title} -- {song.artist}
  Tuning: {tuning_str}  |  Tempo: {song.tempo} BPM  |  Time: {ts}
  Source: Converted from Guitar Pro file by gp2tab
{sep}

LEGEND:
  b(1/2) = half-step bend    b(1) = full bend    b(1 1/2) = 1.5-step bend
  br = bend & release    pb = pre-bend    pbr = pre-bend & release
  h = hammer-on    p = pull-off    / = slide up    \\ = slide down
  ~ = vibrato    (n) = tied note    t = tap    x = mute    PM = palm mute
  NH = natural harmonic    PH = pinch harmonic    LR = let ring"""


def _render_note_text(note: Note) -> str:
    """Render a single note's text for placement on a string line."""
    if any(t.type == "mute" for t in note.techniques):
        return "x"

    if note.tie in ("continue", "end"):
        return f"({note.fret})"

    text = str(note.fret)

    for tech in note.techniques:
        if tech.type == "bend" and tech.value is not None:
            text += f"b({_BEND_FMT.get(tech.value, str(tech.value))})"
        elif tech.type == "bend_release" and tech.value is not None:
            text += f"br({_BEND_FMT.get(tech.value, str(tech.value))})"
        elif tech.type == "pre_bend" and tech.value is not None:
            text += f"pb({_BEND_FMT.get(tech.value, str(tech.value))})"
        elif tech.type == "pre_bend_release" and tech.value is not None:
            text += f"pbr({_BEND_FMT.get(tech.value, str(tech.value))})"
        elif tech.type == "hammer":
            text += "h"
        elif tech.type == "pull":
            text += "p"
        elif tech.type == "slide_up":
            text += "/"
        elif tech.type == "slide_down":
            text += "\\"
        elif tech.type == "vibrato":
            text += "~~"
        elif tech.type == "tap":
            text = "t" + text
        elif tech.type == "palm_mute":
            text += "PM"
        elif tech.type == "harmonic_natural":
            text = f"<{note.fret}>"
        elif tech.type == "harmonic_pinch":
            text += "PH"
        elif tech.type == "tremolo_pick":
            text += "tp"
        elif tech.type == "trill":
            text += "tr"
        elif tech.type == "let_ring":
            text += "LR"

    return text


def _render_bar(bar: Bar, tuning: list) -> dict:
    """Render a bar into a buffer dict with string content and beat markers."""
    num_strings = len(tuning)
    min_width = 8  # minimum bar width for empty bars

    if bar.is_rest:
        return {
            "bar_num": bar.number,
            "section": bar.section,
            "width": min_width,
            "strings": {s: "-" * min_width for s in range(1, num_strings + 1)},
            "beats_line": " " * min_width,
        }

    # Collect unique beat positions and their note texts per string
    beat_positions = sorted(set(n.beat for n in bar.notes))
    if not beat_positions:
        return {
            "bar_num": bar.number,
            "section": bar.section,
            "width": min_width,
            "strings": {s: "-" * min_width for s in range(1, num_strings + 1)},
            "beats_line": " " * min_width,
        }

    # Build note content at each position per string
    content = {}  # {(beat, string): text}
    for note in bar.notes:
        text = _render_note_text(note)
        key = (note.beat, note.string)
        content[key] = text

    # Calculate column widths: for each beat position, find the max content width
    col_widths = {}
    for bp in beat_positions:
        max_w = 1
        for s in range(1, num_strings + 1):
            text = content.get((bp, s), "")
            if len(text) > max_w:
                max_w = len(text)
        col_widths[bp] = max_w + 1  # +1 for padding dash

    # Assign column offsets
    col_offsets = {}
    offset = 0
    for bp in beat_positions:
        col_offsets[bp] = offset
        offset += col_widths[bp]

    total_width = max(offset + 1, min_width)

    # Build string lines
    strings = {}
    for s in range(1, num_strings + 1):
        line = ["-"] * total_width
        for bp in beat_positions:
            text = content.get((bp, s), "")
            if text:
                col = col_offsets[bp]
                for ci, ch in enumerate(text):
                    if col + ci < total_width:
                        line[col + ci] = ch
        strings[s] = "".join(line)

    # Build beat marker line
    beats_line = [" "] * total_width
    # Parse time signature for beat numbering
    parts = bar.time_signature.split("/")
    num_beats = int(parts[0])

    for beat_num in range(1, num_beats + 1):
        bp = float(beat_num)
        if bp in col_offsets:
            col = col_offsets[bp]
            marker = str(beat_num)
            for ci, ch in enumerate(marker):
                if col + ci < total_width:
                    beats_line[col + ci] = ch
        # Also check for sub-beat markers (& for the "and")
        half = bp + 0.5
        if half in col_offsets and half not in [float(b) for b in range(1, num_beats + 1)]:
            col = col_offsets[half]
            if col < total_width:
                beats_line[col] = "&"

    return {
        "bar_num": bar.number,
        "section": bar.section,
        "width": total_width,
        "strings": strings,
        "beats_line": "".join(beats_line),
    }


def _render_system(bars: list, tuning: list) -> str:
    """Render a system (one or more bars on a single line) as a string."""
    num_strings = len(tuning)
    lines = []

    # Bar label line
    label_parts = []
    offset = 0
    for buf in bars:
        label = f"Bar {buf['bar_num']}"
        if buf.get("section"):
            label += f" [{buf['section']}]"
        padded = label.ljust(buf["width"])
        label_parts.append(padded)
        offset += buf["width"]
    lines.append("  " + "".join(label_parts))

    # Beat markers line
    beat_parts = []
    for buf in bars:
        beat_parts.append(buf["beats_line"])
    lines.append("  " + " ".join(beat_parts))

    # String lines (1=highest to num_strings=lowest)
    for s in range(1, num_strings + 1):
        sname = string_name(s, tuning)
        parts = []
        for buf in bars:
            parts.append(buf["strings"][s])
        lines.append(f"{sname}|" + "|".join(parts) + "|")

    return "\n".join(lines)
