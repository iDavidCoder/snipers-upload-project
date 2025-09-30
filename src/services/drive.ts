
import { drive } from "../config/google.js";
import { VideoItem } from "../types/index.js";
import { writeStreamToFile, tmpVideoPath } from "../utils/tmp.js";
import { createWriteStream } from "fs";
import type { drive_v3 } from "googleapis";
import type { GaxiosResponse } from "googleapis-common";

export async function listFolderVideos(folderId: string): Promise<VideoItem[]> {
  const q = `trashed=false and '${folderId}' in parents and mimeType contains 'video/'`;
  const items: VideoItem[] = [];
  let pageToken: string | undefined = undefined;
  do {
    const res: GaxiosResponse<drive_v3.Schema$FileList> = await drive.files.list({
      q,
      fields: "nextPageToken, files(id, name, mimeType, size)",
      pageToken,
      pageSize: 1000,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true
    });
    res.data.files?.forEach((f: drive_v3.Schema$File) =>
      items.push({
        id: f.id!,
        name: f.name || f.id!,
        mimeType: f.mimeType || "",
        size: f.size ?? undefined
      })
    );
    pageToken = res.data.nextPageToken || undefined;
  } while (pageToken);
  return items;
}

export async function getFileMeta(fileId: string): Promise<VideoItem> {
  const res = await drive.files.get({ fileId, fields: "id, name, mimeType, size", supportsAllDrives: true });
  const f = res.data;
  return {
    id: f.id!,
    name: f.name || f.id!,
    mimeType: f.mimeType || "",
    size: f.size ?? undefined
  };
}

export async function downloadToTmp(fileId: string, filenameHint?: string): Promise<{ path: string; title: string }> {
  const meta = await getFileMeta(fileId);
  const ext = meta.name.includes(".") ? meta.name.slice(meta.name.lastIndexOf(".")) : ".mp4";
  const path = tmpVideoPath(ext);
  const res = await drive.files.get({ fileId, alt: "media" }, { responseType: "stream" });
  await writeStreamToFile(res.data, path);
  return { path, title: filenameHint || meta.name };
}
