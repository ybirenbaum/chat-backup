"use client";

import { useEffect, useState } from "react";
import type { ThreadMeta, ShareDoc } from "@/lib/types";
import { createShare, deleteShare, getShare, shareUrl } from "@/lib/share";

export default function ShareControl({
  uid,
  thread,
}: {
  uid: string;
  thread: ThreadMeta;
}) {
  const [share, setShare] = useState<ShareDoc | null | "loading">("loading");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getShare(thread.id)
      .then((s) => !cancelled && setShare(s))
      .catch(() => !cancelled && setShare(null));
    return () => {
      cancelled = true;
    };
  }, [thread.id]);

  async function handleCreate() {
    setBusy(true);
    try {
      await createShare(uid, thread.id, {
        name: thread.name,
        participants: thread.participants,
        messagesUrl: thread.messagesUrl,
      });
      setShare(await getShare(thread.id));
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl(thread.id));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleStop() {
    setBusy(true);
    try {
      await deleteShare(thread.id);
      setShare(null);
    } finally {
      setBusy(false);
    }
  }

  if (share === "loading") return null;

  if (!share) {
    return (
      <button
        onClick={handleCreate}
        disabled={busy}
        className="flex items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
      >
        🔗 {busy ? "Creating link…" : "Share chat"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700"
      >
        🔗 {copied ? "Link copied!" : "Copy share link"}
      </button>
      <button
        onClick={handleStop}
        disabled={busy}
        title="Anyone with the old link will lose access"
        className="text-xs text-neutral-400 underline hover:text-neutral-600 disabled:opacity-60 dark:hover:text-neutral-200"
      >
        Stop sharing
      </button>
    </div>
  );
}
