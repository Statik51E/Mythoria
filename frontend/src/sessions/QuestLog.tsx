import type { Quest } from "../lib/types";

interface Props {
  quests?: Record<string, Quest>;
  onClose: () => void;
}

export default function QuestLog({ quests, onClose }: Props) {
  const list = quests ? Object.values(quests) : [];
  const active = list.filter((q) => q.status === "active");
  const done = list.filter((q) => q.status === "completed");
  const failed = list.filter((q) => q.status === "failed");

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink-900/80 backdrop-blur-sm fade-in">
      <div className="panel-gold w-[min(96vw,640px)] max-h-[88vh] flex flex-col shadow-panel">
        <div className="flex items-center justify-between p-4 border-b border-hairline-strong">
          <div>
            <div className="eyebrow text-arcane">Journal</div>
            <div className="font-serif text-[20px] text-parchment">Quêtes</div>
          </div>
          <button
            onClick={onClose}
            className="font-mono text-[10px] tracking-label uppercase text-ink-400 hover:text-gold-400"
          >
            Fermer · Esc
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
          {list.length === 0 && (
            <div className="font-serif italic text-parchment-2 text-center py-8">
              Aucune quête pour l'instant. Le MJ en ouvrira lorsque l'histoire l'exigera.
            </div>
          )}
          <Section title="En cours" quests={active} accent="gold" />
          <Section title="Accomplies" quests={done} accent="moss" />
          <Section title="Échouées" quests={failed} accent="ember" />
        </div>
      </div>
    </div>
  );
}

function Section({ title, quests, accent }: { title: string; quests: Quest[]; accent: "gold" | "moss" | "ember" }) {
  if (quests.length === 0) return null;
  return (
    <div>
      <div className={`eyebrow mb-2 ${accent === "gold" ? "" : accent === "moss" ? "text-moss" : "text-ember"}`}>{title}</div>
      <div className="space-y-2">
        {quests.map((q) => (
          <div key={q.id} className="panel p-3">
            <div className="font-serif text-[15px] text-parchment leading-tight">{q.title}</div>
            <div className="font-sans text-[13px] text-parchment-2 mt-1 leading-snug">{q.summary}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
