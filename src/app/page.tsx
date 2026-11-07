"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import SignInScreen from "@/components/SignInScreen";
import ThreadSidebar from "@/components/ThreadSidebar";
import ThreadDashboard from "@/components/ThreadDashboard";
import ChatView from "@/components/ChatView";

type ViewMode = "dashboard" | "messages";

export default function Home() {
  const { user, loading } = useAuth();
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-neutral-400">
        Loading…
      </div>
    );
  }

  if (!user) return <SignInScreen />;

  function selectThread(id: string) {
    setSelectedThread(id);
    setViewMode("dashboard");
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <ThreadSidebar selectedId={selectedThread} onSelect={selectThread} />
      {selectedThread ? (
        viewMode === "dashboard" ? (
          <ThreadDashboard
            key={selectedThread}
            threadId={selectedThread}
            onOpenMessages={() => setViewMode("messages")}
          />
        ) : (
          <ChatView
            key={selectedThread}
            threadId={selectedThread}
            onBack={() => setViewMode("dashboard")}
          />
        )
      ) : (
        <div className="flex flex-1 items-center justify-center bg-neutral-100 text-sm text-neutral-400 dark:bg-neutral-950">
          Select a chat, or upload a new WhatsApp export ZIP to get started.
        </div>
      )}
    </div>
  );
}
