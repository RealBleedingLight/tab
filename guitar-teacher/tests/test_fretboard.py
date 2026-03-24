from guitar_teacher.core.fretboard import render_fretboard, render_chord_diagram

STANDARD_TUNING = ["E", "A", "D", "G", "B", "E"]


class TestRenderFretboard:
    def test_returns_string(self):
        result = render_fretboard(
            notes=["C", "E", "G"],
            tuning=STANDARD_TUNING,
        )
        assert isinstance(result, str)
        assert len(result) > 0

    def test_contains_string_labels(self):
        result = render_fretboard(
            notes=["C", "E", "G"],
            tuning=STANDARD_TUNING,
        )
        assert "E" in result

    def test_contains_fret_numbers(self):
        result = render_fretboard(
            notes=["C", "E", "G"],
            tuning=STANDARD_TUNING,
            fret_range=(0, 12),
        )
        assert "0" in result
        assert "12" in result

    def test_highlights_root(self):
        result = render_fretboard(
            notes=["C", "E", "G"],
            tuning=STANDARD_TUNING,
            root="C",
        )
        assert "R" in result

    def test_custom_fret_range(self):
        result = render_fretboard(
            notes=["D", "E", "F", "G", "A", "B", "C"],
            tuning=STANDARD_TUNING,
            fret_range=(5, 12),
        )
        assert "5" in result
        assert "12" in result

    def test_title_shown(self):
        result = render_fretboard(
            notes=["C", "E", "G"],
            tuning=STANDARD_TUNING,
            title="C Major Triad",
        )
        assert "C Major Triad" in result


class TestRenderChordDiagram:
    def test_chord_diagram(self):
        result = render_chord_diagram(
            frets=[None, None, 0, 2, 3, 2],
            tuning=STANDARD_TUNING,
            title="D Major",
        )
        assert isinstance(result, str)
        assert "D Major" in result
