"""Parser for GP6/7/8 files (ZIP containing Content/score.gpif XML)."""
import zipfile
import xml.etree.ElementTree as ET
from typing import Dict, List, Optional, Tuple
from gp2tab.models import Song, Bar, Note, Technique, Section
from gp2tab.utils import midi_to_note_name, duration_beats

_NOTE_VALUE_MAP = {
    "Whole": "whole", "Half": "half", "Quarter": "quarter",
    "Eighth": "eighth", "16th": "16th", "32nd": "32nd",
}


def parse_gp_xml(filepath: str, track_index: int = 0) -> Song:
    """Parse a GP6/7/8 file and return a Song model."""
    with zipfile.ZipFile(filepath, 'r') as zf:
        xml_data = zf.read('Content/score.gpif')
    root = ET.fromstring(xml_data)

    title, artist = _parse_score(root)
    tuning = _parse_tuning(root, track_index)
    tempo, tempo_changes = _parse_tempo(root)

    rhythms = _parse_rhythms(root)
    notes_table = _parse_notes(root, len(tuning))
    beats_table = _parse_beats(root)
    voices_table = _parse_voices(root)
    bars_table = _parse_bars_table(root)

    bars, sections = _assemble_bars(
        root, track_index, bars_table, voices_table,
        beats_table, notes_table, rhythms, tuning, tempo_changes
    )

    return Song(
        title=title, artist=artist, tuning=tuning,
        tempo=tempo, bars=bars, sections=sections,
    )


def list_tracks_xml(filepath: str) -> List[Tuple[int, str]]:
    """Return list of (index, name) for tracks in the file."""
    with zipfile.ZipFile(filepath, 'r') as zf:
        xml_data = zf.read('Content/score.gpif')
    root = ET.fromstring(xml_data)
    tracks = root.findall('.//Tracks/Track')
    return [(i, t.findtext('Name', f'Track {i+1}')) for i, t in enumerate(tracks)]


def _parse_score(root) -> Tuple[str, str]:
    title = root.findtext('.//Score/Title', '').strip()
    artist = root.findtext('.//Score/Artist', '').strip()
    return title, artist


def _parse_tuning(root, track_index: int) -> List[str]:
    tracks = root.findall('.//Tracks/Track')
    track = tracks[track_index]
    pitches_text = ''
    for prop in track.findall('.//Properties/Property'):
        if prop.get('name') == 'Tuning':
            pitches_text = prop.findtext('Pitches', '')
            break
    pitches = [int(p) for p in pitches_text.split()]
    return [midi_to_note_name(p) for p in pitches]


def _parse_tempo(root) -> Tuple[int, Dict[int, int]]:
    """Return (initial_tempo, {bar_index: tempo})."""
    initial_tempo = 120
    tempo_changes = {}
    for auto in root.findall('.//Automations/Automation'):
        if auto.findtext('Type') == 'Tempo':
            bar_idx = int(auto.findtext('Bar', '0'))
            value_text = auto.findtext('Value', '120 2')
            bpm = int(value_text.split()[0])
            if bar_idx == 0:
                initial_tempo = bpm
            else:
                tempo_changes[bar_idx] = bpm
    return initial_tempo, tempo_changes


def _parse_rhythms(root) -> Dict[str, dict]:
    result = {}
    for r in root.findall('.//Rhythms/Rhythm'):
        rid = r.get('id')
        nv = r.findtext('NoteValue', 'Quarter')
        duration = _NOTE_VALUE_MAP.get(nv, 'quarter')
        dotted = r.find('AugmentationDot') is not None
        tuplet = None
        pt = r.find('PrimaryTuplet')
        if pt is not None:
            tuplet = {
                "actual": int(pt.get('num', '1')),
                "normal": int(pt.get('den', '1')),
            }
        result[rid] = {"duration": duration, "dotted": dotted, "tuplet": tuplet}
    return result


