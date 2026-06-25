"use client";

import { useState } from "react";

const LANGUAGES = [
  "English", "German", "French", "Spanish", "Italian", "Portuguese",
  "Dutch", "Polish", "Swedish", "Danish", "Finnish",
  "Czech", "Romanian", "Hungarian", "Bulgarian", "Croatian",
  "Japanese", "Chinese", "Arabic", "Korean", "Turkish",
];

const EU_BASE = "https://commission.europa.eu/news-and-media/news/take-splash-european-bathing-waters-remain-clean-2026-06-19";

const DEMOS: { label: string; targetUrl: string; sourceUrl: string; targetLanguage: string; mode: "ai" | "mqm" }[] = [
  {
    label: "German — MQM",
    targetUrl: `${EU_BASE}_de`,
    sourceUrl: "",
    targetLanguage: "German",
    mode: "mqm",
  },
  {
    label: "French — AI",
    targetUrl: `${EU_BASE}_fr`,
    sourceUrl: "",
    targetLanguage: "French",
    mode: "ai",
  },
  {
    label: "Spanish — AI",
    targetUrl: `${EU_BASE}_es`,
    sourceUrl: "",
    targetLanguage: "Spanish",
    mode: "ai",
  },
  {
    label: "EN → DE comparison",
    targetUrl: `${EU_BASE}_de`,
    sourceUrl: `${EU_BASE}_en`,
    targetLanguage: "German",
    mode: "ai",
  },
  {
    label: "EN → FR comparison",
    targetUrl: `${EU_BASE}_fr`,
    sourceUrl: `${EU_BASE}_en`,
    targetLanguage: "French",
    mode: "ai",
  },
];

type Issue = { severity: "Critical" | "Major" | "Minor"; quote: string; note: string };
type Dimension = { score: number; explanation: string; issues: Issue[] };
type Analysis = {
  linguistic_quality: Dimension;
  terminology_consistency: Dimension;
  cultural_adaptation: Dimension;
  completeness: Dimension;
  overall: { score: number; summary: string };
};
type Mode = "ai" | "mqm" | "comparison";

const MODE_LABELS: Record<Mode, string> = {
  ai: "AI Judgment",
  mqm: "MQM",
  comparison: "Comparison",
};

const MODE_COLORS: Record<Mode, { bg: string; text: string }> = {
  ai: { bg: "#f3f4f6", text: "#6b7280" },
  mqm: { bg: "#dbeafe", text: "#1d4ed8" },
  comparison: { bg: "#fef3c7", text: "#92400e" },
};

