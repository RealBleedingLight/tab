import os
import pytest
from gp2tab.models import Song, Bar, Note, Technique, Section

GP_FILE = os.path.join(
    os.path.dirname(__file__), "..", "..",
    "songs", "guthrie-govan", "man-of-steel", "Guthrie Hans.gp"
)


@pytest.fixture
def sample_song():
    """A small song fixture for formatter tests."""
    return Song(
        title="Test Solo",
        artist="Test Artist",
        tuning=["E", "A", "D", "G", "B", "e"],
        tempo=128,
        sections=[Section(name="Intro", start_bar=1, end_bar=2)],
        bars=[
            Bar(number=1, time_signature="4/4", section="Intro", notes=[
                Note(string=2, fret=15, beat=1.0, duration="eighth"),
                Note(string=2, fret=17, beat=1.5, duration="eighth"),
                Note(string=2, fret=17, beat=2.0, duration="quarter",
                     techniques=[Technique(type="bend", value=0.5)],
                     tie="start"),
                Note(string=3, fret=14, beat=3.0, duration="eighth",
                     techniques=[Technique(type="hammer")]),
                Note(string=3, fret=16, beat=3.5, duration="eighth",
                     techniques=[Technique(type="pull")]),
                Note(string=3, fret=14, beat=4.0, duration="eighth"),
            ]),
            Bar(number=2, time_signature="4/4", notes=[
                Note(string=3, fret=13, beat=1.0, duration="half",
                     techniques=[Technique(type="vibrato")]),
                Note(string=4, fret=14, beat=3.0, duration="quarter",
                     techniques=[Technique(type="slide_up")]),
                Note(string=4, fret=17, beat=4.0, duration="quarter"),
            ]),
        ],
    )


@pytest.fixture
def rest_bars_song():
    """Song with consecutive rest bars for LLM collapse testing."""
    return Song(
        title="Rest Test",
        artist="Nobody",
        tuning=["E", "A", "D", "G", "B", "e"],
        tempo=100,
        bars=[
            Bar(number=1, time_signature="4/4"),
            Bar(number=2, time_signature="4/4"),
            Bar(number=3, time_signature="4/4"),
            Bar(number=4, time_signature="4/4", notes=[
                Note(string=1, fret=12, beat=1.0, duration="whole"),
            ]),
        ],
    )
