import { youtube } from "../config/google.js";
import { env } from "../config/env.js";
import { createReadStream } from "fs";
import type { UploadResult } from "../types/index.js";

export async function uploadVideo(filePath: string, title: string): Promise<UploadResult> {
  const res = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: { title, categoryId: env.youtube.categoryId, defaultLanguage: "pt-BR", defaultAudioLanguage: "pt-BR" },
      status: { privacyStatus: env.youtube.privacyStatus }
    },
    media: { body: createReadStream(filePath) }
  });
  const id = res.data.id as string;
  return { videoId: id, title, filePath };
}
