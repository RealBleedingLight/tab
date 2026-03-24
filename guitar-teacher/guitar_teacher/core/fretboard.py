"""ASCII fretboard and chord diagram renderers."""
from typing import Optional, List

from guitar_teacher.core.note_utils import note_to_pitch_class, fret_to_pitch_class


def render_fretboard(
    notes: List[str],
    tuning: List[str],
    root: Optional[str] = None,
    fret_range: tuple = (0, 15),
    title: Optional[str] = None,
) -> str:
    """Render a horizontal ASCII fretboard diagram.

    Strings are displayed high-to-low (string 1 / high-e at top).
    Each fret cell is 4 characters wide: [R], [*], or ---/====.

    Args:
        notes: List of note names that belong to the scale/chord (e.g. ["C", "E", "G"]).
        tuning: List of 6 open-string note names, low-to-high (e.g. ["E","A","D","G","B","E"]).
        root: Optional root note name.  Displayed as [R] instead of [*].
        fret_range: (first_fret, last_fret) inclusive.
        title: Optional title printed above the diagram.

    Returns:
        Multi-line string ready for terminal output.
    """
    start_fret, end_fret = fret_range

    # Build sets of pitch classes for fast lookup
    note_pcs = set(note_to_pitch_class(n) for n in notes)
    root_pc = note_to_pitch_class(root) if root is not None else None

    # Fret header row
    fret_numbers = list(range(start_fret, end_fret + 1))

    # Column widths: each fret is 4 chars wide (e.g. "[R] " or "--- ")
    # We'll use a separator character between frets.
    CELL_WIDTH = 4  # content + trailing space

    # Build header line: leading label area then fret numbers
    label_width = 3  # "e  " / "B  " etc.
    nut_marker = " \u2551"  # ║ for fret 0 (nut)

    # Header: "    " + fret numbers right-aligned in their cells
    header_parts = []
    for f in fret_numbers:
        # right-justify fret number in CELL_WIDTH-1 chars, then a space
        header_parts.append(f"{f:>{CELL_WIDTH - 1}} ")
    header_line = " " * (label_width + 2) + "".join(header_parts)

    lines = []
    if title:
        lines.append(title)
        lines.append("")

    lines.append(header_line)

    # String names high-to-low: string 1 is high e (index 5 of tuning list)
    # tuning is low-to-high, so string 1 = tuning[5], string 6 = tuning[0]
    string_count = len(tuning)
    string_display_names = list(reversed(tuning))  # index 0 = highest string

    for display_idx in range(string_count):
        # string_num: 1 = highest (used by fret_to_pitch_class)
        string_num = display_idx + 1
        label = string_display_names[display_idx]

        row_parts = []
        for f in fret_numbers:
            pc = fret_to_pitch_class(string_num, f, tuning)
            if pc in note_pcs:
                if root_pc is not None and pc == root_pc:
                    cell = "[R]"
                else:
                    cell = "[*]"
            else:
                cell = "---"
            row_parts.append(f"{cell} ")

        # Nut: use ║ after fret 0 when start_fret == 0
        if start_fret == 0:
            separator = "\u2551"
        else:
            separator = "|"

        line = f"{label:<{label_width}}{separator}" + "".join(row_parts)
        lines.append(line)

    return "\n".join(lines)


def render_chord_diagram(
    frets: List[Optional[int]],
    tuning: List[str],
    title: Optional[str] = None,
) -> str:
    """Render a vertical ASCII chord box diagram.

    Args:
        frets: List of 6 values, one per string from low (E) to high (e).
               None = muted (X), 0 = open (O), positive int = fret number.
        tuning: List of 6 open-string note names, low-to-high.
        title: Optional chord name printed above the diagram.

    Returns:
        Multi-line string ready for terminal output.
    """
    # Determine the fret window to display
    fretted = [f for f in frets if f is not None and f > 0]
    if fretted:
        min_fret = min(fretted)
        max_fret = max(fretted)
    else:
        min_fret = 1
        max_fret = 4

    # Always show at least 4 frets; start from fret 1 for open chords
    window_start = max(1, min_fret)
    window_end = max(window_start + 3, max_fret)
    fret_rows = list(range(window_start, window_end + 1))

    # String order for display: low E on left → high e on right
    # tuning[0] = low E, tuning[5] = high e
    string_count = len(frets)

    lines = []
    if title:
        lines.append(title)
        lines.append("")

    # --- Mute / open indicators above the box ---
    top_indicators = []
    for i in range(string_count):
        f = frets[i]
        if f is None:
            top_indicators.append("X")
        elif f == 0:
            top_indicators.append("O")
        else:
            top_indicators.append(" ")

    lines.append(" " + " ".join(top_indicators))

    # --- Nut (thick bar if starting at fret 1) or fret number on the side ---
    if window_start == 1:
        nut_line = "\u2550" * (string_count * 2 + 1)  # ══ wide bar for nut
        lines.append(" " + nut_line)
    else:
        # Show fret number to the right of the first row separator
        lines.append(f" {'|' * (string_count * 2 + 1)}  fr.{window_start}")

    # --- Fret rows ---
    for row_fret in fret_rows:
        cells = []
        for i in range(string_count):
            f = frets[i]
            if f is not None and f == row_fret:
                cells.append("●")
            else:
                cells.append("|")
        row = "|" + "|".join(cells) + "|"
        lines.append(" " + row)
        # Separator between frets (thin line)
        sep = "-" + "-".join(["-" for _ in range(string_count)]) + "-"
        lines.append(" " + sep)

    # Remove last separator line (cleaner look)
    if lines and lines[-1].strip().replace("-", "") == "":
        lines.pop()

    # --- String labels at the bottom ---
    string_labels = [t[0] for t in tuning]  # just the letter
    lines.append(" " + " ".join(string_labels))

    return "\n".join(lines)
