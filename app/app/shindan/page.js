"use client";
import { useState } from "react";
import { supabase, supabaseReady } from "@/lib/supabase";

const C = {
  washi: "#F4F0E6", washiDeep: "#E9E3D2", ai: "#26324F", aiSoft: "#5C6781",
  shu: "#C0442E", shuSoft: "#D98E7E", pencil: "#9A958A", line: "#D8D0BD",
  ok: "#3F7D5E", white: "#FCFAF4",
};

// 8ジャンル。title=見出し、hint=下の小さい例、noun=二つ名の後半（詳しい人の肩書き）
const GENRES = [
  { key: "sports",  title: "スポーツ",        hint: "サッカー・野球・バスケ・観戦など",       noun: "アスリート" },
  { key: "art",     title: "アート",          hint: "絵画・デザイン・写真・イラストなど",     noun: "芸術家" },
  { key: "history", title: "歴史",            hint: "日本史・世界史・遺跡・城など",           noun: "歴史家" },
  { key: "science", title: "科学・テクノロジー", hint: "宇宙・AI・生物・ガジェットなど",        noun: "研究者" },
  { key: "music",   title: "音楽",            hint: "クラシック・K-POP・ロック・ボカロなど", noun: "音楽家" },
  { key: "society", title: "政治・社会",       hint: "選挙・ニュース・国際情勢・法律など",     noun: "評論家" },
  { key: "economy", title: "経済・ビジネス",   hint: "株・FX・起業・お金の話など",             noun: "戦略家" },
  { key: "nature",  title: "自然・動物",       hint: "動物・植物・環境・アウトドアなど",       noun: "探究者" },
];

// 二つ名の前半（好きなジャンル）
const LOVE = {
  sports: "スポーツ", art: "アート", history: "歴史", science: "科学",
  music: "音楽", society: "社会", economy: "経済", nature: "自然",
};

export default function Shindan() {
  const [step, setStep] = useState(0); // 0..7 が質問、8 が結果
  // 各ジャンルの回答： like（-1..1 好き度）, know（-1..1 詳しさ）
  const [ans, setAns] = useState({});
  const [saving, setSaving] = useState(false);

  const genre = GENRES[step];
  const done = step >= GENRES.length;

  const setPoint = (like, know) => {
    setAns((prev) => ({ ...prev, [genre.key]: { like, know } }));
  };
  const current = !done ? ans[genre.key] : null;

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));

  if (done) {
    return <Result ans={ans} onRetry={() => { setAns({}); setStep(0); }} saving={saving} setSaving={setSaving} />;
  }

  return (
    <main style={{ minHeight: "100vh", background: C.washi, color: C.ai, fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px 40px" }}>
        <header style={{ padding: "20px 0 10px", display: "flex", alignItems: "center", gap: 9 }}>
          <Mark /><span style={{ fontWeight: 700, fontSize: 16 }}>あなたを診断</span>
        </header>

        {/* 進み具合 */}
        <div style={{ display: "flex", gap: 4, marginBottom: 22 }}>
          {GENRES.map((g, i) => (
            <div key={g.key} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? C.shu : C.line }} />
          ))}
        </div>

        <div style={{ fontSize: 13, color: C.aiSoft, marginBottom: 4 }}>質問 {step + 1} / {GENRES.length}</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 4px" }}>「{genre.title}」は、あなたにとって？</h1>
        <div style={{ fontSize: 13, color: C.pencil, marginBottom: 22 }}>例：{genre.hint}</div>

        <Matrix value={current} onPick={setPoint} />

        <div style={{ display: "flex", gap: 10, marginTop: 26 }}>
          {step > 0 && (
            <button onClick={back} style={{ background: "transparent", border: `1px solid ${C.line}`, borderRadius: 10, padding: "13px 20px", fontSize: 14, color: C.aiSoft, cursor: "pointer" }}>もどる</button>
          )}
          <button onClick={next} disabled={!current}
            style={{ flex: 1, background: current ? C.ai : C.washiDeep, color: current ? C.white : C.pencil, border: "none", borderRadius: 10, padding: "13px", fontSize: 15, fontWeight: 700, cursor: current ? "pointer" : "default" }}>
            {step === GENRES.length - 1 ? "結果を見る" : "進む"}
          </button>
        </div>
        {!current && <div style={{ fontSize: 12, color: C.pencil, marginTop: 10, textAlign: "center" }}>図の中をタップして、あなたの位置を決めてください</div>}
      </div>
    </main>
  );
}

