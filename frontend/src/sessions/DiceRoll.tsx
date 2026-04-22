import { useEffect, useState } from "react";

interface Props {
  finalValue: number;
  onDone: () => void;
  rollerName: string;
}

export default function DiceRoll({ finalValue, onDone, rollerName }: Props) {
  const [shown, setShown] = useState<number>(1);
  const [phase, setPhase] = useState<"rolling" | "settling" | "revealed">("rolling");

  useEffect(() => {
    let cancelled = false;
    const start = Date.now();
    const rollDuration = 1400;
    const tick = () => {
      if (cancelled) return;
      const elapsed = Date.now() - start;
      if (elapsed < rollDuration) {
        const interval = 50 + (elapsed / rollDuration) * 200;
        setShown(Math.floor(Math.random() * 20) + 1);
        setTimeout(tick, interval);
      } else {
        setShown(finalValue);
        setPhase("settling");
        setTimeout(() => !cancelled && setPhase("revealed"), 300);
        setTimeout(() => !cancelled && onDone(), 2200);
      }
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, [finalValue, onDone]);

  const isCrit20 = phase === "revealed" && finalValue === 20;
  const isCrit1 = phase === "revealed" && finalValue === 1;
  const accent = isCrit20 ? "#d9b968" : isCrit1 ? "#c85a3a" : "#e8d08a";
  const glow = isCrit20
    ? "rgba(217,185,104,.7)"
    : isCrit1
    ? "rgba(200,90,58,.7)"
    : "rgba(232,208,138,.4)";

  return (
    <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center fade-in">
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-[2px]" />
      <div className="relative flex flex-col items-center gap-4">
        <div className="font-mono text-[11px] tracking-eyebrow uppercase text-parchment-2/80">
          {rollerName} lance 1d20
        </div>
        <div
          className={`relative w-40 h-40 ${phase === "rolling" ? "dice-rolling" : "dice-settled"}`}
          style={{
            transition: "transform 240ms cubic-bezier(.2,.6,.2,1)",
            transform: phase === "settling" ? "scale(1.15)" : phase === "revealed" ? "scale(1)" : undefined,
          }}
        >
          <DiceShape color={accent} glow={glow} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="font-serif text-[64px] leading-none"
              style={{
                color: accent,
                textShadow: `0 0 24px ${glow}`,
              }}
            >
              {shown}
            </span>
          </div>
        </div>
        {isCrit20 && (
          <div className="font-serif italic text-gold-300 text-[18px] mt-2 fade-in">
            Réussite critique !
          </div>
        )}
        {isCrit1 && (
          <div className="font-serif italic text-ember text-[18px] mt-2 fade-in">
            Échec critique...
          </div>
        )}
      </div>
      <style>{`
        @keyframes diceTumble {
          0%   { transform: rotate(0deg) scale(.92); }
          25%  { transform: rotate(180deg) scale(1.05); }
          50%  { transform: rotate(360deg) scale(.95); }
          75%  { transform: rotate(540deg) scale(1.08); }
          100% { transform: rotate(720deg) scale(1); }
        }
        .dice-rolling { animation: diceTumble 1.4s cubic-bezier(.4,.1,.3,1) forwards; }
        .dice-settled { animation: none; }
      `}</style>
    </div>
  );
}

function DiceShape({ color, glow }: { color: string; glow: string }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" style={{ filter: `drop-shadow(0 0 24px ${glow})` }}>
      <polygon
        points="50,5 90,30 90,70 50,95 10,70 10,30"
        fill="url(#diceGrad)"
        stroke={color}
        strokeWidth="2"
      />
      <polygon
        points="50,5 90,30 50,50 10,30"
        fill="rgba(255,255,255,.08)"
        stroke={color}
        strokeWidth="1"
      />
      <polygon
        points="50,50 90,30 90,70 50,95"
        fill="rgba(0,0,0,.18)"
        stroke={color}
        strokeWidth="1"
      />
      <polygon
        points="50,50 10,30 10,70 50,95"
        fill="rgba(0,0,0,.32)"
        stroke={color}
        strokeWidth="1"
      />
      <defs>
        <linearGradient id="diceGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2a1f12" />
          <stop offset="100%" stopColor="#0e0904" />
        </linearGradient>
      </defs>
    </svg>
  );
}
