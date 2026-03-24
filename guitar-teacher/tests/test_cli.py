import os
import pytest
from click.testing import CliRunner
from guitar_teacher.cli import cli

MOS_JSON = os.path.join(
    os.path.dirname(__file__), "..", "..", "songs", "guthrie-govan", "man-of-steel", "tab.json"
)


@pytest.fixture
def runner():
    return CliRunner()


class TestScaleCommand:
    def test_d_dorian(self, runner):
        result = runner.invoke(cli, ["scale", "D", "dorian"])
        assert result.exit_code == 0
        assert "Dorian" in result.output
        assert "D" in result.output

    def test_unknown_scale(self, runner):
        result = runner.invoke(cli, ["scale", "C", "nonexistent"])
        assert result.exit_code != 0 or "not found" in result.output.lower()


class TestChordCommand:
    def test_am7(self, runner):
        result = runner.invoke(cli, ["chord", "Am7"])
        assert result.exit_code == 0
        assert "m7" in result.output or "Minor 7" in result.output

    def test_c_major(self, runner):
        result = runner.invoke(cli, ["chord", "C"])
        assert result.exit_code == 0


class TestKeyCommand:
    def test_c_major(self, runner):
        result = runner.invoke(cli, ["key", "C", "major"])
        assert result.exit_code == 0
        assert "Dm" in result.output or "ii" in result.output


class TestIdentifyKeyCommand:
    def test_basic(self, runner):
        result = runner.invoke(cli, ["identify-key", "D", "E", "F", "G", "A", "Bb", "C"])
        assert result.exit_code == 0
        assert "D" in result.output


class TestSuggestScalesCommand:
    def test_basic(self, runner):
        result = runner.invoke(cli, ["suggest-scales", "Dm7", "G7", "Cmaj7"])
        assert result.exit_code == 0


class TestIntervalCommand:
    def test_major_third(self, runner):
        result = runner.invoke(cli, ["interval", "C", "E"])
        assert result.exit_code == 0
        assert "Major 3rd" in result.output
        assert "4" in result.output


class TestAnalyzeCommand:
    @pytest.mark.skipif(not os.path.exists(MOS_JSON), reason="fixture not found")
    def test_analyze_json(self, runner):
        result = runner.invoke(cli, ["analyze", MOS_JSON])
        assert result.exit_code == 0
        assert "Key:" in result.output or "key:" in result.output.lower()
        assert "Section" in result.output or "section" in result.output.lower()


class TestLessonsCommand:
    @pytest.mark.skipif(not os.path.exists(MOS_JSON), reason="fixture not found")
    def test_lessons_generates_files(self, runner, tmp_path):
        result = runner.invoke(cli, ["lessons", MOS_JSON, "-o", str(tmp_path)])
        assert result.exit_code == 0
        assert os.path.exists(tmp_path / "theory.md")
        assert os.path.isdir(tmp_path / "lessons")
