/**
 * Triggers a real browser file download for a given URL and filename.
 * Uses a blob object URL so browsers treat it as same-origin, guaranteeing
 * that the download attribute triggers actual file saving rather than opening in a new tab.
 */
export async function triggerFileDownload(url: string, filename: string): Promise<void> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
  } catch {
    // Fallback: direct anchor with download and attachment
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