const SEVERITY_ORDER: Record<string, number> = { Critical: 0, Major: 1, Minor: 2 };

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Critical: { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
  Major:    { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
  Minor:    { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" },
};

const DIMENSION_LABELS: Record<string, string> = {
  linguistic_quality:      "Linguistic Quality",
  terminology_consistency: "Terminology",
  cultural_adaptation:     "Cultural Adaptation",
  completeness:            "Completeness",
};

const DIMENSIONS = ["linguistic_quality", "terminology_consistency", "cultural_adaptation", "completeness"] as const;

function ScoreCard({ label, data }: { label: string; data: Dimension }) {
  const color = data.score >= 8 ? "#22c55e" : data.score >= 6 ? "#f59e0b" : "#ef4444";
  const issues = data.issues ?? [];
  const hasCritical = issues.some((i) => i.severity === "Critical");
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, background: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <strong style={{ fontSize: 15 }}>{label}</strong>
        <span style={{ fontSize: 24, fontWeight: 700, color }}>{data.score}/10</span>
      </div>
      <p style={{ margin: 0, fontSize: 14, color: "#374151" }}>{data.explanation}</p>
      {issues.length > 0 && (
        <p style={{ margin: "6px 0 0", fontSize: 12, color: hasCritical ? "#ef4444" : "#6b7280" }}>
          {issues.length} issue{issues.length !== 1 ? "s" : ""} flagged
        </p>
      )}
    </div>
  );
}

function IssueList({ analysis }: { analysis: Analysis }) {
  const allIssues = DIMENSIONS
    .flatMap((dim) => (analysis[dim].issues ?? []).map((issue) => ({ ...issue, dimension: dim })))
    .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3));

  if (allIssues.length === 0) {
    return (
      <div style={{ marginTop: 20, padding: 14, background: "#f0fdf4", borderRadius: 8, fontSize: 14, color: "#166534" }}>
        No specific issues found. The translation appears to meet quality standards.
      </div>
    );
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 12px", color: "#111827" }}>
        Flagged Issues ({allIssues.length})
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {allIssues.map((issue, i) => {
          const c = SEVERITY_COLORS[issue.severity] ?? SEVERITY_COLORS.Minor;
          return (
            <div key={i} style={{
              display: "grid",
              gridTemplateColumns: "80px 140px 1fr",
              gap: 12,
              padding: "10px 14px",
              background: c.bg,
              border: `1px solid ${c.border}`,
              borderRadius: 6,
              fontSize: 14,
              alignItems: "start",
            }}>
              <span style={{ fontWeight: 700, color: c.text, fontSize: 11, textTransform: "uppercase", paddingTop: 2 }}>
                {issue.severity}
              </span>
              <span style={{ color: "#6b7280", fontSize: 13, paddingTop: 1 }}>
                {DIMENSION_LABELS[issue.dimension]}
              </span>
              <div>
                {issue.quote && (
                  <p style={{ margin: "0 0 4px", fontStyle: "italic", color: "#374151" }}>
                    &ldquo;{issue.quote}&rdquo;
                  </p>
                )}
                <p style={{ margin: 0, color: "#374151" }}>{issue.note}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Home() {
  const [targetUrl, setTargetUrl] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("German");
  const [mode, setMode] = useState<"ai" | "mqm">("ai");
  const [usedMode, setUsedMode] = useState<Mode>("ai");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const canAnalyze = targetUrl.trim() || sourceUrl.trim();
  const isComparison = targetUrl.trim() && sourceUrl.trim();

  async function runAnalysis(tUrl: string, sUrl: string, lang: string, m: "ai" | "mqm") {
    setIsLoading(true);
    setError("");
    setAnalysis(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: tUrl, sourceUrl: sUrl, targetLanguage: lang, mode: m }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setUsedMode(data.mode ?? "ai");
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAnalyze() {
    if (!canAnalyze) return;
    await runAnalysis(targetUrl, sourceUrl, targetLanguage, mode);
  }

  async function handleDemo(demo: typeof DEMOS[0]) {
    setTargetUrl(demo.targetUrl);
    setSourceUrl(demo.sourceUrl);
    setTargetLanguage(demo.targetLanguage);
    setMode(demo.mode);
    await runAnalysis(demo.targetUrl, demo.sourceUrl, demo.targetLanguage, demo.mode);
  }

  const overallColor = analysis
    ? analysis.overall.score >= 8 ? "#22c55e" : analysis.overall.score >= 6 ? "#f59e0b" : "#ef4444"
    : "#000";

  const modeStyle = MODE_COLORS[usedMode];

  return (
    <main style={{ maxWidth: 760, margin: "48px auto", padding: "0 20px", fontFamily: "sans-serif" }}>
      <h1 style={{ marginBottom: 4 }}>Website Localization Reviewer</h1>
      <p style={{ color: "#6b7280", marginBottom: 16 }}>
        Analyze a single page or compare source and target URLs for a full translation review.
      </p>

      <div style={{ marginBottom: 24 }}>
        <span style={{ fontSize: 13, color: "#6b7280", marginRight: 10 }}>Try a demo:</span>
        {DEMOS.map((demo) => (
          <button
            key={demo.label}
            onClick={() => handleDemo(demo)}
            disabled={isLoading}
            style={{
              marginRight: 8,
              marginBottom: 8,
              padding: "4px 12px",
              fontSize: 13,
              borderRadius: 16,
              border: "1px solid #d1d5db",
              background: "#f9fafb",
              color: "#374151",
              cursor: isLoading ? "wait" : "pointer",
            }}
          >
            {demo.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
        <div>
          <label style={{ fontSize: 13, color: "#6b7280", display: "block", marginBottom: 4 }}>
            Target URL (translated page)
          </label>
          <input
            type="url"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://commission.europa.eu/index_de"
            style={{ width: "100%", padding: 10, fontSize: 15, borderRadius: 4, border: "1px solid #d1d5db", boxSizing: "border-box" }}
          />
        </div>
        <div>
          <label style={{ fontSize: 13, color: "#6b7280", display: "block", marginBottom: 4 }}>
            Source URL (original language) — leave blank to analyze target only
          </label>
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://commission.europa.eu/index_en"
            style={{ width: "100%", padding: 10, fontSize: 15, borderRadius: 4, border: "1px solid #d1d5db", boxSizing: "border-box" }}
          />
        </div>

        {isComparison && (
          <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
            Note: For accurate comparison, source and target pages should be translations of the same content.
          </p>
        )}

        {!isComparison && (
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <span style={{ fontSize: 14, color: "#374151" }}>Assessment method:</span>
            {(["ai", "mqm"] as const).map((m) => (
              <label key={m} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 14 }}>
                <input type="radio" name="mode" value={m} checked={mode === m} onChange={() => setMode(m)} />
                {m === "ai" ? "AI Judgment" : "MQM Framework"}
              </label>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <label htmlFor="lang" style={{ fontSize: 14 }}>Target language:</label>
          <select
            id="lang"
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
            style={{ padding: "6px 10px", fontSize: 15, borderRadius: 4, border: "1px solid #d1d5db" }}
          >
            {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
          </select>
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !canAnalyze}
            style={{
              padding: "8px 24px",
              fontSize: 15,
              borderRadius: 4,
              border: "none",
              background: isLoading || !canAnalyze ? "#9ca3af" : "#0070f3",
              color: "#fff",
              cursor: isLoading ? "wait" : "pointer",
            }}
          >
            {isLoading ? "Analyzing…" : isComparison ? "Compare" : "Analyze"}
          </button>
        </div>
      </div>

      {error && <p style={{ color: "#ef4444" }}>{error}</p>}

      {analysis && (
        <div>
          <div style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 8,
            padding: 20,
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}>
            <div style={{ fontSize: 48, fontWeight: 700, color: overallColor }}>
              {analysis.overall.score}/10
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <strong style={{ fontSize: 16 }}>Overall Score — {targetLanguage}</strong>
                <span style={{
                  fontSize: 11, padding: "2px 8px", borderRadius: 12,
                  background: modeStyle.bg, color: modeStyle.text,
                  fontWeight: 600, textTransform: "uppercase",
                }}>
                  {MODE_LABELS[usedMode]}
                </span>
              </div>
              <p style={{ margin: "4px 0 0", color: "#374151" }}>{analysis.overall.summary}</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <ScoreCard label="Linguistic Quality" data={analysis.linguistic_quality} />
            <ScoreCard label="Terminology Consistency" data={analysis.terminology_consistency} />
            <ScoreCard label="Cultural Adaptation" data={analysis.cultural_adaptation} />
            <ScoreCard label="Completeness" data={analysis.completeness} />
          </div>

          <IssueList analysis={analysis} />
        </div>
      )}
    </main>
  );
}
