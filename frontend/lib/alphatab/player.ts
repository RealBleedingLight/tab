import { useSyncExternalStore } from "react";
import type * as AT from "@coderline/alphatab";
import {
  ALPHATAB_FONT_DIR, ALPHATAB_SCRIPT, ALPHATAB_SOUNDFONT, loadAlphaTab, type AlphaTabModule,
} from "./loader";
import type { ActiveFret } from "@/components/Fretboard";

export interface TrainerConfig {
  targetSpeed: number;
  step: number;
  loopsPerStep: number;
}

export interface PlayerSnapshot {
  status: "idle" | "loading" | "rendering" | "ready" | "error";
  error: string | null;
  soundReady: boolean;
  playing: boolean;
  currentTime: number;
  endTime: number;
  /** Percent, 100 = original tempo. */
  speed: number;
  looping: boolean;
  metronome: boolean;
  countIn: boolean;
  /** Inclusive, 0-based bar range currently selected for playback. */
  range: [number, number] | null;
  /** Loops completed since the range was set. */
  loops: number;
  trainer: TrainerConfig | null;
  activeNotes: ActiveFret[];
  currentBar: number;
  guitarMuted: boolean;
  guitarSolo: boolean;
  notation: boolean;
}

const INITIAL: PlayerSnapshot = {
  status: "idle", error: null, soundReady: false, playing: false,
  currentTime: 0, endTime: 0, speed: 100, looping: false, metronome: false, countIn: false,
  range: null, loops: 0, trainer: null, activeNotes: [], currentBar: 0,
  guitarMuted: false, guitarSolo: false, notation: false,
};

// Dark-theme colours for the rendered score.
const SCORE_COLORS = {
  staffLineColor: "#52525b",
  barSeparatorColor: "#71717a",
  barNumberColor: "#a1a1aa",
  mainGlyphColor: "#e4e4e7",
  secondaryGlyphColor: "rgba(228,228,231,0.55)",
  scoreInfoColor: "#e4e4e7",
};

type Listener = () => void;

/**
 * Wraps an alphaTab API instance: rendering, synth playback, looping, the
 * speed trainer and live-note tracking. UI reads state through
 * `usePlayer(selector)` so high-frequency updates (cursor time) only
 * re-render the components that actually display them.
 */
export class ScorePlayer {
  private state: PlayerSnapshot = INITIAL;
  private listeners = new Set<Listener>();
  private api: AT.AlphaTabApi | null = null;
  private at: AlphaTabModule | null = null;
  private score: AT.model.Score | null = null;
  private trackIndex = 0;
  private lastTick = 0;
  /** Tick bounds of the current selection, for loop-wrap detection. */
  private rangeTicks: [number, number] | null = null;
  private mountId = 0;
  /** Called once per completed loop with the speed it was played at. */
  onLoop: ((speed: number) => void) | null = null;

  getSnapshot = () => this.state;

  subscribe = (l: Listener) => {
    this.listeners.add(l);
    return () => { this.listeners.delete(l); };
  };

  private set(patch: Partial<PlayerSnapshot>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach(l => l());
  }

