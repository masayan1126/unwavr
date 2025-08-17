import { NextResponse } from "next/server";

export async function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const urls = ["/", "/tasks", "/milestones", "/pomodoro", "/launcher"]; // 主要ページ
  const items = urls
    .map((u) => `<url><loc>${base}${u}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`) 
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</urlset>`;
  return new NextResponse(xml, { headers: { "Content-Type": "application/xml" } });
}


