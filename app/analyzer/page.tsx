"use client";

import { useState } from "react";
import { IssueList, type Analysis, DIMENSIONS } from "../components/IssueList";
import { buildTextReport, buildFilename, download } from "../lib/export";
import { saveReport } from "../lib/reports";

const LANGUAGES = [
  "English", "German", "French", "Spanish", "Italian", "Portuguese",
  "Dutch", "Polish", "Swedish", "Danish", "Finnish",
  "Czech", "Romanian", "Hungarian", "Bulgarian", "Croatian",
  "Japanese", "Chinese", "Arabic", "Korean", "Turkish",
];

const EU_BASE = "https://commission.europa.eu/news-and-media/news/take-splash-european-bathing-waters-remain-clean-2026-06-19";

const BTA_EN = "https://www.bta.bg/en/news/bulgaria/1155324-constitutional-court-annuls-parliament-resolution-ordering-government-to-pursue-";
const BTA_BG = "https://www.bta.bg/bg/news/bulgaria/1155261-konstitutsionniyat-sad-obyavi-za-protivokonstitutsionno-reshenieto-na-parlamenta";

const DEMOS: { label: string; targetUrl: string; sourceUrl: string; targetLanguage: string; mode: "ai" | "mqm" }[] = [
  { label: "German — MQM",      targetUrl: `${EU_BASE}_de`, sourceUrl: "",             targetLanguage: "German",  mode: "mqm" },
  { label: "French — AI",       targetUrl: `${EU_BASE}_fr`, sourceUrl: "",             targetLanguage: "French",  mode: "ai"  },
  { label: "Spanish — AI",      targetUrl: `${EU_BASE}_es`, sourceUrl: "",             targetLanguage: "Spanish", mode: "ai"  },
  { label: "EN → DE comparison",targetUrl: `${EU_BASE}_de`, sourceUrl: `${EU_BASE}_en`,targetLanguage: "German",  mode: "ai"  },
  { label: "EN → FR comparison",targetUrl: `${EU_BASE}_fr`, sourceUrl: `${EU_BASE}_en`,targetLanguage: "French",  mode: "ai"  },
  { label: "BG → EN comparison",targetUrl: BTA_EN,          sourceUrl: BTA_BG,         targetLanguage: "English", mode: "ai"  },
  { label: "Varna — MQM",       targetUrl: "https://www.varna.bg/en/189", sourceUrl: "", targetLanguage: "English", mode: "mqm" },
  { label: "ET → EN comparison",targetUrl: "https://taalihomes.ee/en/accommodation/metsamaja/", sourceUrl: "https://taalihomes.ee/majutus/metsamaja/", targetLanguage: "English", mode: "ai" },
];

type Mode = "ai" | "mqm" | "comparison";

const MODE_LABELS: Record<Mode, string> = {
  ai: "AI Judgment", mqm: "MQM", comparison: "Comparison",
};

const MODE_COLORS: Record<Mode, { bg: string; text: string }> = {
  ai:         { bg: "#f3f4f6", text: "#6b7280" },
  mqm:        { bg: "#dbeafe", text: "#1d4ed8" },
  comparison: { bg: "#fef3c7", text: "#92400e" },
};

function scoreColor(s: number) {
  return s >= 8 ? "#22c55e" : s >= 6 ? "#f59e0b" : "#ef4444";
}

