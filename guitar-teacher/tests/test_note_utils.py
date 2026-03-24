from guitar_teacher.core.note_utils import (
    note_to_pitch_class,
    pitch_class_to_name,
    fret_to_pitch_class,
    fret_to_note,
    interval_semitones,
)

STANDARD_TUNING = ["E", "A", "D", "G", "B", "E"]


class TestNoteToPitchClass:
    def test_naturals(self):
        assert note_to_pitch_class("C") == 0
        assert note_to_pitch_class("D") == 2
        assert note_to_pitch_class("E") == 4
        assert note_to_pitch_class("F") == 5
        assert note_to_pitch_class("G") == 7
        assert note_to_pitch_class("A") == 9
        assert note_to_pitch_class("B") == 11

    def test_sharps(self):
        assert note_to_pitch_class("C#") == 1
        assert note_to_pitch_class("F#") == 6

    def test_flats(self):
        assert note_to_pitch_class("Db") == 1
        assert note_to_pitch_class("Bb") == 10

    def test_enharmonic_equivalence(self):
        assert note_to_pitch_class("C#") == note_to_pitch_class("Db")
        assert note_to_pitch_class("G#") == note_to_pitch_class("Ab")

    def test_case_insensitive(self):
        assert note_to_pitch_class("c") == 0
        assert note_to_pitch_class("bb") == 10
        assert note_to_pitch_class("f#") == 6


class TestPitchClassToName:
    def test_sharps_default(self):
        assert pitch_class_to_name(0) == "C"
        assert pitch_class_to_name(1) == "C#"
        assert pitch_class_to_name(6) == "F#"

    def test_flats(self):
        assert pitch_class_to_name(1, prefer_flats=True) == "Db"
        assert pitch_class_to_name(10, prefer_flats=True) == "Bb"

    def test_naturals_same_either_way(self):
        assert pitch_class_to_name(0) == pitch_class_to_name(0, prefer_flats=True)
        assert pitch_class_to_name(4) == pitch_class_to_name(4, prefer_flats=True)


class TestFretToPitchClass:
    def test_open_strings_standard(self):
        assert fret_to_pitch_class(6, 0, STANDARD_TUNING) == 4
        assert fret_to_pitch_class(1, 0, STANDARD_TUNING) == 4
        assert fret_to_pitch_class(5, 0, STANDARD_TUNING) == 9

    def test_fretted_notes(self):
        assert fret_to_pitch_class(2, 15, STANDARD_TUNING) == 2  # D
        assert fret_to_pitch_class(3, 14, STANDARD_TUNING) == 9  # A


class TestFretToNote:
    def test_basic(self):
        assert fret_to_note(6, 0, STANDARD_TUNING) == "E"
        assert fret_to_note(2, 15, STANDARD_TUNING) == "D"

    def test_prefer_flats(self):
        assert fret_to_note(6, 1, STANDARD_TUNING) == "F"
        assert fret_to_note(6, 2, STANDARD_TUNING) == "F#"
        assert fret_to_note(6, 2, STANDARD_TUNING, prefer_flats=True) == "Gb"


class TestIntervalSemitones:
    def test_unison(self):
        assert interval_semitones("C", "C") == 0

    def test_major_third(self):
        assert interval_semitones("C", "E") == 4

    def test_perfect_fifth(self):
        assert interval_semitones("C", "G") == 7

    def test_wraps_around(self):
        assert interval_semitones("A", "C") == 3

    def test_enharmonic(self):
        assert interval_semitones("C", "C#") == interval_semitones("C", "Db")
