"""Generate lesson plans from SoloAnalysis."""
import os
from typing import Optional, List

from guitar_teacher.core.models import (
    SoloAnalysis,
    SectionAnalysis,
    LessonContext,
    LessonStep,
    WarmupExercise,
    ConceptContext,
)
from guitar_teacher.lessons.templates import render_template
from guitar_teacher.config import get_theory_dir
from guitar_teacher.core.theory import TheoryEngine


def generate_lessons(analysis, output_dir, section_order="difficulty"):
    """Generate all lesson files from a SoloAnalysis.

    Args:
        section_order: 'difficulty' (easiest first) or 'bars' (chronological bar order)
    """
    engine = TheoryEngine(get_theory_dir())
    os.makedirs(output_dir, exist_ok=True)
    lessons_dir = os.path.join(output_dir, "lessons")
    os.makedirs(lessons_dir, exist_ok=True)

    # Build lesson plan
    lesson_plan = _build_lesson_plan(analysis, engine, section_order=section_order)

    # Render each lesson
    for i, lesson_ctx in enumerate(lesson_plan):
        ctx = {"ctx": lesson_ctx}

        # Technique intro lessons use their own template
        if hasattr(lesson_ctx, '_techniques') and lesson_ctx._techniques:
            lesson_ctx.techniques = lesson_ctx._techniques
            template_name = "technique_intro.md.j2"
        else:
            template_name = _get_template_for_phase(lesson_ctx.phase)

        content = render_template(template_name, ctx)
        slug = _slugify(lesson_ctx.section_name)
        filename = f"{lesson_ctx.lesson_number:02d}-{slug}.md"
        with open(os.path.join(lessons_dir, filename), "w") as f:
            f.write(content)

    # Generate README.md for lessons
    _generate_lessons_readme(lessons_dir, lesson_plan)

    # Generate theory.md
    _generate_theory(analysis, engine, output_dir)

    # Generate breakdown.md
    _generate_breakdown(analysis, engine, output_dir)

    # Generate practice.md
    _generate_practice_plan(analysis, output_dir)

    # Generate .context.md
    _generate_context(analysis, lesson_plan, output_dir)

    # Generate practice-log.md
    _generate_practice_log(output_dir)


def _build_lesson_plan(analysis, engine, section_order="difficulty"):
    """Build ordered list of LessonContext objects.

    Args:
        section_order: 'difficulty' (easiest first) or 'bars' (chronological)
    """
    lessons = []
    lesson_num = 1

    # Phase 1: Technique prerequisites (1-2 lessons)
    top_techniques = _get_top_techniques(analysis, engine, count=3)
    if top_techniques:
        ctx = _build_technique_lesson(
            lesson_num, top_techniques, analysis, engine,
        )
        # Attach technique data for the template
        tech_data = []
        for t_key in top_techniques:
            if t_key in engine.techniques:
                tech_data.append(engine.techniques[t_key])
        ctx._techniques = tech_data
        lessons.append(ctx)
        lesson_num += 1

    # Phase 2: Section lessons — order by difficulty or bar position
    if section_order == "bars":
        ordered_names = [s.name for s in sorted(analysis.sections, key=lambda s: s.bar_range[0])]
    else:
        ordered_names = analysis.practice_order

    for section_name in ordered_names:
        section = _find_section(analysis, section_name)
        if section is None:
            continue
        ctx = _build_section_lesson(lesson_num, section, analysis, engine, lessons)
        lessons.append(ctx)
        lesson_num += 1

    # Phase 3: Assembly lessons (pair adjacent sections)
    section_pairs = _get_assembly_pairs(analysis)
    for pair in section_pairs:
        ctx = _build_assembly_lesson(
            lesson_num, pair, analysis, engine, lessons,
        )
        lessons.append(ctx)
        lesson_num += 1

    # Phase 4: Performance lesson
    perf = _build_performance_lesson(lesson_num, analysis, engine, lessons)
    lessons.append(perf)

    # Set next_lesson pointers
    for i in range(len(lessons) - 1):
        lessons[i].next_lesson = lessons[i + 1].lesson_number

    return lessons


