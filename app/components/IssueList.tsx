export type Issue = { severity: "Critical" | "Major" | "Minor"; quote: string; note: string };
export type Dimension = { score: number; explanation: string; issues: Issue[] };
export type Analysis = {
  linguistic_quality: Dimension;
  terminology_consistency: Dimension;
  cultural_adaptation: Dimension;
  completeness: Dimension;
  overall: { score: number; summary: string };
};

export const DIMENSIONS = [
  "linguistic_quality",
  "terminology_consistency",
  "cultural_adaptation",
  "completeness",
] as const;

const SEVERITY_ORDER: Record<string, number> = { Critical: 0, Major: 1, Minor: 2 };

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Critical: { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
  Major:    { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
  Minor:    { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" },
};

export const DIMENSION_LABELS: Record<string, string> = {
  linguistic_quality:      "Linguistic Quality",
  terminology_consistency: "Terminology",
  cultural_adaptation:     "Cultural Adaptation",
  completeness:            "Completeness",
};

export function issueCount(analysis: Analysis) {
  return DIMENSIONS.reduce(
    (n, k) => n + (analysis[k].issues?.length ?? 0),
    0
  );
}

export function IssueList({ analysis, heading }: { analysis: Analysis; heading?: string }) {
  const allIssues = DIMENSIONS
    .flatMap((dim) => (analysis[dim].issues ?? []).map((issue) => ({ ...issue, dimension: dim })))
    .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3));

  if (allIssues.length === 0) {
    return (
      <div style={{ marginTop: 20, padding: 14, background: "#f0fdf4", borderRadius: 8, fontSize: 14, color: "#166534" }}>
        {heading && <strong style={{ display: "block", marginBottom: 4 }}>{heading}</strong>}
        No specific issues found. The translation appears to meet quality standards.
      </div>
    );
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 12px", color: "#111827" }}>
        {heading ? `${heading} — ` : ""}Flagged Issues ({allIssues.length})
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
