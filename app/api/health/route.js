import { supabase, supabaseReady } from "@/lib/supabase";

export async function GET() {
  if (!supabaseReady) {
    return Response.json({ connected: false, message: "まだSupabaseの接続情報（.env.local）が設定されていません。" });
  }
  try {
    const { error } = await supabase.auth.getSession();
    if (error) throw error;
    return Response.json({ connected: true, message: "Supabaseに接続できました。" });
  } catch (e) {
    return Response.json({ connected: false, message: "接続情報はありますが、Supabaseに届きませんでした。" });
  }
}