def _build_technique_lesson(lesson_num, technique_keys, analysis, engine):
    """Build a technique intro lesson."""
    tech_names = []
    warmups = []
    steps = []
    checkpoints = []

    for t_key in technique_keys:
        tech = engine.techniques.get(t_key)
        if not tech:
            continue
        tech_names.append(tech.name)

        warmups.append(WarmupExercise(
            description=f"Warm up with basic {tech.name.lower()} exercises on the B string around fret 12",
        ))

        steps.append(LessonStep(
            title=f"Practice {tech.name}",
            body=tech.teaching_template if tech.teaching_template else f"Practice {tech.name.lower()} technique.",
            instruction=f"Start slow and focus on clean execution. Practice {tech.name.lower()} on the B string, frets 12-15.",
            listen_for=f"Clean, controlled {tech.name.lower()} with consistent tone.",
            repeat_instruction="10 repetitions, then move to the next technique.",
        ))

        checkpoints.append(f"Can you execute {tech.name.lower()} cleanly and consistently?")

    concept_name = " & ".join(tech_names) if tech_names else "Technique Foundations"

    return LessonContext(
        lesson_number=lesson_num,
        section_name=f"Technique Foundations — {concept_name}",
        bar_start=0,
        bar_end=0,
        phase="Foundation",
        prerequisites="None",
        estimated_time=20,
        target_tempo_pct=0,
        target_tempo_bpm=0,
        goal_techniques=", ".join(tech_names),
        warmup_exercises=warmups,
        primary_concept=ConceptContext(
            name=concept_name,
            teaching_note=f"These techniques appear frequently in this solo. Master them before tackling the sections.",
        ),
        primary_scale=None,
        steps=steps,
        improvisation_suggestions=None,
        checkpoints=checkpoints,
        next_lesson=None,
    )


