import {
  collection, doc, addDoc, updateDoc, getDoc, getDocs, query, where, orderBy,
  serverTimestamp, onSnapshot, Unsubscribe, QueryConstraint, writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Campaign, Character, Message, SessionDoc } from "./types";

function generateInviteCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

export async function createCampaign(hostUid: string, name: string, description: string): Promise<string> {
  const ref = await addDoc(collection(db, "campaigns"), {
    name,
    description,
    hostUid,
    playerUids: [hostUid],
    inviteCode: generateInviteCode(),
    status: "active",
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "campaigns", ref.id), {});
  return ref.id;
}

export function watchMyCampaigns(uid: string, cb: (campaigns: Campaign[]) => void): Unsubscribe {
  const q = query(
    collection(db, "campaigns"),
    where("playerUids", "array-contains", uid),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Campaign, "id">) })));
  });
}

export async function getCampaign(campaignId: string): Promise<Campaign | null> {
  const snap = await getDoc(doc(db, "campaigns", campaignId));
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<Campaign, "id">) }) : null;
}

export async function deleteCampaign(campaignId: string): Promise<void> {
  // Firestore Web SDK has no recursive delete — clean leaves first, then trunk.
  const sessSnap = await getDocs(collection(db, `campaigns/${campaignId}/sessions`));

  for (const s of sessSnap.docs) {
    const msgs = await getDocs(collection(db, `campaigns/${campaignId}/sessions/${s.id}/messages`));
    if (!msgs.empty) {
      const msgBatch = writeBatch(db);
      msgs.docs.forEach((m) => msgBatch.delete(m.ref));
      await msgBatch.commit();
    }
  }

  const charSnap = await getDocs(collection(db, `campaigns/${campaignId}/characters`));

  const batch = writeBatch(db);
  sessSnap.docs.forEach((d) => batch.delete(d.ref));
  charSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, "campaigns", campaignId));
  await batch.commit();
}

export function watchMessages(
  campaignId: string,
  sessionId: string,
  cb: (messages: Message[]) => void
): Unsubscribe {
  const q = query(
    collection(db, `campaigns/${campaignId}/sessions/${sessionId}/messages`),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Message, "id">) })));
  });
}

export async function postMessage(
  campaignId: string,
  sessionId: string,
  authorUid: string,
  content: string,
  type: Message["type"] = "player",
  extra: Partial<Pick<Message, "interactionNpcId">> = {}
): Promise<void> {
  const data: Record<string, unknown> = {
    type,
    authorUid,
    content,
    createdAt: serverTimestamp(),
  };
  if (extra.interactionNpcId) data.interactionNpcId = extra.interactionNpcId;
  await addDoc(collection(db, `campaigns/${campaignId}/sessions/${sessionId}/messages`), data);
}

export async function listSessions(campaignId: string): Promise<SessionDoc[]> {
  const snap = await getDocs(
    query(collection(db, `campaigns/${campaignId}/sessions`), orderBy("startedAt", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SessionDoc, "id">) }));
}

export async function createSession(campaignId: string): Promise<string> {
  const ref = await addDoc(collection(db, `campaigns/${campaignId}/sessions`), {
    startedAt: serverTimestamp(),
  });
  return ref.id;
}

export function watchSession(
  campaignId: string,
  sessionId: string,
  cb: (session: SessionDoc | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, `campaigns/${campaignId}/sessions`, sessionId), (snap) => {
    cb(snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<SessionDoc, "id">) }) : null);
  });
}

export async function updateSession(
  campaignId: string,
  sessionId: string,
  partial: Partial<Omit<SessionDoc, "id">>
): Promise<void> {
  await updateDoc(doc(db, `campaigns/${campaignId}/sessions`, sessionId), partial as Record<string, unknown>);
}

export async function listCharacters(campaignId: string, constraints: QueryConstraint[] = []): Promise<Character[]> {
  const snap = await getDocs(
    query(collection(db, `campaigns/${campaignId}/characters`), ...constraints)
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Character, "id">) }));
}

export async function createCharacter(
  campaignId: string,
  data: Omit<Character, "id">
): Promise<string> {
  const ref = await addDoc(collection(db, `campaigns/${campaignId}/characters`), data);
  return ref.id;
}

export async function updateCharacter(
  campaignId: string,
  characterId: string,
  partial: Partial<Omit<Character, "id">>
): Promise<void> {
  await updateDoc(doc(db, `campaigns/${campaignId}/characters`, characterId), partial as Record<string, unknown>);
}

export function watchCharacters(
  campaignId: string,
  cb: (characters: Character[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, `campaigns/${campaignId}/characters`), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Character, "id">) })));
  });
}
