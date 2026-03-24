"""Solo analysis pipeline: GP/JSON file -> SoloAnalysis."""
import json
import os
from typing import Optional, List, Dict, Tuple

from guitar_teacher.core.note_utils import (
    note_to_pitch_class,
    pitch_class_to_name,
    fret_to_pitch_class,
    fret_to_note,
)
from guitar_teacher.core.models import (
    NoteAnalysis,
    BarAnalysis,
    SectionAnalysis,
    SoloAnalysis,
)
from guitar_teacher.config import get_theory_dir


def analyze_file(path, track_index=0):
    """Analyze a GP or JSON file and return a SoloAnalysis."""
    if path.endswith(".json"):
        with open(path) as f:
            data = json.load(f)
        song = _reconstruct_song_from_json(data)
    else:
        from gp2tab.parser import parse
        song = parse(path, track_index)
    return analyze_song(song)


def _reconstruct_song_from_json(data):
    """Parse gp2tab JSON format back into Song model."""
    from gp2tab.models import Song, Bar, Note, Technique, Section

    sections = []
    for s in data.get("sections", []):
        sections.append(Section(
            name=s["name"],
            start_bar=s["start_bar"],
            end_bar=s["end_bar"],
        ))

    bars = []
    for b in data["bars"]:
        notes = []
        for n in b.get("notes", []):
            techniques = []
            for t in n.get("techniques", []):
                techniques.append(Technique(type=t["type"], value=t.get("value")))
            notes.append(Note(
                string=n["string"],
                fret=n["fret"],
                beat=n["beat"],
                duration=n["duration"],
                dotted=n.get("dotted", False),
                techniques=techniques,
                tie=n.get("tie"),
                tuplet=n.get("tuplet"),
                grace=n.get("grace", False),
            ))
        bars.append(Bar(
            number=b["number"],
            time_signature=b["time_signature"],
            notes=notes,
        ))

    return Song(
        title=data.get("title", ""),
        artist=data.get("artist", ""),
        tuning=data.get("tuning", ["E", "A", "D", "G", "B", "E"]),
        tempo=data.get("tempo", 120),
        bars=bars,
        sections=sections,
    )


