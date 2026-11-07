"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import type { ThreadMeta } from "@/lib/types";
import UploadButton from "./UploadButton";

export default function ThreadSidebar({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { user, signOut } = useAuth();
  const [threads, setThreads] = useState<ThreadMeta[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "threads"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setThreads(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name,
            createdAt: data.createdAt?.toDate?.().toISOString() ?? "",
            participants: data.participants ?? [],
            messageCount: data.messageCount ?? 0,
            mediaCount: data.mediaCount ?? 0,
            skippedMediaCount: data.skippedMediaCount ?? 0,
            messagesUrl: data.messagesUrl,
          };
        })
      );
    });
    return unsub;
  }, [user]);

  return (
    <aside className="flex h-screen w-72 flex-shrink-0 flex-col border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between border-b border-neutral-200 p-4 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          {user?.photoURL && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoURL}
              alt=""
              className="h-8 w-8 rounded-full"
            />
          )}
          <span className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">
            {user?.displayName ?? user?.email}
          </span>
        </div>
        <button
          onClick={() => signOut()}
          className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
        >
          Sign out
        </button>
      </div>

      <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
        <UploadButton onUploaded={onSelect} />
      </div>

      <div className="flex-1 overflow-y-auto">
        {threads.length === 0 && (
          <p className="p-4 text-sm text-neutral-400">
            No chats yet. Upload a WhatsApp export ZIP to get started.
          </p>
        )}
        {threads.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={`flex w-full flex-col gap-0.5 border-b border-neutral-100 px-4 py-3 text-left transition dark:border-neutral-800 ${
              selectedId === t.id
                ? "bg-emerald-50 dark:bg-emerald-950"
                : "hover:bg-neutral-50 dark:hover:bg-neutral-800"
            }`}
          >
            <span className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {t.name}
            </span>
            <span className="text-xs text-neutral-400">
              {t.messageCount} messages · {t.mediaCount} media
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}