def _parse_notes(root, num_strings: int) -> Dict[str, dict]:
    result = {}
    for note_el in root.findall('.//Notes/Note'):
        nid = note_el.get('id')
        fret = 0
        gp_string = 0
        techniques = []

        for prop in note_el.findall('.//Properties/Property'):
            pname = prop.get('name')
            if pname == 'Fret':
                fret = int(prop.findtext('Fret', '0'))
            elif pname == 'String':
                gp_string = int(prop.findtext('String', '0'))
            elif pname == 'HopoOrigin':
                techniques.append(Technique(type="hammer"))
            elif pname == 'HopoDestination':
                techniques.append(Technique(type="pull"))
            elif pname == 'Bended':
                pass  # handled below
            elif pname == 'Muted':
                techniques.append(Technique(type="mute"))
            elif pname == 'Tapped':
                techniques.append(Technique(type="tap"))

        # Bends
        bend_techs = _parse_bend(note_el)
        if bend_techs:
            techniques.extend(bend_techs)

        # Slides
        slide_tech = _parse_slide(note_el)
        if slide_tech:
            techniques.append(slide_tech)

        # Tag-based techniques
        if note_el.find('Vibrato') is not None:
            techniques.append(Technique(type="vibrato"))
        if note_el.find('Trill') is not None:
            techniques.append(Technique(type="trill"))
        if note_el.find('LetRing') is not None:
            techniques.append(Technique(type="let_ring"))

        # Tie
        tie = _parse_tie(note_el)

        # Convert string: GP is 0-indexed (0=lowest), we want 1-indexed (1=highest)
        # GP: 0=E(low), 1=A, 2=D, 3=G, 4=B, 5=e
        # Ours: 1=e, 2=B, 3=G, 4=D, 5=A, 6=E(low)
        string_num = num_strings - gp_string

        result[nid] = {
            "fret": fret, "string": string_num,
            "techniques": techniques, "tie": tie,
        }
    return result


def _parse_bend(note_el) -> List[Technique]:
    """Extract bend technique from note properties."""
    props = {}
    for prop in note_el.findall('.//Properties/Property'):
        pname = prop.get('name')
        if pname in ('BendOriginValue', 'BendMiddleValue', 'BendDestinationValue'):
            props[pname] = float(prop.findtext('Float', '0'))

    if not props:
        return []

    origin = props.get('BendOriginValue', 0.0)
    dest = props.get('BendDestinationValue', 0.0)

    # GP XML: 100 = whole step, 50 = half step
    if origin == 0 and dest > 0:
        value = _round_bend(dest / 100.0)
        return [Technique(type="bend", value=value)]
    elif origin > 0 and dest < origin:
        value = _round_bend(origin / 100.0)
        return [Technique(type="bend_release", value=value)]
    elif origin > 0 and dest == 0:
        value = _round_bend(origin / 100.0)
        return [Technique(type="bend_release", value=value)]
    elif origin > 0 and dest >= origin:
        value = _round_bend(origin / 100.0)
        return [Technique(type="pre_bend", value=value)]
    return []


def _round_bend(value: float) -> float:
    """Round bend value to nearest 0.5 step."""
    return round(value * 2) / 2


def _parse_slide(note_el) -> Optional[Technique]:
    for prop in note_el.findall('.//Properties/Property'):
        if prop.get('name') == 'Slide':
            flags = int(prop.findtext('Flags', '0'))
            # Bits: 1=shift, 2=legato, 4=out down, 8=out up, 16=in below, 32=in above
            if flags & 0x04 or flags & 0x20:
                return Technique(type="slide_down")
            return Technique(type="slide_up")
    return None


def _parse_tie(note_el) -> Optional[str]:
    tie_el = note_el.find('Tie')
    if tie_el is None:
        return None
    origin = tie_el.get('origin', 'false') == 'true'
    dest = tie_el.get('destination', 'false') == 'true'
    if origin and dest:
        return "continue"
    elif origin:
        return "start"
    elif dest:
        return "end"
    return None


def _parse_beats(root) -> Dict[str, dict]:
    result = {}
    for beat_el in root.findall('.//Beats/Beat'):
        bid = beat_el.get('id')
        rhythm_el = beat_el.find('Rhythm')
        rhythm_ref = rhythm_el.get('ref') if rhythm_el is not None else '0'
        notes_text = beat_el.findtext('Notes', '')
        note_ids = notes_text.split() if notes_text.strip() else []
        grace = beat_el.find('GraceNotes') is not None
        result[bid] = {
            "rhythm_ref": rhythm_ref,
            "note_ids": note_ids,
            "grace": grace,
        }
    return result


def _parse_voices(root) -> Dict[str, List[str]]:
    result = {}
    for voice_el in root.findall('.//Voices/Voice'):
        vid = voice_el.get('id')
        beats_text = voice_el.findtext('Beats', '')
        result[vid] = beats_text.split() if beats_text.strip() else []
    return result


