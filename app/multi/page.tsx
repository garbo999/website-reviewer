"use client";

import { useState } from "react";
import { IssueList, issueCount, type Analysis } from "../components/IssueList";
import { buildCSV, buildMultiTextReport, download, type MultiRow } from "../lib/export";

const EU_DEMO = "https://commission.europa.eu/news-and-media/news/take-splash-european-bathing-waters-remain-clean-2026-06-19_{lang}";

const ALL_LANGUAGES = [
  { name: "German",     code: "de", selected: true  },
  { name: "French",     code: "fr", selected: true  },
  { name: "Spanish",    code: "es", selected: true  },
  { name: "Italian",    code: "it", selected: true  },
  { name: "Dutch",      code: "nl", selected: true  },
  { name: "Polish",     code: "pl", selected: false },
  { name: "Portuguese", code: "pt", selected: false },
  { name: "Romanian",   code: "ro", selected: false },
];

type RowStatus = "idle" | "loading" | "done" | "error";
type Row = { name: string; code: string; status: RowStatus; analysis?: Analysis; error?: string };

function scoreColor(score: number) {
  return score >= 8 ? "#22c55e" : score >= 6 ? "#f59e0b" : "#ef4444";
}

function ScoreCell({ score }: { score: number }) {
  return (
    <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600, color: scoreColor(score), fontSize: 15 }}>
      {score.toFixed(1)}
    </td>
  );
}

const TH: React.CSSProperties = {
  padding: "8px 12px", textAlign: "center", fontSize: 12, fontWeight: 600,
  color: "#6b7280", textTransform: "uppercase", borderBottom: "2px solid #e5e7eb",
  whiteSpace: "nowrap",
};

