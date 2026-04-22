import { useState, KeyboardEvent } from "react";

interface Props {
  onSend: (content: string) => Promise<void>;
}

export default function Composer({ onSend }: Props) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      await onSend(trimmed);
      setText("");
    } finally {
      setBusy(false);
    }
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex-1 panel-gold p-3 shadow-panel flex flex-col gap-2">
      <div className="label">Ton action</div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKey}
        placeholder="« Je pousse la porte et j'écoute avant d'entrer... »"
        rows={2}
        disabled={busy}
        className="field font-serif italic text-[15px] leading-relaxed resize-none bg-transparent border-0 p-0 focus:bg-transparent"
      />
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-label uppercase text-ink-400">
          Entrée · envoyer · Maj+Entrée · saut de ligne
        </span>
        <button
          onClick={send}
          disabled={!text.trim() || busy}
          className="btn-primary !py-1.5 !px-3"
        >
          {busy ? "..." : "Envoyer"}
        </button>
      </div>
    </div>
  );
}