def _build_section_lesson(lesson_num, section, analysis, engine, previous_lessons):
    """Build a lesson for a specific section."""
    # Determine phase and tempo
    if section.difficulty <= 4.0:
        phase = "Foundation"
        tempo_pct = 50
    elif section.difficulty <= 7.0:
        phase = "Building"
        tempo_pct = 40
    else:
        phase = "Peak"
        tempo_pct = 30

    tempo_bpm = int(analysis.tempo * tempo_pct / 100)

    # Prerequisites
    if previous_lessons:
        prev_nums = ", ".join(f"{l.lesson_number:02d}" for l in previous_lessons[-2:])
        prereqs = f"Lessons {prev_nums}"
    else:
        prereqs = "None"

    # Warmup
    warmups = []
    for tech in section.primary_techniques[:2]:
        t = engine.techniques.get(tech)
        if t:
            warmups.append(WarmupExercise(
                description=f"2 min {t.name.lower()} warm-up on B string fret 15",
            ))
    if not warmups:
        warmups.append(WarmupExercise(description="5 min chromatic warm-up, 4 notes per string"))

    # Primary concept
    primary_tech = section.primary_techniques[0] if section.primary_techniques else "phrasing"
    tech_data = engine.techniques.get(primary_tech)
    concept = ConceptContext(
        name=tech_data.name if tech_data else primary_tech.replace("_", " ").title(),
        teaching_note=tech_data.teaching_template if tech_data and tech_data.teaching_template else f"Focus on clean {primary_tech.replace('_', ' ')} execution in this section.",
    )

    # Scale context
    primary_scale = None
    if section.overall_scale:
        parts = section.overall_scale.split(" ", 1)
        if len(parts) == 2:
            scale_result = engine.get_scale(parts[0], parts[1].lower().replace(" ", "_"))
            if scale_result:
                primary_scale = ConceptContext(
                    name=section.overall_scale,
                    teaching_note=scale_result.scale.teaching_note,
                    improvisation_tip=scale_result.scale.improvisation_tip,
                    root=scale_result.root,
                    notes=scale_result.notes,
                )

    # Steps
    bar_start = section.bar_range[0]
    bar_end = section.bar_range[1]
    mid = (bar_start + bar_end) // 2

    steps = [
        LessonStep(
            title=f"Learn the Notes — Bars {bar_start}-{mid}",
            body=f"Open your tab and read through bars {bar_start}-{mid}.",
            instruction=f"Play each note one at a time, very slowly — no metronome. Find the right frets and strings. Play through until you can find every note without hesitation.",
            listen_for="Clean tone on every note. No accidental string noise, no buzzing.",
            repeat_instruction=f"Play through bars {bar_start}-{mid} at least 5 times slowly.",
        ),
        LessonStep(
            title=f"Learn the Notes — Bars {mid+1}-{bar_end}",
            body=f"Continue to bars {mid+1}-{bar_end}.",
            instruction=f"Same approach — note by note, no metronome. Take your time.",
            listen_for="Clean transitions between notes, especially position shifts.",
            repeat_instruction=f"5 times through bars {mid+1}-{bar_end} until memorized.",
        ),
    ]

    # Add technique-specific step if there are techniques
    if section.primary_techniques:
        tech_list = ", ".join(section.primary_techniques[:3])
        steps.append(LessonStep(
            title="Add Techniques",
            body=f"Go back through bars {bar_start}-{bar_end} and focus on the techniques: {tech_list}.",
            instruction=f"For each technique occurrence, stop and practice it in isolation 3 times. Then play the phrase around it in context.",
            listen_for="Each technique should be clean and accurate. Bends hit target pitch, vibrato is even, legato notes are consistent volume.",
            repeat_instruction=f"Isolate each technique until reliable, then play bars {bar_start}-{bar_end} with techniques included.",
        ))

    steps.append(LessonStep(
        title="Phrasing and Expression",
        body=f"Think vocally — if you were singing bars {bar_start}-{bar_end}, how would it sound?",
        instruction="Add dynamics. Lean into emphasized notes, let breathing points have tiny gaps. Shape the line musically.",
        listen_for="Musical flow. The phrase should feel like it's going somewhere, not a disconnected series of notes.",
        repeat_instruction="5 passes focusing on musicality over precision.",
    ))

    steps.append(LessonStep(
        title="Tempo",
        body=f"Set your metronome to {tempo_bpm} bpm ({tempo_pct}% of {analysis.tempo} bpm).",
        instruction=f"Play bars {bar_start}-{bar_end} with metronome. If clean, increase by 5 bpm. If it falls apart, drop back 10 bpm.",
        listen_for=f"Clean execution at tempo. Every note in time, techniques accurate.",
        repeat_instruction="3 passes at each tempo before increasing.",
    ))

    steps.append(LessonStep(
        title="Consistency Pass",
        body="You need to play this section reliably, not just once.",
        instruction=f"At {tempo_pct}% tempo, play bars {bar_start}-{bar_end} three times in a row with no mistakes.",
        listen_for="Consistency. Each pass should sound roughly the same.",
        repeat_instruction="Until 3 clean consecutive passes. If one bar consistently breaks, isolate and loop it 10 times.",
    ))

    # Checkpoints
    checkpoints = [
        f"Can you play bars {bar_start}-{bar_end} cleanly at {tempo_pct}% tempo?",
        "Are all techniques executed accurately?",
        "Does the phrasing feel musical and natural?",
        "Can you do 3 clean consecutive passes?",
    ]

    # Improvisation suggestions
    improv = None
    if primary_scale and primary_scale.improvisation_tip:
        improv = primary_scale.improvisation_tip

    return LessonContext(
        lesson_number=lesson_num,
        section_name=f"{section.name} — Bars {bar_start}-{bar_end}",
        bar_start=bar_start,
        bar_end=bar_end,
        phase=phase,
        prerequisites=prereqs,
        estimated_time=25,
        target_tempo_pct=tempo_pct,
        target_tempo_bpm=tempo_bpm,
        goal_techniques=f"Play bars {bar_start}-{bar_end} cleanly with {', '.join(section.primary_techniques[:3]) if section.primary_techniques else 'proper phrasing'}",
        warmup_exercises=warmups,
        primary_concept=concept,
        primary_scale=primary_scale,
        steps=steps,
        improvisation_suggestions=improv,
        checkpoints=checkpoints,
        next_lesson=None,
    )


