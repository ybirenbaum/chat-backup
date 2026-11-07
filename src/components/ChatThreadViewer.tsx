"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { ChatMessage } from "@/lib/types";
import MessageBubble from "./MessageBubble";

export default function ChatThreadViewer({
  threadName,
  messages,
  error,
  headerLeft,
  headerRight,
}: {
  threadName: string;
  messages: ChatMessage[] | null;
  error: string | null;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
}) {
  const [search, setSearch] = useState("");

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
    <div className="flex min-h-0 flex-1 flex-col bg-neutral-100 dark:bg-neutral-950">
      <div className="flex items-center justify-between gap-3 border-b border-neutral-200 bg-white px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex min-w-0 items-center gap-3">
          {headerLeft}
          <h2 className="truncate text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {threadName}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search this chat…"
            className="w-64 rounded-md border border-neutral-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          />
          {headerRight}
        </div>
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
