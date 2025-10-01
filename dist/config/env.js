import dotenv from "dotenv";
dotenv.config();
const num = (v, def) => (v ? Number(v) : def);
export const env = {
    port: num(process.env.PORT, 3000),
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirectUri: process.env.GOOGLE_REDIRECT_URI || "urn:ietf:wg:oauth:2.0:oob",
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN || ""
    },
    youtube: {
        privacyStatus: process.env.YOUTUBE_DEFAULT_PRIVACY || "private",
        categoryId: process.env.YOUTUBE_CATEGORY_ID || "22",
        regionCode: process.env.YOUTUBE_REGION_CODE || "BR"
    },
    supabase: {
        url: process.env.SUPABASE_URL || "",
        anonKey: process.env.SUPABASE_ANON_KEY || "",
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
        table: process.env.SUPABASE_TABLE || "request_queue"
    },
    callbackUrl: process.env.CALLBACK_URL || ""
};