def analyze_song(song):
    """Analyze a gp2tab Song and return a SoloAnalysis."""
    from guitar_teacher.core.theory import TheoryEngine
    engine = TheoryEngine(get_theory_dir())

    # Normalize tuning (handle lowercase 'e' for high E)
    tuning = [t.upper() for t in song.tuning]

    # Load technique data for difficulty scoring
    technique_data = engine.techniques
    gp2tab_map = engine.gp2tab_mapping

    # === Per-bar analysis ===
    all_pitch_names = []
    technique_summary = {}  # technique_key -> [bar_numbers]
    scale_summary = {}  # scale_name -> [bar_numbers]
    bar_analyses = []

    for bar in song.bars:
        if bar.is_rest:
            bar_analyses.append(BarAnalysis(
                bar_number=bar.number,
                notes=[],
                detected_scale="",
                techniques=[],
                note_density=0,
                difficulty_score=1.0,
                melodic_patterns=[],
                outside_notes=[],
            ))
            continue

        note_analyses = []
        bar_techniques = set()
        bar_pitch_classes = []

        for note in bar.notes:
            pc = fret_to_pitch_class(note.string, note.fret, tuning)
            pitch_name = pitch_class_to_name(pc)
            all_pitch_names.append(pitch_name)
            bar_pitch_classes.append(pc)

            tech_types = []
            for t in note.techniques:
                mapped = gp2tab_map.get(t.type, t.type)
                tech_types.append(mapped)
                bar_techniques.add(mapped)
                if mapped not in technique_summary:
                    technique_summary[mapped] = []
                technique_summary[mapped].append(bar.number)

            note_analyses.append(NoteAnalysis(
                string=note.string,
                fret=note.fret,
                beat=note.beat,
                duration=note.duration,
                pitch=pitch_name,
                pitch_class=pc,
                scale_degree=None,
                techniques=tech_types,
            ))

        # Detect scale for this bar
        bar_pitch_names = list(set(
            pitch_class_to_name(pc) for pc in set(bar_pitch_classes)
        ))
        bar_scale = ""
        outside = []
        if len(bar_pitch_names) >= 3:
            matches = engine.detect_key(bar_pitch_names)
            if matches:
                top = matches[0]
                bar_scale = f"{top.root} {top.scale.name}"
                outside = top.outside_notes

        # Melodic patterns
        patterns = _detect_melodic_patterns(bar_pitch_classes)

        # Difficulty
        difficulty = _score_difficulty(
            bar.notes, technique_data, song.tempo,
            list(bar_techniques), gp2tab_map,
        )

        bar_analyses.append(BarAnalysis(
            bar_number=bar.number,
            notes=note_analyses,
            detected_scale=bar_scale,
            techniques=list(bar_techniques),
            note_density=len(note_analyses),
            difficulty_score=difficulty,
            melodic_patterns=patterns,
            outside_notes=outside,
        ))

    # === Overall key detection ===
    unique_pitches = list(set(all_pitch_names))
    overall_key = "Unknown"
    if unique_pitches:
        key_matches = engine.detect_key(unique_pitches)
        if key_matches:
            overall_key = f"{key_matches[0].root} {key_matches[0].scale.name}"

    # === Section grouping ===
    sections = _group_sections(song, bar_analyses, engine)

    # Build scale_summary from sections
    for section in sections:
        if section.overall_scale and section.overall_scale not in scale_summary:
            scale_summary[section.overall_scale] = []
        if section.overall_scale:
            for bar in section.bars:
                if bar.bar_number not in scale_summary[section.overall_scale]:
                    scale_summary[section.overall_scale].append(bar.bar_number)

    # === Practice order (easiest first) ===
    sorted_sections = sorted(sections, key=lambda s: s.difficulty)
    practice_order = [s.name for s in sorted_sections]

    return SoloAnalysis(
        title=song.title,
        artist=song.artist,
        key=overall_key,
        tempo=song.tempo,
        tuning=tuning,
        sections=sections,
        practice_order=practice_order,
        technique_summary=technique_summary,
        scale_summary=scale_summary,
    )


def _group_sections(song, bar_analyses, engine):
    """Group bars into sections."""
    # Use GP section markers if available
    if song.sections:
        return _sections_from_markers(song.sections, bar_analyses, engine, song.tempo)

    # Find boundaries at rest bars
    non_rest_groups = []
    current_group = []
    for ba in bar_analyses:
        if ba.note_density == 0:
            if current_group:
                non_rest_groups.append(current_group)
                current_group = []
        else:
            current_group.append(ba)
    if current_group:
        non_rest_groups.append(current_group)

    # If no rest bars created groups, fall back to 4-bar chunks
    if len(non_rest_groups) <= 1:
        non_rest_bars = [ba for ba in bar_analyses if ba.note_density > 0]
        if not non_rest_bars:
            return []
        non_rest_groups = []
        for i in range(0, len(non_rest_bars), 4):
            non_rest_groups.append(non_rest_bars[i:i + 4])

    # Build SectionAnalysis for each group
    sections = []
    for i, group in enumerate(non_rest_groups):
        section = _build_section(
            f"Section {chr(65 + i)}", group, i + 1, engine,
        )
        sections.append(section)

    return sections


def _sections_from_markers(markers, bar_analyses, engine, tempo):
    """Build sections from GP section markers."""
    bar_map = {ba.bar_number: ba for ba in bar_analyses}
    sections = []
    for i, marker in enumerate(markers):
        group = []
        for bar_num in range(marker.start_bar, marker.end_bar + 1):
            if bar_num in bar_map:
                group.append(bar_map[bar_num])
        if group:
            section = _build_section(marker.name, group, i + 1, engine)
            sections.append(section)
    return sections


