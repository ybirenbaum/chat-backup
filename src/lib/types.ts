export type MediaKind = "image" | "video" | "audio" | "document" | null;

export interface ChatMessage {
  id: string;
  timestamp: string | null; // ISO string, null if unparseable
  rawTimestamp: string;
  sender: string | null; // null for system messages
  text: string;
  isSystem: boolean;
  media: {
    kind: MediaKind;
    fileName: string;
    url: string;
    sizeBytes: number;
  } | null;
}

export interface ThreadMeta {
  id: string;
  name: string;
  createdAt: string; // ISO string
  participants: string[];
  messageCount: number;
  mediaCount: number;
  skippedMediaCount: number;
  messagesUrl: string; // Cloudinary URL to messages.json
}
