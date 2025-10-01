import { youtube } from "../config/google.js";
import { env } from "../config/env.js";
import { createReadStream } from "fs";
export async function uploadVideo(filePath, title) {
    const res = await youtube.videos.insert({
        part: ["snippet", "status"],
        requestBody: {
            snippet: { title, categoryId: env.youtube.categoryId, defaultLanguage: "pt-BR", defaultAudioLanguage: "pt-BR" },
            status: { privacyStatus: env.youtube.privacyStatus }
        },
        media: { body: createReadStream(filePath) }
    });
    const id = res.data.id;
    return { videoId: id, title, filePath };
}
