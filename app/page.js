"use client";
import { useState, useEffect } from "react";

const C = {
  washi: "#F4F0E6", washiDeep: "#E9E3D2", ai: "#26324F", aiSoft: "#5C6781",
  shu: "#C0442E", shuSoft: "#D98E7E", pencil: "#9A958A", line: "#D8D0BD",
  ok: "#3F7D5E", white: "#FCFAF4",
};

const TABS = [
  { key: "print", label: "プリント" },
  { key: "news", label: "ニュース" },
  { key: "events", label: "イベント" },
  { key: "mail", label: "メール" },
];

export default function Home() {
  const [tab, setTab] = useState("print");
  return (
    <main style={{ minHeight: "100vh", background: C.washi, color: C.ai, fontFamily: "'Zen Kaku Gothic New', sans-serif", position: "relative" }}>
      <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", backgroundImage: `linear-gradient(${C.line}40 1px, transparent 1px), linear-gradient(90deg, ${C.line}40 1px, transparent 1px)`, backgroundSize: "26px 26px", maskImage: "radial-gradient(ellipse 100% 70% at 50% 0%, #000 50%, transparent 100%)", WebkitMaskImage: "radial-gradient(ellipse 100% 70% at 50% 0%, #000 50%, transparent 100%)" }} />

      <div style={{ position: "relative", maxWidth: 600, margin: "0 auto", padding: "0 18px 80px" }}>
        <header style={{ padding: "24px 0 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Mark />
            <span style={{ fontWeight: 700, fontSize: 17 }}>セカンドブレイン</span>
          </div>
          <ConnectionDot />
        </header>

        {/* タブ */}
        <nav style={{ display: "flex", gap: 4, borderBottom: `1px solid ${C.line}`, marginBottom: 22 }}>
          {TABS.map((t) => {
            const on = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ position: "relative", background: "transparent", border: "none", cursor: "pointer", padding: "10px 12px 12px", fontSize: 14, fontWeight: on ? 700 : 500, color: on ? C.ai : C.aiSoft }}>
                {t.label}
                {on && <span style={{ position: "absolute", left: 8, right: 8, bottom: -1, height: 2.5, background: C.shu, borderRadius: 2 }} />}
              </button>
            );
          })}
        </nav>

        {tab === "print" && <PrintTab />}
        {tab === "news" && <NewsTab />}
        {tab === "events" && <EventsTab />}
        {tab === "mail" && <MailTab />}
      </div>
    </main>
  );
}

// ── プリント ──────────────────
function PrintTab() {
  return (
    <section>
      <h1 style={{ fontSize: 25, fontWeight: 900, margin: "4px 0 8px", lineHeight: 1.4 }}>撮るだけで、締切がカレンダーに。</h1>
      <p style={{ color: C.aiSoft, fontSize: 15, lineHeight: 1.8, margin: "0 0 24px" }}>
        配られたプリントを撮ると、小テストや提出物の締切を読み取って、確認してからカレンダーに入れられます。
      </p>
      <a href="/torikomu" style={{ display: "block", textAlign: "center", background: C.ai, color: C.white, textDecoration: "none", fontWeight: 700, fontSize: 16, padding: "16px", borderRadius: 12 }}>
        プリントをアップロード →
      </a>
    </section>
  );
}

// ── ニュース ──────────────────
function NewsTab() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(null);

  const load = () => {
    setLoading(true); setError(null);
    fetch("/api/news").then((r) => r.json()).then((d) => {
      if (d.error) throw new Error(d.error);
      setNews(d.news || []); setMode(d.mode);
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  return (
    <section>
      <SectionHead title="今朝のニュース" desc="AIが要点をまとめました" onReload={load} loading={loading} />
      {mode === "trial" && <TrialNote />}
      {error && <ErrorNote msg={error} onRetry={load} />}
      {loading && <Skeleton n={3} />}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {!loading && news.map((n, i) => (
          <div key={i} onClick={() => setOpen(open === i ? null : i)} style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 12, padding: "16px 18px", cursor: "pointer" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 24, lineHeight: 1.2 }}>{n.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.shu, letterSpacing: "0.06em", marginBottom: 3 }}>{n.category}　{n.source}</div>
                <div style={{ fontWeight: 700, fontSize: 15.5, lineHeight: 1.5 }}>{n.title}</div>
                {open === i ? (
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
        ))}
      </div>
    </section>
  );
}

// ── イベント ──────────────────
function EventsTab() {
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
    <section>
      <SectionHead title="近くのイベント" desc="1ヶ月以内・東京近郊" onReload={load} loading={loading} />
      {mode === "trial" && <TrialNote />}
      {error && <ErrorNote msg={error} onRetry={load} />}
      {loading && <Skeleton n={3} />}
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
    </section>
  );
}

// ── メール（準備中） ──────────────────
function MailTab() {
  return (
    <section>
      <SectionHead title="メール" desc="重要なメールだけ拾います" />
      <div style={{ background: C.white, border: `1px dashed ${C.aiSoft}66`, borderRadius: 12, padding: "32px 22px", textAlign: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>準備中の機能です</div>
        <p style={{ color: C.aiSoft, fontSize: 13.5, lineHeight: 1.9, margin: 0 }}>
          Gmailから提出物やイベントの連絡を拾って、カレンダー追加をおすすめする機能です。<br />
          メールの読み取りは安全面の確認が必要なため、いまは準備中。大学生向けに広げるときに公開します。
        </p>
      </div>
    </section>
  );
}

// ── 共通パーツ ──────────────────
function SectionHead({ title, desc, onReload, loading }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 900, margin: "0 0 2px" }}>{title}</h1>
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
    <span title={state.connected ? "Supabase 接続済み" : "Supabase 未接続"} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.aiSoft }}>
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
