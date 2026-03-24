"""CLI entry point for gp2tab."""
import argparse
import os
import sys
from gp2tab.parser import parse, list_tracks
from gp2tab.formatter_tab import format_tab
from gp2tab.formatter_json import format_json
from gp2tab.formatter_llm import format_llm


def main():
    parser = argparse.ArgumentParser(description="Convert Guitar Pro files to tab formats")
    parser.add_argument("file", help="Guitar Pro file (.gp, .gp3, .gp4, .gp5, .gpx)")
    parser.add_argument("-o", "--output", help="Output directory (default: same as input file)")
    parser.add_argument("--width", type=int, default=120, help="ASCII tab line width (default: 120)")
    parser.add_argument("--track", type=int, default=1, help="Track number (default: 1)")
    parser.add_argument("--format", default="tab,json,llm",
                        help="Output formats, comma-separated (default: tab,json,llm)")
    parser.add_argument("--dry-run", action="store_true", help="Parse only, don't write files")
    args = parser.parse_args()

    if not os.path.exists(args.file):
        print(f"Error: File not found: {args.file}", file=sys.stderr)
        sys.exit(1)

    tracks = list_tracks(args.file)
    if len(tracks) > 1:
        print(f"Found {len(tracks)} tracks:")
        for i, name in tracks:
            marker = " <--" if i == args.track - 1 else ""
            print(f"  {i+1}. {name}{marker}")
        print(f"Using track {args.track}. Use --track N to select a different track.")
        print()

    track_index = args.track - 1
    song = parse(args.file, track_index)

    total_notes = sum(len(b.notes) for b in song.bars)
    total_warnings = sum(len(b.warnings) for b in song.bars)
    tuning_label = " ".join(song.tuning)

    print(f"Parsed: {song.title} -- {song.artist}")
    print(f"Track:  {tracks[track_index][1] if track_index < len(tracks) else 'Unknown'} (Track {args.track})")
    print(f"Bars:   {len(song.bars)}  |  Tempo: {song.tempo} BPM  |  Tuning: {tuning_label}")
    print(f"Notes:  ~{total_notes}  |  Warnings: {total_warnings}")
    print()

    if args.dry_run:
        print("Dry run -- no files written.")
        return

    if args.output:
        out_dir = args.output
    else:
        file_abs = os.path.abspath(args.file)
        base_name = os.path.splitext(os.path.basename(file_abs))[0]
        folder_name = f"{base_name} gp2tab"
        out_dir = os.path.join(os.path.dirname(file_abs), folder_name)
    os.makedirs(out_dir, exist_ok=True)

    formats = [f.strip() for f in args.format.split(",")]
    print("Written:")

    if "tab" in formats:
        tab_text = format_tab(song, width=args.width)
        path = os.path.join(out_dir, "tab.txt")
        with open(path, "w") as f:
            f.write(tab_text)
        print(f"  -> tab.txt      (ASCII tab, {args.width} char width)")

    if "json" in formats:
        json_text = format_json(song)
        path = os.path.join(out_dir, "tab.json")
        with open(path, "w") as f:
            f.write(json_text)
        print(f"  -> tab.json     (structured data, {len(song.bars)} bars)")

    if "llm" in formats:
        llm_text = format_llm(song)
        path = os.path.join(out_dir, "tab.llm.txt")
        with open(path, "w") as f:
            f.write(llm_text)
        llm_lines = llm_text.count("\n")
        print(f"  -> tab.llm.txt  (LLM-optimized, {llm_lines} lines)")


if __name__ == "__main__":
    main()
