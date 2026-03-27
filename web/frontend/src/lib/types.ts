export interface FretPosition {
  string: number   // 0 = low E, 5 = high e
  fret: number
  is_root: boolean
}

export interface SectionSummary {
  id: string
  name: string
  bar_start: number
  bar_end: number
  difficulty: number
  techniques: string[]
  overall_scale: string
  completed: boolean
}

export interface SongSummary {
  id: string
  title: string
  artist: string
  key: string
  tempo: number
  tuning: string[]
  section_count: number
  completed_count: number
  processed_at: string
}

export interface SongDetail extends SongSummary {
  sections: SectionSummary[]
  full_tab: string
}

export interface ScaleResponse {
  root: string
  scale_type: string
  name: string
  notes: string[]
  character: string
  common_in: string[]
  improvisation_tip: string
  teaching_note: string
  fretboard: FretPosition[]
}

export interface ChordResponse {
  root: string
  symbol: string
  name: string
  notes: string[]
  intervals: number[]
  character: string
  fretboard: FretPosition[]
}

export interface KeyDegree {
  numeral: string
  chord_name: string
  notes: string[]
}

export interface KeyResponse {
  root: string
  scale_type: string
  degrees: KeyDegree[]
}

export interface ScaleListItem {
  key: string
  name: string
  category: string
}

export interface ChordTypeItem {
  key: string
  name: string
  symbol: string
}
