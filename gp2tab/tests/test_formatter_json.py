import json
from gp2tab.formatter_json import format_json


def test_json_structure(sample_song):
    result = json.loads(format_json(sample_song))
    assert result["title"] == "Test Solo"
    assert result["artist"] == "Test Artist"
    assert result["tuning"] == ["E", "A", "D", "G", "B", "e"]
    assert result["tempo"] == 128
    assert result["total_bars"] == 2
    assert len(result["bars"]) == 2


def test_json_note_fields(sample_song):
    result = json.loads(format_json(sample_song))
    note = result["bars"][0]["notes"][0]
    assert note["string"] == 2
    assert note["fret"] == 15
    assert note["beat"] == 1.0
    assert note["duration"] == "eighth"
    assert note["dotted"] is False
    assert note["tie"] is None
    assert note["tuplet"] is None
    assert note["grace"] is False


def test_json_techniques(sample_song):
    result = json.loads(format_json(sample_song))
    bend_note = result["bars"][0]["notes"][2]
    assert len(bend_note["techniques"]) == 1
    assert bend_note["techniques"][0]["type"] == "bend"
    assert bend_note["techniques"][0]["value"] == 0.5


def test_json_technique_null_value(sample_song):
    result = json.loads(format_json(sample_song))
    hammer_note = result["bars"][0]["notes"][3]
    assert hammer_note["techniques"][0]["type"] == "hammer"
    assert hammer_note["techniques"][0]["value"] is None


def test_json_rest_bar(rest_bars_song):
    result = json.loads(format_json(rest_bars_song))
    assert result["bars"][0]["is_rest"] is True
    assert result["bars"][0]["notes"] == []


def test_json_sections(sample_song):
    result = json.loads(format_json(sample_song))
    assert len(result["sections"]) == 1
    assert result["sections"][0]["name"] == "Intro"
