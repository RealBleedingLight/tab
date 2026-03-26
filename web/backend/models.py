from pydantic import BaseModel
from typing import List, Optional


class SectionSummary(BaseModel):
    id: str
    name: str
    bar_start: int
    bar_end: int
    difficulty: float
    techniques: List[str]
    overall_scale: str
    completed: bool = False


class SongSummary(BaseModel):
    id: str
    title: str
    artist: str
    key: str
    tempo: int
    tuning: List[str]
    section_count: int
    completed_count: int
    processed_at: str


class SongDetail(SongSummary):
    sections: List[SectionSummary]
    full_tab: str


class FretPosition(BaseModel):
    string: int     # 0 = low E, 5 = high e
    fret: int
    is_root: bool


class ScaleResponse(BaseModel):
    root: str
    scale_type: str
    name: str
    notes: List[str]
    character: str
    common_in: List[str]
    improvisation_tip: str
    teaching_note: str
    fretboard: List[FretPosition]


class ChordResponse(BaseModel):
    root: str
    symbol: str
    name: str
    notes: List[str]
    intervals: List[int]
    character: str
    fretboard: List[FretPosition]


class KeyDegree(BaseModel):
    numeral: str
    chord_name: str
    notes: List[str]


class KeyResponse(BaseModel):
    root: str
    scale_type: str
    degrees: List[KeyDegree]


class ScaleListItem(BaseModel):
    key: str
    name: str
    category: str


class ChordTypeItem(BaseModel):
    key: str
    name: str
    symbol: str
