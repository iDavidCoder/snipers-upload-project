import tmp from "tmp";
import { createWriteStream } from "fs";
import { pipeline } from "stream";
import { promisify } from "util";
const pipe = promisify(pipeline);

export function tmpVideoPath(ext = ".mp4") {
  const f = tmp.fileSync({ prefix: "video-", postfix: ext });
  return f.name;
}

export async function writeStreamToFile(stream: NodeJS.ReadableStream, path: string) {
  await pipe(stream, createWriteStream(path));
}