def _build_assembly_lesson(lesson_num, section_pair, analysis, engine, previous_lessons):
    """Build a lesson connecting two sections."""
    names = [s.name for s in section_pair]
    bar_start = section_pair[0].bar_range[0]
    bar_end = section_pair[-1].bar_range[1]
    avg_diff = sum(s.difficulty for s in section_pair) / len(section_pair)
    tempo_pct = 50 if avg_diff <= 5.0 else 40
    tempo_bpm = int(analysis.tempo * tempo_pct / 100)

    prereqs = ", ".join(f"the lesson for {s.name}" for s in section_pair)

    warmups = [WarmupExercise(
        description=f"Quick run-through of each section individually at {tempo_pct}% tempo",
    )]

    transition_bar = section_pair[0].bar_range[1]
    steps = [
        LessonStep(
            title="Review Each Section",
            body=f"Play through {names[0]} and {names[1]} separately, one time each.",
            instruction=f"One pass each at {tempo_bpm} bpm. Note how each section ends and begins.",
            listen_for="Confidence in each section individually.",
            repeat_instruction="Once through each.",
        ),
        LessonStep(
            title="The Transition",
            body=f"Focus on the join point: the last 2 bars of {names[0]} into the first 2 bars of {names[1]} (around bar {transition_bar}).",
            instruction="Loop just this 4-bar transition 10 times. Pay attention to position shifts, dynamic changes, and timing.",
            listen_for="Smooth flow through the transition. No hesitation, no gear-shifting.",
            repeat_instruction="10 loops of the transition.",
        ),
        LessonStep(
            title="Full Combined Run",
            body=f"Play from the start of {names[0]} through the end of {names[1]}.",
            instruction=f"Metronome at {tempo_bpm} bpm. Play the full combined passage.",
            listen_for="The transition should feel invisible — like one continuous phrase.",
            repeat_instruction="3 clean passes of the full combined section.",
        ),
    ]

    checkpoints = [
        f"Can you play {names[0]} into {names[1]} without stopping?",
        "Is the transition smooth with no hesitation?",
        f"Can you do 3 clean passes at {tempo_pct}% tempo?",
    ]

    ctx = LessonContext(
        lesson_number=lesson_num,
        section_name=f"Assembly — {' + '.join(names)}",
        bar_start=bar_start,
        bar_end=bar_end,
        phase="Assembly",
        prerequisites=prereqs,
        estimated_time=20,
        target_tempo_pct=tempo_pct,
        target_tempo_bpm=tempo_bpm,
        goal_techniques=f"Connect {' and '.join(names)} seamlessly",
        warmup_exercises=warmups,
        primary_concept=ConceptContext(
            name="Connecting Sections",
            teaching_note="The hardest part of playing a solo isn't any individual section — it's the transitions between them.",
        ),
        primary_scale=None,
        steps=steps,
        improvisation_suggestions=None,
        checkpoints=checkpoints,
        next_lesson=None,
    )
    ctx.sections_to_connect = names
    return ctx


def _build_performance_lesson(lesson_num, analysis, engine, previous_lessons):
    """Build the final performance lesson."""
    tempo_pct = 80
    tempo_bpm = int(analysis.tempo * tempo_pct / 100)

    warmups = [
        WarmupExercise(description="5 min technique warm-up: your weakest technique from this solo"),
        WarmupExercise(description="5 min run through the section you're least confident on"),
    ]

    section_order = [s.name for s in analysis.sections]

    steps = [
        LessonStep(
            title="Section Review",
            body="Quick pass through each section.",
            instruction=f"Play each section once at {tempo_pct}% tempo as a refresher.",
            listen_for="Overall confidence level in each section.",
            repeat_instruction="Once through each section.",
        ),
        LessonStep(
            title="Full Run-Through #1",
            body=f"Set metronome to {tempo_bpm} bpm. Play the entire solo. No stops.",
            instruction="Start the metronome, take a breath, and play. If you stumble, keep the beat and jump back in.",
            listen_for="Overall musical arc. Does the solo build energy naturally?",
            repeat_instruction="Once. Take a 2-minute break after.",
        ),
        LessonStep(
            title="Spot-Fix",
            body="Identify the weakest moment from your first run.",
            instruction="Isolate that passage (2-4 bars) and loop it 10 times. Then play the 4 bars before and after.",
            listen_for="Clean, confident execution of the weak spot.",
            repeat_instruction="Until it feels solid.",
        ),
        LessonStep(
            title="Full Run-Through #2",
            body="Another complete performance. Record this one.",
            instruction="Full solo, no stops, metronome on.",
            listen_for="Improvement from run #1. Musical expression.",
            repeat_instruction="Once. Listen back to the recording.",
        ),
        LessonStep(
            title="Full Run-Through #3 — Performance Standard",
            body="Final run. Full commitment, full expression.",
            instruction="Play as if performing for an audience.",
            listen_for="A complete, musical performance. Not perfect — musical.",
            repeat_instruction="Once. Record and compare to the original.",
        ),
    ]

    checkpoints = [
        "Can you play the complete solo without stopping?",
        f"Are you at {tempo_pct}% tempo or higher?",
        "Does the recording sound musical (not just correct)?",
        "Are the transitions between sections smooth?",
    ]

    ctx = LessonContext(
        lesson_number=lesson_num,
        section_name=f"Full Performance — {analysis.title}",
        bar_start=analysis.sections[0].bar_range[0] if analysis.sections else 1,
        bar_end=analysis.sections[-1].bar_range[1] if analysis.sections else 1,
        phase="Performance",
        prerequisites="All previous lessons",
        estimated_time=40,
        target_tempo_pct=tempo_pct,
        target_tempo_bpm=tempo_bpm,
        goal_techniques=f"Play the complete {analysis.title} solo with musical expression",
        warmup_exercises=warmups,
        primary_concept=ConceptContext(
            name="Performance",
            teaching_note="This is not a practice session — it's a performance. No stopping, full commitment.",
        ),
        primary_scale=None,
        steps=steps,
        improvisation_suggestions=None,
        checkpoints=checkpoints,
        next_lesson=None,
    )
    ctx.section_order = section_order
    return ctx


