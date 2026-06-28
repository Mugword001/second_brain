import Anthropic from "@anthropic-ai/sdk";

const DUMMY = {
  mode: "trial",
  events: [
    { title: "（見本）現代アート展", date: "今月中", location: "六本木", category: "アート", price: "一般1,500円", desc: "話題の現代アートをまとめて見られる企画展。学生割引あり。", emoji: "🎨" },
    { title: "（見本）週末フードフェス", date: "今週末", location: "代々木公園", category: "グルメ", price: "入場無料", desc: "各国の屋台が集まる食のイベント。食べ歩きが楽しめます。", emoji: "🍜" },
    { title: "（見本）夜のジャズライブ", date: "来週土曜", location: "渋谷", category: "音楽", price: "学生2,000円", desc: "若手ミュージシャンによる生演奏。初心者でも楽しめる雰囲気。", emoji: "🎷" },
    { title: "（見本）夏の花火大会", date: "来月初旬", location: "お台場", category: "季節", price: "無料", desc: "東京湾を彩る花火大会。早めの場所取りがおすすめ。", emoji: "🎆" },
  ],
};

function extractJson(text) {
  const m = text.match(/\{[\s\S]*\}/);
  return JSON.parse(m ? m[0] : text.replace(/```json|```/g, "").trim());
}

export async function GET() {
  if (!process.env.ANTHROPIC_API_KEY) {
    await new Promise((r) => setTimeout(r, 1000));
    return Response.json(DUMMY);
  }
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{
        role: "user",
        content: `今日から1ヶ月以内に東京近郊で開催されるおすすめイベントを4件、Webで調べてください。アート・グルメ・音楽・季節行事などジャンルが偏らないように。
調べ終わったら次のJSONだけを出力（前置き・マークダウン不要）:
{"events":[{"title":"イベント名","date":"開催日","location":"場所","category":"ジャンル","price":"料金","desc":"1〜2文の説明","emoji":"内容に合う絵文字1つ"}]}`,
      }],
    });
    const text = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
    let events = [];
    try { events = extractJson(text).events || []; } catch {}
    return Response.json({ mode: "live", events });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "イベントの取得に失敗しました" }, { status: 500 });
  }
}
