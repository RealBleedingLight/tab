"""TheoryEngine — core music theory logic for guitar-teacher."""
import os
import re
from typing import Optional, List, Dict, Tuple
from collections import Counter

import yaml

from guitar_teacher.core.note_utils import (
    note_to_pitch_class,
    pitch_class_to_name,
    interval_semitones,
)
from guitar_teacher.core.models import (
    Scale,
    Chord,
    Interval,
    Technique,
    TechniqueVariant,
    KeyMatch,
    ScaleResult,
    ChordResult,
    ScaleSuggestion,
)

# Keys that conventionally use sharps vs flats
_SHARP_KEYS = {"C", "G", "D", "A", "E", "B", "F#", "C#"}
_FLAT_KEYS = {"F", "Bb", "Eb", "Ab", "Db", "Gb"}


class TheoryEngine:
    """Load YAML knowledge base and provide music-theory queries."""

    def __init__(self, theory_dir: str) -> None:
        self.scales = {}          # type: Dict[str, Scale]
        self._scale_aliases = {}  # type: Dict[str, str]
        self.chords = {}          # type: Dict[str, Chord]
        self._chord_aliases = {}  # type: Dict[str, str]
        self.intervals = []       # type: List[Interval]
        self.techniques = {}      # type: Dict[str, Technique]
        self.gp2tab_mapping = {}  # type: Dict[str, str]

        self._load_scales(os.path.join(theory_dir, "scales.yaml"))
        self._load_chords(os.path.join(theory_dir, "chords.yaml"))
        self._load_intervals(os.path.join(theory_dir, "intervals.yaml"))
        self._load_techniques(os.path.join(theory_dir, "techniques.yaml"))

    # ------------------------------------------------------------------
    # YAML loaders
    # ------------------------------------------------------------------

    def _load_scales(self, path: str) -> None:
        with open(path, "r") as f:
            data = yaml.safe_load(f)
        for key, s in data["scales"].items():
            scale = Scale(
                key=key,
                name=s["name"],
                aliases=s.get("aliases", []),
                category=s.get("category", ""),
                intervals=s["intervals"],
                character=s.get("character", ""),
                common_in=s.get("common_in", []),
                chord_fit=s.get("chord_fit", []),
                teaching_note=s.get("teaching_note", ""),
                improvisation_tip=s.get("improvisation_tip", ""),
                parent_scale=s.get("parent_scale"),
                parent_degree=s.get("parent_degree"),
            )
            self.scales[key] = scale
            for alias in scale.aliases:
                self._scale_aliases[alias.lower()] = key

    def _load_chords(self, path: str) -> None:
        with open(path, "r") as f:
            data = yaml.safe_load(f)
        for key, c in data["chords"].items():
            chord = Chord(
                key=key,
                name=c["name"],
                symbol=c.get("symbol", ""),
                aliases=c.get("aliases", []),
                intervals=c["intervals"],
                character=c.get("character", ""),
                common_voicings=c.get("common_voicings"),
            )
            self.chords[key] = chord
            # Index by symbol
            if chord.symbol:
                self._chord_aliases[chord.symbol.lower()] = key
            # Index by aliases
            for alias in chord.aliases:
                self._chord_aliases[alias.lower()] = key

    def _load_intervals(self, path: str) -> None:
        with open(path, "r") as f:
            data = yaml.safe_load(f)
        for i in data["intervals"]:
            self.intervals.append(Interval(
                semitones=i["semitones"],
                name=i["name"],
                short_name=i["short_name"],
                quality=i["quality"],
            ))

    def _load_techniques(self, path: str) -> None:
        with open(path, "r") as f:
            data = yaml.safe_load(f)
        self.gp2tab_mapping = data.get("gp2tab_mapping", {})
        for key, t in data["techniques"].items():
            variants = []
            for v in t.get("variants", []):
                variants.append(TechniqueVariant(
                    name=v["name"],
                    semitones=v.get("semitones"),
                    notation=v.get("notation"),
                ))
            self.techniques[key] = Technique(
                key=key,
                name=t["name"],
                difficulty=t["difficulty"],
                description=t["description"],
                variants=variants,
                teaching_template=t.get("teaching_template", ""),
                common_mistakes=t.get("common_mistakes", []),
            )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _prefer_flats(root: str) -> bool:
        """Return True if the given root conventionally uses flats."""
        # Normalise: first letter uppercase, rest as-is
        if root in _FLAT_KEYS:
            return True
        if root in _SHARP_KEYS:
            return False
        # For enharmonic edge cases, flats if the root itself contains 'b'
        return "b" in root

    def _resolve_scale(self, scale_type: str) -> Optional[Scale]:
        """Look up a scale by canonical key or alias (case-insensitive)."""
        low = scale_type.lower()
        # Try canonical key first
        if low in self.scales:
            return self.scales[low]
        # Then aliases
        canonical = self._scale_aliases.get(low)
        if canonical and canonical in self.scales:
            return self.scales[canonical]
        return None

    def _resolve_chord(self, chord_type: str) -> Optional[Chord]:
        """Look up a chord by canonical key, symbol, or alias (case-insensitive)."""
        low = chord_type.lower()
        # Try canonical key
        if low in self.chords:
            return self.chords[low]
        # Try alias / symbol
        canonical = self._chord_aliases.get(low)
        if canonical and canonical in self.chords:
            return self.chords[canonical]
        return None

    def _compute_notes(self, root: str, step_pattern: List[int], use_flats: bool) -> List[str]:
        """Given a root and list of semitone steps, return note names."""
        root_pc = note_to_pitch_class(root)
        notes = [pitch_class_to_name(root_pc, prefer_flats=use_flats)]
        current = root_pc
        for step in step_pattern[:-1]:  # last step returns to root, skip it
            current = (current + step) % 12
            notes.append(pitch_class_to_name(current, prefer_flats=use_flats))
        return notes

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def get_scale(self, root: str, scale_type: str) -> Optional[ScaleResult]:
        """Instantiate a scale at a specific root, returning computed notes."""
        scale = self._resolve_scale(scale_type)
        if scale is None:
            return None
        use_flats = self._prefer_flats(root)
        notes = self._compute_notes(root, scale.intervals, use_flats)
        return ScaleResult(scale=scale, root=root, notes=notes)

    def detect_key(self, notes: List[str]) -> List[KeyMatch]:
        """Detect the most likely key/scale for a collection of notes."""
        input_pcs = [note_to_pitch_class(n) for n in notes]
        input_set = set(input_pcs)
        total_input = len(input_set)
        if total_input == 0:
            return []

        # Frequency for bonus calculation
        freq = Counter(input_pcs)
        first_pc = input_pcs[0]
        most_common_pc = freq.most_common(1)[0][0]

        all_roots = []
        for pc in range(12):
            all_roots.append(pitch_class_to_name(pc, prefer_flats=False))
            flat_name = pitch_class_to_name(pc, prefer_flats=True)
            if flat_name != all_roots[-1]:
                all_roots.append(flat_name)

        results = []  # type: List[KeyMatch]
        seen = set()  # type: set

        for root_name in all_roots:
            root_pc = note_to_pitch_class(root_name)
            for scale_key, scale in self.scales.items():
                # Skip scales with many notes (chromatic) to avoid noise
                if len(scale.intervals) > 8:
                    continue
                sig = (root_pc, scale_key)
                if sig in seen:
                    continue
                seen.add(sig)

                use_flats = self._prefer_flats(root_name)
                scale_notes = self._compute_notes(root_name, scale.intervals, use_flats)
                scale_pcs = set(note_to_pitch_class(n) for n in scale_notes)

                matched = len(input_set & scale_pcs)
                matched_scale = len(scale_pcs & input_set)
                outside = input_set - scale_pcs

                if matched == 0:
                    continue

                score = matched / total_input - 0.1 * (len(scale_pcs) - matched_scale)

                # Bonuses
                if root_pc == first_pc:
                    score += 0.1
                if root_pc == most_common_pc:
                    score += 0.05

                outside_notes = [pitch_class_to_name(pc, prefer_flats=use_flats) for pc in outside]

                results.append(KeyMatch(
                    root=root_name,
                    scale=scale,
                    score=round(score, 4),
                    notes_matched=matched,
                    total_notes=total_input,
                    outside_notes=outside_notes,
                ))

        results.sort(key=lambda m: m.score, reverse=True)
        return results[:5]

    def get_chord(self, root: str, chord_type: str) -> Optional[ChordResult]:
        """Instantiate a chord at a specific root, returning computed notes."""
        chord = self._resolve_chord(chord_type)
        if chord is None:
            return None
        use_flats = self._prefer_flats(root)
        root_pc = note_to_pitch_class(root)
        notes = []
        for semi in chord.intervals:
            pc = (root_pc + semi) % 12
            notes.append(pitch_class_to_name(pc, prefer_flats=use_flats))
        return ChordResult(chord=chord, root=root, symbol=chord.symbol, notes=notes)

    def chords_in_key(self, root: str, scale_type: str) -> List[ChordResult]:
        """Build diatonic triads for each degree of the given scale."""
        sr = self.get_scale(root, scale_type)
        if sr is None:
            return []

        use_flats = self._prefer_flats(root)
        # Build pitch classes for the full scale
        scale_pcs = [note_to_pitch_class(n) for n in sr.notes]
        num_degrees = len(sr.notes)

        # Quality lookup: intervals (from root of triad) -> chord type key
        _TRIAD_QUALITY = {
            (4, 7): "major",
            (3, 7): "minor",
            (3, 6): "diminished",
            (4, 8): "augmented",
        }

        results = []
        for i in range(num_degrees):
            triad_root_pc = scale_pcs[i]
            third_pc = scale_pcs[(i + 2) % num_degrees]
            fifth_pc = scale_pcs[(i + 4) % num_degrees]

            int_3 = (third_pc - triad_root_pc) % 12
            int_5 = (fifth_pc - triad_root_pc) % 12

            quality_key = _TRIAD_QUALITY.get((int_3, int_5))
            if quality_key is None:
                # Fallback: unknown triad quality, use major as default
                quality_key = "major"

            chord = self.chords.get(quality_key)
            if chord is None:
                continue

            triad_root_name = pitch_class_to_name(triad_root_pc, prefer_flats=use_flats)
            triad_notes = [
                triad_root_name,
                pitch_class_to_name(third_pc, prefer_flats=use_flats),
                pitch_class_to_name(fifth_pc, prefer_flats=use_flats),
            ]
            results.append(ChordResult(
                chord=chord,
                root=triad_root_name,
                symbol=chord.symbol,
                notes=triad_notes,
            ))
        return results

    def suggest_scales(self, chords: List[str]) -> List[ScaleSuggestion]:
        """Suggest scales for a chord progression given as chord name strings."""
        _CHORD_RE = re.compile(r'^([A-G][#b]?)(.*)$')
        all_notes = []  # type: List[str]

        for chord_str in chords:
            m = _CHORD_RE.match(chord_str)
            if m is None:
                continue
            root = m.group(1)
            quality = m.group(2)
            if not quality:
                quality = "major"
            cr = self.get_chord(root, quality)
            if cr is not None:
                all_notes.extend(cr.notes)

        if not all_notes:
            return []

        # Deduplicate while preserving order for detect_key
        seen = set()  # type: set
        unique = []  # type: List[str]
        for n in all_notes:
            pc = note_to_pitch_class(n)
            if pc not in seen:
                seen.add(pc)
                unique.append(n)

        matches = self.detect_key(unique)
        suggestions = []
        for km in matches:
            use_flats = self._prefer_flats(km.root)
            scale_notes = self._compute_notes(km.root, km.scale.intervals, use_flats)
            suggestions.append(ScaleSuggestion(
                root=km.root,
                name=km.scale.name,
                notes=scale_notes,
                score=km.score,
            ))
        return suggestions

    def interval_between(self, note1: str, note2: str) -> Interval:
        """Return the Interval between two notes."""
        semis = interval_semitones(note1, note2)
        for iv in self.intervals:
            if iv.semitones == semis:
                return iv
        # Fallback: shouldn't happen with a complete 0-11 interval list
        raise ValueError(f"No interval found for {semis} semitones")

    def note_to_scale_degree(self, note: str, root: str, scale: ScaleResult) -> str:
        """Return the scale degree label for a note relative to a root.

        Uses major scale degrees as reference:
          [0,2,4,5,7,9,11] -> ["1","2","3","4","5","6","7"]
        """
        _MAJOR_SEMIS = [0, 2, 4, 5, 7, 9, 11]
        _DEGREE_NAMES = ["1", "2", "3", "4", "5", "6", "7"]

        semis = interval_semitones(root, note)

        # Exact match with a major-scale degree
        if semis in _MAJOR_SEMIS:
            return _DEGREE_NAMES[_MAJOR_SEMIS.index(semis)]

        # One semitone below a major degree -> flat
        for i, ms in enumerate(_MAJOR_SEMIS):
            if semis == ms - 1:
                return "b" + _DEGREE_NAMES[i]

        # One semitone above a major degree -> sharp
        for i, ms in enumerate(_MAJOR_SEMIS):
            if semis == ms + 1:
                return "#" + _DEGREE_NAMES[i]

        # Fallback (shouldn't happen within 12 semitones)
        return str(semis)
