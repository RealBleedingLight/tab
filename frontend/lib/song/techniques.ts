import type { TechniqueId } from "./types";

export interface TechniqueGuide {
  id: TechniqueId;
  name: string;
  /** Relative difficulty weight, 0 (trivial) – 3 (advanced). */
  weight: number;
  /** Whether it deserves its own warm-up lesson before the sections. */
  warmup: boolean;
  summary: string;
  howTo: string[];
  mistakes: string[];
  drill: string;
}

export const TECHNIQUES: Record<TechniqueId, TechniqueGuide> = {
  bend: {
    id: "bend", name: "String bends", weight: 1.5, warmup: true,
    summary: "Push or pull the string to raise the pitch to a target note.",
    howTo: [
      "Fret the target note first (usually 2 frets higher for a full bend) and memorise its pitch.",
      "Bend with 2–3 fingers stacked behind the bending finger — ring supports middle supports index.",
      "Rotate from the wrist like turning a doorknob; don't push with the finger alone.",
      "Mute the other strings with your picking-hand palm and the underside of your fretting fingers.",
    ],
    mistakes: ["Bending flat (under the target pitch)", "Letting unused strings ring", "Using only one finger"],
    drill: "Alternate: fretted target note → bend up to it → compare. 10 reps, then do it without the reference.",
  },
  prebend: {
    id: "prebend", name: "Pre-bends", weight: 1.5, warmup: true,
    summary: "Bend the string silently *before* picking, then release to the lower note.",
    howTo: [
      "Bend to the target pitch without picking — use your ear from regular bends.",
      "Pick, then release smoothly back to the fretted pitch.",
      "Check the pre-bend pitch against the fretted target occasionally.",
    ],
    mistakes: ["Pre-bending out of tune", "Releasing too early / too fast"],
    drill: "Bend → pick → release, slowly, matching the timing of the recording at 50%.",
  },
  release: {
    id: "release", name: "Bend releases", weight: 1, warmup: false,
    summary: "Return a bent string to its resting pitch in time with the music.",
    howTo: ["Keep finger pressure on the string while releasing so the note keeps sounding.", "Time the release to the rhythm shown in the tab."],
    mistakes: ["Losing pressure so the note dies", "Releasing with an audible 'clunk'"],
    drill: "Bend, hold for 1 beat, release over 1 beat, with a metronome at 60 BPM.",
  },
  vibrato: {
    id: "vibrato", name: "Vibrato", weight: 1, warmup: true,
    summary: "A controlled, rhythmic wobble in pitch that makes held notes sing.",
    howTo: [
      "Anchor the thumb or the side of the index on the neck and pivot from the wrist.",
      "Keep it even: pick a speed (e.g. 8th-note triplets) and stay consistent.",
      "Wide vibrato = small repeated bends; narrow vibrato = gentle motion.",
    ],
    mistakes: ["Nervous, uneven vibrato", "Vibrato that goes below the note's pitch", "Stopping the note too early"],
    drill: "Hold a note on the G string for 4 beats with vibrato in time with a slow metronome.",
  },
  hammerOn: {
    id: "hammerOn", name: "Hammer-ons", weight: 0.75, warmup: true,
    summary: "Sound a higher note by 'hammering' a finger onto the string without picking.",
    howTo: [
      "Come down on the fingertip, right behind the fret, with a quick decisive motion.",
      "Volume should match the picked note — practice unplugged to hear it.",
    ],
    mistakes: ["Weak, quiet hammer-ons", "Landing in the middle of the fret"],
    drill: "Pick one note, hammer the next, 4 × per string across all strings, 60–80 BPM.",
  },
  pullOff: {
    id: "pullOff", name: "Pull-offs", weight: 0.75, warmup: true,
    summary: "Sound a lower note by flicking the finger off the string downward.",
    howTo: [
      "Fret both notes before pulling off — the lower finger must already be in place.",
      "Pull slightly down toward the floor (a mini pluck), not straight up.",
    ],
    mistakes: ["Lifting straight off so the lower note is inaudible", "Accidentally sounding the next string"],
    drill: "Pull-off pairs on each string, then chain hammer-on + pull-off trills for 30 s.",
  },
  slide: {
    id: "slide", name: "Slides", weight: 0.75, warmup: false,
    summary: "Glide between notes along the string while keeping pressure on it.",
    howTo: ["Keep enough pressure to sustain the note, but not so much it drags.", "Look at the destination fret, not the start fret.", "Land exactly in time — slides tend to rush."],
    mistakes: ["Overshooting the target fret", "Losing volume mid-slide"],
    drill: "Slide between two notes 5 frets apart, eyes on the destination, 10 reps each direction.",
  },
  tapping: {
    id: "tapping", name: "Tapping", weight: 2.5, warmup: true,
    summary: "Use a picking-hand finger to fret notes on the neck (hammer + pull-off).",
    howTo: [
      "Tap with the middle finger so you can still hold the pick.",
      "Pull the tapping finger slightly off to the side to sound the next note.",
      "Mute unused strings with the fretting hand — tapping is noisy.",
    ],
    mistakes: ["Unmuted string noise", "Uneven volume between tapped and fretted notes"],
    drill: "Tap-pull-hammer triplet on one string (e.g. 12-5-8) at 60 BPM, rhythm first, speed later.",
  },
  naturalHarmonic: {
    id: "naturalHarmonic", name: "Natural harmonics", weight: 0.5, warmup: false,
    summary: "Lightly touch the string directly above the fret wire (5, 7, 12) and pick.",
    howTo: ["Touch — don't press — right over the fret wire.", "Pick near the bridge for a brighter harmonic.", "Release the touch right after picking."],
    mistakes: ["Touching between frets instead of over the wire", "Pressing down too hard"],
    drill: "Play harmonics at frets 12, 7, 5 across all strings slowly.",
  },
  artificialHarmonic: {
    id: "artificialHarmonic", name: "Pinch / artificial harmonics", weight: 2, warmup: true,
    summary: "Squealing harmonics made by catching the string with the thumb edge right after the pick.",
    howTo: [
      "Hold the pick with very little tip showing so your thumb brushes the string.",
      "Experiment with picking position — the sweet spots move around the pickups.",
      "Add gain and vibrato; they sound much bigger with both.",
    ],
    mistakes: ["Too much pick showing", "Staying in one spot where no harmonic exists"],
    drill: "On the G string at fret 5, move the pick in 1 cm steps toward the neck until it squeals.",
  },
  palmMute: {
    id: "palmMute", name: "Palm muting", weight: 0.5, warmup: false,
    summary: "Rest the edge of the picking hand on the strings near the bridge for a chunky sound.",
    howTo: ["Lightly rest the palm edge right where strings leave the bridge saddles.", "Too far forward = dead thud; too far back = no mute."],
    mistakes: ["Muting too hard so notes lose pitch", "Lifting the hand between notes"],
    drill: "8th notes on the low E: 4 muted, 4 open, repeat, keeping a steady tone.",
  },
  deadNote: {
    id: "deadNote", name: "Dead (muted) notes", weight: 0.5, warmup: false,
    summary: "Percussive 'x' notes — fretting hand touches but doesn't press the strings.",
    howTo: ["Relax the fretting fingers onto the strings to kill the pitch.", "Keep the picking hand moving in rhythm."],
    mistakes: ["Accidentally sounding a harmonic or fretted note"],
    drill: "Alternate a fretted note and a muted scratch in steady 16ths.",
  },
  ghostNote: {
    id: "ghostNote", name: "Ghost notes", weight: 0.25, warmup: false,
    summary: "Very quiet notes that add groove — play them softly.",
    howTo: ["Pick lightly or let them come from the fretting hand only."],
    mistakes: ["Playing them as loud as normal notes"],
    drill: "Play the phrase with accents on the main notes and barely-audible ghost notes.",
  },
  letRing: {
    id: "letRing", name: "Let ring", weight: 0.25, warmup: false,
    summary: "Keep notes sustaining over each other like a chord.",
    howTo: ["Use fingerings that don't lift previous fingers.", "Arch fingers so they don't touch neighbouring strings."],
    mistakes: ["Lifting fingers too early", "Accidental muting by flat fingers"],
    drill: "Play the arpeggio slowly and check each string still rings at the end.",
  },
  tremoloPicking: {
    id: "tremoloPicking", name: "Tremolo picking", weight: 1.5, warmup: true,
    summary: "Very fast, repeated alternate picking on a single note.",
    howTo: ["Pick from the wrist (or forearm) with a relaxed, small motion.", "Stay locked to a subdivision (16ths or 32nds) — don't just 'shake'."],
    mistakes: ["Tension in the forearm", "Losing the subdivision"],
    drill: "16ths at 90 BPM for 30 s, then 100, 110 … stay relaxed.",
  },
  trill: {
    id: "trill", name: "Trills", weight: 1.25, warmup: false,
    summary: "Rapidly alternate between two notes with hammer-ons and pull-offs.",
    howTo: ["Keep the lower finger planted; only the upper finger moves.", "Stay light and close to the string."],
    mistakes: ["Fingers lifting too high", "Uneven rhythm"],
    drill: "Index + middle trill for 10 s, rest, then index + ring, index + pinky.",
  },
  whammy: {
    id: "whammy", name: "Whammy bar", weight: 1, warmup: false,
    summary: "Change pitch with the tremolo arm — dives, dips and vibrato.",
    howTo: ["Hold the bar with the pinky/palm so you can keep picking.", "Aim dips/dives at the pitch or rhythm in the tab."],
    mistakes: ["Guitar going out of tune (check it often)", "Overdoing it"],
    drill: "Hold a note, dip ½ step on beat 3, return on beat 4, repeat.",
  },
  graceNote: {
    id: "graceNote", name: "Grace notes", weight: 0.75, warmup: false,
    summary: "A quick ornamental note just before the main note.",
    howTo: ["Usually played as a fast hammer-on, pull-off or slide into the main note.", "The main note lands on the beat — the grace note is squeezed in before it."],
    mistakes: ["Making the grace note too long"],
    drill: "Play the main note alone in time, then add the grace note without shifting the beat.",
  },
  doubleStop: {
    id: "doubleStop", name: "Double stops", weight: 0.75, warmup: false,
    summary: "Two notes played together — common in blues and rock leads.",
    howTo: ["Barre with one finger when both notes are on the same fret.", "Mute the strings around them."],
    mistakes: ["One of the notes not sounding", "Neighbour strings ringing"],
    drill: "Play each double stop slowly, check both notes ring, then play in rhythm.",
  },
  chord: {
    id: "chord", name: "Chords", weight: 0.75, warmup: false,
    summary: "Three or more notes together.",
    howTo: ["Learn the shape silently first, then practice changing into it in time.", "Anticipate: start moving on the last beat before the change."],
    mistakes: ["Late chord changes", "Muffled strings"],
    drill: "Switch between the shapes in this section on every beat at 60 BPM.",
  },
  sweep: {
    id: "sweep", name: "Sweep / economy picking", weight: 2.5, warmup: true,
    summary: "One note per string played with a single continuous pick stroke across strings.",
    howTo: [
      "Let the pick 'fall through' the strings in one motion — not separate strokes.",
      "Roll the fretting finger or lift each finger right after its note so notes don't ring together.",
      "Start extremely slow; clean separation matters more than speed.",
    ],
    mistakes: ["Notes blurring together like a chord", "Separate strokes instead of one sweep"],
    drill: "3-string arpeggio sweeps (e.g. minor triad on G-B-e) at 50 BPM in 8th-note triplets.",
  },
  stringSkip: {
    id: "stringSkip", name: "String skipping", weight: 1.25, warmup: true,
    summary: "Jumping over one or more strings between consecutive notes.",
    howTo: ["Move the pick in a small arc over the skipped string.", "Keep muted: the skipped string must stay silent."],
    mistakes: ["Hitting the string in between", "Big, slow picking motions"],
    drill: "Alternate notes on the D and B strings, 8th notes, until it feels even.",
  },
  wideStretch: {
    id: "wideStretch", name: "Wide stretches", weight: 1.25, warmup: true,
    summary: "Fingerings that span 5+ frets in one hand position.",
    howTo: ["Warm up first!", "Bring the thumb lower behind the neck and the elbow in.", "Stop if you feel pain — practice higher up the neck first where frets are closer."],
    mistakes: ["Forcing it cold", "Collapsing finger joints"],
    drill: "Play the stretch shape at fret 12, then move it down one fret at a time.",
  },
  positionShift: {
    id: "positionShift", name: "Position shifts", weight: 1, warmup: false,
    summary: "Big jumps along the neck between notes.",
    howTo: ["Look ahead to the target position before you need to move.", "Shift during a slide, open string or rest if one exists.", "Move the whole arm, not just the fingers."],
    mistakes: ["Arriving late", "Looking at the hand instead of the target fret"],
    drill: "Practice just the last note before and the first note after each shift, back and forth.",
  },
  tuplet: {
    id: "tuplet", name: "Tuplets (triplets, quintuplets…)", weight: 1, warmup: false,
    summary: "Groups of notes that divide the beat unevenly (3, 5, 6, 7 …).",
    howTo: ["Count the grouping out loud: 'tri-po-let', 'hip-po-pot-a-mus'.", "Make sure the first note of each group lands on the beat."],
    mistakes: ["Squashing the group and landing early", "Accenting the wrong notes"],
    drill: "Metronome at 60 BPM: play the group on one open string, landing each group on the click.",
  },
};

export function techniqueName(id: TechniqueId): string {
  return TECHNIQUES[id]?.name ?? id;
}
