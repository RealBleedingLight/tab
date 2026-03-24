from gp2tab.formatter_tab import format_tab


def test_tab_header(sample_song):
    result = format_tab(sample_song)
    assert "Test Solo" in result
    assert "Test Artist" in result
    assert "Tuning: E A D G B e" in result
    assert "Tempo: 128 BPM" in result
    assert "LEGEND:" in result


def test_tab_string_names(sample_song):
    result = format_tab(sample_song)
    lines = result.split("\n")
    string_lines = [l for l in lines if "|" in l and l[0] in "eBGDAE" and l[1] == "|"]
    assert len(string_lines) >= 6


def test_tab_fret_numbers(sample_song):
    result = format_tab(sample_song)
    assert "15" in result
    assert "17" in result
    assert "14" in result


def test_tab_techniques(sample_song):
    result = format_tab(sample_song)
    assert "b(" in result  # bend
    assert "h" in result   # hammer (in note rendering)
    assert "~" in result   # vibrato


def test_tab_bar_labels(sample_song):
    result = format_tab(sample_song)
    assert "Bar 1" in result
    assert "Bar 2" in result


def test_tab_no_string_wrap(sample_song):
    """Strings within a system should never wrap."""
    result = format_tab(sample_song, width=80)
    lines = result.split("\n")
    for line in lines:
        if "|" in line and line[0] in "eBGDAE":
            assert len(line) <= 80 + 5  # small tolerance for closing |


def test_tab_rest_bars(rest_bars_song):
    result = format_tab(rest_bars_song)
    # Rest bars should still show 6 empty strings
    lines = result.split("\n")
    string_lines = [l for l in lines if "|" in l and l[0] in "eBGDAE" and l[1] == "|"]
    assert len(string_lines) >= 6
