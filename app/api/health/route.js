import { supabase, supabaseReady } from "@/lib/supabase";

export async function GET() {
  // 診断用：環境変数がサーバーから見えているかを詳しく返す
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const diag = {
    url_exists: Boolean(url),
    url_length: url ? url.length : 0,
    url_head: url ? url.slice(0, 18) : null,
    key_exists: Boolean(key),
    key_length: key ? key.length : 0,
  };

  if (!supabaseReady) {
    return Response.json({
      connected: false,
      message: "まだSupabaseの接続情報（.env.local）が設定されていません。",
      diag,
    });
  }
  try {
    const { error } = await supabase.auth.getSession();
    if (error) throw error;
    return Response.json({ connected: true, message: "Supabaseに接続できました。", diag });
  } catch (e) {
    return Response.json({ connected: false, message: "接続情報はありますが、Supabaseに届きませんでした。", diag });
  }
}
