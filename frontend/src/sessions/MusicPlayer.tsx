import { useEffect, useMemo, useRef, useState } from "react";
import type { CurrentScene, Npc } from "../lib/types";
import {
  MOOD_LABEL,
  MUSIC_ATTRIBUTION,
  pickMoodForContext,
  tracksByMood,
  type MusicMood,
  type MusicTrack,
} from "../lib/musicTracks";
import { unlockAudio } from "../lib/audio";

interface Props {
  scene?: CurrentScene;
  npcs?: Record<string, Npc>;
}

const STORAGE_KEY = "mythoria_music_v1";
type Stored = { volume: number; enabled: boolean; manualMood: MusicMood | null };

function loadStored(): Stored {
  if (typeof window === "undefined") return { volume: 0.4, enabled: false, manualMood: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { volume: 0.4, enabled: false, manualMood: null };
    const parsed = JSON.parse(raw);
    return {
      volume: typeof parsed.volume === "number" ? parsed.volume : 0.4,
      enabled: parsed.enabled === true,
      manualMood: typeof parsed.manualMood === "string" ? parsed.manualMood : null,
    };
  } catch {
    return { volume: 0.4, enabled: false, manualMood: null };
  }
}

function saveStored(s: Stored): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* localStorage might be disabled */
  }
}

export default function MusicPlayer({ scene, npcs }: Props) {
  const initial = useMemo(loadStored, []);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [volume, setVolume] = useState(initial.volume);
  const [manualMood, setManualMood] = useState<MusicMood | null>(initial.manualMood);
  const [expanded, setExpanded] = useState(false);
  const [trackIdx, setTrackIdx] = useState(0);

  const autoMood = pickMoodForContext(scene, npcs);
  const mood: MusicMood = manualMood ?? autoMood;
  const pool = useMemo(() => tracksByMood(mood), [mood]);
  const current: MusicTrack | undefined = pool[trackIdx % Math.max(pool.length, 1)];

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevMoodRef = useRef<MusicMood>(mood);

  // Persist preferences across reloads.
  useEffect(() => {
    saveStored({ enabled, volume, manualMood });
  }, [enabled, volume, manualMood]);

  // Reset to a fresh track in the pool whenever the mood changes (auto or manual).
  useEffect(() => {
    if (prevMoodRef.current !== mood) {
      prevMoodRef.current = mood;
      const next = tracksByMood(mood);
      if (next.length > 0) setTrackIdx(Math.floor(Math.random() * next.length));
    }
  }, [mood]);

  // Drive the actual <audio> element.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = volume;
  }, [volume]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !current) return;
    if (!enabled) {
      el.pause();
      return;
    }
    if (el.src !== current.url) {
      el.src = current.url;
    }
    el.play().catch(() => {
      // Autoplay blocked or net error — fall through silently; the next user
      // click on the play button will succeed because the gesture unlocks audio.
    });
  }, [enabled, current]);

  function toggle() {
    unlockAudio();
    setEnabled((v) => !v);
  }

  function skip() {
    if (pool.length === 0) return;
    setTrackIdx((i) => (i + 1) % pool.length);
  }

  function pickMood(m: MusicMood | null) {
    setManualMood(m);
    setExpanded(false);
  }

  return (
    <div className="fixed bottom-4 right-4 z-30 select-none">
      {/* No crossOrigin attribute on purpose — Incompetech (and most static
          MP3 hosts) don't return CORS headers, and setting crossOrigin would
          force a preflight that fails the load. <audio> can play cross-origin
          URLs without it for plain playback. */}
      <audio
        ref={audioRef}
        loop
        preload="none"
        onEnded={skip}
      />
      <div className="bg-ink-900/90 border border-parchment-2/15 rounded-lg shadow-2xl backdrop-blur-md text-parchment-1">
        <div className="flex items-center gap-2 px-3 py-2">
          <button
            type="button"
            onClick={toggle}
            className="w-8 h-8 rounded-full border border-gold-300/40 hover:border-gold-300 text-gold-300 flex items-center justify-center transition-colors"
            title={enabled ? "Mettre en pause" : "Activer la musique"}
          >
            {enabled ? "❚❚" : "▶"}
          </button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-left min-w-[160px] hover:text-gold-300 transition-colors"
            title="Choisir l'ambiance"
          >
            <div className="font-mono text-[10px] tracking-eyebrow uppercase text-parchment-2/70">
              {MOOD_LABEL[mood]}
              {manualMood ? " · manuel" : " · auto"}
            </div>
            <div className="font-serif text-[13px] truncate max-w-[200px]">
              {current?.title ?? "—"}
            </div>
          </button>
          <button
            type="button"
            onClick={skip}
            className="w-7 h-7 rounded text-parchment-2/70 hover:text-gold-300 transition-colors"
            title="Piste suivante"
          >
            ⏭
          </button>
        </div>
        {expanded && (
          <div className="border-t border-parchment-2/10 px-3 py-2 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-eyebrow uppercase text-parchment-2/70 w-12">
                Volume
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-1 accent-gold-300"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => pickMood(null)}
                className={`px-2 py-1 rounded text-[11px] font-mono uppercase tracking-eyebrow border transition-colors ${
                  manualMood === null
                    ? "border-gold-300 text-gold-300"
                    : "border-parchment-2/20 text-parchment-2/70 hover:border-gold-300/60"
                }`}
              >
                Auto
              </button>
              {(Object.keys(MOOD_LABEL) as MusicMood[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => pickMood(m)}
                  className={`px-2 py-1 rounded text-[11px] font-mono uppercase tracking-eyebrow border transition-colors ${
                    manualMood === m
                      ? "border-gold-300 text-gold-300"
                      : "border-parchment-2/20 text-parchment-2/70 hover:border-gold-300/60"
                  }`}
                >
                  {MOOD_LABEL[m]}
                </button>
              ))}
            </div>
            <a
              href={MUSIC_ATTRIBUTION.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-[10px] text-parchment-2/50 hover:text-gold-300 italic"
            >
              {MUSIC_ATTRIBUTION.text}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
