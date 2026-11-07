import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { ShareDoc } from "./types";

export function shareUrl(threadId: string): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}${basePath}/share/?id=${encodeURIComponent(threadId)}`;
}

export async function getShare(threadId: string): Promise<ShareDoc | null> {
  const snap = await getDoc(doc(db, "shares", threadId));
  if (!snap.exists()) return null;
  return snap.data() as ShareDoc;
}

export async function createShare(
  uid: string,
  threadId: string,
  thread: { name: string; participants: string[]; messagesUrl: string }
): Promise<void> {
  await setDoc(doc(db, "shares", threadId), {
    ownerUid: uid,
    threadId,
    name: thread.name,
    participants: thread.participants,
    messagesUrl: thread.messagesUrl,
    createdAt: serverTimestamp(),
  });
}

export async function deleteShare(threadId: string): Promise<void> {
  await deleteDoc(doc(db, "shares", threadId));
}
