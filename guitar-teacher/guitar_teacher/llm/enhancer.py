"""Post-process generated lessons via LLM."""
import os
from guitar_teacher.llm.providers import LLMConfig, call_llm

SYSTEM_PROMPT = """You are an expert guitar teacher enriching a lesson plan.

RULES:
1. All notes, frets, strings, scales, techniques, and musical data are CORRECT. Do NOT change any of them.
2. Improve the prose: make it natural, engaging, conversational. Add analogies where helpful.
3. Add improvisation suggestions tied to the detected scale/mode.
4. Add context about the song or artist if you know it.
5. Keep the exact same structure (headings, checkpoints, steps). Only improve the text within each section.
6. Keep it concise - don't bloat the lesson.

Return the improved lesson as complete markdown."""


def enhance_lessons(lesson_dir, config):
    """Enhance all lesson files in a directory. Returns count of enhanced files."""
    enhanced = 0
    for filename in sorted(os.listdir(lesson_dir)):
        if not filename.endswith(".md") or filename == "README.md":
            continue
        filepath = os.path.join(lesson_dir, filename)
        with open(filepath) as f:
            content = f.read()
        try:
            improved = call_llm(config, SYSTEM_PROMPT, content)
            with open(filepath, "w") as f:
                f.write(improved)
            enhanced += 1
        except Exception as e:
            print(f"  Warning: could not enhance {filename}: {e}")
    return enhanced


def enhance_file(filepath, config):
    """Enhance a single file. Returns True on success."""
    with open(filepath) as f:
        content = f.read()
    try:
        improved = call_llm(config, SYSTEM_PROMPT, content)
        with open(filepath, "w") as f:
            f.write(improved)
        return True
    except Exception as e:
        print(f"  Warning: could not enhance {filepath}: {e}")
        return False
