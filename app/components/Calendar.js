"use client";
import { useState, useEffect } from "react";
import { supabase, supabaseReady } from "@/lib/supabase";

const C = {
  washi: "#F4F0E6", washiDeep: "#E9E3D2", ai: "#26324F", aiSoft: "#5C6781",
  shu: "#C0442E", shuSoft: "#D98E7E", pencil: "#9A958A", line: "#D8D0BD",
  ok: "#3F7D5E", white: "#FCFAF4",
};

const WEEK = ["月", "火", "水", "木", "金", "土", "日"];

function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// 月曜始まりのカレンダー格子を作る
function buildGrid(year, month) {
  const first = new Date(year, month, 1);
  const startDay = (first.getDay() + 6) % 7; // 月曜=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function Calendar() {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(ymd(today));
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", type: "予定", start_time: "", note: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const load = async () => {
    setLoading(true);
    if (!supabaseReady || !supabase) { setLoading(false); return; }
    const start = ymd(new Date(year, month, 1));
    const end = ymd(new Date(year, month + 1, 0));
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .gte("plan_date", start)
      .lte("plan_date", end)
      .order("start_time", { ascending: true });
    if (!error && data) setPlans(data);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [year, month]);

  const grid = buildGrid(year, month);
  const plansByDay = {};
  for (const p of plans) {
    (plansByDay[p.plan_date] = plansByDay[p.plan_date] || []).push(p);
  }
  const selectedPlans = plansByDay[selected] || [];

  const move = (delta) => setCursor(new Date(year, month + delta, 1));

  const TYPE_OPTIONS = ["予定", "小テスト", "提出物", "課題", "その他"];
  const emojiFor = (t) => t === "小テスト" ? "📝" : t === "提出物" ? "📋" : t === "課題" ? "📐" : "📌";

  const addPlan = async () => {
    if (!form.title.trim()) { setFormError("予定名を入れてください"); return; }
    if (!supabaseReady || !supabase) { setFormError("Supabaseに接続できていません"); return; }
    setSaving(true); setFormError(null);
    const { error } = await supabase.from("plans").insert({
      title: form.title.trim(),
      type: form.type,
      plan_date: selected,
      start_time: form.start_time || null,
      note: form.note || null,
      emoji: emojiFor(form.type),
    });
    setSaving(false);
    if (error) { setFormError(error.message); return; }
    setForm({ title: "", type: "予定", start_time: "", note: "" });
    setAdding(false);
    load();
  };

  const selDate = new Date(selected + "T00:00:00");
  const selLabel = `${selDate.getFullYear()}年${selDate.getMonth() + 1}月${selDate.getDate()}日(${["日","月","火","水","木","金","土"][selDate.getDay()]})`;

  return (
    <div>
      {/* 月の見出し */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 32, fontWeight: 900, lineHeight: 1 }}>{month + 1}</span>
          <span style={{ fontSize: 14, color: C.aiSoft }}>月 ・ {year}</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <NavBtn onClick={() => move(-1)} dir="prev" />
          <button onClick={() => { setCursor(new Date(today.getFullYear(), today.getMonth(), 1)); setSelected(ymd(today)); }}
            style={{ border: `1px solid ${C.line}`, background: "transparent", borderRadius: 8, padding: "4px 12px", fontSize: 12.5, color: C.ai, cursor: "pointer" }}>今日</button>
          <NavBtn onClick={() => move(1)} dir="next" />
        </div>
      </div>

      {/* 曜日 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 4 }}>
        {WEEK.map((w, i) => (
          <div key={w} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: i === 5 ? "#3B6FA0" : i === 6 ? C.shu : C.aiSoft, padding: "4px 0" }}>{w}</div>
        ))}
      </div>

      {/* 日付の格子 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, background: C.line, border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden" }}>
        {grid.map((d, i) => {
          if (!d) return <div key={i} style={{ background: C.washi, minHeight: 62 }} />;
          const key = ymd(d);
          const isToday = key === ymd(today);
          const isSel = key === selected;
          const dayPlans = plansByDay[key] || [];
          const dow = (d.getDay() + 6) % 7;
          return (
            <button key={i} onClick={() => setSelected(key)}
              style={{ background: isSel ? C.ai : C.white, border: "none", cursor: "pointer", minHeight: 62, minWidth: 0, overflow: "hidden", padding: "5px 4px 4px", textAlign: "left", display: "flex", flexDirection: "column", gap: 2, position: "relative" }}>
              <span style={{
                fontSize: 12.5, fontWeight: isToday ? 900 : 600,
                color: isSel ? C.white : dow === 6 ? C.shu : dow === 5 ? "#3B6FA0" : C.ai,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 20, height: 20, borderRadius: "50%",
                background: isToday && !isSel ? C.shu : "transparent",
                color: isToday && !isSel ? C.white : isSel ? C.white : dow === 6 ? C.shu : dow === 5 ? "#3B6FA0" : C.ai,
              }}>{d.getDate()}</span>
              {dayPlans.slice(0, 2).map((p) => (
                <span key={p.id} style={{ display: "block", width: "100%", fontSize: 9.5, lineHeight: 1.3, color: isSel ? "#D8DEEA" : C.aiSoft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {p.emoji || "・"}{p.title}
                </span>
              ))}
              {dayPlans.length > 2 && (
                <span style={{ fontSize: 9, color: isSel ? "#D8DEEA" : C.pencil }}>+{dayPlans.length - 2}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 選んだ日の予定 */}
      <div style={{ marginTop: 22 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 12px" }}>{selLabel}</h2>
        {loading ? (
          <div style={{ color: C.aiSoft, fontSize: 14 }}>読み込み中…</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {selectedPlans.length === 0 && !adding && (
              <div style={{ color: C.pencil, fontSize: 14, padding: "4px 0" }}>予定はありません</div>
            )}
            {selectedPlans.map((p) => (
              <div key={p.id} style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 14px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 22, lineHeight: 1.2 }}>{p.emoji || "📌"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {p.start_time && <span style={{ fontSize: 13, fontWeight: 700, color: C.shu }}>{p.start_time}</span>}
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{p.title}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: C.aiSoft, marginTop: 3 }}>
                    {p.type}{p.note ? `　${p.note}` : ""}
                  </div>
                </div>
              </div>
            ))}

            {/* 新しい予定 */}
            {!adding ? (
              <button onClick={() => { setAdding(true); setFormError(null); }}
                style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: `1.5px dashed ${C.aiSoft}66`, borderRadius: 10, padding: "12px 14px", cursor: "pointer", color: C.ai, fontSize: 14, fontWeight: 600 }}>
                <span style={{ fontSize: 18, lineHeight: 1, color: C.shu }}>＋</span> 新しい予定
              </button>
            ) : (
              <div style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 10, padding: "14px" }}>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="予定名（例：英語の宿題）" autoFocus
                  style={{ width: "100%", boxSizing: "border-box", border: "none", borderBottom: `1.5px solid ${C.line}`, background: "transparent", padding: "6px 2px", fontSize: 16, color: C.ai, outline: "none", marginBottom: 12 }} />
                <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  <label style={{ flex: 1 }}>
                    <span style={{ display: "block", fontSize: 11.5, color: C.pencil, marginBottom: 3 }}>種類</span>
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                      style={{ width: "100%", boxSizing: "border-box", border: "none", borderBottom: `1.5px solid ${C.line}`, background: "transparent", padding: "5px 2px", fontSize: 15, color: C.ai, outline: "none", cursor: "pointer" }}>
                      {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </label>
                  <label style={{ flex: 1 }}>
                    <span style={{ display: "block", fontSize: 11.5, color: C.pencil, marginBottom: 3 }}>時刻（任意）</span>
                    <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                      style={{ width: "100%", boxSizing: "border-box", border: "none", borderBottom: `1.5px solid ${C.line}`, background: "transparent", padding: "5px 2px", fontSize: 15, color: C.ai, outline: "none", cursor: "pointer" }} />
                  </label>
                </div>
                <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="メモ（任意）"
                  style={{ width: "100%", boxSizing: "border-box", border: "none", borderBottom: `1.5px solid ${C.line}`, background: "transparent", padding: "6px 2px", fontSize: 15, color: C.ai, outline: "none", marginBottom: 14 }} />
                {formError && <div style={{ color: C.shu, fontSize: 13, marginBottom: 10 }}>{formError}</div>}
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={addPlan} disabled={saving}
                    style={{ flex: 1, background: C.ai, color: C.white, border: "none", borderRadius: 8, padding: "11px", fontSize: 14.5, fontWeight: 700, cursor: saving ? "default" : "pointer" }}>
                    {saving ? "保存中…" : "保存"}
                  </button>
                  <button onClick={() => { setAdding(false); setFormError(null); setForm({ title: "", type: "予定", start_time: "", note: "" }); }}
                    style={{ background: "transparent", color: C.aiSoft, border: `1px solid ${C.line}`, borderRadius: 8, padding: "11px 18px", fontSize: 14, cursor: "pointer" }}>
                    やめる
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function NavBtn({ onClick, dir }) {
  return (
    <button onClick={onClick} style={{ border: `1px solid ${C.line}`, background: "transparent", borderRadius: 8, width: 32, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d={dir === "prev" ? "M10 3l-5 5 5 5" : "M6 3l5 5-5 5"} stroke="#26324F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
