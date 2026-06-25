import { type Analysis } from "../components/IssueList";

export type SingleReport = {
  id: string;
  savedAt: string;
  type: "single";
  url: string;
  sourceUrl: string;
  language: string;
  mode: string;
  analysis: Analysis;
};

export type MultiReport = {
  id: string;
  savedAt: string;
  type: "multi";
  templateUrl: string;
  mode: string;
  rows: { name: string; analysis: Analysis }[];
};

export type SavedReport = SingleReport | MultiReport;

const KEY = "saved_reports";

export function getReports(): SavedReport[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch { return []; }
}

export function saveReport(data: Omit<SingleReport, "id" | "savedAt"> | Omit<MultiReport, "id" | "savedAt">): void {
  const reports = getReports();
  reports.unshift({ ...data, id: Date.now().toString(), savedAt: new Date().toISOString() } as SavedReport);
  try {
    localStorage.setItem(KEY, JSON.stringify(reports));
  } catch { /* storage full */ }
}

export function deleteReport(id: string): void {
  localStorage.setItem(KEY, JSON.stringify(getReports().filter((r) => r.id !== id)));
}

export function clearReports(): void {
  localStorage.removeItem(KEY);
}
