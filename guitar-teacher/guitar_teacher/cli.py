"""Guitar Teacher CLI."""
import re
import click
from guitar_teacher.config import get_theory_dir, load_config
from guitar_teacher.core.theory import TheoryEngine
from guitar_teacher.core.fretboard import render_fretboard


def _get_engine():
    return TheoryEngine(get_theory_dir())


@click.group()
def cli():
    """Guitar Teacher - music theory reference and lesson generator."""
    pass


@cli.command()
@click.argument("root")
@click.argument("scale_type")
def scale(root, scale_type):
    """Look up a scale. Example: guitar-teacher scale D dorian"""
    engine = _get_engine()
    result = engine.get_scale(root, scale_type)
    if result is None:
        click.echo(f"Scale not found: {root} {scale_type}")
        raise SystemExit(1)
    click.echo(f"\n{result.root} {result.scale.name}")
    click.echo(f"Category: {result.scale.category}")
    click.echo(f"Notes: {' '.join(result.notes)}")
    click.echo(f"Character: {result.scale.character}")
    if result.scale.common_in:
        click.echo(f"Common in: {', '.join(result.scale.common_in)}")
    if result.scale.chord_fit:
        click.echo(f"Chord fit: {', '.join(result.scale.chord_fit)}")
    click.echo(f"\nTeaching note: {result.scale.teaching_note}")
    if result.scale.improvisation_tip:
        click.echo(f"Improvisation tip: {result.scale.improvisation_tip}")
    click.echo()
    fb = render_fretboard(
        result.notes, ["E", "A", "D", "G", "B", "E"],
        root=result.root, title=f"{result.root} {result.scale.name}",
    )
    click.echo(fb)


@cli.command()
@click.argument("chord_name")
def chord(chord_name):
    """Look up a chord. Example: guitar-teacher chord Am7"""
    engine = _get_engine()
    m = re.match(r'^([A-G][#b]?)(.*)$', chord_name)
    if not m:
        click.echo(f"Cannot parse chord name: {chord_name}")
        raise SystemExit(1)
    root, chord_type = m.group(1), m.group(2)
    if not chord_type:
        chord_type = "major"
    result = engine.get_chord(root, chord_type)
    if result is None:
        click.echo(f"Chord not found: {chord_name}")
        raise SystemExit(1)
    click.echo(f"\n{result.root}{result.chord.symbol} — {result.chord.name}")
    click.echo(f"Notes: {' '.join(result.notes)}")
    click.echo(f"Intervals: {result.chord.intervals}")
    click.echo(f"Character: {result.chord.character}")


@cli.command()
@click.argument("root")
@click.argument("scale_type")
def key(root, scale_type):
    """Show diatonic chords in a key. Example: guitar-teacher key C major"""
    engine = _get_engine()
    chords = engine.chords_in_key(root, scale_type)
    if not chords:
        click.echo(f"Key not found: {root} {scale_type}")
        raise SystemExit(1)
    roman = ["I", "ii", "iii", "IV", "V", "vi", "vii"]
    click.echo(f"\nDiatonic chords in {root} {scale_type}:\n")
    for i, c in enumerate(chords):
        numeral = roman[i] if i < len(roman) else str(i + 1)
        click.echo(f"  {numeral:>5}  {c.root}{c.symbol:.<8} {' '.join(c.notes)}")


@cli.command("identify-key")
@click.argument("notes", nargs=-1, required=True)
def identify_key(notes):
    """Identify likely key from notes. Example: guitar-teacher identify-key D E F G A Bb C"""
    engine = _get_engine()
    matches = engine.detect_key(list(notes))
    if not matches:
        click.echo("No key matches found.")
        raise SystemExit(1)
    click.echo(f"\nTop key matches for: {' '.join(notes)}\n")
    for i, m in enumerate(matches[:5]):
        outside = f" (outside: {', '.join(m.outside_notes)})" if m.outside_notes else ""
        click.echo(
            f"  {i+1}. {m.root} {m.scale.name} — score: {m.score:.2f} "
            f"({m.notes_matched}/{m.total_notes} notes){outside}"
        )