// 2×2マトリクス。タップした位置に点を置く。
function Matrix({ value, onPick }) {
  const SIZE = 260;
  const handle = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;   // 0..1
    const y = (e.clientY - rect.top) / rect.height;   // 0..1
    const like = Math.max(-1, Math.min(1, (x - 0.5) * 2));      // 右が好き(+)
    const know = Math.max(-1, Math.min(1, ((1 - y) - 0.5) * 2)); // 上が詳しい(+)
    onPick(Number(like.toFixed(2)), Number(know.toFixed(2)));
  };
  const px = value ? (value.like / 2 + 0.5) * SIZE : null;
  const py = value ? (1 - (value.know / 2 + 0.5)) * SIZE : null;

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div style={{ position: "relative" }}>
        {/* ラベル */}
        <div style={{ position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)", fontSize: 12, fontWeight: 700, color: C.aiSoft }}>詳しい</div>
        <div style={{ position: "absolute", bottom: -18, left: "50%", transform: "translateX(-50%)", fontSize: 12, fontWeight: 700, color: C.aiSoft }}>詳しくない</div>
        <div style={{ position: "absolute", left: -14, top: "50%", transform: "translateY(-50%) rotate(-90deg)", transformOrigin: "center", fontSize: 12, fontWeight: 700, color: C.shu }}>きらい</div>
        <div style={{ position: "absolute", right: -14, top: "50%", transform: "translateY(-50%) rotate(90deg)", transformOrigin: "center", fontSize: 12, fontWeight: 700, color: C.shu }}>すき</div>

        <div onClick={handle}
          style={{ width: SIZE, height: SIZE, background: C.white, border: `1.5px solid ${C.line}`, borderRadius: 14, position: "relative", cursor: "pointer", overflow: "hidden" }}>
          {/* 十字線 */}
          <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: C.line }} />
          <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: C.line }} />
          {/* 四象限の薄い言葉 */}
          <span style={{ position: "absolute", top: 10, right: 12, fontSize: 10.5, color: C.pencil }}>得意で好き</span>
          <span style={{ position: "absolute", top: 10, left: 12, fontSize: 10.5, color: C.pencil }}>詳しいけど微妙</span>
          <span style={{ position: "absolute", bottom: 10, right: 12, fontSize: 10.5, color: C.pencil }}>好きで伸ばせる</span>
          <span style={{ position: "absolute", bottom: 10, left: 12, fontSize: 10.5, color: C.pencil }}>これから</span>
          {/* 点 */}
          {value && (
            <div style={{ position: "absolute", left: px, top: py, width: 18, height: 18, borderRadius: "50%", background: C.shu, border: `3px solid ${C.white}`, boxShadow: "0 2px 6px rgba(192,68,46,.5)", transform: "translate(-50%,-50%)" }} />
          )}
        </div>
      </div>
    </div>
  );
}

// 結果
function Result({ ans, onRetry, saving, setSaving }) {
  // 一番好きなジャンル / 一番詳しいジャンル
  let bestLike = null, bestKnow = null;
  for (const g of GENRES) {
    const a = ans[g.key];
    if (!a) continue;
    if (bestLike === null || a.like > ans[bestLike].like) bestLike = g.key;
    if (bestKnow === null || a.know > ans[bestKnow].know) bestKnow = g.key;
  }

  const likeVal = bestLike ? ans[bestLike].like : -1;
  const knowVal = bestKnow ? ans[bestKnow].know : -1;

  // 全部低いとき用の予備
  let title, sub;
  if (likeVal <= 0 && knowVal <= 0) {
    title = "まだ見ぬ世界の探検家";
    sub = "好きも得意もこれから見つかる、伸びしろの人。";
  } else {
    const loveWord = LOVE[bestLike] || "世界";
    const nounWord = (GENRES.find((g) => g.key === bestKnow) || {}).noun || "探究者";
    title = `${loveWord}を愛する${nounWord}`;
    sub = `一番好きなのは「${GENRES.find((g) => g.key === bestLike).title}」、一番詳しいのは「${GENRES.find((g) => g.key === bestKnow).title}」。`;
  }

  const save = async () => {
    setSaving(true);
    try {
      if (supabaseReady && supabase) {
        await supabase.from("profiles").insert({ nickname: title, answers: ans });
      }
      // ブラウザにも覚えておく（次回のニュース選定用）
      // localStorage は使えない環境があるため state のみ。将来サーバー保存に一本化。
    } catch (e) { /* 保存失敗は致命的ではないので黙ってスルー */ }
    setSaving(false);
    window.location.href = "/";
  };

  return (
    <main style={{ minHeight: "100vh", background: C.ai, color: C.white, fontFamily: "'Zen Kaku Gothic New', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ maxWidth: 420, textAlign: "center" }}>
        <div style={{ fontSize: 13, letterSpacing: "0.2em", color: C.shuSoft, marginBottom: 18, fontWeight: 700 }}>あなたのタイプは</div>
        <h1 style={{ fontSize: 34, fontWeight: 900, lineHeight: 1.4, margin: "0 0 18px" }}>{title}</h1>
        <p style={{ fontSize: 14.5, lineHeight: 1.9, color: "#C8D0E0", margin: "0 0 36px" }}>{sub}<br />このタイプに合わせて、ニュースを選んでお届けします。</p>
        <button onClick={save} disabled={saving}
          style={{ width: "100%", background: C.white, color: C.ai, border: "none", borderRadius: 12, padding: "15px", fontSize: 15, fontWeight: 700, cursor: saving ? "default" : "pointer", marginBottom: 12 }}>
          {saving ? "保存中…" : "この結果でニュースを見る"}
        </button>
        <button onClick={onRetry} style={{ background: "transparent", border: `1px solid #3A4763`, color: "#C8D0E0", borderRadius: 12, padding: "12px 20px", fontSize: 13.5, cursor: "pointer" }}>もう一度診断する</button>
      </div>
    </main>
  );
}

function Mark() {
  return (
    <svg width="24" height="24" viewBox="0 0 26 26" fill="none" aria-hidden>
      <rect x="1" y="1" width="24" height="24" rx="7" fill="#26324F" />
      <path d="M9 8.5c-1.4 0-2.5 1.1-2.5 2.5 0 .5.15.97.4 1.36-.55.43-.9 1.1-.9 1.84 0 1.3 1.05 2.3 2.35 2.3.2 1 1.1 1.75 2.15 1.75 1.21 0 2.2-.98 2.2-2.2V9.7c0-1.21-.99-2.2-2.2-2.2-.36 0-.7.08-1 .25" stroke="#F4F0E6" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 8.5c1.4 0 2.5 1.1 2.5 2.5 0 .5-.15.97-.4 1.36.55.43.9 1.1.9 1.84 0 1.3-1.05 2.3-2.35 2.3-.2 1-1.1 1.75-2.15 1.75" stroke="#C0442E" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