  async mount(container: HTMLElement): Promise<void> {
    const mountId = ++this.mountId;
    this.set({ status: "loading", error: null });
    let at: AlphaTabModule;
    try {
      at = await loadAlphaTab();
    } catch (e) {
      this.set({ status: "error", error: e instanceof Error ? e.message : String(e) });
      return;
    }
    // Unmounted (or re-mounted, e.g. React StrictMode) while the script loaded.
    if (mountId !== this.mountId) return;
    this.at = at;

    const settings = new at.Settings();
    settings.fillFromJson({
      core: {
        scriptFile: new URL(ALPHATAB_SCRIPT, window.location.href).href,
        fontDirectory: new URL(ALPHATAB_FONT_DIR, window.location.href).href,
        logLevel: "error",
        engine: "svg",
      },
      display: {
        staveProfile: "tab",
        layoutMode: "page",
        scale: window.innerWidth < 640 ? 0.8 : 0.95,
        resources: SCORE_COLORS,
      },
      notation: {
        elements: {
          scoreTitle: false, scoreSubTitle: false, scoreArtist: false, scoreAlbum: false,
          scoreWords: false, scoreMusic: false, scoreWordsAndMusic: false, scoreCopyright: false,
          trackNames: false,
        },
      },
      player: {
        playerMode: "enabledSynthesizer",
        soundFont: new URL(ALPHATAB_SOUNDFONT, window.location.href).href,
        enableCursor: true,
        enableAnimatedBeatCursor: true,
        enableUserInteraction: true,
        scrollOffsetY: -160,
      },
      // Plain objects are accepted for Map-typed options at runtime.
    } as unknown as AT.json.SettingsJson);

    const api = new at.AlphaTabApi(container, settings);
    this.api = api;
    this.set({ status: "rendering" });

    api.renderStarted.on(() => this.set({ status: "rendering" }));
    api.renderFinished.on(() => this.set({ status: "ready" }));
    api.error.on(err => this.set({ status: "error", error: err?.message ?? "Rendering failed" }));
    api.playerReady.on(() => this.set({ soundReady: true }));
    api.playerStateChanged.on(e => this.set({ playing: e.state === at.synth.PlayerState.Playing }));
    api.playerPositionChanged.on(e => this.onPosition(e));
    api.playedBeatChanged.on(beat => this.onBeat(beat));
    api.playbackRangeChanged.on(e => {
      // User drag-selected on the score.
      if (!e.playbackRange) {
        this.rangeTicks = null;
        if (this.state.range) this.set({ range: null, loops: 0 });
        return;
      }
      this.rangeTicks = [e.playbackRange.startTick, e.playbackRange.endTick];
      const range = this.ticksToBars(e.playbackRange.startTick, e.playbackRange.endTick);
      if (range && (!this.state.range || range[0] !== this.state.range[0] || range[1] !== this.state.range[1])) {
        this.set({ range, loops: 0, trainer: null });
      }
    });

    // A score may have been handed to us while the engine was still loading.
    if (this.score) api.renderScore(this.score, [this.trackIndex]);
  }

  destroy() {
    this.mountId++;
    this.api?.destroy();
    this.api = null;
    this.set({ status: "idle", soundReady: false, playing: false, activeNotes: [] });
  }

  render(score: AT.model.Score, trackIndex: number) {
    this.score = score;
    this.trackIndex = trackIndex;
    this.rangeTicks = null;
    this.set({ range: null, loops: 0, trainer: null, activeNotes: [], guitarMuted: false, guitarSolo: false });
    this.api?.renderScore(score, [trackIndex]);
  }

  private onPosition(e: AT.synth.PositionChangedEventArgs) {
    const s = this.state;
    // alphaTab reports the jump back to the range start as a seek, so detect
    // the wrap geometrically: we were near the end and are now near the start.
    const r = this.rangeTicks;
    const wrapped = !!(s.playing && s.looping && s.range && r
      && this.lastTick >= r[1] - 1920 && e.currentTick <= r[0] + 960 && e.currentTick < this.lastTick);
    this.lastTick = e.currentTick;
    const patch: Partial<PlayerSnapshot> = { currentTime: e.currentTime, endTime: e.endTime };
    if (wrapped) {
      const loops = s.loops + 1;
      patch.loops = loops;
      this.onLoop?.(s.speed);
      if (s.trainer && loops % s.trainer.loopsPerStep === 0 && s.speed < s.trainer.targetSpeed) {
        const speed = Math.min(s.trainer.targetSpeed, s.speed + s.trainer.step);
        patch.speed = speed;
        if (this.api) this.api.playbackSpeed = speed / 100;
      }
    }
    // Only notify when something visible changed (time moves in ~50ms steps).
    if (wrapped || Math.abs(e.currentTime - s.currentTime) >= 200 || e.endTime !== s.endTime) this.set(patch);
  }

  private onBeat(beat: AT.model.Beat) {
    if (!beat || beat.voice.bar.staff.track.index !== this.trackIndex) return;
    const activeNotes = beat.notes
      .filter(n => n.fret >= 0 && !n.isTieDestination)
      .map(n => ({ string: n.string - 1, fret: n.fret }));
    this.set({ activeNotes, currentBar: beat.voice.bar.index });
  }

  private ticksToBars(startTick: number, endTick: number): [number, number] | null {
    const cache = this.api?.tickCache;
    if (!cache || !this.score) return null;
    let s = 0;
    let e = 0;
    for (const mb of this.score.masterBars) {
      const start = cache.getMasterBarStart(mb);
      if (start <= startTick) s = mb.index;
      if (start < endTick) e = mb.index;
    }
    return [s, Math.max(s, e)];
  }

