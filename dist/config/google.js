import { google } from "googleapis";
import { env } from "./env.js";
export const oauth2Client = new google.auth.OAuth2(env.google.clientId, env.google.clientSecret, env.google.redirectUri);
oauth2Client.setCredentials({ refresh_token: env.google.refreshToken });
export const drive = google.drive({ version: "v3", auth: oauth2Client });
export const youtube = google.youtube({ version: "v3", auth: oauth2Client });
