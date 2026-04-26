import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import {
  watchCampaign,
  watchMessages,
  postMessage,
  watchCharacters,
  createCharacter,
  updateCharacter,
  watchSession,
  updateSession,
  updateCampaign,
} from "../lib/firestore";
import { callGroq, GroqMessage } from "../lib/groqClient";
import {
  MJ_SYSTEM_PROMPT,
  NPC_VOICE_PROMPT,
  buildContextSuffix,
  buildNpcPersonaSuffix,
} from "../lib/gmPrompts";
import type {
  BestiaryEntry,
  Campaign,
  Character,
  CurrentScene,
  EquipSlot,
  Equipment,
  HpChange,
  Item,
  ItemGrant,
  Message,
  Npc,
  NpcSpawn,
  Quest,
  QuestUpdate,
  SceneSuggestion,
  SessionDoc,
  SuggestedAction,
  TokenPosition,
} from "../lib/types";
type NewCharacter = Omit<Character, "id">;
import NarrationPanel, { QuickAction } from "./NarrationPanel";
import PlayerHUD from "./PlayerHUD";
import Composer from "./Composer";
import SceneStage from "./SceneStage";
import SceneSelector from "./SceneSelector";
import CharacterForge from "./CharacterForge";
import DiceRoll from "./DiceRoll";
import Inventory, { ItemAction } from "./Inventory";
import NpcForge from "./NpcForge";
import InteractionScene from "./InteractionScene";
import MusicPlayer from "./MusicPlayer";
import QuestLog from "./QuestLog";
import Bestiary from "./Bestiary";

const PREFILLS: Record<Exclude<QuickAction, "roll">, string> = {
  speak: "Je dis : « ",
  act: "Je ",
  spell: "Je lance le sort ",
};

interface PendingRoll {
  value: number;
  rollerName: string;
}