  // ---- controls -------------------------------------------------------

  playPause() {
    if (!this.api || !this.state.soundReady) return;
    this.api.playPause();
  }

  play() {
    if (this.api && this.state.soundReady) this.api.play();
  }

  stop() {
    this.api?.stop();
    this.set({ activeNotes: [] });
  }

  setSpeed(speed: number) {
    const v = Math.max(25, Math.min(150, Math.round(speed)));
    if (this.api) this.api.playbackSpeed = v / 100;
    this.set({ speed: v });
  }

  setLooping(looping: boolean) {
    if (this.api) this.api.isLooping = looping;
    this.set({ looping });
  }

  setMetronome(on: boolean) {
    if (this.api) this.api.metronomeVolume = on ? 1 : 0;
    this.set({ metronome: on });
  }

  setCountIn(on: boolean) {
    if (this.api) this.api.countInVolume = on ? 1 : 0;
    this.set({ countIn: on });
  }

  setTrainer(trainer: TrainerConfig | null) {
    this.set({ trainer, loops: 0 });
  }

  /** Mute the learner's own part to play along with the backing tracks. */
  setGuitarMuted(muted: boolean) {
    const track = this.score?.tracks[this.trackIndex];
    if (this.api && track) this.api.changeTrackMute([track], muted);
    this.set({ guitarMuted: muted });
  }

  /** Hear only the learner's part. */
  setGuitarSolo(solo: boolean) {
    const track = this.score?.tracks[this.trackIndex];
    if (this.api && track) this.api.changeTrackSolo([track], solo);
    this.set({ guitarSolo: solo });
  }

  setNotation(on: boolean) {
    if (!this.api || !this.at) return;
    this.api.settings.display.staveProfile = on ? this.at.StaveProfile.ScoreTab : this.at.StaveProfile.Tab;
    this.api.updateSettings();
    this.api.render();
    this.set({ notation: on });
  }

  /** Select bars [start, end] (inclusive) for playback and move the cursor there. */
  selectBars(start: number, end: number) {
    const api = this.api;
    const score = this.score;
    if (!api || !score || !this.at) return;
    const staff = score.tracks[this.trackIndex]?.staves[0];
    const cache = api.tickCache;
    const last = score.masterBars.length - 1;
    const s = Math.max(0, Math.min(start, last));
    const e = Math.max(s, Math.min(end, last));
    this.set({ range: [s, e], loops: 0 });
    if (!staff || !cache) return;

    // Highlight partial selections only — tinting the whole song is just noise.
    const startBeat = staff.bars[s]?.voices[0]?.beats[0];
    const endVoice = staff.bars[e]?.voices[0];
    const endBeat = endVoice?.beats[endVoice.beats.length - 1];
    const wholeSong = e - s + 1 >= 0.8 * (last + 1);
    if (startBeat && endBeat && !wholeSong) api.highlightPlaybackRange(startBeat, endBeat);
    else api.clearPlaybackRangeHighlight();

    const range = new this.at.synth.PlaybackRange();
    range.startTick = cache.getMasterBarStart(score.masterBars[s]);
    range.endTick = cache.getMasterBarStart(score.masterBars[e]) + score.masterBars[e].calculateDuration();
    api.playbackRange = range;
    api.tickPosition = range.startTick;
    this.lastTick = range.startTick;
    this.rangeTicks = [range.startTick, range.endTick];
  }

  clearRange() {
    if (!this.api) return;
    this.api.clearPlaybackRangeHighlight();
    this.api.playbackRange = null;
    this.rangeTicks = null;
    this.set({ range: null, loops: 0, trainer: null });
  }

  /** Apply a lesson step's practice action in one go. */
  practice(bars: [number, number], speed: number, loop: boolean, trainer?: TrainerConfig | null, autoplay = true) {
    const wasPlaying = this.state.playing;
    if (wasPlaying) this.api?.pause();
    this.selectBars(bars[0], bars[1]);
    this.setSpeed(speed);
    this.setLooping(loop);
    this.setTrainer(trainer ?? null);
    if (autoplay) setTimeout(() => this.play(), wasPlaying ? 120 : 0);
  }
}

export function usePlayer<T>(player: ScorePlayer, selector: (s: PlayerSnapshot) => T): T {
  return useSyncExternalStore(
    player.subscribe,
    () => selector(player.getSnapshot()),
    () => selector(INITIAL),
  );
}
