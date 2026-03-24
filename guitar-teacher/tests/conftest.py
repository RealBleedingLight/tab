import os
import pytest

REPO_ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
STANDARD_TUNING = ["E", "A", "D", "G", "B", "E"]

MOS_JSON = os.path.join(REPO_ROOT, "songs", "guthrie-govan", "man-of-steel", "tab.json")
MOS_GP = os.path.join(REPO_ROOT, "songs", "guthrie-govan", "man-of-steel", "Guthrie Hans.gp")
THEORY_DIR = os.path.join(os.path.dirname(__file__), "..", "theory")


@pytest.fixture
def engine():
    from guitar_teacher.core.theory import TheoryEngine
    return TheoryEngine(THEORY_DIR)
