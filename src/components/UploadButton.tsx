"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { uploadWhatsAppZip, type UploadProgress } from "@/lib/uploadZip";

export default function UploadButton({
  onUploaded,
}: {
  onUploaded: (threadId: string) => void;
}) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!user) return;
    setError(null);
    const threadName = file.name.replace(/\.zip$/i, "");
    try {
      const threadId = await uploadWhatsAppZip(
        file,
        user.uid,
        threadName,
        setProgress
      );
      setProgress(null);
      onUploaded(threadId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
      setProgress(null);
    }
  }

  const busy = progress !== null && progress.stage !== "done";

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".zip,application/zip"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
      >
        {busy ? "Uploading…" : "Upload WhatsApp export (.zip)"}
      </button>

      {progress && progress.stage !== "done" && (
        <div className="text-xs text-neutral-500 dark:text-neutral-400">
          {progress.stage === "reading" && "Reading ZIP…"}
          {progress.stage === "parsing" && "Parsing chat transcript…"}
          {progress.stage === "uploading" &&
            `Uploading media ${progress.mediaDone}/${progress.mediaTotal}${
              progress.currentFile ? ` (${progress.currentFile})` : ""
            }`}
          {progress.stage === "finalizing" && "Saving thread…"}
        </div>
      )}

      {error && (
        <div className="max-w-xs text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
