"""Data models for guitar-teacher."""
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Tuple


# === Theory Models ===

@dataclass
class Scale:
    key: str
    name: str
    aliases: List[str]
    category: str
    intervals: List[int]
    character: str
    common_in: List[str]
    chord_fit: List[str]
    teaching_note: str
    improvisation_tip: str
    parent_scale: Optional[str] = None
    parent_degree: Optional[int] = None


@dataclass
class Chord:
    key: str
    name: str
    symbol: str
    aliases: List[str]
    intervals: List[int]
    character: str
    common_voicings: Optional[Dict] = None


@dataclass
class Interval:
    semitones: int
    name: str
    short_name: str
    quality: str


@dataclass
class TechniqueVariant:
    name: str
    semitones: Optional[int] = None
    notation: Optional[str] = None


@dataclass
class Technique:
    key: str
    name: str
    difficulty: int
    description: str
    variants: List[TechniqueVariant]
    teaching_template: str
    common_mistakes: List[str]


# === Key Detection Models ===

@dataclass
class KeyMatch:
    root: str
    scale: Scale
    score: float
    notes_matched: int
    total_notes: int
    outside_notes: List[str]


# === Analysis Models ===

@dataclass
class NoteAnalysis:
    string: int
    fret: int
    beat: float
    duration: str
    pitch: str
    pitch_class: int
    scale_degree: Optional[str]
    techniques: List[str]


@dataclass
class BarAnalysis:
    bar_number: int
    notes: List[NoteAnalysis]
    detected_scale: str
    techniques: List[str]
    note_density: int
    difficulty_score: float
    melodic_patterns: List[str]
    outside_notes: List[str]


@dataclass
class SectionAnalysis:
    name: str
    bars: List[BarAnalysis]
    bar_range: Tuple[int, int]
    overall_scale: str
    primary_techniques: List[str]
    difficulty: float
    practice_priority: int


@dataclass
class SoloAnalysis:
    title: str
    artist: str
    key: str
    tempo: int
    tuning: List[str]
    sections: List[SectionAnalysis]
    practice_order: List[str]
    technique_summary: Dict[str, List[int]]
    scale_summary: Dict[str, List[int]]


# === Lesson Template Context Models ===

@dataclass
class LessonStep:
    title: str
    body: str
    instruction: str
    listen_for: str
    repeat_instruction: str
    tab_excerpt: Optional[str] = None


@dataclass
class WarmupExercise:
    description: str
    source_lesson: Optional[str] = None


@dataclass
class ConceptContext:
    name: str
    teaching_note: str
    improvisation_tip: Optional[str] = None
    root: Optional[str] = None
    notes: Optional[List[str]] = None


@dataclass
class LessonContext:
    lesson_number: int
    section_name: str
    bar_start: int
    bar_end: int
    phase: str
    prerequisites: str
    estimated_time: int
    target_tempo_pct: int
    target_tempo_bpm: int
    goal_techniques: str
    warmup_exercises: List[WarmupExercise]
    primary_concept: ConceptContext
    primary_scale: Optional[ConceptContext]
    steps: List[LessonStep]
    improvisation_suggestions: Optional[str]
    checkpoints: List[str]
    next_lesson: Optional[int]


@dataclass
class ScaleResult:
    """A scale instantiated at a specific root."""
    scale: Scale
    root: str
    notes: List[str]


@dataclass
class ChordResult:
    """A chord instantiated at a specific root."""
    chord: Chord
    root: str
    symbol: str
    notes: List[str]


@dataclass
class ScaleSuggestion:
    """A scale suggested for a chord progression."""
    root: str
    name: str
    notes: List[str]
    score: float
