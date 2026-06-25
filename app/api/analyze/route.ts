import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import * as cheerio from "cheerio";

const client = new Anthropic();

function extractText(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, nav, footer, header, noscript, iframe").remove();
  const text = $("body").text().replace(/\s+/g, " ").trim();
  return text.slice(0, 5000);
}

const JSON_INSTRUCTION = `IMPORTANT: Return only valid JSON. Use single quotes for any text you quote from the page inside the JSON string values — never double quotes inside JSON strings.`;

const ISSUES_INSTRUCTION = `For each dimension, list up to 3 specific issues found as an array. Each issue must have:
- "severity": "Critical", "Major", or "Minor"
- "quote": a short excerpt from the text that illustrates the problem (use single quotes within the text)
- "note": one sentence explaining why this is an error
If no issues are found for a dimension, use an empty array.`;

const JSON_FORMAT = `{
  "linguistic_quality": { "score": 0, "explanation": "", "issues": [{ "severity": "Major", "quote": "example text", "note": "reason this is an error" }] },
  "terminology_consistency": { "score": 0, "explanation": "", "issues": [] },
  "cultural_adaptation": { "score": 0, "explanation": "", "issues": [] },
  "completeness": { "score": 0, "explanation": "", "issues": [] },
  "overall": { "score": 0, "summary": "" }
}`;

function aiPrompt(targetLanguage: string, pageText: string): string {
  return `You are an expert localization reviewer. Analyze the following web page text which should be in ${targetLanguage}.

Score it on these 4 dimensions from 1 (poor) to 10 (excellent):
1. Linguistic Quality — fluency, grammar, naturalness in ${targetLanguage}
2. Terminology Consistency — consistent use of key terms throughout
3. Cultural Adaptation — appropriate tone, idioms, date/number formats, cultural references
4. Completeness — no untranslated strings or mixed source language

For each dimension give a score and one sentence explanation.
${ISSUES_INSTRUCTION}
Then give an Overall score (average) and a 2-sentence summary.

${JSON_INSTRUCTION}

Respond in this exact JSON format:
${JSON_FORMAT}

Page text:
${pageText}`;
}

function mqmPrompt(targetLanguage: string, pageText: string): string {
  return `You are an expert localization reviewer applying the MQM (Multidimensional Quality Metrics) framework. Analyze the following web page text which should be in ${targetLanguage}.

Identify errors in these MQM categories mapped to 4 dimensions:
1. Linguistic Quality (MQM: Fluency) — grammar, spelling, punctuation, awkward phrasing
2. Terminology Consistency (MQM: Terminology) — wrong terms, inconsistent use of key terms
3. Cultural Adaptation (MQM: Style + Locale Conventions) — inappropriate register, wrong date/number/currency formats
4. Completeness (MQM: Accuracy) — mistranslations, omissions, untranslated strings

For each dimension: classify errors as Critical (penalty 25), Major (penalty 5), or Minor (penalty 1). Score = max(0, 100 - penalties) / 10. Give one sentence explanation.
${ISSUES_INSTRUCTION}
Then give an Overall score (average) and a 2-sentence summary.

${JSON_INSTRUCTION}

Respond in this exact JSON format:
${JSON_FORMAT}

Page text:
${pageText}`;
}

function comparisonPrompt(targetLanguage: string, sourceText: string, targetText: string): string {
  return `You are an expert localization reviewer. Compare the SOURCE text (original) with the TARGET text (translation into ${targetLanguage}).

Score the translation on 4 dimensions from 1 (poor) to 10 (excellent):
1. Linguistic Quality — fluency, grammar, naturalness of the TARGET in ${targetLanguage}
2. Terminology Consistency — consistent translation of key terms from SOURCE to TARGET
3. Cultural Adaptation — appropriate adaptation of tone, idioms, date/number formats for a ${targetLanguage}-speaking audience
4. Completeness — all content from SOURCE is present in TARGET with no omissions or untranslated strings

For each dimension give a score and one sentence explanation based on the comparison.
${ISSUES_INSTRUCTION}
Then give an Overall score (average) and a 2-sentence summary highlighting the main strengths and issues found by comparing source and target.

${JSON_INSTRUCTION}

Respond in this exact JSON format:
${JSON_FORMAT}

SOURCE TEXT:
${sourceText}

TARGET TEXT (${targetLanguage}):
${targetText}`;
}

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; LocalizationReviewer/1.0)" },
  });
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  return extractText(await response.text());
}

function parseAnalysis(raw: string) {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not parse analysis response.");
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    const sanitized = jsonMatch[0].replace(/:\s*"([\s\S]*?)(?<!\\)"(?=\s*[,}])/g, (_, val) => {
      return `: "${val.replace(/(?<!\\)"/g, "'")}"`;
    });
    return JSON.parse(sanitized);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url, sourceUrl, targetLanguage, mode } = await req.json();

    const hasTarget = url && url.trim();
    const hasSource = sourceUrl && sourceUrl.trim();

    if (!hasTarget && !hasSource) {
      return NextResponse.json({ error: "Please provide at least one URL." }, { status: 400 });
    }
    if (!targetLanguage) {
      return NextResponse.json({ error: "Missing targetLanguage." }, { status: 400 });
    }

    let prompt: string;
    let usedMode: string;

    if (hasTarget && hasSource) {
      const [targetText, sourceText] = await Promise.all([
        fetchPage(url.trim()),
        fetchPage(sourceUrl.trim()),
      ]);
      prompt = comparisonPrompt(targetLanguage, sourceText, targetText);
      usedMode = "comparison";
    } else {
      const pageUrl = hasTarget ? url.trim() : sourceUrl.trim();
      const pageText = await fetchPage(pageUrl);
      if (pageText.length < 50) {
        return NextResponse.json({ error: "Could not extract enough text from the page." }, { status: 400 });
      }
      prompt = mode === "mqm"
        ? mqmPrompt(targetLanguage, pageText)
        : aiPrompt(targetLanguage, pageText);
      usedMode = mode ?? "ai";
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const analysis = parseAnalysis(raw);

    return NextResponse.json({ analysis, targetLanguage, mode: usedMode });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
