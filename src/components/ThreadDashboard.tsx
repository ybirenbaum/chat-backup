"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useThread } from "@/hooks/useThread";
import { computeThreadStats } from "@/lib/stats";
import { formatDate, formatRelative, initials, avatarColor } from "@/lib/format";
import { shareMedia } from "@/lib/shareMedia";
import ShareIconButton from "./ShareIconButton";
import ShareControl from "./ShareControl";

export default function ThreadDashboard({
  threadId,
  onOpenMessages,
  onBackToList,
}: {
  threadId: string;
  onOpenMessages: () => void;
  onBackToList?: () => void;
}) {
  const { user } = useAuth();
  const { thread, messages, error } = useThread(threadId);
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (error) {
    return (
      <div className="flex h-full flex-1 items-center justify-center bg-neutral-100 dark:bg-neutral-950">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }
  if (!thread || !messages) {
    return (
      <div className="flex h-full flex-1 items-center justify-center bg-neutral-100 dark:bg-neutral-950">
        <p className="text-sm text-neutral-400">Loading summary…</p>
      </div>
    );
  }

  const stats = computeThreadStats(messages);
  const topParticipants = stats.participants.slice(0, 5);
  const maxCount = topParticipants[0]?.count ?? 1;

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-neutral-100 dark:bg-neutral-950">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900 sm:px-6 sm:py-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {onBackToList && (
            <button
              onClick={onBackToList}
              title="Back to chats"
              className="flex-shrink-0 rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 md:hidden"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold text-neutral-900 dark:text-neutral-100 sm:text-lg">
              {thread.name}
            </h2>
            <p className="text-xs text-neutral-400">
              {thread.participants.length} participants · {stats.messageCount} messages
            </p>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap">
          {user && <ShareControl uid={user.uid} thread={thread} />}
          <button
            onClick={onOpenMessages}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Open full chat →
          </button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl flex-1 space-y-4 p-4 sm:space-y-6 sm:p-6">
        <section className="rounded-xl bg-white p-4 shadow-sm sm:p-5 dark:bg-neutral-900">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">
            Summary
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Messages" value={stats.messageCount.toLocaleString()} />
            <Stat label="Photos" value={stats.mediaCounts.image.toLocaleString()} />
            <Stat
              label="Videos & audio"
              value={(stats.mediaCounts.video + stats.mediaCounts.audio).toLocaleString()}
            />
            <Stat
              label="Date range"
              small
              value={
                stats.dateRange
                  ? `${formatDate(stats.dateRange.start)} – ${formatDate(stats.dateRange.end)}`
                  : "—"
              }
            />
          </div>

          {topParticipants.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-medium text-neutral-400">Most active</p>
              <div className="space-y-1.5">
                {topParticipants.map((p) => (
                  <div key={p.name} className="flex items-center gap-2">
                    <span
                      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white ${avatarColor(p.name)}`}
                    >
                      {initials(p.name)}
                    </span>
                    <span className="w-28 flex-shrink-0 truncate text-xs text-neutral-700 dark:text-neutral-300">
                      {p.name}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${(p.count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="w-10 flex-shrink-0 text-right text-xs text-neutral-400">
                      {p.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.busiestDay && (
            <p className="mt-4 text-xs text-neutral-400">
              Busiest day:{" "}
              <span className="font-medium text-neutral-600 dark:text-neutral-300">
                {formatDate(stats.busiestDay.date)}
              </span>{" "}
              ({stats.busiestDay.count} messages)
            </p>
          )}
        </section>

        {stats.recent.length > 0 && (
          <section className="rounded-xl bg-white p-4 shadow-sm sm:p-5 dark:bg-neutral-900">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">
              ✨ Highlights
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {stats.recent.map((m) => (
                <div
                  key={m.id}
                  className="w-40 flex-shrink-0 rounded-lg border border-neutral-100 p-2 dark:border-neutral-800"
                >
                  {m.media?.kind === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.media.url}
                      alt=""
                      onClick={() => setLightbox(m.media!.url)}
                      className="mb-1.5 h-24 w-full cursor-pointer rounded-md object-cover"
                    />
                  ) : m.media?.kind === "video" ? (
                    <video src={m.media.url} className="mb-1.5 h-24 w-full rounded-md object-cover" muted />
                  ) : m.media ? (
                    <div className="mb-1.5 flex h-24 w-full items-center justify-center rounded-md bg-neutral-100 text-2xl dark:bg-neutral-800">
                      {m.media.kind === "audio" ? "🎵" : "📎"}
                    </div>
                  ) : (
                    <p className="mb-1.5 line-clamp-3 h-24 text-xs text-neutral-700 dark:text-neutral-300">
                      {m.text}
                    </p>
                  )}
                  <p className="truncate text-[11px] font-medium text-neutral-600 dark:text-neutral-300">
                    {m.sender}
                  </p>
                  <p className="text-[10px] text-neutral-400">{formatRelative(m.timestamp)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-xl bg-white p-4 shadow-sm sm:p-5 dark:bg-neutral-900">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">
            📷 Photos ({stats.photos.length})
          </h3>
          {stats.photos.length === 0 ? (
            <p className="text-sm text-neutral-400">No photos in this chat.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
              {stats.photos.map((m) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={m.id}
                  src={m.media!.url}
                  alt=""
                  onClick={() => setLightbox(m.media!.url)}
                  className="aspect-square cursor-pointer rounded-md object-cover transition hover:opacity-80"
                />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl bg-white p-4 shadow-sm sm:p-5 dark:bg-neutral-900">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">
            🎬 Videos & audio ({stats.videosAndAudio.length})
          </h3>
          {stats.videosAndAudio.length === 0 ? (
            <p className="text-sm text-neutral-400">No videos or voice notes in this chat.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {stats.videosAndAudio.map((m) => (
                <div
                  key={m.id}
                  className="group flex items-center gap-3 rounded-lg border border-neutral-100 p-2 dark:border-neutral-800"
                >
                  {m.media!.kind === "video" ? (
                    <video
                      src={m.media!.url}
                      controls
                      className="h-20 w-28 flex-shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <audio src={m.media!.url} controls className="h-10 flex-1" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-neutral-700 dark:text-neutral-300">
                      {m.sender}
                    </p>
                    <p className="text-[11px] text-neutral-400">{formatRelative(m.timestamp)}</p>
                  </div>
                  <ShareIconButton
                    alwaysVisible
                    onClick={() => shareMedia(m.media!.url, m.media!.fileName, "")}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded-md" />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div>
      <p className={`font-semibold text-neutral-900 dark:text-neutral-100 ${small ? "text-sm" : "text-2xl"}`}>
        {value}
      </p>
      <p className="text-xs text-neutral-400">{label}</p>
    </div>
  );
}