def _build_section(name, bars, priority, engine):
    """Build a SectionAnalysis from a group of BarAnalysis."""
    bar_range = (bars[0].bar_number, bars[-1].bar_number)

    # Collect all techniques
    all_techniques = {}
    for bar in bars:
        for t in bar.techniques:
            all_techniques[t] = all_techniques.get(t, 0) + 1
    primary_techniques = sorted(all_techniques.keys(), key=lambda t: all_techniques[t], reverse=True)

    # Average difficulty
    difficulties = [b.difficulty_score for b in bars if b.note_density > 0]
    avg_difficulty = sum(difficulties) / len(difficulties) if difficulties else 1.0

    # Overall scale for section
    all_pitches = set()
    for bar in bars:
        for note in bar.notes:
            all_pitches.add(note.pitch)
    overall_scale = ""
    if len(all_pitches) >= 3:
        matches = engine.detect_key(list(all_pitches))
        if matches:
            overall_scale = f"{matches[0].root} {matches[0].scale.name}"

    return SectionAnalysis(
        name=name,
        bars=bars,
        bar_range=bar_range,
        overall_scale=overall_scale,
        primary_techniques=primary_techniques,
        difficulty=round(avg_difficulty, 1),
        practice_priority=priority,
    )


def _score_difficulty(notes, technique_data, tempo, technique_types, gp2tab_map):
    """Score bar difficulty from 1.0 to 10.0."""
    if not notes:
        return 1.0

    # Note density (max contribution: 3.0)
    density = min(len(notes) / 4.0, 1.0) * 3.0

    # Technique difficulty (max contribution: 3.0)
    tech_scores = []
    for t in technique_types:
        if t in technique_data:
            tech_scores.append(technique_data[t].difficulty)
    tech_avg = (sum(tech_scores) / len(tech_scores)) if tech_scores else 0
    technique_score = min(tech_avg / 10.0, 1.0) * 3.0

    # Tempo factor (max contribution: 2.0)
    tempo_factor = min(tempo / 200.0, 1.0) * 2.0

    # String crossings (max contribution: 1.0)
    crossings = 0
    for i in range(1, len(notes)):
        if notes[i].string != notes[i - 1].string:
            crossings += 1
    crossing_score = min(crossings / max(len(notes) - 1, 1), 1.0) * 1.0

    # Position shifts (max contribution: 1.0)
    max_shift = 0
    for i in range(1, len(notes)):
        shift = abs(notes[i].fret - notes[i - 1].fret)
        max_shift = max(max_shift, shift)
    shift_score = min(max_shift / 12.0, 1.0) * 1.0

    total = density + technique_score + tempo_factor + crossing_score + shift_score
    return max(1.0, min(10.0, total))


def _detect_melodic_patterns(pitch_classes):
    """Detect simple melodic patterns from a list of pitch classes."""
    if len(pitch_classes) < 3:
        return []

    patterns = []

    # Check ascending
    ascending = all(
        pitch_classes[i] != pitch_classes[i + 1]
        and (pitch_classes[i + 1] - pitch_classes[i]) % 12 <= 6
        for i in range(len(pitch_classes) - 1)
    )
    if ascending:
        patterns.append("ascending_run")

    # Check descending
    descending = all(
        pitch_classes[i] != pitch_classes[i + 1]
        and (pitch_classes[i] - pitch_classes[i + 1]) % 12 <= 6
        for i in range(len(pitch_classes) - 1)
    )
    if descending:
        patterns.append("descending_run")

    # Check chromatic
    chromatic = all(
        abs((pitch_classes[i + 1] - pitch_classes[i]) % 12) == 1
        or abs((pitch_classes[i] - pitch_classes[i + 1]) % 12) == 1
        for i in range(len(pitch_classes) - 1)
    )
    if chromatic and len(pitch_classes) >= 4:
        patterns.append("chromatic")

    # Check repeated note
    if len(set(pitch_classes)) == 1:
        patterns.append("repeated_note")

    return patterns
