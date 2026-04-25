import { useEffect, useMemo, useRef, useState } from "react";
import type { Character, CurrentScene, Npc, NpcRole, TokenPosition } from "../lib/types";
import { buildNpcPortraitUrls, buildPlayerPortraitUrls } from "../lib/portrait";
import { buildMapUrlChain } from "../lib/scenePresets";
import CharacterPortrait from "./CharacterPortrait";
import ProceduralBattlemap from "./ProceduralBattlemap";

interface Props {
  campaignName: string;
  characters: Character[];
  currentUid: string;
  isHost: boolean;
  scene?: CurrentScene;
  tokens?: Record<string, TokenPosition>;
  npcs?: Record<string, Npc>;
  npcTokens?: Record<string, TokenPosition>;
  onMoveCharacterToken?: (charId: string, pos: TokenPosition) => void;
  onMoveNpcToken?: (npcId: string, pos: TokenPosition) => void;
  onClickNpc?: (npc: Npc) => void;
}

interface Drag {
  kind: "char" | "npc";
  id: string;
  pointerId: number;
  offsetX: number;
  offsetY: number;
  startedAt: number;
  movedSinceStart: boolean;
}

const ROLE_RING: Record<NpcRole, { ring: string; glow: string }> = {
  ally:    { ring: "rgba(109,138,90,.95)",  glow: "rgba(109,138,90,.45)" },
  neutral: { ring: "rgba(170,160,140,.85)", glow: "rgba(170,160,140,.30)" },
  hostile: { ring: "rgba(206,82,68,.95)",   glow: "rgba(206,82,68,.45)"  },
};

