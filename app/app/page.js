"use client";
import { useState, useEffect } from "react";
import Calendar from "./components/Calendar";

const C = {
  washi: "#F4F0E6", washiDeep: "#E9E3D2", ai: "#26324F", aiSoft: "#5C6781",
  shu: "#C0442E", shuSoft: "#D98E7E", pencil: "#9A958A", line: "#D8D0BD",
  ok: "#3F7D5E", white: "#FCFAF4",
};

export default function Home() {
  const [tab, setTab] = useState("calendar");
  const [diag, setDiag] = useState(null); // {like, know, avoid} or null

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    if (p.get("tab") === "discover") setTab("discover");
    const like = p.get("like"), know = p.get("know"), avoid = p.get("avoid");
    if (like || know) setDiag({ like, know, avoid });
  }, []);
  return (
    <main style={{ minHeight: "100vh", background: C.washi, color: C.ai, fontFamily: "'Zen Kaku Gothic New', sans-serif", position: "relative", paddingBottom: 76 }}>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px" }}>
        <header style={{ padding: "20px 0 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Mark />
            <span style={{ fontWeight: 700, fontSize: 16 }}>セカンドブレイン</span>
          </div>
          <ConnectionDot />
        </header>

        {tab === "calendar" && <Calendar />}
        {tab === "print" && <PrintTab />}
        {tab === "discover" && <DiscoverTab diag={diag} />}
      </div>

      <BottomBar tab={tab} setTab={setTab} />
    </main>
  );
}

// ── 下部のアイコンバー ──────────────────
function BottomBar({ tab, setTab }) {
  const items = [
    { key: "calendar", label: "カレンダー", icon: IconCalendar },
    { key: "print", label: "プリント", icon: IconCamera },
    { key: "discover", label: "みつける", icon: IconCompass },
  ];
  return (
    <nav style={{ position: "fixed", left: 0, right: 0, bottom: 0, background: C.white, borderTop: `1px solid ${C.line}`, display: "flex", justifyContent: "space-around", padding: "8px 0 max(8px, env(safe-area-inset-bottom))", zIndex: 50 }}>
      {items.map((it) => {
        const on = tab === it.key;
        const Icon = it.icon;
        return (
          <button key={it.key} onClick={() => setTab(it.key)}
            style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "2px 18px", color: on ? C.shu : C.aiSoft }}>
            <Icon color={on ? C.shu : C.aiSoft} />
            <span style={{ fontSize: 10.5, fontWeight: on ? 700 : 500 }}>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ── プリント ──────────────────
function PrintTab() {
  return (
    <section style={{ marginTop: 6 }}>
      <h1 style={{ fontSize: 23, fontWeight: 900, margin: "4px 0 8px", lineHeight: 1.4 }}>撮るだけで、締切がカレンダーに。</h1>
      <p style={{ color: C.aiSoft, fontSize: 14.5, lineHeight: 1.8, margin: "0 0 22px" }}>
        配られたプリントを撮ると、小テストや提出物の締切を読み取って、確認してからカレンダーに入れられます。
      </p>
      <a href="/torikomu" style={{ display: "block", textAlign: "center", background: C.ai, color: C.white, textDecoration: "none", fontWeight: 700, fontSize: 16, padding: "16px", borderRadius: 12 }}>
        プリントをアップロード →
      </a>
    </section>
  );
}

// ── みつける（ニュース＋イベント統合） ──────────────────
function DiscoverTab({ diag }) {
  const [showPopup, setShowPopup] = useState(!diag); // 未診断ならポップアップ
  return (
    <section style={{ marginTop: 6 }}>
      {showPopup && <DiagnosisPopup onClose={() => setShowPopup(false)} />}
      <NewsSection diag={diag} />
      <div style={{ height: 28 }} />
      <EventsSection />
    </section>
  );
}

// 診断をすすめるポップアップ
function DiagnosisPopup({ onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(27,42,74,.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, zIndex: 100 }}>
      <div style={{ background: C.washi, borderRadius: 18, padding: "28px 24px 24px", maxWidth: 360, width: "100%", position: "relative", boxShadow: "0 20px 50px -20px rgba(0,0,0,.5)" }}>
        <button onClick={onClose} aria-label="閉じる" style={{ position: "absolute", top: 12, right: 14, background: "transparent", border: "none", fontSize: 22, color: C.pencil, cursor: "pointer", lineHeight: 1 }}>×</button>
        <div style={{ fontSize: 13, letterSpacing: "0.14em", color: C.shu, fontWeight: 700, marginBottom: 12 }}>ニュースタイプ診断</div>
        <h2 style={{ fontSize: 21, fontWeight: 900, margin: "0 0 12px", lineHeight: 1.5 }}>あなた好みのニュースを<br />お届けします</h2>
        <p style={{ fontSize: 13.5, color: C.aiSoft, lineHeight: 1.9, margin: "0 0 22px" }}>
          8つの質問に答えると、あなたのタイプが分かります。その結果に合わせて「おすすめ」と「発見」のニュースを選びます。1〜2分で終わります。
        </p>
        <a href="/shindan" style={{ display: "block", textAlign: "center", background: C.ai, color: C.white, textDecoration: "none", fontWeight: 700, fontSize: 15, padding: "14px", borderRadius: 12, marginBottom: 10 }}>
          診断をはじめる
        </a>
        <button onClick={onClose} style={{ width: "100%", background: "transparent", border: "none", color: C.aiSoft, fontSize: 13, cursor: "pointer", padding: "6px" }}>あとで（時事ニュースだけ見る）</button>
      </div>
    </div>
  );
}

function NewsSection({ diag }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(null); // "sectionKey-index"

  const load = () => {
    setLoading(true); setError(null);
    const qs = new URLSearchParams();
    if (diag?.like) qs.set("like", diag.like);
    if (diag?.know) qs.set("know", diag.know);
    if (diag?.avoid) qs.set("avoid", diag.avoid);
    const url = "/api/news" + (qs.toString() ? "?" + qs.toString() : "");
    fetch(url).then((r) => r.json()).then((d) => {
      if (d.error) throw new Error(d.error);
      setSections(d.sections || []); setMode(d.mode);
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [diag]);

  return (
    <div>
      <SectionHead title="ニュース" desc={diag ? "あなた向けに選びました" : "今日の時事"} onReload={load} loading={loading} />
      {mode === "trial" && <TrialNote />}
      {error && <ErrorNote msg={error} onRetry={load} />}
      {loading && <Skeleton n={3} />}
      {!loading && sections.map((sec) => (
        <div key={sec.key} style={{ marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
            <h2 style={{ fontSize: 16, fontWeight: 900, margin: 0, color: C.ai }}>{sec.label}</h2>
            {sec.desc && <span style={{ fontSize: 11.5, color: C.pencil }}>{sec.desc}</span>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {sec.items.map((n, i) => {
              const id = `${sec.key}-${i}`;
              const isOpen = open === id;
              return (
                <div key={id} onClick={() => setOpen(isOpen ? null : id)} style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 12, padding: "16px 18px", cursor: "pointer" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 24, lineHeight: 1.2 }}>{n.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.shu, letterSpacing: "0.06em", marginBottom: 3 }}>{n.category}　{n.source}</div>
                      <div style={{ fontWeight: 700, fontSize: 15.5, lineHeight: 1.5 }}>{n.title}</div>
                      {isOpen ? (
                        <div style={{ marginTop: 10 }}>
                          <div style={{ fontSize: 13.5, color: C.aiSoft, lineHeight: 1.8 }}>{n.summary}</div>
                          <div style={{ marginTop: 10, background: C.washi, borderRadius: 8, padding: "10px 12px", fontSize: 13, color: C.ai, lineHeight: 1.7 }}>
                            <span style={{ fontWeight: 700, color: C.shu }}>ひとこと　</span>{n.point}
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: C.pencil, marginTop: 6 }}>タップで要約と解説 ▾</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function EventsSection() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true); setError(null);
    fetch("/api/events").then((r) => r.json()).then((d) => {
      if (d.error) throw new Error(d.error);
      setEvents(d.events || []); setMode(d.mode);
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  return (
    <div>
      <SectionHead title="近くのイベント" desc="1ヶ月以内・東京近郊" onReload={load} loading={loading} />
      {mode === "trial" && <TrialNote />}
      {error && <ErrorNote msg={error} onRetry={load} />}
      {loading && <Skeleton n={2} />}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {!loading && events.map((ev, i) => (
          <div key={i} style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 26, lineHeight: 1.1 }}>{ev.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15.5, marginBottom: 5 }}>{ev.title}</div>
                <div style={{ fontSize: 12.5, color: C.aiSoft, lineHeight: 1.9 }}>
                  <span style={{ color: C.shu, fontWeight: 700 }}>{ev.date}</span>　{ev.location}<br />
                  {ev.category}　{ev.price}
                </div>
                <div style={{ fontSize: 13, color: C.aiSoft, lineHeight: 1.7, marginTop: 8 }}>{ev.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 共通パーツ ──────────────────
function SectionHead({ title, desc, onReload, loading }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 14 }}>
      <div>
        <h1 style={{ fontSize: 19, fontWeight: 900, margin: "0 0 2px" }}>{title}</h1>
        <div style={{ fontSize: 12.5, color: C.aiSoft }}>{desc}</div>
      </div>
      {onReload && (
        <button onClick={onReload} disabled={loading} style={{ background: "transparent", border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 12px", fontSize: 12.5, fontWeight: 600, color: loading ? C.pencil : C.ai, cursor: loading ? "default" : "pointer" }}>
          {loading ? "読込中" : "更新"}
        </button>
      )}
    </div>
  );
}

function TrialNote() {
  return (
    <div style={{ background: "#FFF6C9", color: "#7A5B12", padding: "10px 14px", fontSize: 12.5, lineHeight: 1.7, borderRadius: 8, marginBottom: 14 }}>
      お試しモードです。これは見本です。本物の情報を出すにはAnthropicの鍵が必要です。
    </div>
  );
}

function ErrorNote({ msg, onRetry }) {
  return (
    <div style={{ background: "#FBEDEA", border: `1px solid ${C.shuSoft}`, color: C.shu, borderRadius: 10, padding: "12px 14px", fontSize: 13.5, marginBottom: 14 }}>
      {msg}
      <button onClick={onRetry} style={{ marginLeft: 10, background: C.shu, color: "#fff", border: "none", borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>再試行</button>
    </div>
  );
}

function Skeleton({ n }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ background: C.washiDeep, borderRadius: 5, height: 14, width: "40%", marginBottom: 10 }} />
          <div style={{ background: C.washiDeep, borderRadius: 5, height: 12, width: "85%" }} />
        </div>
      ))}
    </div>
  );
}

function ConnectionDot() {
  const [state, setState] = useState({ loading: true });
  useEffect(() => {
    fetch("/api/health").then((r) => r.json()).then((d) => setState({ loading: false, ...d })).catch(() => setState({ loading: false, connected: false }));
  }, []);
  const color = state.loading ? C.pencil : state.connected ? C.ok : C.shu;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.aiSoft }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
      {state.connected ? "接続済み" : state.loading ? "確認中" : "未接続"}
    </span>
  );
}

function Mark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
      <rect x="1" y="1" width="24" height="24" rx="7" fill="#26324F" />
      <path d="M9 8.5c-1.4 0-2.5 1.1-2.5 2.5 0 .5.15.97.4 1.36-.55.43-.9 1.1-.9 1.84 0 1.3 1.05 2.3 2.35 2.3.2 1 1.1 1.75 2.15 1.75 1.21 0 2.2-.98 2.2-2.2V9.7c0-1.21-.99-2.2-2.2-2.2-.36 0-.7.08-1 .25" stroke="#F4F0E6" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 8.5c1.4 0 2.5 1.1 2.5 2.5 0 .5-.15.97-.4 1.36.55.43.9 1.1.9 1.84 0 1.3-1.05 2.3-2.35 2.3-.2 1-1.1 1.75-2.15 1.75" stroke="#C0442E" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// アイコン
function IconCalendar({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" stroke={color} strokeWidth="1.7" />
      <path d="M3.5 9h17M8 3v3M16 3v3" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function IconCamera({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="7" width="18" height="13" rx="2.5" stroke={color} strokeWidth="1.7" />
      <path d="M8 7l1.5-2.5h5L16 7" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="12" cy="13.5" r="3.5" stroke={color} strokeWidth="1.7" />
    </svg>
  );
}
function IconCompass({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth="1.7" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}