export default function Multi() {
  const [template, setTemplate]   = useState(EU_DEMO);
  const [languages, setLanguages] = useState(ALL_LANGUAGES);
  const [rows, setRows]           = useState<Row[]>([]);
  const [running, setRunning]     = useState(false);
  const [mode, setMode]           = useState<"ai" | "mqm">("ai");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  function toggleLang(code: string) {
    setLanguages((prev) => prev.map((l) => l.code === code ? { ...l, selected: !l.selected } : l));
  }

  async function analyzeOne(lang: { name: string; code: string }) {
    const url = template.replace("{lang}", lang.code);
    setRows((prev) => prev.map((r) => r.code === lang.code ? { ...r, status: "loading" } : r));
    try {
      const res  = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, sourceUrl: "", targetLanguage: lang.name, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setRows((prev) => prev.map((r) => r.code === lang.code ? { ...r, status: "done", analysis: data.analysis } : r));
    } catch (err) {
      setRows((prev) => prev.map((r) => r.code === lang.code
        ? { ...r, status: "error", error: err instanceof Error ? err.message : "Failed" }
        : r));
    }
  }

  async function handleRun() {
    const selected = languages.filter((l) => l.selected);
    if (!selected.length || !template.includes("{lang}")) return;
    setRunning(true);
    setSelectedCode(null);
    setRows(selected.map((l) => ({ name: l.name, code: l.code, status: "idle" })));
    await Promise.all(selected.map((l) => analyzeOne(l)));
    setRunning(false);
  }

  const selected    = languages.filter((l) => l.selected);
  const doneCount   = rows.filter((r) => r.status === "done" || r.status === "error").length;
  const selectedRow = rows.find((r) => r.code === selectedCode && r.status === "done");

  return (
    <main style={{ maxWidth: 820, margin: "40px auto", padding: "0 20px", fontFamily: "sans-serif" }}>
      <h1 style={{ marginBottom: 4 }}>Multi-language Analysis</h1>
      <p style={{ color: "#6b7280", marginBottom: 28 }}>
        Analyze the same page across multiple languages and compare quality scores at a glance.
        Use <code style={{ background: "#f3f4f6", padding: "1px 5px", borderRadius: 3 }}>{"{lang}"}</code> in
        the URL where the language code appears.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
        <div>
          <label style={{ fontSize: 13, color: "#6b7280", display: "block", marginBottom: 4 }}>URL template</label>
          <input type="text" value={template} onChange={(e) => setTemplate(e.target.value)}
            style={{ width: "100%", padding: 10, fontSize: 14, borderRadius: 4, border: "1px solid #d1d5db", boxSizing: "border-box", fontFamily: "monospace" }} />
        </div>

        <div>
          <span style={{ fontSize: 13, color: "#6b7280", display: "block", marginBottom: 8 }}>Languages</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {languages.map((l) => (
              <label key={l.code} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, cursor: "pointer" }}>
                <input type="checkbox" checked={l.selected} onChange={() => toggleLang(l.code)} />
                {l.name}
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <span style={{ fontSize: 14, color: "#374151" }}>Assessment method:</span>
          {(["ai", "mqm"] as const).map((m) => (
            <label key={m} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 14 }}>
              <input type="radio" name="multi-mode" value={m} checked={mode === m} onChange={() => setMode(m)} />
              {m === "ai" ? "AI Judgment" : "MQM Framework"}
            </label>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={handleRun} disabled={running || !selected.length || !template.includes("{lang}")} style={{
            padding: "8px 28px", fontSize: 15, borderRadius: 4, border: "none",
            background: running || !selected.length ? "#9ca3af" : "#0070f3",
            color: "#fff", cursor: running ? "wait" : "pointer",
          }}>
            {running ? `Analyzing… (${doneCount}/${selected.length})` : "Analyze All"}
          </button>
          {!template.includes("{lang}") && (
            <span style={{ fontSize: 13, color: "#ef4444" }}>URL must contain {"{lang}"}</span>
          )}
        </div>
      </div>

      {rows.length > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 8 }}>
            <button
              onClick={() => {
                const doneRows = rows.filter((r) => r.status === "done" && r.analysis) as MultiRow[];
                const report = buildMultiTextReport(doneRows, template.replace("_{lang}", ""), mode);
                download("localization-review-multi.txt", report, "text/plain");
              }}
              style={{ padding: "4px 12px", fontSize: 13, borderRadius: 4, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", color: "#374151" }}
            >
              ↓ Export full report (.txt)
            </button>
            <button
              onClick={() => {
                const doneRows = rows.filter((r) => r.status === "done" && r.analysis) as MultiRow[];
                const csv = buildCSV(doneRows);
                download("localization-review-multi.csv", csv, "text/csv");
              }}
              style={{ padding: "4px 12px", fontSize: 13, borderRadius: 4, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", color: "#374151" }}
            >
              ↓ Export scores (.csv)
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={{ ...TH, textAlign: "left", paddingLeft: 16 }}>Language</th>
                  <th style={TH}>Overall</th>
                  <th style={TH}>Linguistic</th>
                  <th style={TH}>Terminology</th>
                  <th style={TH}>Cultural</th>
                  <th style={TH}>Completeness</th>
                  <th style={TH}>Issues</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const isSelected = row.code === selectedCode;
                  const isClickable = row.status === "done";
                  return (
                    <tr
                      key={row.code}
                      onClick={() => isClickable && setSelectedCode(isSelected ? null : row.code)}
                      style={{
                        borderBottom: "1px solid #f3f4f6",
                        background: isSelected ? "#eff6ff" : i % 2 === 0 ? "#fff" : "#fafafa",
                        cursor: isClickable ? "pointer" : "default",
                      }}
                    >
                      <td style={{ padding: "10px 16px", fontWeight: 500 }}>{row.name}</td>
                      {row.status === "loading" || row.status === "idle" ? (
                        <td colSpan={6} style={{ padding: "10px 12px", color: "#9ca3af", fontSize: 13 }}>
                          {row.status === "loading" ? "Analyzing…" : "Waiting…"}
                        </td>
                      ) : row.status === "error" ? (
                        <td colSpan={6} style={{ padding: "10px 12px", color: "#ef4444", fontSize: 13 }}>
                          {row.error}
                        </td>
                      ) : row.analysis ? (
                        <>
                          <ScoreCell score={row.analysis.overall.score} />
                          <ScoreCell score={row.analysis.linguistic_quality.score} />
                          <ScoreCell score={row.analysis.terminology_consistency.score} />
                          <ScoreCell score={row.analysis.cultural_adaptation.score} />
                          <ScoreCell score={row.analysis.completeness.score} />
                          <td style={{ padding: "10px 12px", textAlign: "center", color: "#6b7280", fontSize: 13 }}>
                            {issueCount(row.analysis)}
                          </td>
                        </>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {rows.some((r) => r.status === "done") && !selectedRow && (
            <p style={{ marginTop: 12, fontSize: 13, color: "#9ca3af", textAlign: "center" }}>
              Click a row to see its flagged issues
            </p>
          )}

          {selectedRow?.analysis && (
            <IssueList analysis={selectedRow.analysis} heading={selectedRow.name} />
          )}
        </>
      )}
    </main>
  );
}
