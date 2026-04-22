import type { Message, SuggestedAction } from "../lib/types";

export type QuickAction = "speak" | "act" | "spell" | "roll";

interface Props {
  message: Message | undefined;
  isHost: boolean;
  thinking: boolean;
  onAskGM: () => void;
  canAsk: boolean;
  onQuickAction: (kind: QuickAction) => void;
  onSuggestedAction: (action: SuggestedAction) => void;
  onApplySceneSuggestion?: () => void;
  hasCharacter: boolean;
}

export default function NarrationPanel({
  message,
  isHost,
  thinking,
  onAskGM,
  canAsk,
  onQuickAction,
  onSuggestedAction,
  onApplySceneSuggestion,
  hasCharacter,
}: Props) {
  const dynamic = message?.suggestedActions ?? [];
  const sceneSuggestion = message?.sceneSuggestion;

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

        {sceneSuggestion && isHost && onApplySceneSuggestion && (
          <button
            onClick={onApplySceneSuggestion}
            className="mt-4 w-full panel-gold p-3 hover:border-gold-300 transition-colors text-left fade-in"
          >
            <div className="font-mono text-[10px] tracking-label uppercase text-gold-300 mb-1">
              🗺 Le MJ propose une nouvelle scène
            </div>
            <div className="font-serif text-[14px] text-parchment leading-tight">
              {sceneSuggestion.label}
            </div>
            <div className="font-mono text-[9px] tracking-label uppercase text-gold-400 mt-2">
              Cliquer pour appliquer →
            </div>
          </button>
        )}
      </div>

      <div className="p-5 flex-1 overflow-y-auto scrollbar-thin">
        {dynamic.length > 0 && (
          <>
            <div className="eyebrow mb-2">Suggestions du MJ</div>
            <div className="space-y-2 font-mono text-[11px] tracking-label uppercase mb-5">
              {dynamic.map((a, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSuggestedAction(a)}
                  disabled={!hasCharacter}
                  className={`group w-full flex items-center justify-between panel-gold px-3 py-2 transition-colors ${
                    !hasCharacter
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer hover:border-gold-300"
                  }`}
                  title={a.prompt}
                >
                  <span className="text-gold-200 group-hover:text-gold-100 truncate">{a.label}</span>
                  <span className="text-gold-400/60 text-[9px] shrink-0 ml-2">→</span>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="eyebrow mb-2">Actions de base</div>
        <div className="space-y-2 font-mono text-[11px] tracking-label uppercase">
          <ActionRow
            label="Parler"
            hint="PNJ · dialogue"
            disabled={!hasCharacter}
            onClick={() => onQuickAction("speak")}
          />
          <ActionRow
            label="Agir"
            hint="Libre · narration"
            disabled={!hasCharacter}
            onClick={() => onQuickAction("act")}
          />
          <ActionRow
            label="Sort"
            hint="Magie · coût mana"
            disabled={!hasCharacter}
            onClick={() => onQuickAction("spell")}
          />
          <ActionRow
            label="Jet 1d20"
            hint="Test · compétence"
            disabled={!hasCharacter}
            onClick={() => onQuickAction("roll")}
          />
        </div>
        {!hasCharacter && (
          <p className="mt-3 font-serif italic text-ink-400 text-[12px]">
            Forge d'abord ton personnage pour agir.
          </p>
        )}
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
            Le MJ répond automatiquement à chaque action
          </p>
        </div>
      )}
    </aside>
  );
}

function ActionRow({
  label,
  hint,
  onClick,
  disabled,
}: {
  label: string;
  hint: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group w-full flex items-center justify-between panel px-3 py-2 transition-colors ${
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:border-gold-500/50 hover:bg-ink-800/50"
      }`}
    >
      <span className="text-parchment group-hover:text-gold-300">{label}</span>
      <span className="text-ink-400 text-[9px]">{hint}</span>
    </button>
  );
}
