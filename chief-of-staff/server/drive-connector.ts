/**
 * Google Drive Connector Bridge
 *
 * Uses the `gws` CLI (Google Workspace CLI) to access Google Drive on behalf
 * of the user. All calls are made server-side so credentials stay secure.
 *
 * Supported operations:
 *  - List recent files
 *  - Search files by query
 *  - Export/read file content (for summarization)
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Run a gws command and return parsed JSON output. Returns null on failure. */
function gwsJson(args: string): any {
  try {
    const output = execSync(`gws ${args}`, {
      timeout: 20_000,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return JSON.parse(output.trim());
  } catch (err: any) {
    console.warn("[Marcus Drive] gws error:", err?.message ?? err);
    return null;
  }
}

/** Sanitize a string for safe shell interpolation inside single quotes. */
function shellEscape(s: string): string {
  return s.replace(/'/g, "'\\''");
}

// ─── Drive Operations ─────────────────────────────────────────────────────────

/**
 * List the most recently modified files from Google Drive.
 */
export async function listRecentFiles(maxResults = 20): Promise<DriveFile[]> {
  const params = JSON.stringify({
    pageSize: maxResults,
    orderBy: "modifiedTime desc",
    fields: "files(id,name,mimeType,modifiedTime,size,webViewLink)",
    q: "trashed = false",
  });

  const result = gwsJson(`drive files list --params '${shellEscape(params)}'`);
  if (!result?.files) return [];

  return result.files.map((f: any) => ({
    id: f.id ?? "",
    name: f.name ?? "Untitled",
    mimeType: f.mimeType ?? "application/octet-stream",
    modifiedTime: f.modifiedTime ?? new Date().toISOString(),
    size: f.size,
    webViewLink: f.webViewLink,
  }));
}

/**
 * Search Google Drive files by a text query.
 */
export async function searchDriveFiles(query: string, maxResults = 20): Promise<DriveFile[]> {
  // Build a Drive query: full-text search + not trashed
  const driveQuery = `fullText contains '${shellEscape(query)}' and trashed = false`;
  const params = JSON.stringify({
    pageSize: maxResults,
    orderBy: "modifiedTime desc",
    fields: "files(id,name,mimeType,modifiedTime,size,webViewLink)",
    q: driveQuery,
  });

  const result = gwsJson(`drive files list --params '${shellEscape(params)}'`);
  if (!result?.files) return [];

  return result.files.map((f: any) => ({
    id: f.id ?? "",
    name: f.name ?? "Untitled",
    mimeType: f.mimeType ?? "application/octet-stream",
    modifiedTime: f.modifiedTime ?? new Date().toISOString(),
    size: f.size,
    webViewLink: f.webViewLink,
  }));
}

/**
 * Export and read the text content of a Google Drive file.
 * Supports Google Docs, Sheets, Presentations, and plain text/markdown files.
 * Returns up to 8000 characters of content for LLM summarization.
 */
export async function readDriveFileContent(
  fileId: string,
  mimeType: string
): Promise<string | null> {
  const tmpDir = os.tmpdir();
  const tmpFile = path.join(tmpDir, `marcus_drive_${fileId}_${Date.now()}.txt`);

  try {
    // Determine export MIME type based on file type
    let exportMime: string | null = null;

    if (mimeType.includes("google-apps.document")) {
      exportMime = "text/plain";
    } else if (mimeType.includes("google-apps.spreadsheet")) {
      exportMime = "text/csv";
    } else if (mimeType.includes("google-apps.presentation")) {
      exportMime = "text/plain";
    } else if (
      mimeType.startsWith("text/") ||
      mimeType.includes("markdown") ||
      mimeType.includes("json")
    ) {
      // Download directly
      const params = JSON.stringify({ fileId, alt: "media" });
      const result = gwsJson(`drive files get --params '${shellEscape(params)}' --output '${tmpFile}'`);
      if (!result) return null;
      if (fs.existsSync(tmpFile)) {
        const content = fs.readFileSync(tmpFile, "utf-8");
        fs.unlinkSync(tmpFile);
        return content.slice(0, 8000);
      }
      return null;
    } else {
      // Binary or unsupported type — cannot read
      return null;
    }

    // Export Google Workspace formats
    const params = JSON.stringify({ fileId, mimeType: exportMime });
    gwsJson(`drive files export --params '${shellEscape(params)}' --output '${tmpFile}'`);

    if (fs.existsSync(tmpFile)) {
      const content = fs.readFileSync(tmpFile, "utf-8");
      fs.unlinkSync(tmpFile);
      return content.slice(0, 8000);
    }

    return null;
  } catch (err) {
    console.warn("[Marcus Drive] readDriveFileContent error:", err);
    if (fs.existsSync(tmpFile)) {
      try { fs.unlinkSync(tmpFile); } catch {}
    }
    return null;
  }
}
