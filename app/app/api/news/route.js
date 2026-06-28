import Anthropic from "@anthropic-ai/sdk";

// お試しモード用の見本ニュース
const DUMMY = {
  mode: "trial",
  news: [
    { category: "経済", title: "日銀、政策金利を据え置き", summary: "日本銀行は金融政策決定会合で政策金利の据え置きを決めました。物価と賃金の動向を見極める姿勢です。", point: "住宅ローンやバイト先の時給に、じわじわ関わってくる話です。", source: "（見本）", emoji: "🏦" },
    { category: "テクノロジー", title: "高校でのAI活用、指針づくりが進む", summary: "学校現場でのAIの使い方について、国がガイドラインの整備を進めています。学習補助としての活用が中心です。", point: "あなたが作っているようなアプリの追い風になりそうです。", source: "（見本）", emoji: "🤖" },
    { category: "社会", title: "東京都、若者向け文化イベントを拡充", summary: "東京都が10代・20代向けの文化・芸術イベントの支援を広げると発表しました。無料の催しも増える見込みです。", point: "イベントタブで拾えるお出かけ先が増えるかもしれません。", source: "（見本）", emoji: "🎨" },
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
        content: `今日の日本の重要ニュースを3件、Webで調べてください。経済・テクノロジー・社会など分野が偏らないように。
調べ終わったら次のJSONだけを出力（前置き・マークダウン不要）:
{"news":[{"category":"分野","title":"見出し","summary":"2〜3文のやさしい要約","point":"高校生・若者にとっての注目ポイントを1文","source":"出典メディア名","emoji":"内容に合う絵文字1つ"}]}`,
      }],
    });
    const text = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
    let news = [];
    try { news = extractJson(text).news || []; } catch {}
    return Response.json({ mode: "live", news });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "ニュースの取得に失敗しました" }, { status: 500 });
  }
}