export default function SceneStage({
  campaignName,
  characters,
  currentUid,
  isHost,
  scene,
  tokens,
  npcs,
  npcTokens,
  onMoveCharacterToken,
  onMoveNpcToken,
  onClickNpc,
}: Props) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [localCharTokens, setLocalCharTokens] = useState<Record<string, TokenPosition>>({});
  const [localNpcTokens, setLocalNpcTokens] = useState<Record<string, TokenPosition>>({});

  useEffect(() => {
    if (!drag) setLocalCharTokens(tokens ?? {});
  }, [tokens, drag]);
  useEffect(() => {
    if (!drag) setLocalNpcTokens(npcTokens ?? {});
  }, [npcTokens, drag]);

  const mapUrls = useMemo(
    () => (scene ? buildMapUrlChain(scene.prompt, scene.seed) : []),
    [scene]
  );
  const [mapIdx, setMapIdx] = useState(0);
  const [mapFailed, setMapFailed] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapKey = mapUrls.join("|");
  useEffect(() => {
    setMapIdx(0);
    setMapFailed(false);
    setMapLoaded(false);
  }, [mapKey]);
  // Pollinations sometimes hangs without firing onError. Force-advance after 12s.
  // flux (Schnell) usually returns in 3-6s; 12s gives it margin for cold starts
  // before falling through to sana.
  useEffect(() => {
    if (mapLoaded || mapFailed) return;
    const t = setTimeout(() => {
      setMapIdx((i) => {
        if (i + 1 < mapUrls.length) return i + 1;
        setMapFailed(true);
        return i;
      });
    }, 12000);
    return () => clearTimeout(t);
  }, [mapIdx, mapLoaded, mapFailed, mapUrls.length]);
  const mapUrl = mapUrls[mapIdx] ?? null;

  const npcList = useMemo(() => Object.values(npcs ?? {}), [npcs]);

  function defaultCharPos(i: number, total: number): TokenPosition {
    const padding = 0.12;
    const span = 1 - padding * 2;
    const x = total === 1 ? 0.5 : padding + (i / (total - 1)) * span;
    return { x, y: 0.78 };
  }
  function defaultNpcPos(i: number, total: number): TokenPosition {
    const padding = 0.18;
    const span = 1 - padding * 2;
    const x = total === 1 ? 0.5 : padding + (i / (total - 1)) * span;
    return { x, y: 0.32 };
  }
  function getCharPos(id: string, idx: number): TokenPosition {
    return localCharTokens[id] ?? defaultCharPos(idx, characters.length);
  }
  function getNpcPos(id: string, idx: number): TokenPosition {
    return localNpcTokens[id] ?? defaultNpcPos(idx, npcList.length);
  }

  function startDrag(e: React.PointerEvent, kind: "char" | "npc", id: string) {
    const stage = stageRef.current;
    if (!stage) return;

    const canMove =
      kind === "char"
        ? (() => {
            const ch = characters.find((c) => c.id === id);
            return Boolean(ch) && (isHost || ch!.ownerUid === currentUid) && Boolean(onMoveCharacterToken);
          })()
        : isHost && Boolean(onMoveNpcToken);

    // Always start a "click candidate" so we can fire onClickNpc on a non-drag tap.
    const rect = stage.getBoundingClientRect();
    const pos =
      kind === "char"
        ? getCharPos(id, characters.findIndex((c) => c.id === id))
        : getNpcPos(id, npcList.findIndex((n) => n.id === id));
    const tokenX = pos.x * rect.width + rect.left;
    const tokenY = pos.y * rect.height + rect.top;
    setDrag({
      kind,
      id,
      pointerId: e.pointerId,
      offsetX: e.clientX - tokenX,
      offsetY: e.clientY - tokenY,
      startedAt: Date.now(),
      movedSinceStart: false,
    });
    if (canMove) {
      (e.target as Element).setPointerCapture?.(e.pointerId);
    }
  }

  function moveDrag(e: React.PointerEvent) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const stage = stageRef.current;
    if (!stage) return;
    const canMove =
      drag.kind === "char"
        ? (() => {
            const ch = characters.find((c) => c.id === drag.id);
            return Boolean(ch) && (isHost || ch!.ownerUid === currentUid) && Boolean(onMoveCharacterToken);
          })()
        : isHost && Boolean(onMoveNpcToken);
    if (!canMove) return;

    const rect = stage.getBoundingClientRect();
    const x = (e.clientX - drag.offsetX - rect.left) / rect.width;
    const y = (e.clientY - drag.offsetY - rect.top) / rect.height;
    const clamped = {
      x: Math.max(0.04, Math.min(0.96, x)),
      y: Math.max(0.04, Math.min(0.96, y)),
    };
    if (drag.kind === "char") {
      setLocalCharTokens((t) => ({ ...t, [drag.id]: clamped }));
    } else {
      setLocalNpcTokens((t) => ({ ...t, [drag.id]: clamped }));
    }
    if (!drag.movedSinceStart) setDrag({ ...drag, movedSinceStart: true });
  }

  function endDrag(e: React.PointerEvent) {
    if (!drag || e.pointerId !== drag.pointerId) return;

    const wasClick = !drag.movedSinceStart && Date.now() - drag.startedAt < 350;

    if (wasClick && drag.kind === "npc") {
      const npc = npcs?.[drag.id];
      if (npc && onClickNpc) onClickNpc(npc);
    } else if (drag.movedSinceStart) {
      if (drag.kind === "char") {
        const finalPos = localCharTokens[drag.id];
        if (finalPos && onMoveCharacterToken) onMoveCharacterToken(drag.id, finalPos);
      } else {
        const finalPos = localNpcTokens[drag.id];
        if (finalPos && onMoveNpcToken) onMoveNpcToken(drag.id, finalPos);
      }
    }
    setDrag(null);
  }

  const hasScene = Boolean(scene);
  const showMap = mapUrl && !mapFailed;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {!hasScene ? (
        <ParchmentFallback campaignName={campaignName} characters={characters} currentUid={currentUid} />
      ) : (
        <div ref={stageRef} className="absolute inset-0">
          {/* Always-rendered procedural battlemap — instant, deterministic, no network */}
          <ProceduralBattlemap label={scene?.label ?? ""} prompt={scene?.prompt ?? ""} seed={scene?.seed ?? 0} />
          {/* AI-generated map fades in on top if/when it actually loads */}
          {showMap && (
            <img
              key={mapUrl}
              src={mapUrl}
              alt={scene?.label ?? "scène"}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: mapLoaded ? 1 : 0, transition: "opacity 600ms ease-out" }}
              draggable={false}
              onLoad={() => setMapLoaded(true)}
              onError={() => {
                setMapLoaded(false);
                if (mapIdx + 1 < mapUrls.length) setMapIdx(mapIdx + 1);
                else setMapFailed(true);
              }}
            />
          )}
          {/* Battlemap 1-inch grid overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(0,0,0,.28) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(0,0,0,.28) 1px, transparent 1px)
              `,
              backgroundSize: "64px 64px",
              mixBlendMode: "multiply",
              opacity: 0.55,
            }}
          />
          {/* Vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 90% 80% at 50% 55%, transparent 50%, rgba(0,0,0,.6) 100%)",
            }}
          />
          {/* Subtle scanline texture */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "repeating-linear-gradient(0deg, rgba(255,255,255,.012) 0 1px, transparent 1px 3px)",
              mixBlendMode: "overlay",
            }}
          />

          <div
            className="absolute inset-0"
            onPointerMove={drag ? moveDrag : undefined}
            onPointerUp={drag ? endDrag : undefined}
            onPointerCancel={drag ? endDrag : undefined}
          >
            {/* NPC tokens behind player tokens */}
            {npcList.map((n, i) => {
              const pos = getNpcPos(n.id, i);
              return (
                <div
                  key={`npc_${n.id}`}
                  className="absolute"
                  style={{
                    left: `${pos.x * 100}%`,
                    top: `${pos.y * 100}%`,
                    transform: "translate(-50%, -50%)",
                    cursor: "pointer",
                    touchAction: "none",
                  }}
                  onPointerDown={(e) => startDrag(e, "npc", n.id)}
                >
                  <NpcToken npc={n} dragging={drag?.kind === "npc" && drag.id === n.id} />
                </div>
              );
            })}

            {/* Character tokens on top */}
            {characters.map((c, i) => {
              const pos = getCharPos(c.id, i);
              const mine = c.ownerUid === currentUid;
              const canMove = (isHost || mine) && Boolean(onMoveCharacterToken);
              return (
                <div
                  key={`char_${c.id}`}
                  className="absolute"
                  style={{
                    left: `${pos.x * 100}%`,
                    top: `${pos.y * 100}%`,
                    transform: "translate(-50%, -50%)",
                    cursor: canMove ? (drag?.id === c.id ? "grabbing" : "grab") : "default",
                    touchAction: canMove ? "none" : undefined,
                  }}
                  onPointerDown={(e) => canMove && startDrag(e, "char", c.id)}
                >
                  <CharacterToken character={c} mine={mine} dragging={drag?.kind === "char" && drag.id === c.id} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Scene label */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 text-center pointer-events-none z-10">
        <div className="font-mono text-[10px] tracking-eyebrow uppercase text-gold-500/70">Scène</div>
        <div className="font-serif italic text-[20px] text-parchment-2/90 mt-1 max-w-md drop-shadow-[0_2px_4px_rgba(0,0,0,.8)]">
          {scene?.label ?? campaignName}
        </div>
      </div>

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

  const portraitUrls = character.portraitSeed
    ? buildPlayerPortraitUrls(
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
        {portraitUrls && portraitUrls.length > 0 ? (
          <CharacterPortrait
            src={portraitUrls}
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

function NpcToken({ npc, dragging = false }: { npc: Npc; dragging?: boolean }) {
  const initials = npc.name
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const portraitUrls = buildNpcPortraitUrls(npc, 256);
  const { ring, glow } = ROLE_RING[npc.role];

  return (
    <div
      className="flex flex-col items-center gap-1 fade-in select-none"
      style={{ filter: dragging ? "brightness(1.15)" : undefined }}
    >
      <div
        className="rounded-full p-[3px]"
        style={{
          background: `radial-gradient(circle, ${ring}, ${ring} 80%, transparent)`,
          boxShadow: dragging
            ? `0 0 48px ${glow}, 0 0 0 4px rgba(0,0,0,.4)`
            : `0 0 28px ${glow}, 0 4px 10px rgba(0,0,0,.5)`,
          transition: "box-shadow 160ms ease",
        }}
      >
        {portraitUrls.length > 0 ? (
          <CharacterPortrait
            src={portraitUrls}
            alt={npc.name}
            size={56}
            rounded="full"
            fallbackInitials={initials}
          />
        ) : (
          <div
            className="w-[56px] h-[56px] rounded-full flex items-center justify-center font-serif text-[20px] text-parchment"
            style={{
              background: "radial-gradient(circle at 35% 30%, #3a2818, #110a04)",
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
        {npc.name}
      </div>
    </div>
  );
}