@cli.command("suggest-scales")
@click.argument("chords", nargs=-1, required=True)
def suggest_scales(chords):
    """Suggest scales for a chord progression. Example: guitar-teacher suggest-scales Dm7 G7 Cmaj7"""
    engine = _get_engine()
    suggestions = engine.suggest_scales(list(chords))
    if not suggestions:
        click.echo("No scale suggestions found.")
        raise SystemExit(1)
    click.echo(f"\nScale suggestions for: {' '.join(chords)}\n")
    for i, s in enumerate(suggestions[:5]):
        click.echo(f"  {i+1}. {s.root} {s.name} — {' '.join(s.notes)} (score: {s.score:.2f})")


@cli.command()
@click.argument("note1")
@click.argument("note2")
def interval(note1, note2):
    """Show interval between two notes. Example: guitar-teacher interval C E"""
    engine = _get_engine()
    result = engine.interval_between(note1, note2)
    click.echo(f"\n{note1} -> {note2}: {result.name} ({result.short_name})")
    click.echo(f"Semitones: {result.semitones}")


@cli.command()
@click.argument("file_path", type=click.Path(exists=True))
@click.option("--track", "-t", default=0, type=int, help="Track index for multi-track GP files")
def analyze(file_path, track):
    """Analyze a solo from a GP or JSON file. Example: guitar-teacher analyze song.gp"""
    from guitar_teacher.core.analyzer import analyze_file
    click.echo(f"Analyzing {file_path}...")
    result = analyze_file(file_path, track_index=track)
    click.echo(f"\n{'=' * 60}")
    click.echo(f"  {result.title} — {result.artist}")
    click.echo(f"{'=' * 60}")
    click.echo(f"  Key: {result.key}")
    click.echo(f"  Tempo: {result.tempo} bpm")
    click.echo(f"  Tuning: {' '.join(result.tuning)}")
    click.echo(f"  Sections: {len(result.sections)}")
    click.echo()
    click.echo(f"{'Section':<25} {'Bars':>8} {'Diff':>6} {'Techniques'}")
    click.echo(f"{'-'*25} {'-'*8} {'-'*6} {'-'*30}")
    for section in result.sections:
        bars = f"{section.bar_range[0]}-{section.bar_range[1]}"
        techs = ", ".join(section.primary_techniques[:3])
        click.echo(f"{section.name:<25} {bars:>8} {section.difficulty:>5.1f} {techs}")
    click.echo()
    click.echo("Technique inventory:")
    for tech, bars in sorted(result.technique_summary.items()):
        click.echo(f"  {tech:<20} {len(bars)} bars")
    click.echo()
    click.echo(f"Practice order: {' -> '.join(result.practice_order)}")


@cli.command()
@click.argument("file_path", type=click.Path(exists=True))
@click.option("-o", "--output", "output_dir", required=True, type=click.Path(), help="Output directory")
@click.option("--track", "-t", default=0, type=int, help="Track index for multi-track GP files")
@click.option("--order", default="difficulty", type=click.Choice(["difficulty", "bars"], case_sensitive=False),
              help="Section ordering: 'difficulty' (easiest first) or 'bars' (chronological). Default: difficulty")
@click.option("--enhance", is_flag=True, help="Enhance lessons with LLM")
@click.option("--provider", default=None, help="LLM provider (claude, openai, ollama)")
@click.option("--model", "model_name", default=None, help="LLM model name")
def lessons(file_path, output_dir, track, order, enhance, provider, model_name):
    """Generate lesson plans from a GP or JSON file. Example: guitar-teacher lessons song.gp -o ./lessons"""
    from guitar_teacher.core.analyzer import analyze_file
    from guitar_teacher.lessons.generator import generate_lessons

    click.echo(f"Analyzing {file_path}...")
    analysis = analyze_file(file_path, track_index=track)
    click.echo(f"Detected key: {analysis.key}, {len(analysis.sections)} sections")
    click.echo(f"Section order: {order}")

    click.echo(f"Generating lessons to {output_dir}...")
    generate_lessons(analysis, output_dir, section_order=order)
    click.echo("Lesson files generated.")

    if enhance:
        import os
        from guitar_teacher.llm.providers import get_llm_config
        from guitar_teacher.llm.enhancer import enhance_lessons as do_enhance
        config = load_config()
        llm_config = get_llm_config(config, provider_override=provider, model_override=model_name)
        lessons_dir = os.path.join(output_dir, "lessons")
        click.echo(f"Enhancing lessons with {llm_config.provider}/{llm_config.model}...")
        count = do_enhance(lessons_dir, llm_config)
        click.echo(f"Enhanced {count} lesson files.")

    click.echo("Done!")


def main():
    cli()
