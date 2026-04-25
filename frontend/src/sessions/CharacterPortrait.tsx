import { useEffect, useRef, useState } from "react";

interface Props {
  src: string | string[];
  alt: string;
  size?: number;
  rounded?: "full" | "sm" | "md";
  fallbackInitials?: string;
}

export default function CharacterPortrait({
  src,
  alt,
  size = 96,
  rounded = "md",
  fallbackInitials,
}: Props) {
  const sources = Array.isArray(src) ? src : [src];
  const [idx, setIdx] = useState(0);
  // attempt 0 = first try, attempt 1 = retry after delay (handles 429 spikes
  // when several portraits + the battlemap hit Pollinations' 1-req/15s anon
  // limit simultaneously). bust is appended to the URL on retry to defeat the
  // browser's failed-request cache.
  const [attempt, setAttempt] = useState(0);
  const [bust, setBust] = useState(0);
  const [status, setStatus] = useState<"loading" | "waiting" | "ok" | "error">("loading");
  const sourcesKey = sources.join("|");
  const lastKey = useRef<string>("");

  useEffect(() => {
    if (lastKey.current !== sourcesKey) {
      lastKey.current = sourcesKey;
      setIdx(0);
      setAttempt(0);
      setBust(0);
      setStatus("loading");
    }
  }, [sourcesKey]);

  // Per-attempt watchdog. flux usually returns in 3-8s; 15s tolerates a cold
  // start on the Pollinations side without giving up too early.
  useEffect(() => {
    if (status !== "loading") return;
    const t = setTimeout(() => advance(), 15000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, idx, attempt, sources.length]);

  // After an error, wait out the rate-limit window before retrying.
  useEffect(() => {
    if (status !== "waiting") return;
    const t = setTimeout(() => {
      setBust((b) => b + 1);
      setStatus("loading");
    }, 7000);
    return () => clearTimeout(t);
  }, [status]);

  const radius = rounded === "full" ? "9999px" : rounded === "md" ? "6px" : "3px";
  const base = sources[idx];
  const current = base ? (bust > 0 ? `${base}${base.includes("?") ? "&" : "?"}__r=${bust}` : base) : null;

  function advance() {
    // Try this same URL once more before moving on — most failures are
    // transient 429s, not "the model can't render this prompt".
    if (attempt === 0) {
      setAttempt(1);
      setStatus("waiting");
      return;
    }
    if (idx + 1 < sources.length) {
      setIdx(idx + 1);
      setAttempt(0);
      setBust(0);
      setStatus("loading");
    } else {
      setStatus("error");
    }
  }

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: "linear-gradient(135deg, #2a2219, #0f0a06)",
        border: "1px solid rgba(232,208,138,.35)",
        boxShadow: "0 4px 20px rgba(0,0,0,.55), inset 0 0 0 1px rgba(255,255,255,.04)",
      }}
    >
      {status !== "error" && current && (
        <img
          key={current}
          src={current}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => setStatus("ok")}
          onError={advance}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: status === "ok" ? 1 : 0, transition: "opacity 320ms ease-out" }}
        />
      )}
      {status === "waiting" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-gold-500/20 border-t-gold-300/70 animate-spin" />
        </div>
      )}
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-gold-500/30 border-t-gold-400 animate-spin" />
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="font-serif text-parchment" style={{ fontSize: size * 0.32 }}>
            {fallbackInitials || alt[0]?.toUpperCase() || "?"}
          </div>
        </div>
      )}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,.45) 100%)",
        }}
      />
    </div>
  );
}
