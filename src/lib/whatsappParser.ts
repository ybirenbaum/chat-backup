import type { ChatMessage, MediaKind } from "./types";

const IMAGE_EXT = ["jpg", "jpeg", "png", "gif", "webp", "heic"];
const VIDEO_EXT = ["mp4", "mov", "m4v", "3gp", "avi", "mkv"];
const AUDIO_EXT = ["opus", "mp3", "m4a", "aac", "wav", "ogg"];

export function detectMediaKind(fileName: string): MediaKind {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (IMAGE_EXT.includes(ext)) return "image";
  if (VIDEO_EXT.includes(ext)) return "video";
  if (AUDIO_EXT.includes(ext)) return "audio";
  if (ext) return "document";
  return null;
}

// Matches the start of a new WhatsApp message line, covering both the
// iOS export style `[DD/MM/YYYY, HH:MM:SS] Name: text` and the Android
// style `DD/MM/YYYY, HH:MM - Name: text` (with or without a leading
// left-to-right mark / narrow no-break space WhatsApp sometimes inserts).
const LINE_START = new RegExp(
  "^[\\u200e\\u200f]?" +
    "(?:\\[(\\d{1,4}[./-]\\d{1,2}[./-]\\d{1,4}),\\s?(\\d{1,2}:\\d{2}(?::\\d{2})?(?:\\s?[APap]\\.?[Mm]\\.?)?)\\]" +
    "|(\\d{1,4}[./-]\\d{1,2}[./-]\\d{1,4}),\\s?(\\d{1,2}:\\d{2}(?::\\d{2})?(?:\\s?[APap]\\.?[Mm]\\.?)?)\\s[-\\u2013]\\s)" +
    "\\s*(.*)$"
);

// Within the remainder after the timestamp: "Name: message" vs a system
// message with no sender (e.g. "Messages and calls are end-to-end encrypted").
const SENDER_SPLIT = /^([^:]{1,64}?):\s(.*)$/s;

// `<attached: filename.ext>` (Android) or `filename.ext (file attached)` (iOS)
const ATTACHMENT_PATTERNS = [
  /<attached:\s*([^>]+)>/i,
  /^(.*\.[A-Za-z0-9]{2,5})\s*\(file attached\)$/i,
];

function parseTimestamp(datePart: string, timePart: string): string | null {
  const dateSep = datePart.includes("/") ? "/" : datePart.includes("-") ? "-" : ".";
  const dateBits = datePart.split(dateSep).map((p) => parseInt(p, 10));
  if (dateBits.length !== 3 || dateBits.some(Number.isNaN)) return null;

  const [a, b, yearRaw] = dateBits;
  const year = yearRaw < 100 ? yearRaw + 2000 : yearRaw;

  // Disambiguate day/month: WhatsApp is almost always DD/MM/YYYY outside the
  // US. If the first part is > 12 it must be the day; otherwise assume
  // day/month (most common for WhatsApp exports worldwide).
  let day = a;
  let month = b;
  if (a > 12 && b <= 12) {
    day = a;
    month = b;
  } else if (b > 12 && a <= 12) {
    day = b;
    month = a;
  }

  const timeMatch = timePart.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s?([APap]\.?[Mm]\.?)?/);
  if (!timeMatch) return null;
  let hour = parseInt(timeMatch[1], 10);
  const minute = parseInt(timeMatch[2], 10);
  const second = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
  const meridiem = timeMatch[4]?.toLowerCase().replace(/\./g, "");

  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;

  const date = new Date(year, month - 1, day, hour, minute, second);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export interface ParsedLine {
  rawTimestamp: string;
  timestamp: string | null;
  sender: string | null;
  text: string;
  isSystem: boolean;
}

/** Splits raw WhatsApp `_chat.txt` contents into structured message lines. */
export function parseChatText(raw: string): ParsedLine[] {
  const lines = raw.split(/\r\n|\n|\r/);
  const messages: ParsedLine[] = [];

  for (const line of lines) {
    const match = line.match(LINE_START);
    if (match) {
      const datePart = match[1] ?? match[3];
      const timePart = match[2] ?? match[4];
      const rest = match[5] ?? "";
      const rawTimestamp = `${datePart}, ${timePart}`;
      const timestamp = parseTimestamp(datePart, timePart);

      const senderMatch = rest.match(SENDER_SPLIT);
      if (senderMatch) {
        messages.push({
          rawTimestamp,
          timestamp,
          sender: senderMatch[1].trim(),
          text: senderMatch[2],
          isSystem: false,
        });
      } else {
        messages.push({
          rawTimestamp,
          timestamp,
          sender: null,
          text: rest,
          isSystem: true,
        });
      }
    } else if (messages.length > 0 && line.length > 0) {
      // Continuation of a multi-line message (e.g. a long text or caption).
      messages[messages.length - 1].text += "\n" + line;
    }
  }

  return messages;
}

/** Extracts an attachment filename referenced in a message's text, if any. */
export function extractAttachmentFileName(text: string): string | null {
  const trimmed = text.trim();
  for (const pattern of ATTACHMENT_PATTERNS) {
    const m = trimmed.match(pattern);
    if (m) return m[1].trim();
  }
  return null;
}

export function buildMessageId(index: number): string {
  return `m${index.toString(36)}`;
}

export type { ChatMessage };
