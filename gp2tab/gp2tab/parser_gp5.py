"""Parser for GP3/4/5 files using pyguitarpro library."""
import guitarpro
from typing import List, Tuple
from gp2tab.models import Song, Bar, Note, Technique, Section
from gp2tab.utils import midi_to_note_name, duration_beats

_DUR_VALUE_MAP = {
    -2: "whole", -1: "half", 0: "quarter",
    1: "eighth", 2: "16th", 3: "32nd",
}


def parse_gp5(filepath: str, track_index: int = 0) -> Song:
    """Parse a GP3/4/5 file via pyguitarpro."""
    gp_song = guitarpro.parse(filepath)
    track = gp_song.tracks[track_index]

    tuning = [midi_to_note_name(s.value) for s in track.strings]
    tuning.reverse()  # pyguitarpro: high to low; we need low to high

    tempo = gp_song.tempo.value if hasattr(gp_song.tempo, 'value') else int(gp_song.tempo)
    title = gp_song.title or ""
    artist = gp_song.artist or ""

    bars = []
    for i, measure_header in enumerate(gp_song.measureHeaders):
        bar_num = i + 1
        time_sig = f"{measure_header.timeSignature.numerator}/{measure_header.timeSignature.denominator.value}"
        measure = track.measures[i]

        all_notes = []
        for voice in measure.voices:
            current_beat = 1.0
            for beat in voice.beats:
                dur_value = beat.duration.value
                dur_name = _DUR_VALUE_MAP.get(dur_value, "quarter")
                dotted = beat.duration.isDotted
                tuplet_data = None
                if beat.duration.tuplet and beat.duration.tuplet.enters != beat.duration.tuplet.times:
                    tuplet_data = {
                        "actual": beat.duration.tuplet.enters,
                        "normal": beat.duration.tuplet.times,
                    }

                beat_length = duration_beats(dur_name, dotted)
                if tuplet_data:
                    beat_length = beat_length * tuplet_data["normal"] / tuplet_data["actual"]

                for gp_note in beat.notes:
                    techniques = _extract_techniques(gp_note)
                    tie = _extract_tie(gp_note)

                    note = Note(
                        string=gp_note.string,
                        fret=gp_note.value,
                        beat=round(current_beat, 4),
                        duration=dur_name,
                        dotted=dotted,
                        techniques=techniques,
                        tie=tie,
                        tuplet=tuplet_data,
                        grace=beat.effect.isGrace if hasattr(beat.effect, 'isGrace') else False,
                    )
                    all_notes.append(note)

                current_beat += beat_length

        all_notes.sort(key=lambda n: (n.beat, n.string))
        tempo_change = None
        if measure_header.tempo and measure_header.tempo.value != tempo:
            tempo_change = measure_header.tempo.value

        bars.append(Bar(
            number=bar_num,
            time_signature=time_sig,
            notes=all_notes,
            tempo=tempo_change,
        ))

    return Song(
        title=title, artist=artist, tuning=tuning,
        tempo=tempo, bars=bars,
    )


def _extract_techniques(gp_note) -> list:
    techniques = []
    eff = gp_note.effect
    if eff.bend:
        peak = max(p.value for p in eff.bend.points) if eff.bend.points else 0
        value = round(peak / 100.0, 1)
        if value <= 0:
            value = 1.0
        techniques.append(Technique(type="bend", value=value))
    if eff.hammer:
        techniques.append(Technique(type="hammer"))
    if hasattr(eff, 'slide') and eff.slide:
        techniques.append(Technique(type="slide_up"))
    if eff.vibrato:
        techniques.append(Technique(type="vibrato"))
    if eff.harmonic:
        if hasattr(guitarpro, 'NaturalHarmonic') and eff.harmonic.type == guitarpro.NaturalHarmonic:
            techniques.append(Technique(type="harmonic_natural"))
        else:
            techniques.append(Technique(type="harmonic_pinch"))
    if eff.palmMute:
        techniques.append(Technique(type="palm_mute"))
    if eff.ghostNote or eff.deadNote:
        techniques.append(Technique(type="mute"))
    return techniques


def _extract_tie(gp_note) -> str:
    if gp_note.type == guitarpro.NoteType.tie:
        return "end"
    return None


def list_tracks_gp5(filepath: str) -> list:
    gp_song = guitarpro.parse(filepath)
    return [(i, t.name) for i, t in enumerate(gp_song.tracks)]
