"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import SignInScreen from "@/components/SignInScreen";
import ThreadSidebar from "@/components/ThreadSidebar";
import ChatView from "@/components/ChatView";

export default function Home() {
  const { user, loading } = useAuth();
  const [selectedThread, setSelectedThread] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-neutral-400">
        Loading…
      </div>
    );
  }

  if (!user) return <SignInScreen />;

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <ThreadSidebar selectedId={selectedThread} onSelect={setSelectedThread} />
      {selectedThread ? (
        <ChatView key={selectedThread} threadId={selectedThread} />
      ) : (
        <div className="flex flex-1 items-center justify-center bg-neutral-100 text-sm text-neutral-400 dark:bg-neutral-950">
          Select a chat, or upload a new WhatsApp export ZIP to get started.
        </div>
      )}
    </div>
  );
}
