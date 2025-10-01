import { drive } from "../config/google.js";
import { writeStreamToFile, tmpVideoPath } from "../utils/tmp.js";
export async function listFolderVideos(folderId) {
    const q = `trashed=false and '${folderId}' in parents and mimeType contains 'video/'`;
    const items = [];
    let pageToken = undefined;
    do {
        const res = await drive.files.list({
            q,
            fields: "nextPageToken, files(id, name, mimeType, size)",
            pageToken,
            pageSize: 1000,
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });
        res.data.files?.forEach((f) => items.push({
            id: f.id,
            name: f.name || f.id,
            mimeType: f.mimeType || "",
            size: f.size ?? undefined
        }));
        pageToken = res.data.nextPageToken || undefined;
    } while (pageToken);
    return items;
}
export async function getFileMeta(fileId) {
    const res = await drive.files.get({ fileId, fields: "id, name, mimeType, size", supportsAllDrives: true });
    const f = res.data;
    return {
        id: f.id,
        name: f.name || f.id,
        mimeType: f.mimeType || "",
        size: f.size ?? undefined
    };
}
export async function downloadToTmp(fileId, filenameHint) {
    const meta = await getFileMeta(fileId);
    const ext = meta.name.includes(".") ? meta.name.slice(meta.name.lastIndexOf(".")) : ".mp4";
    const path = tmpVideoPath(ext);
    const res = await drive.files.get({ fileId, alt: "media" }, { responseType: "stream" });
    await writeStreamToFile(res.data, path);
    return { path, title: filenameHint || meta.name };
}
