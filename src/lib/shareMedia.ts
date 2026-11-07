export async function shareMedia(url: string, fileName: string, text: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const file = new File([blob], fileName, { type: blob.type });

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text });
      return;
    }
    if (navigator.share) {
      await navigator.share({ url, text });
      return;
    }
  } catch {
    // fall through to download
  }
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.click();
}

export async function shareText(text: string, sender: string | null) {
  const payload = sender ? `${sender}: ${text}` : text;
  try {
    if (navigator.share) {
      await navigator.share({ text: payload });
      return;
    }
  } catch {
    // fall through to clipboard
  }
  await navigator.clipboard?.writeText(payload);
}
