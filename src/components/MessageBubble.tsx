"use client";

import { useState } from "react";
import type { ChatMessage } from "@/lib/types";
import { shareMedia, shareText } from "@/lib/shareMedia";
import ShareIconButton from "./ShareIconButton";

function formatTime(iso: string | null, raw: string): string {
  if (!iso) return raw;
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const [expanded, setExpanded] = useState(false);

  if (message.isSystem) {
    return (
      <div className="my-2 flex justify-center">
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
          {message.text}
        </span>
      </div>
    );
  }

  return (
    <div className="group my-1 flex flex-col items-start gap-1 rounded-lg bg-white px-3 py-2 shadow-sm dark:bg-neutral-900">
      <div className="flex w-full items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          {message.sender}
        </span>
        <span className="text-[11px] text-neutral-400">
          {formatTime(message.timestamp, message.rawTimestamp)}
        </span>
      </div>

      {message.media && (
        <div className="mt-1 flex w-full flex-col gap-1">
          {message.media.kind === "image" && (
            <div className="group/media relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={message.media.url}
                alt={message.media.fileName}
                onClick={() => setExpanded(true)}
                className="max-h-72 max-w-xs cursor-pointer rounded-md object-cover"
              />
              <div className="absolute right-1 top-1">
                <ShareIconButton
                  onClick={() =>
                    shareMedia(message.media!.url, message.media!.fileName, "")
                  }
                />
              </div>
            </div>
          )}
          {message.media.kind === "video" && (
            <div className="relative">
              <video
                src={message.media.url}
                controls
                className="max-h-72 max-w-xs rounded-md"
              />
              <button
                onClick={() =>
                  shareMedia(message.media!.url, message.media!.fileName, "")
                }
                className="absolute right-2 top-2 rounded-full bg-black/40 p-1 text-white hover:bg-black/60"
                title="Share"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.6" y1="10.6" x2="15.4" y2="6.4" />
                  <line x1="8.6" y1="13.4" x2="15.4" y2="17.6" />
                </svg>
              </button>
            </div>
          )}
          {message.media.kind === "audio" && (
            <div className="flex items-center gap-2">
              <audio src={message.media.url} controls className="h-10 max-w-xs" />
              <ShareIconButton
                onClick={() =>
                  shareMedia(message.media!.url, message.media!.fileName, "")
                }
              />
            </div>
          )}
          {message.media.kind === "document" && (
            <div className="flex items-center gap-2 rounded-md bg-neutral-100 px-3 py-2 dark:bg-neutral-800">
              <a
                href={message.media.url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-sm text-blue-600 underline dark:text-blue-400"
              >
                📎 {message.media.fileName}
              </a>
              <ShareIconButton
                onClick={() =>
                  shareMedia(message.media!.url, message.media!.fileName, "")
                }
              />
            </div>
          )}
        </div>
      )}

      {message.text && (
        <div className="flex w-full items-end justify-between gap-2">
          <p className="whitespace-pre-wrap break-words text-sm text-neutral-800 dark:text-neutral-100">
            {message.text}
          </p>
          <ShareIconButton onClick={() => shareText(message.text, message.sender)} />
        </div>
      )}

      {expanded && message.media?.kind === "image" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setExpanded(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={message.media.url}
            alt={message.media.fileName}
            className="max-h-full max-w-full rounded-md"
          />
        </div>
      )}
    </div>
  );
}
