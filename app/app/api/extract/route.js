import Anthropic from "@anthropic-ai/sdk";

// ── お試しモード用のダミー結果 ──────────────────
// ANTHROPIC_API_KEY がまだ無いときは、これを返す。
// 画面の流れ（撮る→確認→追加）を、お金をかけずに試せる。
const DUMMY = {
  mode: "trial",
  items: [
    { subject: "英語コミュニケーション", type: "小テスト", due_date: "2026-06-20", note: "L4 単語と本文", confidence: 0.92 },
    { subject: "世界史探究", type: "提出物", due_date: "2026-06-23", note: "白地図 9ページ", confidence: 0.78 },
    { subject: "数学II", type: "課題", due_date: "2026-06-25", note: "問題集 p.40-42", confidence: 0.61 },
  ],
};

const SYSTEM = `あなたは配布プリントの写真から、提出物や小テストの締切を読み取るアシスタントです。
画像に写っている情報だけを使い、推測で項目を増やさないでください。
次のJSON形式だけを返してください。前置き・説明・マークダウンは一切不要です。
{
  "items": [
    {
      "subject": "科目名",
      "type": "小テスト|提出物|課題|その他 のいずれか",
      "due_date": "YYYY-MM-DD（年が不明なら今年。日付が読めなければ空文字）",
      "note": "範囲やページなどの補足（無ければ空文字）",
      "confidence": 0.0から1.0の数値（読み取りの自信度）
    }
  ]
}
読み取れる締切が一つも無ければ items は空配列にしてください。`;

function extractJson(text) {
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

export async function POST(request) {
  // キーが無ければ、お試しモードでダミーを返す
  if (!process.env.ANTHROPIC_API_KEY) {
    // 本物と同じくらいの「待ち」を演出（読み取っている感）
    await new Promise((r) => setTimeout(r, 1200));
    return Response.json(DUMMY);
  }

  try {
    const { image, mediaType } = await request.json();
    if (!image) {
      return Response.json({ error: "画像が届きませんでした。もう一度お試しください。" }, { status: 400 });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType || "image/jpeg", data: image } },
            { type: "text", text: "このプリントから、提出物や小テストの締切を読み取ってください。" },
          ],
        },
      ],
    });

    const text = msg.content.find((b) => b.type === "text")?.text || "{}";
    let items = [];
    try {
      items = extractJson(text).items || [];
    } catch {
      const m = text.match(/\{[\s\S]*\}/);
      if (m) items = JSON.parse(m[0]).items || [];
    }
    return Response.json({ mode: "live", items });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "読み取りに失敗しました。時間をおいてもう一度お試しください。" }, { status: 500 });
  }
}
