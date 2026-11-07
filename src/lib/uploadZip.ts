import JSZip from "jszip";
import { ref, uploadBytes, getDownloadURL, uploadString } from "firebase/storage";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { storage, db } from "./firebase";
import {
  parseChatText,
  extractAttachmentFileName,
  detectMediaKind,
  buildMessageId,
} from "./whatsappParser";
import type { ChatMessage } from "./types";

export const DEFAULT_MAX_MEDIA_MB = Number(
  process.env.NEXT_PUBLIC_MAX_MEDIA_MB ?? "50"
);

export interface UploadProgress {
  stage: "reading" | "parsing" | "uploading" | "finalizing" | "done" | "error";
  currentFile?: string;
  mediaDone: number;
  mediaTotal: number;
  message?: string;
}

type ProgressCb = (p: UploadProgress) => void;

function findChatTextEntry(zip: JSZip): JSZip.JSZipObject | null {
  const candidates = Object.values(zip.files).filter(
    (f) => !f.dir && /\.txt$/i.test(f.name)
  );
  // Prefer the canonical "_chat.txt" name WhatsApp uses.
  const exact = candidates.find((f) => /(^|\/)_chat\.txt$/i.test(f.name));
  return exact ?? candidates[0] ?? null;
}

function basename(path: string): string {
  return path.split("/").pop() ?? path;
}

export async function uploadWhatsAppZip(
  file: File,
  uid: string,
  threadName: string,
  onProgress: ProgressCb,
  maxMediaMb: number = DEFAULT_MAX_MEDIA_MB
): Promise<string> {
  onProgress({ stage: "reading", mediaDone: 0, mediaTotal: 0 });
  const zip = await JSZip.loadAsync(file);

  const chatEntry = findChatTextEntry(zip);
  if (!chatEntry) {
    throw new Error(
      "No chat transcript (.txt) found in this ZIP. Make sure you selected the WhatsApp chat export ZIP."
    );
  }

  onProgress({ stage: "parsing", mediaDone: 0, mediaTotal: 0 });
  const chatText = await chatEntry.async("text");
  const parsedLines = parseChatText(chatText);

  // Map lowercased basenames -> zip entry, for resolving attachment references.
  const mediaEntries = new Map<string, JSZip.JSZipObject>();
  for (const f of Object.values(zip.files)) {
    if (!f.dir && f !== chatEntry) {
      mediaEntries.set(basename(f.name).toLowerCase(), f);
    }
  }

  const maxBytes = maxMediaMb * 1024 * 1024;
  const threadId = crypto.randomUUID();
  const basePath = `users/${uid}/threads/${threadId}`;

  const uniqueFileNames = new Set<string>();
  for (const line of parsedLines) {
    const fn = extractAttachmentFileName(line.text);
    if (fn && mediaEntries.has(fn.toLowerCase())) uniqueFileNames.add(fn.toLowerCase());
  }

  const mediaUrlByName = new Map<string, { url: string; size: number }>();
  let mediaDone = 0;
  let skippedMediaCount = 0;
  const mediaTotal = uniqueFileNames.size;

  for (const lowerName of uniqueFileNames) {
    const entry = mediaEntries.get(lowerName)!;
    onProgress({
      stage: "uploading",
      currentFile: basename(entry.name),
      mediaDone,
      mediaTotal,
    });

    const blob = await entry.async("blob");
    if (blob.size > maxBytes) {
      skippedMediaCount += 1;
      mediaDone += 1;
      continue;
    }

    const storageRef = ref(storage, `${basePath}/media/${basename(entry.name)}`);
    await uploadBytes(storageRef, blob, { contentType: blob.type || undefined });
    const url = await getDownloadURL(storageRef);
    mediaUrlByName.set(lowerName, { url, size: blob.size });
    mediaDone += 1;
  }

  onProgress({ stage: "finalizing", mediaDone, mediaTotal });

  const participants = new Set<string>();
  const messages: ChatMessage[] = parsedLines.map((line, idx) => {
    if (line.sender) participants.add(line.sender);
    const fn = extractAttachmentFileName(line.text);
    const resolved = fn ? mediaUrlByName.get(fn.toLowerCase()) : undefined;

    return {
      id: buildMessageId(idx),
      timestamp: line.timestamp,
      rawTimestamp: line.rawTimestamp,
      sender: line.sender,
      text: fn ? "" : line.text,
      isSystem: line.isSystem,
      media: resolved
        ? {
            kind: detectMediaKind(fn!),
            fileName: fn!,
            url: resolved.url,
            sizeBytes: resolved.size,
          }
        : null,
    };
  });

  const messagesPath = `${basePath}/messages.json`;
  const messagesRef = ref(storage, messagesPath);
  await uploadString(messagesRef, JSON.stringify(messages), "raw", {
    contentType: "application/json",
  });

  await addDoc(collection(db, "users", uid, "threads"), {
    name: threadName,
    createdAt: serverTimestamp(),
    participants: Array.from(participants),
    messageCount: messages.length,
    mediaCount: mediaUrlByName.size,
    skippedMediaCount,
    messagesPath,
  });

  onProgress({ stage: "done", mediaDone, mediaTotal });
  return threadId;
}
