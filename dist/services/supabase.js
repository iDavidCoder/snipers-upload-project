import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";
export const supabase = createClient(env.supabase.url, env.supabase.anonKey);
export async function insertRequest(userId, url) {
    const { data, error } = await supabase.from(env.supabase.table).insert([{ url, type: "CLIPS", user_id: userId }]).select().single();
    if (error)
        throw error;
    return data;
}
