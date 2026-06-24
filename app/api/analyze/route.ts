import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import * as cheerio from "cheerio";

const client = new Anthropic();

function extractText(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, nav, footer, header, noscript, iframe").remove();
  const text = $("body").text().replace(/\s+/g, " ").trim();
  return text.slice(0, 6000); // keep within token limits
}

function aiPrompt(targetLanguage: string, pageText: string): string {
  return `You are an expert localization reviewer. Analyze the following web page text which should be in ${targetLanguage}.

Score it on these 4 dimensions from 1 (poor) to 10 (excellent):
1. Linguistic Quality — fluency, grammar, naturalness in ${targetLanguage}
2. Terminology Consistency — consistent use of key terms throughout
3. Cultural Adaptation — appropriate tone, idioms, date/number formats, cultural references
4. Completeness — no untranslated strings or mixed source language

For each dimension, give:
- A score (1-10)
- One sentence of explanation
- One specific example from the text (quote directly if possible)

Then give an Overall score (average) and a 2-sentence summary recommendation.

Respond in this exact JSON format:
{
  "linguistic_quality": { "score": 0, "explanation": "", "example": "" },
  "terminology_consistency": { "score": 0, "explanation": "", "example": "" },
  "cultural_adaptation": { "score": 0, "explanation": "", "example": "" },
  "completeness": { "score": 0, "explanation": "", "example": "" },
  "overall": { "score": 0, "summary": "" }
}

Page text:
${pageText}`;
}

function mqmPrompt(targetLanguage: string, pageText: string): string {
  return `You are an expert localization reviewer applying the MQM (Multidimensional Quality Metrics) framework. Analyze the following web page text which should be in ${targetLanguage}.

Identify errors in these MQM categories and map them to 4 dimensions:

1. Linguistic Quality (MQM: Fluency) — grammar, spelling, punctuation, awkward phrasing
2. Terminology Consistency (MQM: Terminology) — wrong terms, inconsistent use of key terms
3. Cultural Adaptation (MQM: Style + Locale Conventions) — inappropriate register, wrong date/number/currency formats, untransferred cultural references
4. Completeness (MQM: Accuracy) — mistranslations, omissions, untranslated strings

For each dimension:
- List errors found, each classified as: Critical (penalty 25), Major (penalty 5), or Minor (penalty 1)
- Calculate score: start at 100, subtract total penalties, cap at 0, divide by 10
- Give one sentence explanation and one quoted example from the text

Then give an Overall score (average of the 4) and a 2-sentence summary.

Respond in this exact JSON format:
{
  "linguistic_quality": { "score": 0, "explanation": "", "example": "" },
  "terminology_consistency": { "score": 0, "explanation": "", "example": "" },
  "cultural_adaptation": { "score": 0, "explanation": "", "example": "" },
  "completeness": { "score": 0, "explanation": "", "example": "" },
  "overall": { "score": 0, "summary": "" }
}

Page text:
${pageText}`;
}

export async function POST(req: NextRequest) {
  try {
    const { url, targetLanguage, mode } = await req.json();

    if (!url || !targetLanguage) {
      return NextResponse.json({ error: "Missing url or targetLanguage" }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LocalizationReviewer/1.0)" },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch URL: ${response.status}` }, { status: 400 });
    }

    const html = await response.text();
    const pageText = extractText(html);

    if (!pageText || pageText.length < 50) {
      return NextResponse.json({ error: "Could not extract enough text from the page." }, { status: 400 });
    }

    const prompt = mode === "mqm"
      ? mqmPrompt(targetLanguage, pageText)
      : aiPrompt(targetLanguage, pageText);

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Could not parse analysis response." }, { status: 500 });
    }

    const analysis = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ analysis, url, targetLanguage, mode: mode ?? "ai" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
