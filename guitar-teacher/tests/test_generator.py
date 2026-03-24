import os
import tempfile
import pytest
from guitar_teacher.core.analyzer import analyze_file
from guitar_teacher.lessons.generator import generate_lessons

MOS_JSON = os.path.join(
    os.path.dirname(__file__), "..", "..", "songs", "guthrie-govan", "man-of-steel", "tab.json"
)


class TestGenerateLessons:
    @pytest.mark.skipif(not os.path.exists(MOS_JSON), reason="fixture not found")
    def test_creates_lesson_files(self):
        analysis = analyze_file(MOS_JSON)
        with tempfile.TemporaryDirectory() as tmpdir:
            generate_lessons(analysis, output_dir=tmpdir)

            assert os.path.exists(os.path.join(tmpdir, "theory.md"))
            assert os.path.exists(os.path.join(tmpdir, "breakdown.md"))
            assert os.path.exists(os.path.join(tmpdir, "practice.md"))
            assert os.path.exists(os.path.join(tmpdir, "practice-log.md"))
            assert os.path.exists(os.path.join(tmpdir, ".context.md"))

            lessons_dir = os.path.join(tmpdir, "lessons")
            assert os.path.isdir(lessons_dir)
            lesson_files = sorted(os.listdir(lessons_dir))
            assert len(lesson_files) >= 3
            assert lesson_files[0].startswith("01-")
            assert os.path.exists(os.path.join(lessons_dir, "README.md"))

    @pytest.mark.skipif(not os.path.exists(MOS_JSON), reason="fixture not found")
    def test_lessons_are_self_contained(self):
        analysis = analyze_file(MOS_JSON)
        with tempfile.TemporaryDirectory() as tmpdir:
            generate_lessons(analysis, output_dir=tmpdir)

            lessons_dir = os.path.join(tmpdir, "lessons")
            lesson_files = [
                f for f in os.listdir(lessons_dir)
                if f.endswith(".md") and f != "README.md"
            ]
            for lf in lesson_files[:3]:
                content = open(os.path.join(lessons_dir, lf)).read()
                assert "## Goal" in content or "## goal" in content.lower()
                assert "## Checkpoint" in content or "## checkpoint" in content.lower()
                assert "## Step" in content or "Step" in content

    @pytest.mark.skipif(not os.path.exists(MOS_JSON), reason="fixture not found")
    def test_context_md_initialized(self):
        analysis = analyze_file(MOS_JSON)
        with tempfile.TemporaryDirectory() as tmpdir:
            generate_lessons(analysis, output_dir=tmpdir)
            content = open(os.path.join(tmpdir, ".context.md")).read()
            assert "01" in content
