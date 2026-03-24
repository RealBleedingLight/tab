"""Data models for gp2tab."""
from dataclasses import dataclass, field
from typing import List, Optional, Dict


@dataclass
class Technique:
    type: str
    value: Optional[float] = None


@dataclass
class Note:
    string: int        # 1=highest pitch string, 6=lowest
    fret: int
    beat: float        # 1.0, 1.5, 2.0, etc.
    duration: str      # "whole", "half", "quarter", "eighth", "16th", "32nd"
    dotted: bool = False
    techniques: List[Technique] = field(default_factory=list)
    tie: Optional[str] = None
    tuplet: Optional[Dict] = None
    grace: bool = False


@dataclass
class Section:
    name: str
    start_bar: int
    end_bar: int


@dataclass
class Bar:
    number: int
    time_signature: str
    notes: List[Note] = field(default_factory=list)
    tempo: Optional[int] = None
    section: Optional[str] = None
    is_partial: bool = False
    warnings: List[str] = field(default_factory=list)

    @property
    def is_rest(self) -> bool:
        return len(self.notes) == 0


@dataclass
class Song:
    title: str
    artist: str
    tuning: List[str]
    tempo: int
    bars: List[Bar] = field(default_factory=list)
    sections: List[Section] = field(default_factory=list)
