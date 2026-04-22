import { useEffect, useMemo, useRef, useState } from "react";
import type { Character, CurrentScene, TokenPosition } from "../lib/types";
import { buildPortraitUrl } from "../lib/portrait";
import { buildMapUrl } from "../lib/scenePresets";
import CharacterPortrait from "./CharacterPortrait";

interface Props {
  campaignName: string;
  characters: Character[];
  currentUid: string;
  isHost: boolean;
  scene?: CurrentScene;
  tokens?: Record<string, TokenPosition>;
  onMoveToken?: (charId: string, pos: TokenPosition) => void;
  onOpenSceneSelector?: () => void;
}

interface Drag {
  charId: string;
  pointerId: number;
  offsetX: number;
  offsetY: number;
}

export default function SceneStage({
  campaignName,
  characters,
  currentUid,
  isHost,
  scene,
  tokens,
  onMoveToken,
  onOpenSceneSelector,
}: Props) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [localTokens, setLocalTokens] = useState<Record<string, TokenPosition>>({});

  // Sync incoming tokens into local state when not dragging (so remote moves arrive smoothly)
  useEffect(() => {
    if (!drag) setLocalTokens(tokens ?? {});
  }, [tokens, drag]);

  const mapUrl = useMemo(
    () => (scene ? buildMapUrl(scene.prompt, scene.seed, 1024) : null),
    [scene]
  );

  function defaultPosition(i: number, total: number): TokenPosition {
    // Spread evenly along the bottom edge
    const padding = 0.12;
    const span = 1 - padding * 2;
    const x = total === 1 ? 0.5 : padding + (i / (total - 1)) * span;
    return { x, y: 0.78 };
  }

  function getPos(charId: string, fallbackIdx: number): TokenPosition {
    return localTokens[charId] ?? defaultPosition(fallbackIdx, characters.length);
  }

  function startDrag(e: React.PointerEvent, charId: string) {
    const stage = stageRef.current;
    if (!stage) return;
    const ch = characters.find((c) => c.id === charId);
    if (!ch) return;
    const canMove = isHost || ch.ownerUid === currentUid;
    if (!canMove || !onMoveToken) return;

    const rect = stage.getBoundingClientRect();
    const pos = getPos(charId, characters.findIndex((c) => c.id === charId));
    const tokenX = pos.x * rect.width + rect.left;
    const tokenY = pos.y * rect.height + rect.top;
    setDrag({
      charId,
      pointerId: e.pointerId,
      offsetX: e.clientX - tokenX,
      offsetY: e.clientY - tokenY,
    });
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }

  function moveDrag(e: React.PointerEvent) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const x = (e.clientX - drag.offsetX - rect.left) / rect.width;
    const y = (e.clientY - drag.offsetY - rect.top) / rect.height;
    const clamped = {
      x: Math.max(0.04, Math.min(0.96, x)),
      y: Math.max(0.04, Math.min(0.96, y)),
    };
    setLocalTokens((t) => ({ ...t, [drag.charId]: clamped }));
  }

  function endDrag(e: React.PointerEvent) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const finalPos = localTokens[drag.charId];
    if (finalPos && onMoveToken) {
      onMoveToken(drag.charId, finalPos);
    }
    setDrag(null);
  }

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Background layer: AI map or fallback parchment */}
      {mapUrl ? (
        <div ref={stageRef} className="absolute inset-0">
          <img
            src={mapUrl}
            alt={scene?.label ?? "scène"}
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 90% 80% at 50% 55%, transparent 50%, rgba(0,0,0,.55) 100%)",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "repeating-linear-gradient(0deg, rgba(255,255,255,.012) 0 1px, transparent 1px 3px)",
              mixBlendMode: "overlay",
            }}
          />

          {/* Tokens */}
          <div
            className="absolute inset-0"
            onPointerMove={drag ? moveDrag : undefined}
            onPointerUp={drag ? endDrag : undefined}
            onPointerCancel={drag ? endDrag : undefined}
          >
            {characters.map((c, i) => {
              const pos = getPos(c.id, i);
              const mine = c.ownerUid === currentUid;
              const canMove = (isHost || mine) && Boolean(onMoveToken);
              return (
                <div
                  key={c.id}
                  className="absolute"
                  style={{
                    left: `${pos.x * 100}%`,
                    top: `${pos.y * 100}%`,
                    transform: "translate(-50%, -50%)",
                    cursor: canMove ? (drag?.charId === c.id ? "grabbing" : "grab") : "default",
                    touchAction: canMove ? "none" : undefined,
                  }}
                  onPointerDown={(e) => canMove && startDrag(e, c.id)}
                >
                  <CharacterToken character={c} mine={mine} dragging={drag?.charId === c.id} />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <ParchmentFallback campaignName={campaignName} characters={characters} currentUid={currentUid} />
      )}

      {/* Scene label */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 text-center pointer-events-none z-10">
        <div className="font-mono text-[10px] tracking-eyebrow uppercase text-gold-500/70">Scène</div>
        <div className="font-serif italic text-[20px] text-parchment-2/90 mt-1 max-w-md drop-shadow-[0_2px_4px_rgba(0,0,0,.8)]">
          {scene?.label ?? campaignName}
        </div>
      </div>

      {/* MJ scene change button */}
      {isHost && onOpenSceneSelector && (
        <button
          onClick={onOpenSceneSelector}
          className="absolute top-16 right-4 z-10 panel px-3 py-2 font-mono text-[10px] tracking-label uppercase text-gold-300 hover:border-gold-500 hover:text-gold-200 transition-colors"
          title="Changer la scène"
        >
          🗺 {scene ? "Changer la scène" : "Choisir une scène"}
        </button>
      )}
    </div>
  );
}

function ParchmentFallback({
  campaignName,
  characters,
  currentUid,
}: {
  campaignName: string;
  characters: Character[];
  currentUid: string;
}) {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(1200px 700px at 50% 50%, rgba(78,62,38,.55), transparent 70%),
            radial-gradient(900px 600px at 20% 25%, rgba(201,162,74,.10), transparent 65%),
            radial-gradient(900px 600px at 80% 80%, rgba(122,107,200,.08), transparent 65%),
            linear-gradient(180deg, #1a1410, #0e0b08)
          `,
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: `
            linear-gradient(60deg, rgba(217,185,104,.4) 1px, transparent 1px),
            linear-gradient(-60deg, rgba(217,185,104,.4) 1px, transparent 1px),
            linear-gradient(0deg, rgba(217,185,104,.4) 1px, transparent 1px)
          `,
          backgroundSize: "70px 121px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 50%, black 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 50%, black 40%, transparent 100%)",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="font-serif italic text-parchment-2/70 text-[15px] max-w-md">
            « Aucune scène n'a encore été dressée pour {campaignName}. »
          </p>
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative" style={{ width: 420, height: 420 }}>
          {characters.map((c, i) => {
            const angle = (i / Math.max(characters.length, 1)) * Math.PI * 2 - Math.PI / 2;
            const radius = characters.length === 1 ? 0 : 150;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            return (
              <div
                key={c.id}
                className="absolute top-1/2 left-1/2"
                style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
              >
                <CharacterToken character={c} mine={c.ownerUid === currentUid} />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function CharacterToken({
  character,
  mine,
  dragging = false,
}: {
  character: Character;
  mine: boolean;
  dragging?: boolean;
}) {
  const initials = character.name
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const portraitUrl = character.portraitSeed
    ? buildPortraitUrl(
        {
          race: character.race,
          classId: character.classId,
          appearance: character.appearance,
          name: character.name,
        },
        character.portraitSeed,
        192
      )
    : null;

  const ringColor = mine ? "rgba(217,185,104,.95)" : "rgba(109,138,90,.85)";
  const glow = mine ? "rgba(217,185,104,.45)" : "rgba(109,138,90,.30)";

  return (
    <div
      className="flex flex-col items-center gap-1 fade-in select-none"
      style={{ filter: dragging ? "brightness(1.15)" : undefined }}
    >
      <div
        className="rounded-full p-[3px]"
        style={{
          background: `radial-gradient(circle, ${ringColor}, ${ringColor} 80%, transparent)`,
          boxShadow: dragging
            ? `0 0 48px ${glow}, 0 0 0 4px rgba(0,0,0,.4)`
            : `0 0 32px ${glow}, 0 4px 12px rgba(0,0,0,.5)`,
          transition: "box-shadow 160ms ease",
        }}
      >
        {portraitUrl ? (
          <CharacterPortrait
            src={portraitUrl}
            alt={character.name}
            size={64}
            rounded="full"
            fallbackInitials={initials}
          />
        ) : (
          <div
            className="w-[64px] h-[64px] rounded-full flex items-center justify-center font-serif text-[22px] text-parchment"
            style={{
              background: "radial-gradient(circle at 35% 30%, #5a4220, #1a0e04)",
              boxShadow: "inset 0 0 10px rgba(0,0,0,.6)",
            }}
          >
            {initials || "?"}
          </div>
        )}
      </div>
      <div
        className="font-mono text-[9px] tracking-label uppercase text-parchment-2 text-center max-w-[90px] truncate px-1.5 py-0.5 rounded-sm"
        style={{ background: "rgba(0,0,0,.55)" }}
      >
        {character.name}
      </div>
    </div>
  );
}
