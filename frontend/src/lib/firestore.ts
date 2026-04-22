import {
  collection, doc, addDoc, updateDoc, getDoc, getDocs, query, where, orderBy,
  serverTimestamp, onSnapshot, Unsubscribe, QueryConstraint,
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
  type: Message["type"] = "player"
): Promise<void> {
  await addDoc(collection(db, `campaigns/${campaignId}/sessions/${sessionId}/messages`), {
    type,
    authorUid,
    content,
    createdAt: serverTimestamp(),
  });
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
