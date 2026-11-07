"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ChatMessage } from "@/lib/types";
import ChatThreadViewer from "@/components/ChatThreadViewer";

export default function SharePage() {
  const [threadName, setThreadName] = useState("");
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Read the share id from the query string manually (rather than
    // next/navigation's useSearchParams) so this page works as a plain
    // static export with no server-side rendering involved.
    let cancelled = false;
    (async () => {
      try {
        const id = new URLSearchParams(window.location.search).get("id");
        if (!id) throw new Error("No chat was specified in this link.");

        const snap = await getDoc(doc(db, "shares", id));
        if (!snap.exists()) {
          throw new Error("This chat is no longer shared, or the link is invalid.");
        }
        const data = snap.data();
        if (cancelled) return;
        setThreadName(data.name);

        const res = await fetch(data.messagesUrl);
        const json: ChatMessage[] = await res.json();
        if (!cancelled) setMessages(json);
      } catch (e) {
        if (cancelled) return;
        // A permission-denied read means the share rule rejected us, which
        // in practice means the same thing to a viewer as a missing doc.
        const isPermissionError =
          e instanceof Error && e.message.toLowerCase().includes("permission");
        setError(
          isPermissionError
            ? "This chat is no longer shared, or the link is invalid."
            : e instanceof Error
              ? e.message
              : "Failed to load this chat."
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center justify-between bg-emerald-600 px-4 py-2 text-xs text-white">
        <span>You&apos;re viewing a shared, read-only chat backup.</span>
      </div>
      <ChatThreadViewer threadName={threadName} messages={messages} error={error} />
    </div>
  );
}
