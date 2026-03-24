"""Configuration loading for guitar-teacher."""
import os
import yaml

DEFAULT_CONFIG_DIR = os.path.expanduser("~/.guitar-teacher")
DEFAULT_CONFIG_PATH = os.path.join(DEFAULT_CONFIG_DIR, "config.yaml")


def get_theory_dir():
    """Return path to the theory/ directory."""
    env_dir = os.environ.get("GUITAR_TEACHER_THEORY_DIR")
    if env_dir and os.path.isdir(env_dir):
        return env_dir
    return os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "theory")


def load_config():
    """Load config from ~/.guitar-teacher/config.yaml. Returns empty dict if missing."""
    if not os.path.exists(DEFAULT_CONFIG_PATH):
        return {}
    with open(DEFAULT_CONFIG_PATH) as f:
        return yaml.safe_load(f) or {}
