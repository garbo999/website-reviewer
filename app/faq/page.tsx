const QA = [
  {
    q: "What does this tool do?",
    a: "The Website Localization Reviewer analyzes translated web pages and scores them across four dimensions: Linguistic Quality, Terminology Consistency, Cultural Adaptation, and Completeness. It generates an instant quality report including a prioritized list of specific flagged issues, without requiring the reviewer to read the target language. It can also analyze the same page across multiple languages simultaneously and export results as a text report or CSV.",
  },
  {
    q: "Who is it for?",
    a: "Content groups, localization managers, and QA reviewers who need to assess the quality of a translated website — as a post-publication audit or a pre-launch check.",
  },
  {
    q: "How do I use it?",
    a: "Paste the URL of a translated page and click Analyze. For a deeper review, also provide the source URL — the tool will compare them directly, catching omissions and mistranslations that are invisible from the target alone. Use the Multi-language tab to analyze the same page in several languages at once. Or click one of the demo buttons to see it in action immediately.",
  },
  {
    q: "What are the three analysis modes?",
    items: [
      { label: "AI Judgment", desc: "Holistic scoring across all four dimensions, drawing on Claude's broad knowledge of the target language and localization conventions." },
      { label: "MQM Framework", desc: "The industry-standard Multidimensional Quality Metrics framework. Errors are classified as Critical (−25), Major (−5), or Minor (−1), and the score is calculated from the total penalty." },
      { label: "Comparison", desc: "Provide both a source and target URL. The tool compares them directly, flagging omissions, additions, and semantic shifts invisible from the target alone." },
    ],
  },
  {
    q: "What is the Flagged Issues list?",
    a: "Below the dimension score cards, the tool lists every specific problem it found across all four dimensions, ranked by severity — Critical first, then Major, then Minor. Each entry includes a quoted excerpt from the page and a one-sentence explanation of why it is an error. This list can be copied directly into a correction brief for a language vendor.",
  },
  {
    q: "Can I analyze multiple languages at once?",
    a: "Yes — use the Multi-language tab. Enter a URL and target language for each language version of the same page, then click Analyze All. Click 'Load EU Commission example' to see it pre-filled with five languages. Results appear in a comparison table as each language completes. Click any row to see its detailed flagged issues.",
  },
  {
    q: "Can I export the results?",
    a: "Yes. On the Analyzer tab, click '↓ Export report (.txt)' at the bottom of the results for a full text report including scores, explanations, and all flagged issues. On the Multi-language tab, use '↓ Export full report (.txt)' for a complete per-language breakdown, or '↓ Export scores (.csv)' for the scores table in spreadsheet format. Files are named with an ISO date and serial number for easy filing.",
  },
  {
    q: "What sites work well?",
    a: "Any site that serves text in the HTML response: government sites, news sites, corporate pages, documentation. The EU Commission (ec.europa.eu) is an ideal test case — 24 languages, clean HTML, and professional translations.",
  },
  {
    q: "What sites won't work?",
    a: "JavaScript-heavy sites that render content client-side (IKEA, Booking.com, many e-commerce platforms). The tool will return an error or very low score if it cannot extract enough text from the page.",
  },
  {
    q: "Why does the score vary slightly between runs?",
    a: "AI Judgment and Comparison modes involve qualitative assessment, which has inherent variability. MQM mode is more consistent because it follows a fixed error-classification and penalty formula.",
  },
  {
    q: "Further development ideas",
    bullets: true,
    items: [
      { label: "API access", desc: "A REST API so the reviewer can be integrated into CI/CD pipelines, CMS workflows, or translation management systems for automated quality gates." },
      { label: "MQM benchmark validation", desc: "Cross-reference AI-generated MQM scores against human-annotated gold standard datasets (such as the MQM Translation Quality dataset on HuggingFace) to measure and improve scoring accuracy." },
      { label: "Rule-based grammar checking", desc: "LanguageTool integration for a fully deterministic Linguistic Quality score." },
      { label: "Paste text mode", desc: "Analyze content that isn't publicly accessible — staging environments, protected pages, or raw translation output." },
      { label: "Multi-page crawl", desc: "Analyze a full site section rather than a single page." },
      { label: "Translation memory sync", desc: "Locate flagged strings in existing TM/TMX files for targeted correction." },
    ],
  },
];

export default function FAQ() {
  return (
    <main style={{ maxWidth: 760, margin: "40px auto", padding: "0 20px", fontFamily: "sans-serif" }}>
      <h1 style={{ marginBottom: 4 }}>FAQ</h1>
      <p style={{ color: "#6b7280", marginBottom: 36 }}>
        About the Website Localization Reviewer
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {QA.map((item) => (
          <div key={item.q}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px", color: "#111827" }}>
              {item.q}
            </h2>
            {"a" in item && (
              <p style={{ margin: 0, fontSize: 15, color: "#374151", lineHeight: 1.6 }}>{item.a}</p>
            )}
            {"items" in item && (
              <ul style={{ margin: 0, padding: 0, listStyle: "bullets" in item ? "disc" : "none", paddingLeft: "bullets" in item ? 20 : 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {item.items!.map((sub) => (
                  <li key={sub.label} style={{ fontSize: 15, color: "#374151", lineHeight: 1.6 }}>
                    <strong>{sub.label}</strong> — {sub.desc}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #e5e7eb", fontSize: 14, color: "#6b7280" }}>
        Built by Andrea Danuzzo, Christèle Forget, Gary Hess, Sena Karaca, and Estefania Tamayo Pineda
        &nbsp;—&nbsp; MAD for Localization Hackathon, June 2026.
      </div>
    </main>
  );
}