def _parse_bars_table(root) -> Dict[str, dict]:
    result = {}
    for bar_el in root.findall('.//Bars/Bar'):
        bid = bar_el.get('id')
        voices_text = bar_el.findtext('Voices', '')
        voice_ids = [v for v in voices_text.split() if v != '-1']
        result[bid] = {"voice_ids": voice_ids}
    return result


def _assemble_bars(root, track_index, bars_table, voices_table,
                   beats_table, notes_table, rhythms, tuning,
                   tempo_changes) -> Tuple[List[Bar], List[Section]]:
    master_bars = root.findall('.//MasterBars/MasterBar')
    result = []
    sections = []
    current_section_name = None
    current_section_start = None
    num_strings = len(tuning)

    for bar_idx, mb in enumerate(master_bars):
        bar_num = bar_idx + 1
        time_sig = mb.findtext('Time', '4/4')

        # Section (rehearsal mark)
        section_el = mb.find('Section')
        section_name = None
        if section_el is not None:
            text = section_el.findtext('Text', '')
            letter = section_el.findtext('Letter', '')
            section_name = text or letter or None

            if current_section_name is not None:
                sections.append(Section(
                    name=current_section_name,
                    start_bar=current_section_start,
                    end_bar=bar_num - 1,
                ))
            current_section_name = section_name
            current_section_start = bar_num

        # Get bar ID for our track
        bar_ids = mb.findtext('Bars', '').split()
        if track_index >= len(bar_ids):
            result.append(Bar(number=bar_num, time_signature=time_sig))
            continue

        bar_id = bar_ids[track_index]
        bar_data = bars_table.get(bar_id, {})
        voice_ids = bar_data.get('voice_ids', [])

        all_notes = []
        for voice_id in voice_ids:
            beat_ids = voices_table.get(voice_id, [])
            current_beat = 1.0

            for beat_id in beat_ids:
                beat_data = beats_table.get(beat_id, {})
                rhythm = rhythms.get(beat_data.get('rhythm_ref', ''), {})

                dur_name = rhythm.get('duration', 'quarter')
                dotted = rhythm.get('dotted', False)
                tuplet = rhythm.get('tuplet')

                beat_length = duration_beats(dur_name, dotted)
                if tuplet:
                    beat_length = beat_length * tuplet['normal'] / tuplet['actual']

                is_grace = beat_data.get('grace', False)

                for note_id in beat_data.get('note_ids', []):
                    note_data = notes_table.get(note_id, {})

                    note = Note(
                        string=note_data.get('string', 1),
                        fret=note_data.get('fret', 0),
                        beat=round(current_beat, 4),
                        duration=dur_name,
                        dotted=dotted,
                        techniques=list(note_data.get('techniques', [])),
                        tie=note_data.get('tie'),
                        tuplet=tuplet,
                        grace=is_grace,
                    )
                    all_notes.append(note)

                if not is_grace:
                    current_beat += beat_length

        all_notes.sort(key=lambda n: (n.beat, n.string))

        # Tempo change
        tempo = tempo_changes.get(bar_idx) if tempo_changes else None

        bar = Bar(
            number=bar_num,
            time_signature=time_sig,
            notes=all_notes,
            section=section_name,
            tempo=tempo,
        )

        # Validate bar duration
        _validate_bar(bar)

        result.append(bar)

    # Close last section
    if current_section_name is not None and result:
        sections.append(Section(
            name=current_section_name,
            start_bar=current_section_start,
            end_bar=len(result),
        ))

    return result, sections


def _validate_bar(bar: Bar):
    """Check that note durations sum to the time signature."""
    if bar.is_rest:
        return

    parts = bar.time_signature.split('/')
    expected_beats = int(parts[0]) * (4.0 / int(parts[1]))

    # Sum durations by tracking unique beat positions and their durations
    # (notes at the same beat are simultaneous, not additive)
    beat_durations = {}
    for note in bar.notes:
        if note.grace:
            continue
        dur = duration_beats(note.duration, note.dotted)
        if note.tuplet:
            dur = dur * note.tuplet['normal'] / note.tuplet['actual']
        # Keep the longest duration at each beat position
        key = round(note.beat, 4)
        if key not in beat_durations or dur > beat_durations[key]:
            beat_durations[key] = dur

    total = sum(beat_durations.values())
    diff = abs(total - expected_beats)

    if diff > 0.01:
        # First/last bars may be partial
        if bar.number == 1 and total < expected_beats:
            bar.is_partial = True
        else:
            bar.warnings.append(
                f"durations sum to {total:.1f} beats (expected {expected_beats:.1f})"
            )
