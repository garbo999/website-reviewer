"use client";

import { useState } from "react";

const LANGUAGES = [
  "German", "French", "Spanish", "Italian", "Portuguese",
  "Dutch", "Polish", "Swedish", "Danish", "Finnish",
  "Czech", "Romanian", "Hungarian", "Bulgarian", "Croatian",
  "Japanese", "Chinese", "Arabic", "Korean",
];

type Dimension = { score: number; explanation: string; example: string };
type Analysis = {
  linguistic_quality: Dimension;
  terminology_consistency: Dimension;
  cultural_adaptation: Dimension;
  completeness: Dimension;
  overall: { score: number; summary: string };
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
  const [url, setUrl] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("German");
  const [mode, setMode] = useState<"ai" | "mqm">("ai");
  const [usedMode, setUsedMode] = useState<"ai" | "mqm">("ai");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    if (!url.trim()) return;
    setIsLoading(true);
    setError("");
    setAnalysis(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, targetLanguage, mode }),
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

  return (
    <main style={{ maxWidth: 760, margin: "48px auto", padding: "0 20px", fontFamily: "sans-serif" }}>
      <h1 style={{ marginBottom: 4 }}>Website Localization Reviewer</h1>
      <p style={{ color: "#6b7280", marginBottom: 24 }}>
        Enter a URL and target language to get a quality report on the translation.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://commission.europa.eu/index_de"
          style={{ padding: 10, fontSize: 15, borderRadius: 4, border: "1px solid #d1d5db" }}
        />
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <span style={{ fontSize: 14, color: "#374151" }}>Assessment method:</span>
          {(["ai", "mqm"] as const).map((m) => (
            <label key={m} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 14 }}>
              <input
                type="radio"
                name="mode"
                value={m}
                checked={mode === m}
                onChange={() => setMode(m)}
              />
              {m === "ai" ? "AI Judgment" : "MQM Framework"}
            </label>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <label htmlFor="lang">Page language:</label>
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
            disabled={isLoading || !url.trim()}
            style={{
              padding: "8px 24px",
              fontSize: 15,
              borderRadius: 4,
              border: "none",
              background: isLoading || !url.trim() ? "#9ca3af" : "#0070f3",
              color: "#fff",
              cursor: isLoading ? "wait" : "pointer",
            }}
          >
            {isLoading ? "Analyzing…" : "Analyze"}
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
                  background: usedMode === "mqm" ? "#dbeafe" : "#f3f4f6",
                  color: usedMode === "mqm" ? "#1d4ed8" : "#6b7280",
                  fontWeight: 600, textTransform: "uppercase",
                }}>
                  {usedMode === "mqm" ? "MQM" : "AI Judgment"}
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
