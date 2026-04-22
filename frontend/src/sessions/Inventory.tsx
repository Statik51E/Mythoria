import { useState } from "react";
import type { Character, EquipSlot, Equipment, Item } from "../lib/types";
import { ITEM_TYPE_LABELS } from "../lib/starterItems";

export type ItemAction = "use" | "equip" | "unequip" | "drop";

interface Props {
  character: Character;
  onClose: () => void;
  onAction: (item: Item, action: ItemAction) => void | Promise<void>;
}

export default function Inventory({ character, onClose, onAction }: Props) {
  const [selected, setSelected] = useState<Item | null>(null);
  const equipment: Equipment = character.equipment ?? {};
  const equippedIds = new Set(
    (["weapon", "armor", "accessory"] as EquipSlot[])
      .map((s) => equipment[s]?.id)
      .filter(Boolean) as string[]
  );

  return (
    <div className="fixed inset-0 z-40 flex justify-end fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" />

      <aside
        className="relative w-[min(92vw,440px)] h-full bg-ink-900/95 border-l border-rule shadow-panel flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-rule">
          <div>
            <div className="eyebrow mb-1">Sac & Équipement</div>
            <h3 className="font-serif text-[18px] text-parchment m-0 truncate max-w-[260px]">
              {character.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="font-mono text-[10px] tracking-label uppercase text-ink-300 hover:text-gold-400"
          >
            Fermer ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-6">
          <section>
            <div className="label mb-2">Équipé</div>
            <div className="grid grid-cols-3 gap-2">
              <EquipSlotBox label="Arme" item={equipment.weapon} onClick={(it) => setSelected(it)} />
              <EquipSlotBox label="Armure" item={equipment.armor} onClick={(it) => setSelected(it)} />
              <EquipSlotBox label="Accessoire" item={equipment.accessory} onClick={(it) => setSelected(it)} />
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <div className="label">Sac · {character.inventory.length} objets</div>
            </div>
            {character.inventory.length === 0 ? (
              <p className="font-serif italic text-ink-400 text-[13px] m-0">Sac vide.</p>
            ) : (
              <ul className="space-y-1.5">
                {character.inventory.map((it) => (
                  <li key={it.id}>
                    <button
                      onClick={() => setSelected(it)}
                      className={`w-full flex items-center gap-3 panel px-3 py-2.5 text-left transition-colors ${
                        selected?.id === it.id ? "border-gold-500" : "hover:border-hairline"
                      }`}
                    >
                      <ItemGlyph type={it.type} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-[14px] text-parchment truncate">{it.name}</span>
                          {it.quantity && it.quantity > 1 && (
                            <span className="font-mono text-[10px] text-ink-300">×{it.quantity}</span>
                          )}
                          {equippedIds.has(it.id) && (
                            <span className="chip chip-gold text-[8px]">Équipé</span>
                          )}
                        </div>
                        <div className="font-mono text-[9px] tracking-label uppercase text-ink-400 mt-0.5">
                          {ITEM_TYPE_LABELS[it.type].label}
                          {it.flavor ? ` · ${it.flavor}` : ""}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {selected && (
          <ItemActions
            item={selected}
            equipped={equippedIds.has(selected.id)}
            onAction={async (action) => {
              await onAction(selected, action);
              setSelected(null);
            }}
            onCancel={() => setSelected(null)}
          />
        )}
      </aside>
    </div>
  );
}

function EquipSlotBox({
  label,
  item,
  onClick,
}: {
  label: string;
  item?: Item | null;
  onClick: (it: Item) => void;
}) {
  if (!item) {
    return (
      <div className="panel p-2 flex flex-col items-center justify-center min-h-[72px] opacity-60">
        <span className="font-mono text-[10px] tracking-label uppercase text-ink-400">{label}</span>
        <span className="font-serif italic text-[11px] text-ink-500 mt-1">— vide —</span>
      </div>
    );
  }
  return (
    <button
      onClick={() => onClick(item)}
      className="panel p-2 flex flex-col items-center text-center min-h-[72px] hover:border-gold-500 transition-colors"
      title={item.description}
    >
      <ItemGlyph type={item.type} small />
      <span className="font-serif text-[12px] text-parchment leading-tight mt-1 truncate max-w-full">
        {item.name}
      </span>
      <span className="font-mono text-[9px] tracking-label uppercase text-ink-400 mt-0.5">
        {label}
      </span>
    </button>
  );
}

function ItemGlyph({ type, small = false }: { type: Item["type"]; small?: boolean }) {
  const meta = ITEM_TYPE_LABELS[type];
  const size = small ? 28 : 36;
  return (
    <div
      className="rounded-sm flex items-center justify-center shrink-0 border border-hairline-strong"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,.06), transparent 70%), linear-gradient(135deg, #2a2219, #161009)`,
        color: meta.color,
        fontSize: small ? 14 : 18,
        textShadow: `0 0 12px ${meta.color}`,
      }}
    >
      {meta.glyph}
    </div>
  );
}

function ItemActions({
  item,
  equipped,
  onAction,
  onCancel,
}: {
  item: Item;
  equipped: boolean;
  onAction: (action: ItemAction) => void;
  onCancel: () => void;
}) {
  const meta = ITEM_TYPE_LABELS[item.type];
  const canEquip = Boolean(item.slot);
  const canUse = item.consumable === true || item.type === "potion" || item.type === "scroll";

  return (
    <div className="border-t border-rule px-5 py-4 bg-ink-900/95 fade-in">
      <div className="flex items-center gap-3 mb-3">
        <ItemGlyph type={item.type} />
        <div className="flex-1 min-w-0">
          <div className="font-serif text-[16px] text-parchment leading-tight">{item.name}</div>
          <div className="font-mono text-[9px] tracking-label uppercase mt-0.5" style={{ color: meta.color }}>
            {meta.label}
          </div>
        </div>
        <button onClick={onCancel} className="font-mono text-[10px] text-ink-400 hover:text-parchment">
          ✕
        </button>
      </div>
      <p className="font-serif italic text-[13px] text-ink-300 m-0 mb-3 leading-snug">
        {item.description}
      </p>
      <div className="flex flex-wrap gap-2">
        {canUse && (
          <button onClick={() => onAction("use")} className="btn-primary text-[12px] py-1.5 px-3">
            Utiliser
          </button>
        )}
        {canEquip && !equipped && (
          <button onClick={() => onAction("equip")} className="btn-ghost text-[12px] py-1.5 px-3">
            Équiper
          </button>
        )}
        {canEquip && equipped && (
          <button onClick={() => onAction("unequip")} className="btn-ghost text-[12px] py-1.5 px-3">
            Déséquiper
          </button>
        )}
        <button
          onClick={() => onAction("drop")}
          className="font-mono text-[11px] tracking-label uppercase text-ember/80 hover:text-ember px-3 py-1.5"
        >
          Jeter
        </button>
      </div>
    </div>
  );
}
