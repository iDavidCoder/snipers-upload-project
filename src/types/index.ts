export type DriveLinkType = "folder" | "file";
export type VideoItem = { id: string; name: string; mimeType: string; size?: string };
export type UploadResult = { videoId: string; title: string; filePath: string };
export type ProcessPayload = { user_id: string; is_private?: boolean; drive_url: string; request_id?: string };
