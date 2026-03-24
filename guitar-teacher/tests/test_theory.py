import pytest
from guitar_teacher.core.theory import TheoryEngine


class TestYAMLLoading:
    def test_loads_scales(self, engine):
        assert len(engine.scales) > 0
        assert "major" in engine.scales
        assert "dorian" in engine.scales

    def test_loads_chords(self, engine):
        assert len(engine.chords) > 0
        assert "major" in engine.chords

    def test_loads_intervals(self, engine):
        assert len(engine.intervals) == 12

    def test_loads_techniques(self, engine):
        assert len(engine.techniques) > 0
        assert "bend" in engine.techniques

    def test_scale_aliases(self, engine):
        scale = engine.get_scale("C", "minor")
        assert scale is not None
        assert "Aeolian" in scale.scale.name or "Minor" in scale.scale.name


class TestGetScale:
    def test_c_major(self, engine):
        result = engine.get_scale("C", "major")
        assert result is not None
        assert result.notes == ["C", "D", "E", "F", "G", "A", "B"]

    def test_d_dorian(self, engine):
        result = engine.get_scale("D", "dorian")
        assert result is not None
        assert result.notes == ["D", "E", "F", "G", "A", "B", "C"]

    def test_a_natural_minor(self, engine):
        result = engine.get_scale("A", "natural_minor")
        assert result is not None
        assert result.notes == ["A", "B", "C", "D", "E", "F", "G"]

    def test_f_sharp_key_uses_sharps(self, engine):
        result = engine.get_scale("F#", "major")
        assert result is not None
        for note in result.notes:
            assert "b" not in note

    def test_bb_key_uses_flats(self, engine):
        result = engine.get_scale("Bb", "major")
        assert result is not None
        assert "Eb" in result.notes
        assert "D#" not in result.notes

    def test_unknown_scale_returns_none(self, engine):
        result = engine.get_scale("C", "nonexistent_scale")
        assert result is None


class TestGetChord:
    def test_c_major(self, engine):
        result = engine.get_chord("C", "major")
        assert result is not None
        assert result.notes == ["C", "E", "G"]

    def test_am7(self, engine):
        result = engine.get_chord("A", "m7")
        assert result is not None
        assert result.notes == ["A", "C", "E", "G"]

    def test_unknown_chord_returns_none(self, engine):
        result = engine.get_chord("C", "nonexistent")
        assert result is None


class TestDetectKey:
    def test_c_major_notes(self, engine):
        notes = ["C", "D", "E", "F", "G", "A", "B"]
        matches = engine.detect_key(notes)
        assert len(matches) > 0
        top = matches[0]
        assert top.root in ("C", "A")

    def test_d_minor_notes(self, engine):
        notes = ["D", "E", "F", "G", "A", "Bb", "C"]
        matches = engine.detect_key(notes)
        top = matches[0]
        assert top.root == "D"

    def test_handles_chromatic_notes(self, engine):
        notes = ["D", "E", "F", "G", "A", "Bb", "C", "C#"]
        matches = engine.detect_key(notes)
        top = matches[0]
        assert top.root == "D"
        assert "C#" in top.outside_notes

    def test_returns_max_five(self, engine):
        notes = ["C", "D", "E", "F", "G", "A", "B"]
        matches = engine.detect_key(notes)
        assert len(matches) <= 5


class TestChordsInKey:
    def test_c_major_diatonic(self, engine):
        chords = engine.chords_in_key("C", "major")
        assert len(chords) == 7
        symbols = [c.symbol for c in chords]
        assert symbols[0] == ""      # C major
        assert "m" in symbols[1]     # Dm

    def test_returns_empty_for_unknown(self, engine):
        chords = engine.chords_in_key("C", "nonexistent")
        assert chords == []


class TestSuggestScales:
    def test_dm7_g7_cmaj7(self, engine):
        suggestions = engine.suggest_scales(["Dm7", "G7", "Cmaj7"])
        assert len(suggestions) > 0
        scale_names = [s.name for s in suggestions]
        assert any("Major" in n or "Ionian" in n for n in scale_names)

    def test_single_minor_chord(self, engine):
        suggestions = engine.suggest_scales(["Am"])
        assert len(suggestions) > 0


class TestIntervalBetween:
    def test_major_third(self, engine):
        result = engine.interval_between("C", "E")
        assert result.semitones == 4
        assert "Major 3rd" in result.name

    def test_perfect_fifth(self, engine):
        result = engine.interval_between("C", "G")
        assert result.semitones == 7
        assert "5th" in result.name


class TestScaleDegree:
    def test_root(self, engine):
        c_major = engine.get_scale("C", "major")
        assert engine.note_to_scale_degree("C", root="C", scale=c_major) == "1"

    def test_flat_third(self, engine):
        d_minor = engine.get_scale("D", "natural_minor")
        assert engine.note_to_scale_degree("F", root="D", scale=d_minor) == "b3"

    def test_fifth(self, engine):
        c_major = engine.get_scale("C", "major")
        assert engine.note_to_scale_degree("G", root="C", scale=c_major) == "5"
