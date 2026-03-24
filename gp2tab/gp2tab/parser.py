"""Format-detecting parser dispatcher."""
import zipfile
from gp2tab.models import Song


def parse(filepath: str, track_index: int = 0) -> Song:
    """Parse a Guitar Pro file (any supported format) into a Song model."""
    if _is_zip(filepath):
        from gp2tab.parser_gp_xml import parse_gp_xml
        return parse_gp_xml(filepath, track_index)
    else:
        from gp2tab.parser_gp5 import parse_gp5
        return parse_gp5(filepath, track_index)


def list_tracks(filepath: str) -> list:
    """Return list of (index, name) tuples for tracks in the file."""
    if _is_zip(filepath):
        from gp2tab.parser_gp_xml import list_tracks_xml
        return list_tracks_xml(filepath)
    else:
        from gp2tab.parser_gp5 import list_tracks_gp5
        return list_tracks_gp5(filepath)


def _is_zip(filepath: str) -> bool:
    return zipfile.is_zipfile(filepath)
