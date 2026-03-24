from gp2tab.formatter_llm import format_llm


def test_llm_header(sample_song):
    result = format_llm(sample_song)
    assert "SONG: Test Solo" in result
    assert "ARTIST: Test Artist" in result
    assert "TUNING: E A D G B e" in result
    assert "TEMPO: 128 BPM" in result
    assert "BARS: 2" in result


def test_llm_note_format(sample_song):
    result = format_llm(sample_song)
    assert "B:15" in result
    assert "B:17" in result
    assert "G:14" in result


def test_llm_techniques(sample_song):
    result = format_llm(sample_song)
    assert "bend(1/2)" in result
    assert "hammer" in result
    assert "vibrato" in result


def test_llm_section_header(sample_song):
    result = format_llm(sample_song)
    assert "[Intro]" in result


def test_llm_rest_collapse(rest_bars_song):
    result = format_llm(rest_bars_song)
    assert "BAR 1-3" in result
    assert "REST" in result


def test_llm_tie_notation(sample_song):
    result = format_llm(sample_song)
    assert "tie>" in result


def test_llm_slide(sample_song):
    result = format_llm(sample_song)
    assert "slide_up" in result
