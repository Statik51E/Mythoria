import type { Message } from "../lib/types";

interface Props {
  message: Message | undefined;
  isHost: boolean;
  thinking: boolean;
  onAskGM: () => void;
  canAsk: boolean;
}

export default function NarrationPanel({ message, isHost, thinking, onAskGM, canAsk }: Props) {
  return (
    <aside className="relative z-10 w-[300px] shrink-0 border-l border-hairline bg-ink-900/75 backdrop-blur-md flex flex-col">
      <div className="p-5 border-b border-rule">
        <div className="eyebrow text-arcane mb-2">Le Maître raconte</div>
        <div className="hr-gold mb-4" />
        {message ? (
          <p className="font-serif italic text-parchment-2 text-[15px] leading-[1.6] m-0 whitespace-pre-wrap">
            {message.content}
          </p>
        ) : (
          <p className="font-serif italic text-ink-400 text-[14px] m-0">
            La lanterne vacille. La voix du Maître n'a pas encore retenti.
          </p>
        )}
      </div>

      <div className="p-5 flex-1 overflow-y-auto scrollbar-thin">
        <div className="eyebrow mb-2">Actions rapides</div>
        <div className="space-y-2 font-mono text-[11px] tracking-label uppercase">
          <ActionRow label="Parler" hint="PNJ · dialogue" />
          <ActionRow label="Agir" hint="Libre · narration" />
          <ActionRow label="Sort" hint="Magie · coût mana" />
          <ActionRow label="Jet 1d20" hint="Test · compétence" />
        </div>
      </div>

      {isHost && (
        <div className="p-5 border-t border-rule">
          <button
            onClick={onAskGM}
            disabled={thinking || !canAsk}
            className="btn-primary w-full"
          >
            {thinking ? "MJ réfléchit..." : "MJ, à toi"}
          </button>
          <p className="font-mono text-[10px] tracking-label uppercase text-ink-400 mt-2 text-center">
            Appel Groq · hôte uniquement
          </p>
        </div>
      )}
    </aside>
  );
}

function ActionRow({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="group flex items-center justify-between panel px-3 py-2 cursor-not-allowed opacity-60">
      <span className="text-parchment">{label}</span>
      <span className="text-ink-400 text-[9px]">{hint}</span>
    </div>
  );
}
