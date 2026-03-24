from unittest.mock import MagicMock
from gp2tab.parser_gp5 import _extract_techniques, _extract_tie
import guitarpro


def _make_note_effect(**kwargs):
    eff = MagicMock()
    eff.bend = kwargs.get("bend", None)
    eff.hammer = kwargs.get("hammer", False)
    eff.slide = kwargs.get("slide", None)
    eff.vibrato = kwargs.get("vibrato", False)
    eff.harmonic = kwargs.get("harmonic", None)
    eff.palmMute = kwargs.get("palmMute", False)
    eff.ghostNote = kwargs.get("ghostNote", False)
    eff.deadNote = kwargs.get("deadNote", False)
    return eff


def _make_gp_note(effect=None, note_type=None):
    note = MagicMock()
    note.effect = effect or _make_note_effect()
    note.type = note_type or guitarpro.NoteType.normal
    return note


def test_extract_hammer():
    note = _make_gp_note(_make_note_effect(hammer=True))
    techs = _extract_techniques(note)
    assert any(t.type == "hammer" for t in techs)


def test_extract_vibrato():
    note = _make_gp_note(_make_note_effect(vibrato=True))
    techs = _extract_techniques(note)
    assert any(t.type == "vibrato" for t in techs)


def test_extract_palm_mute():
    note = _make_gp_note(_make_note_effect(palmMute=True))
    techs = _extract_techniques(note)
    assert any(t.type == "palm_mute" for t in techs)


def test_extract_dead_note():
    note = _make_gp_note(_make_note_effect(deadNote=True))
    techs = _extract_techniques(note)
    assert any(t.type == "mute" for t in techs)


def test_extract_bend():
    bend = MagicMock()
    point = MagicMock()
    point.value = 100  # 100 = full step
    bend.points = [point]
    note = _make_gp_note(_make_note_effect(bend=bend))
    techs = _extract_techniques(note)
    bend_tech = [t for t in techs if t.type == "bend"][0]
    assert bend_tech.value == 1.0


def test_extract_half_step_bend():
    bend = MagicMock()
    point = MagicMock()
    point.value = 50  # 50 = half step
    bend.points = [point]
    note = _make_gp_note(_make_note_effect(bend=bend))
    techs = _extract_techniques(note)
    bend_tech = [t for t in techs if t.type == "bend"][0]
    assert bend_tech.value == 0.5


def test_extract_tie():
    note = _make_gp_note(note_type=guitarpro.NoteType.tie)
    assert _extract_tie(note) == "end"


def test_extract_no_tie():
    note = _make_gp_note(note_type=guitarpro.NoteType.normal)
    assert _extract_tie(note) is None


def test_no_techniques():
    note = _make_gp_note()
    techs = _extract_techniques(note)
    assert techs == []
