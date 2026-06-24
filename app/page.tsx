"use client";

import { useState } from "react";

const LANGUAGES = [
  "English", "German", "French", "Spanish", "Italian", "Portuguese",
  "Dutch", "Polish", "Swedish", "Danish", "Finnish",
  "Czech", "Romanian", "Hungarian", "Bulgarian", "Croatian",
  "Japanese", "Chinese", "Arabic", "Korean", "Turkish",
];

type Dimension = { score: number; explanation: string; example: string };
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

function ScoreCard({ label, data }: { label: string; data: Dimension }) {
  const color = data.score >= 8 ? "#22c55e" : data.score >= 6 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, background: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <strong style={{ fontSize: 15 }}>{label}</strong>
        <span style={{ fontSize: 24, fontWeight: 700, color }}>{data.score}/10</span>
      </div>
      <p style={{ margin: "0 0 6px", fontSize: 14, color: "#374151" }}>{data.explanation}</p>
      {data.example && (
        <p style={{ margin: 0, fontSize: 13, color: "#6b7280", fontStyle: "italic" }}>
          &ldquo;{data.example}&rdquo;
        </p>
      )}
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

  async function handleAnalyze() {
    if (!canAnalyze) return;
    setIsLoading(true);
    setError("");
    setAnalysis(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl, sourceUrl, targetLanguage, mode }),
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

  const overallColor = analysis
    ? analysis.overall.score >= 8 ? "#22c55e" : analysis.overall.score >= 6 ? "#f59e0b" : "#ef4444"
    : "#000";

  const modeStyle = MODE_COLORS[usedMode];

  return (
    <main style={{ maxWidth: 760, margin: "48px auto", padding: "0 20px", fontFamily: "sans-serif" }}>
      <h1 style={{ marginBottom: 4 }}>Website Localization Reviewer</h1>
      <p style={{ color: "#6b7280", marginBottom: 24 }}>
        Analyze a single page or compare source and target URLs for a full translation review.
      </p>

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
        </div>
      )}
    </main>
  );
}
