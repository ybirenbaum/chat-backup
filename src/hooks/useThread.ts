"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import type { ChatMessage, ThreadMeta } from "@/lib/types";

/** Loads a signed-in user's own thread metadata + its messages.json. */
export function useThread(threadId: string) {
  const { user } = useAuth();
  const [thread, setThread] = useState<ThreadMeta | null>(null);
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid, "threads", threadId));
        if (!snap.exists()) throw new Error("Thread not found.");
        const data = snap.data();
        if (cancelled) return;

        const meta: ThreadMeta = {
          id: threadId,
          name: data.name,
          createdAt: data.createdAt?.toDate?.().toISOString() ?? "",
          participants: data.participants ?? [],
          messageCount: data.messageCount ?? 0,
          mediaCount: data.mediaCount ?? 0,
          skippedMediaCount: data.skippedMediaCount ?? 0,
          messagesUrl: data.messagesUrl,
        };
        setThread(meta);

        const res = await fetch(meta.messagesUrl);
        const json: ChatMessage[] = await res.json();
        if (!cancelled) setMessages(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load chat.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [threadId, user]);

  return { thread, messages, error };
}