def _generate_lessons_readme(lessons_dir, lesson_plan):
    """Generate README.md with links to all lessons."""
    lines = ["# Lesson Index\n"]
    for ctx in lesson_plan:
        slug = _slugify(ctx.section_name)
        filename = f"{ctx.lesson_number:02d}-{slug}.md"
        lines.append(f"- [{ctx.lesson_number:02d}. {ctx.section_name}]({filename})")
    lines.append("")
    with open(os.path.join(lessons_dir, "README.md"), "w") as f:
        f.write("\n".join(lines))


def _generate_theory(analysis, engine, output_dir):
    """Generate theory.md."""
    # Build scale_info for the template
    scale_info = {}
    for scale_name in analysis.scale_summary:
        parts = scale_name.split(" ", 1)
        if len(parts) == 2:
            result = engine.get_scale(parts[0], parts[1].lower().replace(" ", "_"))
            if result:
                scale_info[scale_name] = {
                    "notes": result.notes,
                    "character": result.scale.character,
                    "improvisation_tip": result.scale.improvisation_tip,
                }

    content = render_template("theory_overview.md.j2", {
        "analysis": analysis,
        "scale_info": scale_info,
    })
    with open(os.path.join(output_dir, "theory.md"), "w") as f:
        f.write(content)


def _generate_breakdown(analysis, engine, output_dir):
    """Generate breakdown.md."""
    # Sort techniques by frequency
    technique_ranking = sorted(
        analysis.technique_summary.items(),
        key=lambda x: len(x[1]),
        reverse=True,
    )

    technique_info = {}
    for tech_key, _ in technique_ranking:
        if tech_key in engine.techniques:
            t = engine.techniques[tech_key]
            technique_info[tech_key] = {
                "difficulty": t.difficulty,
                "description": t.description,
            }

    content = render_template("breakdown.md.j2", {
        "analysis": analysis,
        "technique_ranking": technique_ranking,
        "technique_info": technique_info,
    })
    with open(os.path.join(output_dir, "breakdown.md"), "w") as f:
        f.write(content)


