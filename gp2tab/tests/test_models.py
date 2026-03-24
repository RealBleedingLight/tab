from gp2tab.models import Technique, Note, Bar, Song, Section


def test_technique_bend():
    t = Technique(type="bend", value=1.0)
    assert t.type == "bend"
    assert t.value == 1.0


def test_technique_no_value():
    t = Technique(type="hammer")
    assert t.value is None


def test_note_basic():
    n = Note(string=2, fret=15, beat=1.0, duration="eighth")
    assert n.string == 2
    assert n.fret == 15
    assert n.dotted is False
    assert n.techniques == []
    assert n.tie is None
    assert n.tuplet is None
    assert n.grace is False


def test_note_with_techniques():
    n = Note(
        string=2, fret=17, beat=2.0, duration="quarter",
        techniques=[Technique(type="bend", value=0.5)],
        tie="start"
    )
    assert len(n.techniques) == 1
    assert n.tie == "start"


def test_bar_rest():
    b = Bar(number=1, time_signature="4/4")
    assert b.is_rest is True
    assert b.notes == []
    assert b.warnings == []


def test_bar_with_notes():
    notes = [Note(string=2, fret=15, beat=1.0, duration="eighth")]
    b = Bar(number=4, time_signature="4/4", notes=notes)
    assert b.is_rest is False


def test_song():
    bars = [Bar(number=1, time_signature="4/4")]
    sections = [Section(name="Intro", start_bar=1, end_bar=4)]
    s = Song(
        title="Test", artist="Artist",
        tuning=["E", "A", "D", "G", "B", "e"],
        tempo=120, bars=bars, sections=sections
    )
    assert s.title == "Test"
    assert len(s.bars) == 1
    assert len(s.sections) == 1
