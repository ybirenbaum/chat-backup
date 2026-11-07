"use client";

import { useThread } from "@/hooks/useThread";
import ChatThreadViewer from "./ChatThreadViewer";

export default function ChatView({
  threadId,
  onBack,
}: {
  threadId: string;
  onBack: () => void;
}) {
  const { thread, messages, error } = useThread(threadId);

  return (
    <ChatThreadViewer
      threadName={thread?.name ?? ""}
      messages={messages}
      error={error}
      headerLeft={
        <button
          onClick={onBack}
          title="Back to summary"
          className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      }
    />
  );
}