def _generate_practice_plan(analysis, output_dir):
    """Generate practice.md."""
    sections = analysis.sections
    if not sections:
        return

    # Split sections by difficulty into phases
    sorted_sections = sorted(sections, key=lambda s: s.difficulty)
    n = len(sorted_sections)
    foundation = sorted_sections[:max(1, n // 3)]
    building = sorted_sections[max(1, n // 3):max(2, 2 * n // 3)]
    peak = sorted_sections[max(2, 2 * n // 3):]

    daily_time = 30
    foundation_sessions = max(2, len(foundation) * 2)
    building_end = foundation_sessions + max(2, len(building) * 2)
    peak_end = building_end + max(2, len(peak) * 3)
    assembly_end = peak_end + max(2, len(sections) // 2)

    content = render_template("practice_plan.md.j2", {
        "analysis": analysis,
        "daily_time": daily_time,
        "foundation_sessions": foundation_sessions,
        "foundation_sections": [s.name for s in foundation],
        "foundation_routine": [
            "5 min: Technique warm-up",
            f"10 min: {foundation[0].name} at 50% tempo" if foundation else "10 min: Easiest section at 50% tempo",
            f"10 min: {foundation[-1].name if len(foundation) > 1 else foundation[0].name} at 50% tempo" if foundation else "10 min: Next section",
            "5 min: Review previous material",
        ],
        "foundation_tempo": 50,
        "building_end": building_end,
        "building_sections": [s.name for s in building],
        "building_routine": [
            "5 min: Technique warm-up",
            f"10 min: New section at 40% tempo" if building else "10 min: Continue building",
            "10 min: Review foundation sections at increasing tempo",
            "5 min: Transitions between learned sections",
        ],
        "building_tempo": 60,
        "peak_end": peak_end,
        "peak_sections": [s.name for s in peak],
        "peak_routine": [
            "5 min: Technique warm-up focusing on speed",
            "15 min: Hardest section, slow and methodical",
            "10 min: All sections individually at current max tempo",
        ],
        "peak_tempo": 70,
        "assembly_end": assembly_end,
        "assembly_routine": [
            "5 min: Technique warm-up",
            "10 min: Weakest transitions",
            "15 min: Full solo run-throughs",
        ],
        "assembly_tempo": 80,
    })
    with open(os.path.join(output_dir, "practice.md"), "w") as f:
        f.write(content)


def _generate_context(analysis, lesson_plan, output_dir):
    """Generate .context.md."""
    lines = [
        f"# {analysis.title} — Progress\n",
        f"**Artist:** {analysis.artist}",
        f"**Key:** {analysis.key}",
        f"**Tempo:** {analysis.tempo} bpm\n",
        "## Current Status",
        f"current_lesson: 01",
        f"- **Total lessons:** {len(lesson_plan)}",
        "- **Max clean tempo:** —",
        "- **Stuck points:** None yet\n",
        "## Completed Lessons",
        "(none yet)\n",
        "## Lesson Plan",
    ]
    for ctx in lesson_plan:
        lines.append(f"- [ ] Lesson {ctx.lesson_number:02d}: {ctx.section_name}")
    lines.append("")
    with open(os.path.join(output_dir, ".context.md"), "w") as f:
        f.write("\n".join(lines))


def _generate_practice_log(output_dir):
    """Generate practice-log.md."""
    content = """# Practice Log

| Date | Lesson | Duration | Tempo | What Worked | What's Stuck |
|------|--------|----------|-------|-------------|-------------|

"""
    with open(os.path.join(output_dir, "practice-log.md"), "w") as f:
        f.write(content)


# === Helpers ===

def _get_top_techniques(analysis, engine, count=3):
    """Get the most common techniques by bar count."""
    ranked = sorted(
        analysis.technique_summary.items(),
        key=lambda x: len(x[1]),
        reverse=True,
    )
    return [t[0] for t in ranked[:count] if t[0] in engine.techniques]


def _find_section(analysis, name):
    """Find a section by name."""
    for s in analysis.sections:
        if s.name == name:
            return s
    return None


def _get_assembly_pairs(analysis):
    """Get pairs of adjacent sections for assembly lessons."""
    sections = analysis.sections
    if len(sections) < 2:
        return []
    pairs = []
    for i in range(0, len(sections) - 1, 2):
        pair = [sections[i], sections[i + 1]]
        pairs.append(pair)
    return pairs


def _slugify(name):
    """Convert a name to a filename-safe slug."""
    import re
    slug = name.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    return slug.strip('-')[:50]


def _get_template_for_phase(phase):
    """Map lesson phase to template name."""
    mapping = {
        "Foundation": "section_lesson.md.j2",
        "Building": "section_lesson.md.j2",
        "Peak": "section_lesson.md.j2",
        "Assembly": "assembly_lesson.md.j2",
        "Performance": "performance_lesson.md.j2",
    }
    return mapping.get(phase, "section_lesson.md.j2")
