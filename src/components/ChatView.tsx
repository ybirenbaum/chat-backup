"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import type { ChatMessage } from "@/lib/types";
import MessageBubble from "./MessageBubble";

export default function ChatView({ threadId }: { threadId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [threadName, setThreadName] = useState("");
  const [search, setSearch] = useState("");
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
        setThreadName(data.name);

        const res = await fetch(data.messagesPath.startsWith("http") ? data.messagesPath : await resolveDownloadUrl(data.messagesPath));
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

  const filtered = useMemo(() => {
    if (!messages) return [];
    if (!search.trim()) return messages;
    const q = search.toLowerCase();
    return messages.filter(
      (m) =>
        m.text.toLowerCase().includes(q) ||
        m.sender?.toLowerCase().includes(q) ||
        m.media?.fileName.toLowerCase().includes(q)
    );
  }, [messages, search]);

  return (
    <div className="flex h-screen flex-1 flex-col bg-neutral-100 dark:bg-neutral-950">
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {threadName}
        </h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search this chat…"
          className="w-64 rounded-md border border-neutral-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {error && <p className="text-sm text-red-500">{error}</p>}
        {!error && messages === null && (
          <p className="text-sm text-neutral-400">Loading messages…</p>
        )}
        {!error && messages !== null && filtered.length === 0 && (
          <p className="text-sm text-neutral-400">No messages match your search.</p>
        )}
        <div className="mx-auto flex max-w-2xl flex-col">
          {filtered.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
        </div>
      </div>
    </div>
  );
}

// messagesPath is stored as a gs:// storage path; resolve it to an https
// download URL lazily (keeps the Firestore doc free of long-lived URLs).
async function resolveDownloadUrl(path: string): Promise<string> {
  const { ref, getDownloadURL } = await import("firebase/storage");
  const { storage } = await import("@/lib/firebase");
  return getDownloadURL(ref(storage, path));
}
