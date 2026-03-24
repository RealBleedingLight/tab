import os
import pytest
from tests.conftest import GP_FILE

pytestmark = pytest.mark.skipif(
    not os.path.exists(GP_FILE),
    reason="GP test file not found"
)


def test_parse_metadata():
    from gp2tab.parser_gp_xml import parse_gp_xml
    song = parse_gp_xml(GP_FILE)
    assert song.title == "Man Of Steel"
    assert song.artist == "Guthrie Govan"
    assert song.tuning == ["E", "A", "D", "G", "B", "e"]
    assert song.tempo == 128


def test_parse_bar_count():
    from gp2tab.parser_gp_xml import parse_gp_xml
    song = parse_gp_xml(GP_FILE)
    assert len(song.bars) == 68


def test_parse_time_signature():
    from gp2tab.parser_gp_xml import parse_gp_xml
    song = parse_gp_xml(GP_FILE)
    assert song.bars[0].time_signature == "4/4"


def test_parse_rest_bars():
    from gp2tab.parser_gp_xml import parse_gp_xml
    song = parse_gp_xml(GP_FILE)
    for i in range(3):
        assert song.bars[i].is_rest, f"Bar {i+1} should be rest"


def test_parse_first_notes():
    from gp2tab.parser_gp_xml import parse_gp_xml
    song = parse_gp_xml(GP_FILE)
    bar4 = song.bars[3]
    assert not bar4.is_rest
    assert len(bar4.notes) > 0
    first_note = bar4.notes[0]
    assert first_note.fret == 15
    assert first_note.string == 2  # B string
    assert first_note.duration == "eighth"
    assert first_note.beat == 1.0


def test_parse_bend():
    from gp2tab.parser_gp_xml import parse_gp_xml
    song = parse_gp_xml(GP_FILE)
    bar4 = song.bars[3]
    bend_notes = [n for n in bar4.notes if any(t.type == "bend" for t in n.techniques)]
    assert len(bend_notes) > 0
    bend = bend_notes[0].techniques[0]
    assert bend.type == "bend"
    assert bend.value == 0.5


def test_parse_ties():
    from gp2tab.parser_gp_xml import parse_gp_xml
    song = parse_gp_xml(GP_FILE)
    bar4 = song.bars[3]
    tie_notes = [n for n in bar4.notes if n.tie is not None]
    assert len(tie_notes) > 0


def test_parse_hammer_pull():
    from gp2tab.parser_gp_xml import parse_gp_xml
    song = parse_gp_xml(GP_FILE)
    all_notes = [n for b in song.bars for n in b.notes]
    hammers = [n for n in all_notes if any(t.type == "hammer" for t in n.techniques)]
    pulls = [n for n in all_notes if any(t.type == "pull" for t in n.techniques)]
    assert len(hammers) > 0
    assert len(pulls) > 0


def test_parse_slides():
    from gp2tab.parser_gp_xml import parse_gp_xml
    song = parse_gp_xml(GP_FILE)
    all_notes = [n for b in song.bars for n in b.notes]
    slides = [n for n in all_notes if any(t.type in ("slide_up", "slide_down") for t in n.techniques)]
    assert len(slides) > 0


def test_parse_vibrato():
    from gp2tab.parser_gp_xml import parse_gp_xml
    song = parse_gp_xml(GP_FILE)
    all_notes = [n for b in song.bars for n in b.notes]
    vibratos = [n for n in all_notes if any(t.type == "vibrato" for t in n.techniques)]
    assert len(vibratos) > 0


def test_list_tracks():
    from gp2tab.parser_gp_xml import list_tracks_xml
    tracks = list_tracks_xml(GP_FILE)
    assert len(tracks) >= 1
    assert isinstance(tracks[0], tuple)
    assert tracks[0][0] == 0


def test_notes_sorted_by_beat():
    from gp2tab.parser_gp_xml import parse_gp_xml
    song = parse_gp_xml(GP_FILE)
    for bar in song.bars:
        beats = [n.beat for n in bar.notes]
        assert beats == sorted(beats), f"Bar {bar.number} notes not sorted by beat"
