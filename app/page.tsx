"use client";

import { useState } from "react";
import { IssueList, issueCount, type Analysis } from "./components/IssueList";
import { buildCSV, buildMultiTextReport, buildFilename, download, type MultiRow } from "./lib/export";
import { saveReport } from "./lib/reports";

const LANGUAGE_OPTIONS = [
  "Arabic", "Bulgarian", "Chinese", "Croatian", "Czech", "Danish", "Dutch",
  "English", "Estonian", "Finnish", "French", "German", "Hungarian", "Italian",
  "Japanese", "Korean", "Polish", "Portuguese", "Romanian", "Spanish", "Swedish", "Turkish",
];

const EU_BASE = "https://commission.europa.eu/news-and-media/news/take-splash-european-bathing-waters-remain-clean-2026-06-19";

const EU_DEMO_DATA = [
  { name: "German",  url: `${EU_BASE}_de` },
  { name: "French",  url: `${EU_BASE}_fr` },
  { name: "Spanish", url: `${EU_BASE}_es` },
  { name: "Italian", url: `${EU_BASE}_it` },
  { name: "Dutch",   url: `${EU_BASE}_nl` },
];

type LangRow   = { id: string; name: string; url: string };
type RowStatus = "idle" | "loading" | "done" | "error";
type ResultRow = { id: string; name: string; status: RowStatus; analysis?: Analysis; error?: string };

