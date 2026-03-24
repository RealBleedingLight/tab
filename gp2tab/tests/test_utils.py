from gp2tab.utils import midi_to_note_name, duration_beats, string_name


def test_midi_standard_tuning():
    pitches = [40, 45, 50, 55, 59, 64]
    names = [midi_to_note_name(p) for p in pitches]
    assert names == ["E", "A", "D", "G", "B", "e"]


def test_midi_flats():
    assert midi_to_note_name(39) == "Eb"
    assert midi_to_note_name(63) == "eb"


def test_duration_beats():
    assert duration_beats("whole") == 4.0
    assert duration_beats("half") == 2.0
    assert duration_beats("quarter") == 1.0
    assert duration_beats("eighth") == 0.5
    assert duration_beats("16th") == 0.25
    assert duration_beats("32nd") == 0.125


def test_duration_beats_dotted():
    assert duration_beats("quarter", dotted=True) == 1.5
    assert duration_beats("eighth", dotted=True) == 0.75


def test_string_name():
    tuning = ["E", "A", "D", "G", "B", "e"]
    assert string_name(1, tuning) == "e"
    assert string_name(2, tuning) == "B"
    assert string_name(6, tuning) == "E"
