"""Jinja2 template loader and renderer for lesson generation."""
import os
from jinja2 import Environment, FileSystemLoader

from guitar_teacher.config import get_theory_dir


def get_template_env():
    """Create Jinja2 environment loading from theory/lesson_templates/."""
    template_dir = os.path.join(get_theory_dir(), "lesson_templates")
    return Environment(
        loader=FileSystemLoader(template_dir),
        trim_blocks=True,
        lstrip_blocks=True,
    )


def render_template(template_name, context):
    """Render a named template with the given context."""
    env = get_template_env()
    template = env.get_template(template_name)
    return template.render(**context)
