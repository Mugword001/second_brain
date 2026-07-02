import Anthropic from "@anthropic-ai/sdk";

const GENRE_LABEL = {
  sports: "スポーツ", art: "アート", history: "歴史", science: "科学・テクノロジー",
  music: "音楽", society: "政治・社会", economy: "経済・ビジネス", nature: "自然・動物",
};

// お試しモード：診断前（時事5本）
const DUMMY_PLAIN = {
  mode: "trial",
  diagnosed: false,
  sections: [
    { key: "current", label: "時事", items: [
      { category: "経済", title: "日銀、政策金利を据え置き", summary: "日本銀行が政策金利の据え置きを決定。物価と賃金の動向を見極める姿勢です。", point: "バイト代や物価に、じわじわ関わる話です。", source: "（見本）", emoji: "🏦" },
      { category: "国際", title: "気候変動サミット、各国が新目標", summary: "主要国が温室効果ガス削減の新しい目標を発表しました。", point: "これからの社会の前提が変わっていきます。", source: "（見本）", emoji: "🌍" },
      { category: "テクノロジー", title: "高校でのAI活用、指針づくり進む", summary: "学校でのAIの使い方について国がガイドライン整備を進めています。", point: "あなたのアプリの追い風かも。", source: "（見本）", emoji: "🤖" },
      { category: "社会", title: "東京都、若者向け文化支援を拡充", summary: "10代・20代向けの文化イベント支援が広がる見込みです。", point: "無料で楽しめる催しが増えそう。", source: "（見本）", emoji: "🎨" },
      { category: "スポーツ", title: "国内リーグ、シーズン開幕迫る", summary: "各地で新シーズンに向けた準備が本格化しています。", point: "観戦の予定を立てるなら今のうち。", source: "（見本）", emoji: "⚽" },
    ]},
  ],
};

// お試しモード：診断後（時事3・おすすめ2・発見1）
function dummyDiagnosed(likeLabel, knowLabel, avoidLabel) {
  return {
    mode: "trial",
    diagnosed: true,
    sections: [
      { key: "current", label: "時事", items: [
        { category: "経済", title: "日銀、政策金利を据え置き", summary: "日本銀行が政策金利の据え置きを決定しました。", point: "バイト代や物価に関わる話です。", source: "（見本）", emoji: "🏦" },
        { category: "国際", title: "気候変動サミット、各国が新目標", summary: "主要国が温室効果ガス削減の新目標を発表。", point: "社会の前提が変わっていきます。", source: "（見本）", emoji: "🌍" },
        { category: "テクノロジー", title: "高校でのAI活用、指針づくり進む", summary: "学校でのAI利用のガイドライン整備が進行中。", point: "あなたのアプリの追い風かも。", source: "（見本）", emoji: "🤖" },
      ]},
      { key: "recommend", label: "おすすめ", desc: `あなたが好き＆詳しい「${knowLabel || likeLabel}」から`, items: [
        { category: knowLabel || "あなた向け", title: `${knowLabel || likeLabel}の最新トピック（見本）`, summary: "あなたの興味に合わせて選んだニュースがここに入ります。", point: "得意分野をさらに深められます。", source: "（見本）", emoji: "⭐" },
        { category: likeLabel || "あなた向け", title: `${likeLabel || knowLabel}の話題（見本）`, summary: "好きな分野の新しい動きを届けます。", point: "好きをもっと好きに。", source: "（見本）", emoji: "💡" },
      ]},
      { key: "discover", label: "発見", desc: `いつもは読まない「${avoidLabel || "新しい分野"}」から`, items: [
        { category: avoidLabel || "新しい分野", title: `${avoidLabel || "新しい分野"}の入門トピック（見本）`, summary: "あえて普段読まない分野を1本。視野を広げるきっかけに。", point: "知らなかった世界との出会い。", source: "（見本）", emoji: "🧭" },
      ]},
    ],
  };
}

function extractJson(text) {
  const m = text.match(/\{[\s\S]*\}/);
  return JSON.parse(m ? m[0] : text.replace(/```json|```/g, "").trim());
}

async function searchNews(anthropic, prompt) {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    messages: [{ role: "user", content: prompt }],
  });
  const text = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
  try { return extractJson(text).news || []; } catch { return []; }
}

const ITEM_SHAPE = `各ニュースは {"category":"分野","title":"見出し","summary":"2〜3文のやさしい要約","point":"若者向けの注目ポイント1文","source":"出典メディア名","emoji":"絵文字1つ"} の形。`;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const like = searchParams.get("like");
  const know = searchParams.get("know");
  const avoid = searchParams.get("avoid");
  const diagnosed = Boolean(like || know);
  const likeLabel = GENRE_LABEL[like] || null;
  const knowLabel = GENRE_LABEL[know] || null;
  const avoidLabel = GENRE_LABEL[avoid] || null;

  if (!process.env.ANTHROPIC_API_KEY) {
    await new Promise((r) => setTimeout(r, 800));
    return Response.json(diagnosed ? dummyDiagnosed(likeLabel, knowLabel, avoidLabel) : DUMMY_PLAIN);
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    if (!diagnosed) {
      const items = await searchNews(anthropic, `今日の日本の重要な時事ニュースを5件、Webで調べてください。分野が偏らないように。次のJSONだけ出力: {"news":[...]}。${ITEM_SHAPE}`);
      return Response.json({ mode: "live", diagnosed: false, sections: [{ key: "current", label: "時事", items }] });
    }

    const [current, recommend, discover] = await Promise.all([
      searchNews(anthropic, `今日の日本の重要な時事ニュースを3件、Webで調べてください。次のJSONだけ出力: {"news":[...]}。${ITEM_SHAPE}`),
      searchNews(anthropic, `「${knowLabel || likeLabel}」「${likeLabel || knowLabel}」の分野の最新ニュースを2件、Webで調べてください。この分野が好きで詳しい人向け。次のJSONだけ出力: {"news":[...]}。${ITEM_SHAPE}`),
      searchNews(anthropic, `「${avoidLabel || "ふだん注目されにくい分野"}」の分野の興味深いニュースを1件、Webで調べてください。ふだんこの分野を読まない人にも面白いもの。次のJSONだけ出力: {"news":[...]}。${ITEM_SHAPE}`),
    ]);

    return Response.json({
      mode: "live", diagnosed: true,
      sections: [
        { key: "current", label: "時事", items: current },
        { key: "recommend", label: "おすすめ", desc: `あなたが好き＆詳しい「${knowLabel || likeLabel}」から`, items: recommend },
        { key: "discover", label: "発見", desc: `いつもは読まない「${avoidLabel || "新しい分野"}」から`, items: discover },
      ],
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "ニュースの取得に失敗しました" }, { status: 500 });
  }
}
