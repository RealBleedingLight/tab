import os
import pytest
from guitar_teacher.core.analyzer import analyze_song, analyze_file
from guitar_teacher.core.models import SoloAnalysis

MOS_JSON = os.path.join(
    os.path.dirname(__file__), "..", "..", "songs", "guthrie-govan", "man-of-steel", "tab.json"
)
MOS_GP = os.path.join(
    os.path.dirname(__file__), "..", "..", "songs", "guthrie-govan", "man-of-steel", "Guthrie Hans.gp"
)


class TestAnalyzeFile:
    @pytest.mark.skipif(not os.path.exists(MOS_JSON), reason="test fixture not found")
    def test_returns_solo_analysis(self):
        result = analyze_file(MOS_JSON)
        assert isinstance(result, SoloAnalysis)

    @pytest.mark.skipif(not os.path.exists(MOS_JSON), reason="test fixture not found")
    def test_detects_key(self):
        result = analyze_file(MOS_JSON)
        assert "D" in result.key

    @pytest.mark.skipif(not os.path.exists(MOS_JSON), reason="test fixture not found")
    def test_has_sections(self):
        result = analyze_file(MOS_JSON)
        assert len(result.sections) > 0

    @pytest.mark.skipif(not os.path.exists(MOS_JSON), reason="test fixture not found")
    def test_has_technique_summary(self):
        result = analyze_file(MOS_JSON)
        assert len(result.technique_summary) > 0

    @pytest.mark.skipif(not os.path.exists(MOS_JSON), reason="test fixture not found")
    def test_sections_have_difficulty(self):
        result = analyze_file(MOS_JSON)
        for section in result.sections:
            assert 1.0 <= section.difficulty <= 10.0

    @pytest.mark.skipif(not os.path.exists(MOS_JSON), reason="test fixture not found")
    def test_practice_order(self):
        result = analyze_file(MOS_JSON)
        assert len(result.practice_order) == len(result.sections)


class TestSectionGrouping:
    def test_rest_bars_create_boundaries(self):
        from gp2tab.models import Song, Bar, Note
        song = Song(
            title="Test", artist="Test", tuning=["E", "A", "D", "G", "B", "E"],
            tempo=120, bars=[
                Bar(number=1, time_signature="4/4", notes=[
                    Note(string=1, fret=5, beat=1.0, duration="quarter"),
                ]),
                Bar(number=2, time_signature="4/4", notes=[]),
                Bar(number=3, time_signature="4/4", notes=[
                    Note(string=1, fret=7, beat=1.0, duration="quarter"),
                ]),
            ]
        )
        result = analyze_song(song)
        assert len(result.sections) >= 2

    def test_fallback_chunks_of_4(self):
        from gp2tab.models import Song, Bar, Note
        bars = []
        for i in range(12):
            bars.append(Bar(
                number=i + 1, time_signature="4/4",
                notes=[Note(string=1, fret=5, beat=1.0, duration="quarter")],
            ))
        song = Song(
            title="Test", artist="Test", tuning=["E", "A", "D", "G", "B", "E"],
            tempo=120, bars=bars,
        )
        result = analyze_song(song)
        assert len(result.sections) == 3


class TestAnalyzeGPFile:
    @pytest.mark.skipif(not os.path.exists(MOS_GP), reason="GP file not found")
    def test_accepts_gp_file(self):
        result = analyze_file(MOS_GP)
        assert isinstance(result, SoloAnalysis)
        assert result.title != ""
