import { createClient } from "@supabase/supabase-js";

export type SupabaseClient = ReturnType<typeof createSupabase>;

export function createSupabase(supabaseUrl: string, supabaseAnonKey: string) {
	return createClient(supabaseUrl, supabaseAnonKey);
}
