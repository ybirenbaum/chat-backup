import type { ChatMessage } from "./types";

export interface ParticipantCount {
  name: string;
  count: number;
}

export interface ThreadStats {
  messageCount: number;
  dateRange: { start: string; end: string } | null; // ISO strings
  participants: ParticipantCount[];
  busiestDay: { date: string; count: number } | null; // date = YYYY-MM-DD
  mediaCounts: { image: number; video: number; audio: number; document: number };
  photos: ChatMessage[];
  videosAndAudio: ChatMessage[];
  documents: ChatMessage[];
  recent: ChatMessage[];
}

const RECENT_COUNT = 16;

export function computeThreadStats(messages: ChatMessage[]): ThreadStats {
  const real = messages.filter((m) => !m.isSystem);

  const participantCounts = new Map<string, number>();
  const dayCounts = new Map<string, number>();
  let start: string | null = null;
  let end: string | null = null;

  const photos: ChatMessage[] = [];
  const videosAndAudio: ChatMessage[] = [];
  const documents: ChatMessage[] = [];
  const mediaCounts = { image: 0, video: 0, audio: 0, document: 0 };

  for (const m of real) {
    if (m.sender) {
      participantCounts.set(m.sender, (participantCounts.get(m.sender) ?? 0) + 1);
    }
    if (m.timestamp) {
      if (!start || m.timestamp < start) start = m.timestamp;
      if (!end || m.timestamp > end) end = m.timestamp;
      const day = m.timestamp.slice(0, 10);
      dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
    }
    if (m.media) {
      mediaCounts[m.media.kind as keyof typeof mediaCounts] += 1;
      if (m.media.kind === "image") photos.push(m);
      else if (m.media.kind === "video" || m.media.kind === "audio") videosAndAudio.push(m);
      else if (m.media.kind === "document") documents.push(m);
    }
  }

  const byRecency = (a: ChatMessage, b: ChatMessage) =>
    (b.timestamp ?? "").localeCompare(a.timestamp ?? "");
  photos.sort(byRecency);
  videosAndAudio.sort(byRecency);
  documents.sort(byRecency);

  const participants = Array.from(participantCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  let busiestDay: { date: string; count: number } | null = null;
  for (const [date, count] of dayCounts.entries()) {
    if (!busiestDay || count > busiestDay.count) busiestDay = { date, count };
  }

  const recent = [...real].sort(byRecency).slice(0, RECENT_COUNT);

  return {
    messageCount: real.length,
    dateRange: start && end ? { start, end } : null,
    participants,
    busiestDay,
    mediaCounts,
    photos,
    videosAndAudio,
    documents,
    recent,
  };
}
