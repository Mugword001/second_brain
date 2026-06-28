"use client";
import { useState, useRef } from "react";

const C = {
  washi: "#F4F0E6", washiDeep: "#E9E3D2", ai: "#26324F", aiSoft: "#5C6781",
  shu: "#C0442E", shuSoft: "#D98E7E", pencil: "#9A958A", line: "#D8D0BD",
  ok: "#3F7D5E", white: "#FCFAF4",
};

const TYPE_OPTIONS = ["小テスト", "提出物", "課題", "その他"];

function confidenceLabel(c) {
  if (c >= 0.85) return { text: "くっきり", color: C.ok };
  if (c >= 0.65) return { text: "たぶん", color: C.shu };
  return { text: "要確認", color: C.shu };
}

function fmtDate(iso) {
  if (!iso) return "日付未定";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return iso;
  const w = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()}(${w})`;
}

function gcalUrl(item) {
  const title = encodeURIComponent(`【${item.type}】${item.subject}`);
  const details = encodeURIComponent(item.note || "");
  const d = (item.due_date || "").replace(/-/g, "");
  const dates = d ? `${d}/${d}` : "";
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}${dates ? `&dates=${dates}` : ""}`;
}

export default function Capture() {
  const [stage, setStage] = useState("start");
  const [preview, setPreview] = useState(null);
  const [items, setItems] = useState([]);
  const [mode, setMode] = useState(null);
  const [error, setError] = useState(null);
  const [addedIds, setAddedIds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const fileRef = useRef(null);

  const onPick = () => fileRef.current?.click();

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      setPreview(dataUrl);
      setStage("reading");
      const base64 = String(dataUrl).split(",")[1];
      const mediaType = file.type || "image/jpeg";
      try {
        const res = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, mediaType }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "読み取りに失敗しました");
        setItems((data.items || []).map((it, i) => ({ ...it, _id: i })));
        setMode(data.mode);
        setAddedIds([]);
        setStage("review");
      } catch (err) {
        setError(err.message);
        setStage("start");
        setPreview(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const updateItem = (id, key, val) =>
    setItems((prev) => prev.map((it) => (it._id === id ? { ...it, [key]: val } : it)));
  const removeItem = (id) => {
    setItems((prev) => prev.filter((it) => it._id !== id));
    if (editingId === id) setEditingId(null);
  };
  const markAdded = (id) => setAddedIds((p) => [...new Set([...p, id])]);

  const reset = () => {
    setStage("start"); setPreview(null); setItems([]); setMode(null);
    setError(null); setAddedIds([]); setEditingId(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const remaining = items.filter((it) => !addedIds.includes(it._id));

  return (
    <main style={{ minHeight: "100vh", background: C.washi, color: C.ai, fontFamily: "'Zen Kaku Gothic New', sans-serif", position: "relative" }}>
      <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", backgroundImage: `linear-gradient(${C.line}44 1px, transparent 1px), linear-gradient(90deg, ${C.line}44 1px, transparent 1px)`, backgroundSize: "26px 26px", maskImage: "radial-gradient(ellipse 100% 80% at 50% 0%, #000 50%, transparent 100%)", WebkitMaskImage: "radial-gradient(ellipse 100% 80% at 50% 0%, #000 50%, transparent 100%)" }} />
      <div style={{ position: "relative", maxWidth: 560, margin: "0 auto", padding: "0 18px 80px" }}>
        <header style={{ padding: "22px 0 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ textDecoration: "none", color: C.ai, display: "flex", alignItems: "center", gap: 9 }}>
            <Mark />
            <span style={{ fontWeight: 700, fontSize: 16 }}>セカンドブレイン</span>
          </a>
        </header>
        {stage === "start" && <StartCard onPick={onPick} error={error} />}
        {stage === "reading" && <ReadingCard preview={preview} />}
        {stage === "review" && (
          <Review
            items={items} remaining={remaining} mode={mode}
            addedIds={addedIds} editingId={editingId} setEditingId={setEditingId}
            updateItem={updateItem} removeItem={removeItem} markAdded={markAdded} reset={reset}
          />
        )}
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onFile} style={{ display: "none" }} />
      </div>
    </main>
  );
}

function StartCard({ onPick, error }) {
  return (
    <section style={{ marginTop: 20 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 18px" }}>プリントをアップロード</h1>
      {error && (
        <div style={{ background: "#FBEDEA", border: `1px solid ${C.shuSoft}`, color: C.shu, borderRadius: 10, padding: "12px 14px", fontSize: 14, marginBottom: 16 }}>{error}</div>
      )}
      <button onClick={onPick} style={{ width: "100%", cursor: "pointer", border: "none", background: "transparent", padding: 0, textAlign: "left" }}>
        <div style={{ background: C.white, border: `1.5px dashed ${C.aiSoft}66`, borderRadius: 12, padding: "40px 24px", boxShadow: "0 10px 26px -22px rgba(38,50,79,.5)" }}>
          <div style={{ textAlign: "center" }}>
            <CameraGlyph />
            <div style={{ fontWeight: 700, fontSize: 16, marginTop: 14 }}>写真を撮る / 選ぶ</div>
          </div>
        </div>
      </button>
    </section>
  );
}

function ReadingCard({ preview }) {
  return (
    <section style={{ marginTop: 20, textAlign: "center" }}>
      <div style={{ position: "relative", display: "inline-block", maxWidth: "100%" }}>
        {preview && (
          <img src={preview} alt="撮ったプリント" style={{ maxWidth: "100%", maxHeight: 300, borderRadius: 8, display: "block", border: `1px solid ${C.line}`, boxShadow: "0 16px 34px -26px rgba(38,50,79,.6)" }} />
        )}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ScanCamera />
        </div>
      </div>
      <div style={{ marginTop: 22, fontWeight: 700, fontSize: 15 }}>読み取っています…</div>
    </section>
  );
}

function Review({ items, remaining, mode, addedIds, editingId, setEditingId, updateItem, removeItem, markAdded, reset }) {
  const allAdded = items.length > 0 && remaining.length === 0;
  const addAll = () => remaining.forEach((it) => {
    window.open(gcalUrl(it), "_blank", "noopener,noreferrer");
    markAdded(it._id);
  });
  return (
    <section style={{ marginTop: 16 }}>
      {mode === "trial" && (
        <div style={{ background: "#FFF6C9", color: "#7A5B12", padding: "10px 14px", fontSize: 13, lineHeight: 1.7, borderRadius: 8, marginBottom: 16 }}>
          お試しモードです。これは見本で、まだ写真は読み取っていません。本物の読み取りにはAnthropicの鍵が必要です。
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h1 style={{ fontSize: 19, fontWeight: 800, margin: 0 }}>
          読み取れた予定 {remaining.length > 0 && <span style={{ color: C.aiSoft, fontWeight: 600, fontSize: 14 }}>（残り{remaining.length}）</span>}
        </h1>
        <button onClick={reset} style={{ background: "transparent", border: "none", color: C.aiSoft, cursor: "pointer", fontSize: 13, textDecoration: "underline", padding: 0 }}>別の写真</button>
      </div>
      {items.length === 0 && (
        <div style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 10, padding: "26px 20px", textAlign: "center", color: C.aiSoft, fontSize: 14 }}>
          このプリントからは締切が読み取れませんでした。
        </div>
      )}
      {allAdded && (
        <div style={{ background: "#EAF3EE", border: `1px solid ${C.ok}55`, color: C.ok, borderRadius: 10, padding: "18px", textAlign: "center", fontSize: 14, fontWeight: 700 }}>
          ✓ すべてカレンダーに追加しました
          <div style={{ marginTop: 10 }}>
            <button onClick={reset} style={{ background: C.ai, color: C.white, border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>別のプリントを撮る</button>
          </div>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((it) => {
          if (addedIds.includes(it._id)) return null;
          const conf = confidenceLabel(it.confidence ?? 0.7);
          const isEditing = editingId === it._id;
          return (
            <div key={it._id} style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 12px" }}>
                <button onClick={() => { window.open(gcalUrl(it), "_blank", "noopener,noreferrer"); markAdded(it._id); }}
                  aria-label="カレンダーに追加"
                  style={{ flexShrink: 0, width: 30, height: 30, borderRadius: "50%", border: `2px solid ${C.ai}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5l3 3 6-7" stroke={C.ai} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button onClick={() => setEditingId(isEditing ? null : it._id)}
                  style={{ flex: 1, minWidth: 0, textAlign: "left", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: C.shu, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{fmtDate(it.due_date)}</span>
                    <span style={{ fontWeight: 700, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.subject || "（科目未入力）"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                    <span style={{ fontSize: 12, color: C.aiSoft }}>{it.type}</span>
                    <span style={{ fontSize: 11, color: conf.color, border: `1px solid ${conf.color}55`, borderRadius: 4, padding: "0 6px" }}>{conf.text}</span>
                    {it.note && <span style={{ fontSize: 12, color: C.pencil, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.note}</span>}
                  </div>
                </button>
                <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
                  <button onClick={() => setEditingId(isEditing ? null : it._id)} style={{ background: "transparent", border: "none", color: C.aiSoft, cursor: "pointer", fontSize: 12.5, padding: "6px 8px" }}>修正</button>
                  <button onClick={() => removeItem(it._id)} aria-label="削除" style={{ background: "transparent", border: "none", color: C.pencil, cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "4px 6px" }}>×</button>
                </div>
              </div>
              {isEditing && (
                <div style={{ borderTop: `1px solid ${C.line}`, padding: "14px 14px 16px", background: C.washi }}>
                  <Field label="科目">
                    <input value={it.subject || ""} onChange={(e) => updateItem(it._id, "subject", e.target.value)} style={inputStyle} placeholder="科目名" />
                  </Field>
                  <div style={{ display: "flex", gap: 12 }}>
                    <Field label="種類" flex={1}>
                      <select value={it.type || "その他"} onChange={(e) => updateItem(it._id, "type", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                        {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </Field>
                    <Field label="締切" flex={1}>
                      <input type="date" value={it.due_date || ""} onChange={(e) => updateItem(it._id, "due_date", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }} />
                    </Field>
                  </div>
                  <Field label="メモ">
                    <input value={it.note || ""} onChange={(e) => updateItem(it._id, "note", e.target.value)} style={inputStyle} placeholder="範囲・ページなど" />
                  </Field>
                  <button onClick={() => setEditingId(null)} style={{ marginTop: 6, background: C.washiDeep, color: C.ai, border: "none", borderRadius: 7, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>修正を閉じる</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {remaining.length > 1 && (
        <button onClick={addAll} style={{ width: "100%", marginTop: 18, background: C.ai, color: C.white, border: "none", borderRadius: 10, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          すべてカレンダーに追加（{remaining.length}件）
        </button>
      )}
    </section>
  );
}

function Field({ label, children, flex }) {
  return (
    <label style={{ display: "block", marginBottom: 12, flex: flex || "unset" }}>
      <span style={{ display: "block", fontSize: 11.5, color: "#9A958A", marginBottom: 3 }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%", boxSizing: "border-box", border: "none", borderBottom: "1.5px solid #D8D0BD",
  background: "transparent", padding: "5px 2px", fontSize: 15, color: "#26324F", outline: "none",
  fontFamily: "'Zen Kaku Gothic New', sans-serif",
};

function Mark() {
  return (
    <svg width="24" height="24" viewBox="0 0 26 26" fill="none" aria-hidden>
      <rect x="1" y="1" width="24" height="24" rx="7" fill="#26324F" />
      <path d="M9 8.5c-1.4 0-2.5 1.1-2.5 2.5 0 .5.15.97.4 1.36-.55.43-.9 1.1-.9 1.84 0 1.3 1.05 2.3 2.35 2.3.2 1 1.1 1.75 2.15 1.75 1.21 0 2.2-.98 2.2-2.2V9.7c0-1.21-.99-2.2-2.2-2.2-.36 0-.7.08-1 .25" stroke="#F4F0E6" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 8.5c1.4 0 2.5 1.1 2.5 2.5 0 .5-.15.97-.4 1.36.55.43.9 1.1.9 1.84 0 1.3-1.05 2.3-2.35 2.3-.2 1-1.1 1.75-2.15 1.75" stroke="#C0442E" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CameraGlyph() {
  return (
    <svg width="46" height="46" viewBox="0 0 46 46" fill="none" aria-hidden>
      <rect x="5" y="13" width="36" height="25" rx="5" stroke="#26324F" strokeWidth="2" fill="none" />
      <path d="M16 13l3-5h8l3 5" stroke="#26324F" strokeWidth="2" strokeLinejoin="round" fill="none" />
      <circle cx="23" cy="26" r="7" stroke="#C0442E" strokeWidth="2" fill="none" />
      <circle cx="23" cy="26" r="2.4" fill="#C0442E" />
    </svg>
  );
}

function ScanCamera() {
  return (
    <>
      <style>{`@keyframes sb-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.55;transform:scale(1.08)}}`}</style>
      <div style={{ width: 76, height: 76, borderRadius: 16, background: "rgba(252,250,244,.92)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 18px -6px rgba(38,50,79,.5)", animation: "sb-pulse 1.3s ease-in-out infinite" }}>
        <svg width="40" height="40" viewBox="0 0 46 46" fill="none">
          <rect x="5" y="13" width="36" height="25" rx="5" stroke="#26324F" strokeWidth="2.2" fill="none" />
          <path d="M16 13l3-5h8l3 5" stroke="#26324F" strokeWidth="2.2" strokeLinejoin="round" fill="none" />
          <circle cx="23" cy="26" r="7.5" stroke="#C0442E" strokeWidth="2.2" fill="none" />
        </svg>
      </div>
    </>
  );
}
