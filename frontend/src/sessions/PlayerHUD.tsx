interface Props {
  displayName: string;
}

// Player HUD placeholder: portrait + HP/mana bars. Wired to real character data in V2.
export default function PlayerHUD({ displayName }: Props) {
  return (
    <div className="panel-gold p-3 flex items-center gap-3 shadow-panel shrink-0">
      <div
        className="w-16 h-16 rounded-sm border border-hairline-strong"
        style={{ background: "linear-gradient(135deg, #2a2219, #191210)" }}
      />
      <div className="min-w-[160px]">
        <div className="font-serif text-[14px] text-parchment leading-tight">{displayName}</div>
        <div className="font-mono text-[9px] tracking-label uppercase text-ink-400 mt-0.5">
          Aventurier · niv. 1
        </div>
        <div className="mt-2 space-y-1">
          <Bar label="PV" value={72} color="ember" />
          <Bar label="MANA" value={48} color="arcane" />
        </div>
      </div>
    </div>
  );
}

function Bar({ label, value, color }: { label: string; value: number; color: "ember" | "arcane" }) {
  const bg = color === "ember" ? "var(--ember)" : "var(--arcane)";
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[9px] tracking-label uppercase text-ink-400 w-10">{label}</span>
      <div className="flex-1 h-[6px] rounded-sm overflow-hidden" style={{ background: "rgba(255,255,255,.06)" }}>
        <div className="h-full" style={{ background: bg, width: `${value}%` }} />
      </div>
    </div>
  );
}