export default function SessionView() {
  const { campaignId, sessionId } = useParams<{ campaignId: string; sessionId: string }>();
  const { user, logout } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<string | undefined>();
  const [prefillToken, setPrefillToken] = useState(0);
  const [showForge, setShowForge] = useState(false);
  const [forgeAutoOpened, setForgeAutoOpened] = useState(false);
  const [pendingRoll, setPendingRoll] = useState<PendingRoll | null>(null);
  const [showInventory, setShowInventory] = useState(false);
  const [showSceneSelector, setShowSceneSelector] = useState(false);
  const [showNpcForge, setShowNpcForge] = useState(false);
  const [activeInteractionNpcId, setActiveInteractionNpcId] = useState<string | null>(null);
  const [session, setSession] = useState<SessionDoc | null>(null);
  const askingRef = useRef(false);
  const messagesScrollRef = useRef<HTMLDivElement | null>(null);
  const appliedSceneSuggestionRef = useRef<string | null>(null);
  const appliedNpcSpawnsRef = useRef<string | null>(null);
  const appliedNpcDespawnsRef = useRef<string | null>(null);
  const appliedItemGrantsRef = useRef<string | null>(null);
  const appliedHpChangesRef = useRef<string | null>(null);
  const appliedQuestUpdatesRef = useRef<string | null>(null);
  const [showQuests, setShowQuests] = useState(false);
  const [showBestiary, setShowBestiary] = useState(false);
  const bootstrappedRef = useRef(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false);

  useEffect(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, thinking]);

  useEffect(() => {
    if (!campaignId) return;
    return watchCampaign(campaignId, setCampaign);
  }, [campaignId]);

  useEffect(() => {
    if (!campaignId || !sessionId) return;
    setMessagesLoaded(false);
    bootstrappedRef.current = false;
    return watchMessages(campaignId, sessionId, (msgs) => {
      setMessages(msgs);
      setMessagesLoaded(true);
    });
  }, [campaignId, sessionId]);

  useEffect(() => {
    if (!campaignId || !sessionId) return;
    return watchSession(campaignId, sessionId, setSession);
  }, [campaignId, sessionId]);

  useEffect(() => {
    if (!campaignId) return;
    return watchCharacters(campaignId, setCharacters);
  }, [campaignId]);

  const myCharacter = useMemo(
    () => characters.find((c) => c.ownerUid === user?.uid) ?? null,
    [characters, user?.uid]
  );

  useEffect(() => {
    if (!user || !campaign) return;
    if (!myCharacter && !forgeAutoOpened) {
      setShowForge(true);
      setForgeAutoOpened(true);
    }
  }, [user, campaign, myCharacter, forgeAutoOpened]);

  const isHost = !!campaign && !!user && campaign.hostUid === user.uid;
  const lastGm = [...messages].reverse().find((m) => m.type === "gm" && !m.npcId);

  // ---------- Auto-trigger MJ/NPC for host on new player input ----------
  // Scans for the most recent player/dice message that lands AFTER the last
  // MJ response. This survives the race where bootstrap + scene-apply post
  // messages around the player's input.
  useEffect(() => {
    if (!isHost || thinking || messages.length === 0) return;

    let lastGmIdx = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].type === "gm") { lastGmIdx = i; break; }
    }

    let pending: Message | null = null;
    for (let i = messages.length - 1; i > lastGmIdx; i--) {
      const m = messages[i];
      if (m.type === "player" || m.type === "dice") { pending = m; break; }
    }
    if (!pending) return;

    const delay = pending.type === "dice" ? 2400 : 250;
    const target = pending;
    const timer = setTimeout(() => {
      if (target.interactionNpcId) {
        const npc = session?.npcs?.[target.interactionNpcId];
        if (npc) { callNpc(npc); return; }
      }
      callMj();
    }, delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isHost, thinking]);

  // ---------- Auto-apply MJ scene suggestion (host only) ----------
  useEffect(() => {
    if (!isHost) return;
    if (!lastGm?.sceneSuggestion) return;
    const key = `${lastGm.id}:${lastGm.sceneSuggestion.label}`;
    if (appliedSceneSuggestionRef.current === key) return;
    appliedSceneSuggestionRef.current = key;
    handleApplySceneSuggestion(lastGm.sceneSuggestion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastGm, isHost]);

  // ---------- Auto-apply MJ NPC spawns (host only) ----------
  useEffect(() => {
    if (!isHost) return;
    if (!lastGm?.npcSpawns || lastGm.npcSpawns.length === 0) return;
    const key = `${lastGm.id}:${lastGm.npcSpawns.map((s) => s.id ?? s.name).join(",")}`;
    if (appliedNpcSpawnsRef.current === key) return;
    appliedNpcSpawnsRef.current = key;
    handleApplyNpcSpawns(lastGm.npcSpawns);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastGm, isHost]);

  // ---------- Auto-apply MJ NPC despawns (host only) ----------
  useEffect(() => {
    if (!isHost) return;
    if (!lastGm?.npcDespawns || lastGm.npcDespawns.length === 0) return;
    const key = `${lastGm.id}:${lastGm.npcDespawns.join(",")}`;
    if (appliedNpcDespawnsRef.current === key) return;
    appliedNpcDespawnsRef.current = key;
    handleApplyNpcDespawns(lastGm.npcDespawns);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastGm, isHost]);

  // ---------- Auto-apply MJ item grants (host only) ----------
  useEffect(() => {
    if (!isHost) return;
    if (!lastGm?.itemGrants || lastGm.itemGrants.length === 0) return;
    const key = `${lastGm.id}:${lastGm.itemGrants.map((g) => g.name).join(",")}`;
    if (appliedItemGrantsRef.current === key) return;
    appliedItemGrantsRef.current = key;
    handleApplyItemGrants(lastGm.itemGrants);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastGm, isHost]);

  // ---------- Auto-apply MJ HP changes (host only) ----------
  useEffect(() => {
    if (!isHost) return;
    if (!lastGm?.hpChanges || lastGm.hpChanges.length === 0) return;
    const key = `${lastGm.id}:${lastGm.hpChanges.map((h) => `${h.target}:${h.delta ?? 0}:${h.deltaMana ?? 0}`).join(",")}`;
    if (appliedHpChangesRef.current === key) return;
    appliedHpChangesRef.current = key;
    handleApplyHpChanges(lastGm.hpChanges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastGm, isHost]);

  // ---------- Auto-apply MJ quest updates (host only) ----------
  useEffect(() => {
    if (!isHost) return;
    if (!lastGm?.questUpdates || lastGm.questUpdates.length === 0) return;
    const key = `${lastGm.id}:${lastGm.questUpdates.map((q) => `${q.id}:${q.status ?? ""}`).join(",")}`;
    if (appliedQuestUpdatesRef.current === key) return;
    appliedQuestUpdatesRef.current = key;
    handleApplyQuestUpdates(lastGm.questUpdates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastGm, isHost]);

  // ---------- Bootstrap: auto-call MJ when session opens empty (host only) ----------
  useEffect(() => {
    if (!isHost || !messagesLoaded || messages.length > 0) return;
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    callMj();
  }, [isHost, messagesLoaded, messages.length]);

  // ---------- Keyboard shortcuts ----------
  // R = roll d20 · M = "I speak" · S = "I act" · I = inventory · Esc = close.
  // Skipped while typing in inputs/textareas/contenteditable so the composer
  // and forge fields are unaffected.
  useEffect(() => {
    function isTypingTarget(t: EventTarget | null): boolean {
      if (!(t instanceof HTMLElement)) return false;
      const tag = t.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
      if (t.isContentEditable) return true;
      return false;
    }
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) {
        if (e.key === "Escape") {
          (e.target as HTMLElement).blur();
        }
        return;
      }
      if (e.key === "Escape") {
        if (showInventory) { setShowInventory(false); return; }
        if (showQuests) { setShowQuests(false); return; }
        if (showBestiary) { setShowBestiary(false); return; }
        if (showSceneSelector) { setShowSceneSelector(false); return; }
        if (showNpcForge) { setShowNpcForge(false); return; }
        if (activeInteractionNpcId) { setActiveInteractionNpcId(null); return; }
        if (pendingRoll) { setPendingRoll(null); return; }
        return;
      }
      if (showForge || showInventory || showQuests || showBestiary || showSceneSelector || showNpcForge || pendingRoll) return;
      const k = e.key.toLowerCase();
      if (k === "r") { e.preventDefault(); handleQuickAction("roll"); return; }
      if (k === "m") { e.preventDefault(); handleQuickAction("speak"); return; }
      if (k === "s") { e.preventDefault(); handleQuickAction("act"); return; }
      if (k === "i" && myCharacter) { e.preventDefault(); setShowInventory(true); return; }
      if (k === "q") { e.preventDefault(); setShowQuests(true); return; }
      if (k === "b") { e.preventDefault(); setShowBestiary(true); return; }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    showForge, showInventory, showQuests, showBestiary, showSceneSelector, showNpcForge,
    pendingRoll, activeInteractionNpcId, myCharacter,
  ]);

  if (!campaign || !campaignId || !sessionId || !user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="eyebrow animate-pulse">La table s'éveille...</div>
      </div>
    );
  }
  const activeNpc: Npc | null = activeInteractionNpcId
    ? session?.npcs?.[activeInteractionNpcId] ?? null
    : null;

  // ---------- Groq calls ----------

  async function callMj() {
    if (!campaignId || !sessionId || askingRef.current) return;
    askingRef.current = true;
    setError(null);
    setThinking(true);
    try {
      const ctx = buildContextSuffix({
        campaign,
        scene: session?.currentScene,
        myCharacter,
        npcs: session?.npcs,
        quests: session?.quests,
      });
      const transcript: GroqMessage[] = [
        { role: "system", content: `${MJ_SYSTEM_PROMPT}${ctx}` },
        ...messages
          .filter((m) => !m.npcId && !m.interactionNpcId) // exclude private NPC dialogue from MJ context
          .map((m): GroqMessage => ({
            role: m.type === "gm" ? "assistant" : "user",
            content: m.type === "gm" ? m.content : `[${m.type}] ${m.content}`,
          })),
      ];
      await callGroq({
        campaignId,
        sessionId,
        messages: transcript,
        persistAs: "gm",
        structured: true,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Le MJ a perdu sa voix.");
    } finally {
      setThinking(false);
      askingRef.current = false;
    }
  }

  async function callNpc(npc: Npc) {
    if (!campaignId || !sessionId || askingRef.current) return;
    askingRef.current = true;
    setError(null);
    setThinking(true);
    try {
      const persona = buildNpcPersonaSuffix(npc);
      const ctx = buildContextSuffix({
        campaign,
        scene: session?.currentScene,
        myCharacter,
      });
      const interactionLog = messages.filter(
        (m) => m.interactionNpcId === npc.id || m.npcId === npc.id
      );
      const transcript: GroqMessage[] = [
        { role: "system", content: `${NPC_VOICE_PROMPT}${persona}${ctx}` },
        ...interactionLog.map((m): GroqMessage => ({
          role: m.npcId === npc.id ? "assistant" : "user",
          content: m.content,
        })),
      ];
      await callGroq({
        campaignId,
        sessionId,
        messages: transcript,
        persistAs: "gm",
        structured: true,
        npcId: npc.id,
        interactionNpcId: npc.id,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : `${npc.name} reste muet.`);
    } finally {
      setThinking(false);
      askingRef.current = false;
    }
  }

  // ---------- Player actions ----------

  async function send(content: string) {
    if (!campaignId || !sessionId || !user) return;
    setError(null);
    await postMessage(
      campaignId,
      sessionId,
      user.uid,
      content,
      "player",
      activeInteractionNpcId ? { interactionNpcId: activeInteractionNpcId } : {}
    );
  }

  async function handleQuickAction(kind: QuickAction) {
    if (!campaignId || !sessionId || !user) return;
    if (kind === "roll") {
      const value = Math.floor(Math.random() * 20) + 1;
      const who = myCharacter?.name ?? user.displayName ?? "Aventurier";
      setPendingRoll({ value, rollerName: who });
      const diceText = `${who} lance 1d20 → ${value}${value === 20 ? " (réussite critique !)" : value === 1 ? " (échec critique !)" : ""}`;
      await postMessage(campaignId, sessionId, user.uid, diceText, "dice");
      return;
    }
    setPrefill(PREFILLS[kind]);
    setPrefillToken((n) => n + 1);
  }

  function handleSuggestedAction(action: SuggestedAction) {
    setPrefill(action.prompt);
    setPrefillToken((n) => n + 1);
  }

  async function handleApplySceneSuggestion(suggestion: SceneSuggestion) {
    if (!campaignId || !sessionId || !user) return;
    const scene: CurrentScene = {
      id: suggestion.id ?? `mj_${Date.now()}`,
      label: suggestion.label,
      prompt: suggestion.prompt,
      seed: Math.floor(Math.random() * 1_000_000),
    };
    await updateSession(campaignId, sessionId, { currentScene: scene });
    await postMessage(campaignId, sessionId, user.uid, `Le décor change : ${scene.label}.`, "system");
  }

  async function handleApplyNpcSpawns(spawns: NpcSpawn[]) {
    if (!campaignId || !sessionId || !user) return;
    const existing = session?.npcs ?? {};
    const existingByName = new Map(
      Object.values(existing).map((n) => [n.name.toLowerCase(), n])
    );
    const next = { ...existing };
    const added: Npc[] = [];
    for (const s of spawns) {
      if (existingByName.has(s.name.toLowerCase())) continue;
      const proposedId = s.id && !existing[s.id] ? s.id : null;
      const id =
        proposedId ?? `npc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const npc: Npc = {
        id,
        name: s.name,
        role: s.role,
        description: s.description,
        portraitSeed: Math.floor(Math.random() * 1_000_000),
      };
      if (s.appearancePrompt) npc.appearancePrompt = s.appearancePrompt;
      next[id] = npc;
      added.push(npc);
    }
    if (added.length === 0) return;
    await updateSession(campaignId, sessionId, { npcs: next });
    for (const n of added) {
      await postMessage(
        campaignId,
        sessionId,
        user.uid,
        `${n.name} entre en scène.`,
        "system"
      );
    }
  }

  async function handleApplyNpcDespawns(names: string[]) {
    if (!campaignId || !sessionId || !user) return;
    const existing = session?.npcs ?? {};
    const existingTokens = session?.npcTokens ?? {};
    const removedNames: string[] = [];
    const removedNpcs: Npc[] = [];
    const nextNpcs: Record<string, Npc> = {};
    const nextTokens: Record<string, { x: number; y: number }> = { ...existingTokens };
    const targets = new Set(names.map((n) => n.toLowerCase().trim()));
    for (const [id, npc] of Object.entries(existing)) {
      const matches = targets.has(npc.name.toLowerCase().trim()) || targets.has(id.toLowerCase());
      if (matches) {
        removedNames.push(npc.name);
        removedNpcs.push(npc);
        delete nextTokens[id];
        // Also clear an active dialogue with this NPC if any.
        if (activeInteractionNpcId === id) setActiveInteractionNpcId(null);
      } else {
        nextNpcs[id] = npc;
      }
    }
    if (removedNames.length === 0) return;
    await updateSession(campaignId, sessionId, { npcs: nextNpcs, npcTokens: nextTokens });
    await mergeIntoBestiary(removedNpcs);
    for (const name of removedNames) {
      await postMessage(
        campaignId,
        sessionId,
        user.uid,
        `${name} quitte la scène.`,
        "system"
      );
    }
  }

  async function mergeIntoBestiary(removed: Npc[]) {
    if (!campaignId || removed.length === 0) return;
    const current = campaign?.bestiary ?? {};
    const next: Record<string, BestiaryEntry> = { ...current };
    for (const npc of removed) {
      const slug = npc.id || npc.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 32);
      const prev = next[slug];
      const outcome: BestiaryEntry["outcome"] =
        typeof npc.hp === "number" && npc.hp <= 0 ? "defeated" : "departed";
      const entry: BestiaryEntry = {
        id: slug,
        name: npc.name,
        role: npc.role,
        description: npc.description,
        outcome,
        encounters: (prev?.encounters ?? 0) + 1,
      };
      if (npc.appearancePrompt) entry.appearancePrompt = npc.appearancePrompt;
      next[slug] = entry;
    }
    await updateCampaign(campaignId, { bestiary: next });
  }

  async function handleApplyItemGrants(grants: ItemGrant[]) {
    if (!campaignId || !sessionId || !user || characters.length === 0) return;

    function makeItem(g: ItemGrant): Item {
      const slug = g.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 24) || "item";
      const item: Item = {
        id: `${g.type}_${slug}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: g.name,
        type: g.type,
        description: g.description,
      };
      if (g.slot) item.slot = g.slot;
      if (g.flavor) item.flavor = g.flavor;
      if (g.consumable) item.consumable = true;
      if (g.quantity && g.quantity > 1) item.quantity = g.quantity;
      return item;
    }

    function findTarget(name?: string): Character | null {
      if (!name) return null;
      const needle = name.toLowerCase().trim();
      return (
        characters.find((c) => c.name.toLowerCase() === needle) ??
        characters.find((c) => c.name.toLowerCase().startsWith(needle)) ??
        null
      );
    }

    // Group grants by target character. Targeted grants go only to the named
    // character; untargeted grants go to every character (party loot).
    const updates = new Map<string, { char: Character; items: Item[] }>();
    const lines: string[] = [];
    for (const g of grants) {
      const target = findTarget(g.character);
      const recipients = target ? [target] : characters;
      for (const r of recipients) {
        const item = makeItem(g);
        if (!updates.has(r.id)) updates.set(r.id, { char: r, items: [] });
        updates.get(r.id)!.items.push(item);
      }
      const qtyLabel = g.quantity && g.quantity > 1 ? ` ×${g.quantity}` : "";
      lines.push(
        target
          ? `${target.name} reçoit : ${g.name}${qtyLabel}.`
          : `Butin : ${g.name}${qtyLabel}.`
      );
    }

    for (const { char, items } of updates.values()) {
      const nextInventory = [...char.inventory, ...items];
      await updateCharacter(campaignId, char.id, { inventory: nextInventory });
    }
    for (const line of lines) {
      await postMessage(campaignId, sessionId, user.uid, line, "system");
    }
  }

  async function handleApplyHpChanges(changes: HpChange[]) {
    if (!campaignId || !sessionId || !user) return;
    const npcMap = session?.npcs ?? {};
    const npcByName = new Map(
      Object.entries(npcMap).map(([id, n]) => [n.name.toLowerCase().trim(), { id, npc: n }])
    );
    const charByName = new Map(
      characters.map((c) => [c.name.toLowerCase().trim(), c])
    );

    const charPatch = new Map<string, Partial<Character>>();
    const npcPatch: Record<string, Npc> = {};
    let npcDirty = false;
    const lines: string[] = [];

    function fmtDelta(d: number, kind: "hp" | "mana", reason?: string): string {
      const verb = kind === "hp"
        ? d < 0 ? `subit ${-d} dégât${-d > 1 ? "s" : ""}` : `regagne ${d} PV`
        : d < 0 ? `dépense ${-d} mana` : `regagne ${d} mana`;
      return reason ? `${verb} (${reason})` : verb;
    }

    for (const ch of changes) {
      const needle = ch.target.toLowerCase().trim();
      const charHit = charByName.get(needle)
        ?? characters.find((c) => c.name.toLowerCase().startsWith(needle));
      if (charHit) {
        const patch = charPatch.get(charHit.id) ?? {};
        if (typeof ch.delta === "number" && typeof charHit.maxHp === "number") {
          const cur = (patch.hp ?? charHit.hp ?? charHit.maxHp);
          patch.hp = Math.max(0, Math.min(charHit.maxHp, cur + ch.delta));
        }
        if (typeof ch.deltaMana === "number" && typeof charHit.maxMana === "number") {
          const cur = (patch.mana ?? charHit.mana ?? charHit.maxMana);
          patch.mana = Math.max(0, Math.min(charHit.maxMana, cur + ch.deltaMana));
        }
        charPatch.set(charHit.id, patch);
        if (typeof ch.delta === "number") lines.push(`${charHit.name} ${fmtDelta(ch.delta, "hp", ch.reason)}.`);
        if (typeof ch.deltaMana === "number") lines.push(`${charHit.name} ${fmtDelta(ch.deltaMana, "mana", ch.reason)}.`);
        continue;
      }

      const npcHit = npcByName.get(needle);
      if (npcHit) {
        const cur = npcPatch[npcHit.id] ?? { ...npcHit.npc };
        // Default an NPC's maxHp on first hit so deltas have a clamp.
        if (typeof cur.maxHp !== "number") cur.maxHp = 20;
        if (typeof cur.hp !== "number") cur.hp = cur.maxHp;
        if (typeof ch.delta === "number") {
          cur.hp = Math.max(0, Math.min(cur.maxHp, cur.hp + ch.delta));
          lines.push(`${cur.name} ${fmtDelta(ch.delta, "hp", ch.reason)}.`);
        }
        npcPatch[npcHit.id] = cur;
        npcDirty = true;
      }
    }

    for (const [id, patch] of charPatch.entries()) {
      if (Object.keys(patch).length > 0) await updateCharacter(campaignId, id, patch);
    }
    if (npcDirty) {
      const merged: Record<string, Npc> = { ...npcMap };
      for (const [id, n] of Object.entries(npcPatch)) merged[id] = n;
      await updateSession(campaignId, sessionId, { npcs: merged });
    }
    for (const line of lines) {
      await postMessage(campaignId, sessionId, user.uid, line, "system");
    }
  }

  async function handleApplyQuestUpdates(updates: QuestUpdate[]) {
    if (!campaignId || !sessionId || !user) return;
    const existing = session?.quests ?? {};
    const next: Record<string, Quest> = { ...existing };
    const lines: string[] = [];
    for (const u of updates) {
      const prev = next[u.id];
      if (prev) {
        const merged: Quest = {
          ...prev,
          title: u.title ?? prev.title,
          summary: u.summary ?? prev.summary,
          status: u.status ?? prev.status,
        };
        next[u.id] = merged;
        if (u.status && u.status !== prev.status) {
          const word = u.status === "completed" ? "accomplie" : u.status === "failed" ? "échouée" : "rouverte";
          lines.push(`Quête ${word} : ${merged.title}.`);
        }
      } else if (u.title && u.summary) {
        next[u.id] = {
          id: u.id,
          title: u.title,
          summary: u.summary,
          status: u.status ?? "active",
        };
        lines.push(`Nouvelle quête : ${u.title}.`);
      }
    }
    await updateSession(campaignId, sessionId, { quests: next });
    for (const line of lines) {
      await postMessage(campaignId, sessionId, user.uid, line, "system");
    }
  }

  async function handleForge(data: NewCharacter) {
    if (!campaignId || !user) return;
    await createCharacter(campaignId, data);
    setShowForge(false);
  }

  async function handlePickScene(scene: CurrentScene) {
    if (!campaignId || !sessionId || !user) return;
    await updateSession(campaignId, sessionId, { currentScene: scene });
    await postMessage(campaignId, sessionId, user.uid, `Le décor change : ${scene.label}.`, "system");
    setShowSceneSelector(false);
  }

  async function handleMoveCharacterToken(charId: string, pos: TokenPosition) {
    if (!campaignId || !sessionId) return;
    const nextTokens = { ...(session?.tokens ?? {}), [charId]: pos };
    await updateSession(campaignId, sessionId, { tokens: nextTokens });
  }

  async function handleMoveNpcToken(npcId: string, pos: TokenPosition) {
    if (!campaignId || !sessionId) return;
    const nextTokens = { ...(session?.npcTokens ?? {}), [npcId]: pos };
    await updateSession(campaignId, sessionId, { npcTokens: nextTokens });
  }

  async function handleCreateNpc(npc: Npc) {
    if (!campaignId || !sessionId || !user) return;
    const nextNpcs = { ...(session?.npcs ?? {}), [npc.id]: npc };
    await updateSession(campaignId, sessionId, { npcs: nextNpcs });
    await postMessage(
      campaignId,
      sessionId,
      user.uid,
      `${npc.name} entre en scène.`,
      "system"
    );
    setShowNpcForge(false);
  }

  function handleClickNpc(npc: Npc) {
    setActiveInteractionNpcId(npc.id);
  }

  async function handleItemAction(item: Item, action: ItemAction) {
    if (!campaignId || !sessionId || !user || !myCharacter) return;
    const ch = myCharacter;
    const equipment: Equipment = ch.equipment ?? {};
    const slot = item.slot;

    let newInventory = ch.inventory;
    let newEquipment: Equipment = equipment;
    let line = "";

    if (action === "use") {
      const remainingQty = (item.quantity ?? 1) - 1;
      newInventory = remainingQty > 0
        ? ch.inventory.map((i) => (i.id === item.id ? { ...i, quantity: remainingQty } : i))
        : ch.inventory.filter((i) => i.id !== item.id);
      line = `${ch.name} utilise ${item.name}.`;
    } else if (action === "equip" && slot) {
      const previouslyEquipped = equipment[slot];
      newEquipment = { ...equipment, [slot]: item };
      line = previouslyEquipped
        ? `${ch.name} range ${previouslyEquipped.name} et équipe ${item.name}.`
        : `${ch.name} équipe ${item.name}.`;
    } else if (action === "unequip" && slot) {
      newEquipment = { ...equipment, [slot]: null };
      line = `${ch.name} range ${item.name}.`;
    } else if (action === "drop") {
      newInventory = ch.inventory.filter((i) => i.id !== item.id);
      const slots: EquipSlot[] = ["weapon", "armor", "accessory"];
      const eqCopy: Equipment = { ...equipment };
      for (const s of slots) {
        if (eqCopy[s]?.id === item.id) eqCopy[s] = null;
      }
      newEquipment = eqCopy;
      line = `${ch.name} jette ${item.name}.`;
    }

    await updateCharacter(campaignId, ch.id, {
      inventory: newInventory,
      equipment: newEquipment,
    });
    if (line) {
      await postMessage(
        campaignId,
        sessionId,
        user.uid,
        line,
        "system",
        activeInteractionNpcId ? { interactionNpcId: activeInteractionNpcId } : {}
      );
    }
  }

  return (
    <div className="h-screen relative flex flex-col overflow-hidden">
      <SceneStage
        campaignName={campaign.name}
        characters={characters}
        currentUid={user.uid}
        isHost={isHost}
        scene={session?.currentScene}
        tokens={session?.tokens}
        npcs={session?.npcs}
        npcTokens={session?.npcTokens}
        onMoveCharacterToken={handleMoveCharacterToken}
        onMoveNpcToken={handleMoveNpcToken}
        onClickNpc={handleClickNpc}
      />

      <header className="relative z-10 h-12 border-b border-hairline bg-ink-900/70 backdrop-blur-md flex items-center justify-between px-5">
        <div className="flex items-center gap-4">
          <Link
            to={`/campaigns/${campaignId}`}
            className="font-mono text-[10px] tracking-label uppercase text-ink-300 hover:text-gold-400"
          >
            ← Table
          </Link>
          <div className="font-mono text-[10px] tracking-label uppercase text-ink-300">
            <span className="text-parchment">Mythoria</span> · {campaign.name} · Tour {messages.filter((m) => m.type === "gm" && !m.npcId).length + 1}
          </div>
        </div>
        <div className="flex items-center gap-5">
          <button
            onClick={() => setShowQuests(true)}
            className="font-mono text-[10px] tracking-label uppercase text-ink-300 hover:text-gold-400"
            title="Journal de quêtes (Q)"
          >
            📜 Quêtes{(() => {
              const a = session?.quests
                ? Object.values(session.quests).filter((q) => q.status === "active").length
                : 0;
              return a > 0 ? ` · ${a}` : "";
            })()}
          </button>
          <button
            onClick={() => setShowBestiary(true)}
            className="font-mono text-[10px] tracking-label uppercase text-ink-300 hover:text-gold-400"
            title="Bestiaire (B)"
          >
            🐺 Bestiaire{(() => {
              const n = campaign?.bestiary ? Object.keys(campaign.bestiary).length : 0;
              return n > 0 ? ` · ${n}` : "";
            })()}
          </button>
          <span className="font-mono text-[10px] tracking-label uppercase text-ink-400">
            {user.displayName ?? user.email?.split("@")[0]}
          </span>
          <button
            onClick={logout}
            className="font-mono text-[10px] tracking-label uppercase text-ink-400 hover:text-ember"
          >
            Sortir
          </button>
        </div>
      </header>

      {isHost && (
        <div className="absolute top-16 right-[316px] z-30 flex flex-col gap-2 items-end">
          <button
            onClick={() => setShowSceneSelector(true)}
            className="panel px-3 py-2 font-mono text-[10px] tracking-label uppercase text-gold-300 hover:border-gold-500 hover:text-gold-200 transition-colors"
            title="Changer la scène"
          >
            🗺 {session?.currentScene ? "Changer la scène" : "Choisir une scène"}
          </button>
          <button
            onClick={() => setShowNpcForge(true)}
            className="panel px-3 py-2 font-mono text-[10px] tracking-label uppercase text-gold-300 hover:border-gold-500 hover:text-gold-200 transition-colors"
            title="Faire entrer un PNJ"
          >
            + Ajouter un PNJ
          </button>
        </div>
      )}

      <div className="relative z-10 flex-1 flex min-h-0">
        <div
          ref={messagesScrollRef}
          className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-8 py-6 space-y-3 pb-[180px]"
        >
          {messages.length === 0 ? (
            <div className="max-w-lg mx-auto mt-20 text-center">
              <div className="eyebrow mb-3">Page blanche</div>
              <p className="font-serif italic text-[18px] text-parchment-2 leading-relaxed">
                « La lanterne n'est pas encore allumée. {isHost ? "Pose la première scène, ou demande au MJ de commencer." : "Attends que le MJ ouvre le chapitre."} »
              </p>
            </div>
          ) : (
            messages.map((m) => (
              <TranscriptLine
                key={m.id}
                message={m}
                currentUid={user.uid}
                npcName={m.npcId ? session?.npcs?.[m.npcId]?.name : undefined}
              />
            ))
          )}
          {thinking && !activeNpc && (
            <div className="fade-in panel-gold p-4 max-w-2xl">
              <div className="eyebrow text-arcane mb-1">Le Maître</div>
              <p className="font-serif italic text-parchment-2 text-[15px] animate-pulse m-0">
                réfléchit à haute voix...
              </p>
            </div>
          )}
        </div>

        {activeNpc ? (
          <InteractionScene
            npc={activeNpc}
            messages={messages}
            thinking={thinking}
            hasCharacter={Boolean(myCharacter)}
            onSuggestedAction={handleSuggestedAction}
            onSpeak={() => {
              setPrefill(`Je dis à ${activeNpc.name} : « `);
              setPrefillToken((n) => n + 1);
            }}
            onClose={() => setActiveInteractionNpcId(null)}
          />
        ) : (
          <NarrationPanel
            message={lastGm}
            isHost={isHost}
            thinking={thinking}
            onAskGM={() => callMj()}
            canAsk={messages.length > 0}
            onQuickAction={handleQuickAction}
            onSuggestedAction={handleSuggestedAction}
            onApplySceneSuggestion={
              lastGm?.sceneSuggestion ? () => handleApplySceneSuggestion(lastGm.sceneSuggestion!) : undefined
            }
            hasCharacter={Boolean(myCharacter)}
          />
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-[300px] z-20 p-4">
        {error && <div className="mb-2 chip chip-ember">{error}</div>}
        {activeNpc && (
          <div className="mb-2 chip chip-gold">
            Tu parles à {activeNpc.name} — tape ta réplique
          </div>
        )}
        <div className="flex gap-3 items-end">
          <PlayerHUD
            displayName={user.displayName ?? user.email?.split("@")[0] ?? "Aventurier"}
            character={myCharacter}
            onForge={() => setShowForge(true)}
            onOpenInventory={() => setShowInventory(true)}
          />
          <Composer onSend={send} prefill={prefill} prefillToken={prefillToken} />
        </div>
      </div>

      {showForge && (
        <CharacterForge
          ownerUid={user.uid}
          onCreate={handleForge}
          onClose={() => setShowForge(false)}
          dismissible={Boolean(myCharacter)}
        />
      )}

      {pendingRoll && (
        <DiceRoll
          finalValue={pendingRoll.value}
          rollerName={pendingRoll.rollerName}
          onDone={() => setPendingRoll(null)}
        />
      )}

      {showInventory && myCharacter && (
        <Inventory
          character={myCharacter}
          onClose={() => setShowInventory(false)}
          onAction={handleItemAction}
        />
      )}

      {showSceneSelector && (
        <SceneSelector
          current={session?.currentScene}
          onPick={handlePickScene}
          onClose={() => setShowSceneSelector(false)}
        />
      )}

      {showNpcForge && (
        <NpcForge onCreate={handleCreateNpc} onClose={() => setShowNpcForge(false)} />
      )}

      {showQuests && (
        <QuestLog quests={session?.quests} onClose={() => setShowQuests(false)} />
      )}

      {showBestiary && (
        <Bestiary bestiary={campaign?.bestiary} onClose={() => setShowBestiary(false)} />
      )}

      <MusicPlayer scene={session?.currentScene} npcs={session?.npcs} />
    </div>
  );
}

function TranscriptLine({
  message,
  currentUid,
  npcName,
}: {
  message: Message;
  currentUid: string;
  npcName?: string;
}) {
  const m = message;
  if (m.type === "gm" && m.npcId) {
    return (
      <div className="fade-in panel p-4 max-w-2xl mr-auto" style={{ borderColor: "rgba(217,185,104,.4)" }}>
        <div className="eyebrow mb-1" style={{ color: "var(--gold-400)" }}>
          {npcName ?? "PNJ"}
        </div>
        <p className="font-serif italic text-parchment-2 text-[14px] leading-[1.55] m-0 whitespace-pre-wrap">
          {m.content}
        </p>
      </div>
    );
  }
  if (m.type === "gm") {
    return (
      <div className="fade-in panel-gold p-5 max-w-3xl mr-auto">
        <div className="eyebrow text-arcane mb-2">Le Maître raconte</div>
        <p className="font-serif italic text-parchment-2 text-[16px] leading-[1.55] m-0 whitespace-pre-wrap">
          {m.content}
        </p>
      </div>
    );
  }
  if (m.type === "system" || m.type === "dice") {
    return (
      <div className="fade-in flex items-center gap-3 py-1.5 max-w-3xl mr-auto">
        <span className="chip chip-moss">{m.type === "dice" ? "Dé" : "Système"}</span>
        <span className="font-mono text-[12px] text-ink-300">{m.content}</span>
      </div>
    );
  }
  const mine = m.authorUid === currentUid;
  return (
    <div className={`fade-in panel p-4 max-w-2xl ${mine ? "ml-auto border-gold-500/30" : "mr-auto"}`}>
      <div className="eyebrow mb-1">
        {mine ? "Toi" : m.authorUid.slice(0, 6)} · action
      </div>
      <p className="font-sans text-parchment text-[14px] leading-[1.6] m-0 whitespace-pre-wrap">
        {m.content}
      </p>
    </div>
  );
}
