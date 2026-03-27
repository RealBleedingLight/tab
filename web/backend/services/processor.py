import re
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from guitar_teacher.core.analyzer import analyze_file

def make_song_id(title: str, artist: str) -> str:
    def slug(s):
        return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return f"{slug(artist)}-{slug(title)}"


def _run_gp2tab(gp_path: str, output_dir: str) -> str:
    """Run gp2tab CLI on a GP file, return tab text content."""
    result = subprocess.run(
        [sys.executable, "-m", "gp2tab", gp_path, "-o", output_dir, "--format", "tab"],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"gp2tab failed: {result.stderr}")
    tab_path = Path(output_dir) / "tab.txt"
    if not tab_path.exists():
        raise RuntimeError("gp2tab did not produce tab.txt")
    return tab_path.read_text()


def process_gp_file(file_path: str) -> dict:
    """
    Process a .gp* or gp2tab .json file.
    Returns a dict matching SongDetail structure ready for storage.

    SoloAnalysis fields:
      title, artist, key, tempo (int), tuning (List[str]),
      sections (List[SectionAnalysis]), practice_order, technique_summary, scale_summary

    SectionAnalysis fields:
      name, bars, bar_range (Tuple[int,int]), overall_scale (str),
      primary_techniques (List[str]), difficulty (float), practice_priority (int)
    """
    path = Path(file_path)
    is_json = path.suffix == ".json"

    # Get tab text
    if is_json:
        # tab.txt may live alongside the JSON (workflow for pre-processed songs)
        tab_sibling = path.parent / "tab.txt"
        full_tab = tab_sibling.read_text() if tab_sibling.exists() else ""
    else:
        with tempfile.TemporaryDirectory() as tmpdir:
            full_tab = _run_gp2tab(str(path), tmpdir)

    # Analyze using guitar_teacher
    analysis = analyze_file(str(path))

    # Build sections list
    # SectionAnalysis.primary_techniques is a List[str] (already sorted by frequency)
    # SectionAnalysis.bar_range is a Tuple[int, int]
    # SectionAnalysis.difficulty is a float (already rounded to 1 decimal)
    sections = []
    for sa in analysis.sections:
        section_id = re.sub(r"[^a-z0-9]+", "-", sa.name.lower()).strip("-")
        sections.append({
            "id": section_id,
            "name": sa.name,
            "bar_start": sa.bar_range[0],
            "bar_end": sa.bar_range[1],
            "difficulty": round(sa.difficulty, 1),
            "techniques": list(sa.primary_techniques),
            "overall_scale": sa.overall_scale,
            "completed": False,
        })

    song_id = make_song_id(analysis.title, analysis.artist)

    return {
        "id": song_id,
        "title": analysis.title,
        "artist": analysis.artist,
        "key": analysis.key,
        "tempo": analysis.tempo,
        "tuning": list(analysis.tuning),
        "section_count": len(sections),
        "completed_count": 0,
        "processed_at": datetime.now(timezone.utc).isoformat(),
        "sections": sections,
        "full_tab": full_tab,
    }
