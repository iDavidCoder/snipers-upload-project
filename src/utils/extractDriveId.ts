import { DriveLinkType } from "../types/index.js";

export function extractDriveId(input: string): { id: string; type: DriveLinkType } {
  const s = input.trim();
  const folder = /\/folders\/([a-zA-Z0-9-_]+)/.exec(s);
  if (folder) return { id: folder[1], type: "folder" };
  const file = /\/file\/d\/([a-zA-Z0-9-_]+)/.exec(s);
  if (file) return { id: file[1], type: "file" };
  const open = /[?&]id=([a-zA-Z0-9-_]+)/.exec(s);
  if (open) return { id: open[1], type: "file" };
  const plain = /^[a-zA-Z0-9-_]{10,}$/.exec(s);
  if (plain) return { id: s, type: "file" };
  throw new Error("Link do Drive inválido");
}
