"use client";

import { useState, useEffect } from "react";
import { getReports, deleteReport, clearReports, type SavedReport, type SingleReport, type MultiReport } from "../lib/reports";
import { IssueList, issueCount, type Analysis } from "../components/IssueList";
import { buildTextReport, buildMultiTextReport, buildFilename, download } from "../lib/export";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function scoreColor(s: number) {
  return s >= 8 ? "#22c55e" : s >= 6 ? "#f59e0b" : "#ef4444";
}

function ModeTag({ mode }: { mode: string }) {
  const labels: Record<string, { label: string; bg: string; color: string }> = {
    ai:         { label: "AI",         bg: "#f3f4f6", color: "#6b7280" },
    mqm:        { label: "MQM",        bg: "#dbeafe", color: "#1d4ed8" },
    comparison: { label: "Comparison", bg: "#fef3c7", color: "#92400e" },
  };
  const s = labels[mode] ?? labels.ai;
  return (
    <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 10, background: s.bg, color: s.color, fontWeight: 600, textTransform: "uppercase" }}>
      {s.label}
    </span>
  );
}

function SingleCard({ report, onDelete }: { report: SingleReport; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const count = issueCount(report.analysis);

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "#6b7280", whiteSpace: "nowrap" }}>{formatDate(report.savedAt)}</span>
        <strong style={{ fontSize: 14 }}>{report.language}</strong>
        <ModeTag mode={report.mode} />
        <span style={{ fontWeight: 700, fontSize: 16, color: scoreColor(report.analysis.overall.score) }}>
          {report.analysis.overall.score}/10
        </span>
        <span style={{ fontSize: 13, color: "#6b7280", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {report.url || report.sourceUrl}
        </span>
        <button
          onClick={() => {
            const rep = buildTextReport(report.analysis, report.language, report.mode, report.url, report.sourceUrl);
            download(buildFilename(`localization-review-${report.language.toLowerCase()}`, "txt"), rep, "text/plain");
          }}
          style={{ padding: "3px 10px", fontSize: 12, borderRadius: 4, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", color: "#374151", whiteSpace: "nowrap" }}
        >
          ↓ .txt
        </button>
        <button onClick={() => setOpen(!open)}
          style={{ padding: "3px 10px", fontSize: 12, borderRadius: 4, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", color: "#374151" }}>
          {open ? "Hide" : `${count} issue${count !== 1 ? "s" : ""}`}
        </button>
        <button onClick={onDelete}
          style={{ padding: "3px 8px", fontSize: 13, borderRadius: 4, border: "1px solid #fca5a5", background: "#fff", cursor: "pointer", color: "#ef4444" }}>
          ×
        </button>
      </div>
      {open && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid #f3f4f6" }}>
          <IssueList analysis={report.analysis} />
        </div>
      )}
    </div>
  );
}

function MultiCard({ report, onDelete }: { report: MultiReport; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const totalIssues = report.rows.reduce((n, r) => n + issueCount(r.analysis), 0);
  const selectedRow = report.rows.find((r) => r.name === selectedLang);

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "#6b7280", whiteSpace: "nowrap" }}>{formatDate(report.savedAt)}</span>
        <strong style={{ fontSize: 14 }}>Multi-language ({report.rows.length})</strong>
        <ModeTag mode={report.mode} />
        <span style={{ fontSize: 13, color: "#6b7280", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {report.rows.map((r) => r.name).join(", ")}
        </span>
        <button
          onClick={() => {
            const rep = buildMultiTextReport(report.rows, report.templateUrl, report.mode);
            download(buildFilename("localization-review-multi", "txt"), rep, "text/plain");
          }}
          style={{ padding: "3px 10px", fontSize: 12, borderRadius: 4, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", color: "#374151", whiteSpace: "nowrap" }}
        >
          ↓ .txt
        </button>
        <button
          onClick={() => {
            const { buildCSV } = require("../lib/export");
            const csv = buildCSV(report.rows);
            download(buildFilename("localization-review-multi", "csv"), csv, "text/csv");
          }}
          style={{ padding: "3px 10px", fontSize: 12, borderRadius: 4, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", color: "#374151", whiteSpace: "nowrap" }}
        >
          ↓ .csv
        </button>
        <button onClick={() => setOpen(!open)}
          style={{ padding: "3px 10px", fontSize: 12, borderRadius: 4, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", color: "#374151" }}>
          {open ? "Hide" : `${totalIssues} issues`}
        </button>
        <button onClick={onDelete}
          style={{ padding: "3px 8px", fontSize: 13, borderRadius: 4, border: "1px solid #fca5a5", background: "#fff", cursor: "pointer", color: "#ef4444" }}>
          ×
        </button>
      </div>

      {open && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid #f3f4f6" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 12 }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {["Language", "Overall", "Linguistic", "Terminology", "Cultural", "Completeness", "Issues"].map((h) => (
                  <th key={h} style={{ padding: "6px 10px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", borderBottom: "1px solid #e5e7eb" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.rows.map((row) => (
                <tr key={row.name}
                  onClick={() => setSelectedLang(selectedLang === row.name ? null : row.name)}
                  style={{ borderBottom: "1px solid #f3f4f6", cursor: "pointer", background: selectedLang === row.name ? "#eff6ff" : "transparent" }}>
                  <td style={{ padding: "8px 10px", fontWeight: 500, textAlign: "center" }}>{row.name}</td>
                  {[row.analysis.overall.score, row.analysis.linguistic_quality.score, row.analysis.terminology_consistency.score, row.analysis.cultural_adaptation.score, row.analysis.completeness.score].map((s, i) => (
                    <td key={i} style={{ padding: "8px 10px", textAlign: "center", fontWeight: 600, color: scoreColor(s) }}>{s}</td>
                  ))}
                  <td style={{ padding: "8px 10px", textAlign: "center", color: "#6b7280" }}>{issueCount(row.analysis)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {selectedRow && (
            <IssueList analysis={selectedRow.analysis} heading={selectedRow.name} />
          )}
          {!selectedRow && (
            <p style={{ marginTop: 10, fontSize: 13, color: "#9ca3af", textAlign: "center" }}>Click a row to see its flagged issues</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function Reports() {
  const [reports, setReports] = useState<SavedReport[]>([]);

  useEffect(() => { setReports(getReports()); }, []);

  function handleDelete(id: string) {
    deleteReport(id);
    setReports((prev) => prev.filter((r) => r.id !== id));
  }

  function handleClear() {
    if (!confirm("Delete all saved reports?")) return;
    clearReports();
    setReports([]);
  }

  return (
    <main style={{ maxWidth: 820, margin: "40px auto", padding: "0 20px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>Reports</h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280" }}>Saved analyses — stored locally in your browser</p>
        </div>
        {reports.length > 0 && (
          <button onClick={handleClear}
            style={{ padding: "6px 14px", fontSize: 13, borderRadius: 4, border: "1px solid #fca5a5", background: "#fff", cursor: "pointer", color: "#ef4444" }}>
            Clear all
          </button>
        )}
      </div>

      {reports.length === 0 ? (
        <p style={{ color: "#9ca3af", fontSize: 15 }}>No saved reports yet. Run an analysis to see results here.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {reports.map((r) =>
            r.type === "single"
              ? <SingleCard key={r.id} report={r} onDelete={() => handleDelete(r.id)} />
              : <MultiCard key={r.id} report={r} onDelete={() => handleDelete(r.id)} />
          )}
        </div>
      )}
    </main>
  );
}
