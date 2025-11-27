import type { Task } from "@/lib/types";

export function htmlToPlainText(html: string): string {
  if (!html) return "";
  if (typeof window === "undefined") {
    // SSR 環境では簡易除去
    return html
      .replace(/<br\s*\/?>(\n)?/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
      .replace(/<[^>]*>/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
  const container = document.createElement("div");
  container.innerHTML = html;
  const text = container.textContent || container.innerText || "";
  return text.replace(/\u00A0/g, " ").trim();
}

export function htmlToMarkdown(html: string): string {
  if (!html) return "";
  let md = html;
  // line breaks and paragraphs
  md = md.replace(/<br\s*\/?>(\n)?/gi, "\n");
  md = md.replace(/<\/(p|div)>/gi, "\n\n");
  // headings
  md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_m, c) => `# ${htmlToPlainText(String(c))}\n\n`);
  md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_m, c) => `## ${htmlToPlainText(String(c))}\n\n`);
  md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_m, c) => `### ${htmlToPlainText(String(c))}\n\n`);
  md = md.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_m, c) => `#### ${htmlToPlainText(String(c))}\n\n`);
  md = md.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, (_m, c) => `##### ${htmlToPlainText(String(c))}\n\n`);
  md = md.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, (_m, c) => `###### ${htmlToPlainText(String(c))}\n\n`);
  // bold / italic / underline
  md = md.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, c) => `**${htmlToPlainText(String(c))}**`);
  md = md.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, c) => `*${htmlToPlainText(String(c))}*`);
  // underline: drop formatting
  md = md.replace(/<u[^>]*>([\s\S]*?)<\/u>/gi, (_m, c) => htmlToPlainText(String(c)));
  // inline code
  md = md.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_m, c) => `\`${htmlToPlainText(String(c)).replace(/`/g, '\\`')}\``);
  // code blocks <pre><code>...
  md = md.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_m, c) => {
    const body = String(c).replace(/^[\n\r]+|[\n\r]+$/g, "");
    return "\n\n```\n" + htmlToPlainText(body) + "\n```\n\n";
  });
  // links
  md = md.replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href, text) => {
    return `[${htmlToPlainText(String(text))}](${href})`;
  });
  // unordered lists
  md = md.replace(/<ul[^>]*>[\s\S]*?<\/ul>/gi, (m) => {
    const items = Array.from(m.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)).map((it) => `- ${htmlToPlainText(String(it[1]))}`);
    return "\n" + items.join("\n") + "\n\n";
  });
  // ordered lists (naive numbering)
  md = md.replace(/<ol[^>]*>[\s\S]*?<\/ol>/gi, (m) => {
    const items = Array.from(m.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)).map((it, idx) => `${idx + 1}. ${htmlToPlainText(String(it[1]))}`);
    return "\n" + items.join("\n") + "\n\n";
  });
  // strip remaining tags
  md = md.replace(/<[^>]+>/g, (t) => {
    // keep inline breaks turned into spaces
    if (/^<\/(p|div)>$/i.test(t)) return "\n\n";
    if (/^<br\s*\/??>$/i.test(t)) return "\n";
    return "";
  });
  // collapse multiple blank lines
  md = md.replace(/\n{3,}/g, "\n\n");
  return md.trim();
}

export type CopyFormat = "markdown" | "html" | "text";

export async function copyDescriptionWithFormat(descriptionHtml: string | undefined, format: CopyFormat): Promise<void> {
  const source = descriptionHtml ?? "";
  let payload = "";
  if (format === "html") payload = source;
  else if (format === "markdown") payload = htmlToMarkdown(source);
  else payload = htmlToPlainText(source);
  if (!payload) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(payload);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = payload;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
}

export async function copyDescriptionToClipboard(descriptionHtml?: string): Promise<void> {
  const text = htmlToPlainText(descriptionHtml ?? "");
  if (!text) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // フォールバック: 一時テキストエリア
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
}

export function getTodayUtc(): number {
  const d = new Date();
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function getTodayDateInput(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTomorrowDateInput(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const day = String(tomorrow.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isOverdue(task: Task, todayUtc: number = getTodayUtc()): boolean {
  if (task.completed) return false;
  if (task.type === "daily") return false;
  if (task.type === "scheduled") {
    const ranges = task.scheduled?.dateRanges ?? [];
    if (ranges.length === 0) return false;
    return ranges.some((r) => r.end < todayUtc);
  }
  if (task.type === "backlog") {
    const planned = task.plannedDates ?? [];
    if (planned.length === 0) return false;
    const latest = Math.max(...planned);
    return latest < todayUtc;
  }
  return false;
}

export function getEarliestExecutionDate(task: Task): number | null {
  if (task.type === "daily") return null;
  if (task.type === "scheduled") {
    const ranges = task.scheduled?.dateRanges ?? [];
    if (ranges.length === 0) return null;
    return Math.min(...ranges.map((r) => r.start));
  }
  if (task.type === "backlog") {
    const planned = task.plannedDates ?? [];
    if (planned.length === 0) return null;
    return Math.min(...planned);
  }
  return null;
}

export function isDailyDoneToday(dailyDoneDates?: number[]): boolean {
  const now = new Date();
  const local = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const utc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Boolean(dailyDoneDates && (dailyDoneDates.includes(local) || dailyDoneDates.includes(utc)));
}

export function isBacklogPlannedToday(plannedDates?: number[]): boolean {
  if (!plannedDates || plannedDates.length === 0) return false;
  const now = new Date();
  const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const utcMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (plannedDates.includes(localMidnight) || plannedDates.includes(utcMidnight)) return true;
  return plannedDates.some((rawTs) => {
    const tsMs = rawTs < 1e12 ? rawTs * 1000 : rawTs;
    const dt = new Date(tsMs);
    return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth() && dt.getDate() === now.getDate();
  });
}

export function isScheduledForToday(days?: number[], ranges?: { start: number; end: number }[]): boolean {
  const now = new Date();
  const dow = now.getDay();
  const inDays = Boolean(days && days.includes(dow));
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const inRanges = Boolean(ranges && ranges.some((r) => t >= r.start && t <= r.end));
  return inDays || inRanges;
}