let _id = 0;
function uid() { return String(++_id); }
function makeRows(data: { name: string; url: string }[]): LangRow[] {
  return data.map((d) => ({ id: uid(), name: d.name, url: d.url }));
}

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
  const [langRows, setLangRows]   = useState<LangRow[]>(() => [
    { id: uid(), name: "", url: "" },
    { id: uid(), name: "", url: "" },
    { id: uid(), name: "", url: "" },
  ]);
  const [results, setResults]     = useState<ResultRow[]>([]);
  const [running, setRunning]     = useState(false);
  const [mode, setMode]           = useState<"ai" | "mqm">("ai");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function updateRow(id: string, field: keyof LangRow, value: string) {
    setLangRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
  }

  function removeRow(id: string) {
    setLangRows((prev) => prev.filter((r) => r.id !== id));
  }

  function addRow() {
    setLangRows((prev) => [...prev, { id: uid(), name: "", url: "" }]);
  }

  function loadEUDemo() {
    setLangRows(makeRows(EU_DEMO_DATA));
    setResults([]);
    setSelectedId(null);
  }

  async function analyzeOne(row: LangRow): Promise<{ name: string; analysis: Analysis } | null> {
    setResults((prev) => prev.map((r) => r.id === row.id ? { ...r, status: "loading" } : r));
    try {
      const res  = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: row.url, sourceUrl: "", targetLanguage: row.name, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setResults((prev) => prev.map((r) => r.id === row.id ? { ...r, status: "done", analysis: data.analysis } : r));
      return { name: row.name, analysis: data.analysis };
    } catch (err) {
      setResults((prev) => prev.map((r) => r.id === row.id
        ? { ...r, status: "error", error: err instanceof Error ? err.message : "Failed" }
        : r));
      return null;
    }
  }

  async function handleRun() {
    const valid = langRows.filter((r) => r.name.trim() && r.url.trim());
    if (!valid.length) return;
    setRunning(true);
    setSelectedId(null);
    setResults(valid.map((r) => ({ id: r.id, name: r.name, status: "idle" })));
    const results = await Promise.all(valid.map((r) => analyzeOne(r)));
    const successRows = results.filter(Boolean) as { name: string; analysis: Analysis }[];
    if (successRows.length > 0) {
      saveReport({ type: "multi", templateUrl: "", mode, rows: successRows });
    }
    setRunning(false);
  }

  const valid        = langRows.filter((r) => r.name.trim() && r.url.trim());
  const doneCount    = results.filter((r) => r.status === "done" || r.status === "error").length;
  const selectedResult = results.find((r) => r.id === selectedId && r.status === "done");

  return (
    <main style={{ maxWidth: 820, margin: "40px auto", padding: "0 20px", fontFamily: "sans-serif" }}>
      <h1 style={{ marginBottom: 4 }}>Multi-language Analysis</h1>
      <p style={{ color: "#6b7280", marginBottom: 20 }}>
        Enter a URL for each language version of the same page to compare quality scores at a glance.
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <button onClick={loadEUDemo} style={{
          padding: "5px 14px", fontSize: 13, borderRadius: 4,
          border: "1px solid #d1d5db", background: "#f9fafb",
          cursor: "pointer", color: "#374151",
        }}>
          Load EU Commission example
        </button>
        <button onClick={addRow} style={{
          padding: "5px 14px", fontSize: 13, borderRadius: 4,
          border: "1px solid #0070f3", background: "#fff",
          cursor: "pointer", color: "#0070f3",
        }}>
          + Add language
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {langRows.map((row) => (
          <div key={row.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              value={row.name}
              onChange={(e) => updateRow(row.id, "name", e.target.value)}
              style={{ padding: "7px 10px", fontSize: 14, borderRadius: 4, border: "1px solid #d1d5db", minWidth: 130 }}
            >
              <option value="">Language…</option>
              {LANGUAGE_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <input
              type="url"
              value={row.url}
              onChange={(e) => updateRow(row.id, "url", e.target.value)}
              placeholder="https://example.com/page-in-this-language"
              style={{
                flex: 1, padding: "7px 10px", fontSize: 13, borderRadius: 4,
                border: "1px solid #d1d5db", fontFamily: "monospace",
              }}
            />
            <button
              onClick={() => removeRow(row.id)}
              disabled={langRows.length <= 1}
              style={{
                padding: "4px 10px", fontSize: 16, borderRadius: 4,
                border: "1px solid #fca5a5", background: "#fff",
                color: "#ef4444", cursor: langRows.length <= 1 ? "default" : "pointer",
                opacity: langRows.length <= 1 ? 0.4 : 1,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 24, alignItems: "center", marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <span style={{ fontSize: 14, color: "#374151" }}>Assessment method:</span>
          {(["ai", "mqm"] as const).map((m) => (
            <label key={m} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 14 }}>
              <input type="radio" name="multi-mode" value={m} checked={mode === m} onChange={() => setMode(m)} />
              {m === "ai" ? "AI Judgment" : "MQM Framework"}
            </label>
          ))}
        </div>
        <button onClick={handleRun} disabled={running || valid.length === 0} style={{
          padding: "8px 28px", fontSize: 15, borderRadius: 4, border: "none",
          background: running || valid.length === 0 ? "#9ca3af" : "#0070f3",
          color: "#fff", cursor: running ? "wait" : "pointer",
        }}>
          {running ? `Analyzing… (${doneCount}/${valid.length})` : "Analyze All"}
        </button>
      </div>

      {results.length > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 8 }}>
            <button
              onClick={() => {
                const doneRows = results.filter((r) => r.status === "done" && r.analysis) as MultiRow[];
                const report = buildMultiTextReport(doneRows, "", mode);
                download(buildFilename("localization-review-multi", "txt"), report, "text/plain");
              }}
              style={{ padding: "4px 12px", fontSize: 13, borderRadius: 4, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", color: "#374151" }}
            >
              ↓ Export full report (.txt)
            </button>
            <button
              onClick={() => {
                const doneRows = results.filter((r) => r.status === "done" && r.analysis) as MultiRow[];
                const csv = buildCSV(doneRows);
                download(buildFilename("localization-review-multi", "csv"), csv, "text/csv");
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
                {results.map((row, i) => {
                  const isSelected  = row.id === selectedId;
                  const isClickable = row.status === "done";
                  return (
                    <tr key={row.id}
                      onClick={() => isClickable && setSelectedId(isSelected ? null : row.id)}
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

          {results.some((r) => r.status === "done") && !selectedResult && (
            <p style={{ marginTop: 12, fontSize: 13, color: "#9ca3af", textAlign: "center" }}>
              Click a row to see its flagged issues
            </p>
          )}

          {selectedResult?.analysis && (
            <IssueList analysis={selectedResult.analysis} heading={selectedResult.name} />
          )}
        </>
      )}
    </main>
  );
}
