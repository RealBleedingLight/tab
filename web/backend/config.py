import os
from guitar_teacher.config import get_theory_dir

DATA_DIR = os.environ.get("DATA_DIR", os.path.join(os.path.dirname(__file__), "data"))
SONGS_DIR = os.path.join(DATA_DIR, "songs")
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
THEORY_DIR = os.environ.get("GUITAR_TEACHER_THEORY_DIR", get_theory_dir())

os.makedirs(SONGS_DIR, exist_ok=True)