function ScoreCard({ label, data }: { label: string; data: Analysis[typeof DIMENSIONS[number]] }) {
  const issues = data.issues ?? [];
  const hasCritical = issues.some((i) => i.severity === "Critical");
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, background: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <strong style={{ fontSize: 15 }}>{label}</strong>
        <span style={{ fontSize: 24, fontWeight: 700, color: scoreColor(data.score) }}>{data.score}/10</span>
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

export default function Home() {
  const [targetUrl, setTargetUrl]       = useState("");
  const [sourceUrl, setSourceUrl]       = useState("");
  const [targetLanguage, setTargetLanguage] = useState("German");
  const [mode, setMode]                 = useState<"ai" | "mqm">("ai");
  const [usedMode, setUsedMode]         = useState<Mode>("ai");
  const [analysis, setAnalysis]         = useState<Analysis | null>(null);
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState("");

  const canAnalyze  = targetUrl.trim() || sourceUrl.trim();
  const isComparison = targetUrl.trim() && sourceUrl.trim();

  async function runAnalysis(tUrl: string, sUrl: string, lang: string, m: "ai" | "mqm") {
    setIsLoading(true); setError(""); setAnalysis(null);
    try {
      const res  = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: tUrl, sourceUrl: sUrl, targetLanguage: lang, mode: m }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setUsedMode(data.mode ?? "ai");
      setAnalysis(data.analysis);
      saveReport({ type: "single", url: tUrl, sourceUrl: sUrl, language: lang, mode: data.mode ?? m, analysis: data.analysis });
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
    setTargetUrl(demo.targetUrl); setSourceUrl(demo.sourceUrl);
    setTargetLanguage(demo.targetLanguage); setMode(demo.mode);
    await runAnalysis(demo.targetUrl, demo.sourceUrl, demo.targetLanguage, demo.mode);
  }

  const overallColor = analysis ? scoreColor(analysis.overall.score) : "#000";
  const modeStyle    = MODE_COLORS[usedMode];

  return (
    <main style={{ maxWidth: 760, margin: "48px auto", padding: "0 20px", fontFamily: "sans-serif" }}>
      <h1 style={{ marginBottom: 4 }}>Website Localization Reviewer</h1>
      <p style={{ color: "#6b7280", marginBottom: 16 }}>
        Analyze a single page or compare source and target URLs for a full translation review.
      </p>

      <div style={{ marginBottom: 24 }}>
        <span style={{ fontSize: 13, color: "#6b7280", marginRight: 10 }}>Try a demo:</span>
        {DEMOS.map((demo) => (
          <button key={demo.label} onClick={() => handleDemo(demo)} disabled={isLoading} style={{
            marginRight: 8, marginBottom: 8, padding: "4px 12px", fontSize: 13,
            borderRadius: 16, border: "1px solid #d1d5db", background: "#f9fafb",
            color: "#374151", cursor: isLoading ? "wait" : "pointer",
          }}>
            {demo.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
        <div>
          <label style={{ fontSize: 13, color: "#6b7280", display: "block", marginBottom: 4 }}>Target URL (translated page)</label>
          <input type="url" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://commission.europa.eu/index_de"
            style={{ width: "100%", padding: 10, fontSize: 15, borderRadius: 4, border: "1px solid #d1d5db", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ fontSize: 13, color: "#6b7280", display: "block", marginBottom: 4 }}>
            Source URL (original language) — leave blank to analyze target only
          </label>
          <input type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://commission.europa.eu/index_en"
            style={{ width: "100%", padding: 10, fontSize: 15, borderRadius: 4, border: "1px solid #d1d5db", boxSizing: "border-box" }} />
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
          <select id="lang" value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)}
            style={{ padding: "6px 10px", fontSize: 15, borderRadius: 4, border: "1px solid #d1d5db" }}>
            {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
          </select>
          <button onClick={handleAnalyze} disabled={isLoading || !canAnalyze} style={{
            padding: "8px 24px", fontSize: 15, borderRadius: 4, border: "none",
            background: isLoading || !canAnalyze ? "#9ca3af" : "#0070f3",
            color: "#fff", cursor: isLoading ? "wait" : "pointer",
          }}>
            {isLoading ? "Analyzing…" : isComparison ? "Compare" : "Analyze"}
          </button>
          {!canAnalyze && !isLoading && (
            <span style={{ fontSize: 13, color: "#9ca3af" }}>
              ← Enter a URL, or try a demo above
            </span>
          )}
        </div>
      </div>

      {error && <p style={{ color: "#ef4444" }}>{error}</p>}

      {analysis && (
        <div>
          <div style={{
            background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8,
            padding: 20, marginBottom: 20, display: "flex", alignItems: "center", gap: 20,
          }}>
            <div style={{ fontSize: 48, fontWeight: 700, color: overallColor }}>
              {analysis.overall.score}/10
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                <strong style={{ fontSize: 16 }}>Overall Score — {targetLanguage}</strong>
                <span style={{
                  fontSize: 11, padding: "2px 8px", borderRadius: 12,
                  background: modeStyle.bg, color: modeStyle.text,
                  fontWeight: 600, textTransform: "uppercase",
                }}>
                  {MODE_LABELS[usedMode]}
                </span>
                <button
                  onClick={() => {
                    const report = buildTextReport(analysis!, targetLanguage, usedMode, targetUrl, sourceUrl);
                    const slug = targetLanguage.toLowerCase().replace(/\s+/g, "-");
                    download(buildFilename(`localization-review-${slug}`, "txt"), report, "text/plain");
                  }}
                  style={{ marginLeft: "auto", padding: "3px 10px", fontSize: 12, borderRadius: 4, border: "1px solid #bbf7d0", background: "#fff", cursor: "pointer", color: "#374151" }}
                >
                  ↓ Export report
                </button>
              </div>
              <p style={{ margin: "4px 0 0", color: "#374151" }}>{analysis.overall.summary}</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <ScoreCard label="Linguistic Quality"      data={analysis.linguistic_quality} />
            <ScoreCard label="Terminology Consistency" data={analysis.terminology_consistency} />
            <ScoreCard label="Cultural Adaptation"     data={analysis.cultural_adaptation} />
            <ScoreCard label="Completeness"            data={analysis.completeness} />
          </div>

          <IssueList analysis={analysis} />

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #e5e7eb" }}>
            <button
              onClick={() => {
                const report = buildTextReport(analysis!, targetLanguage, usedMode, targetUrl, sourceUrl);
                const slug = targetLanguage.toLowerCase().replace(/\s+/g, "-");
                download(buildFilename(`localization-review-${slug}`, "txt"), report, "text/plain");
              }}
              style={{ padding: "8px 20px", fontSize: 14, borderRadius: 4, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", color: "#374151" }}
            >
              ↓ Export report (.txt)
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
