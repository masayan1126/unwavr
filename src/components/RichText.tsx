"use client";
import React, { useMemo } from "react";
import type { ReactElement } from "react";
import DOMPurify from "dompurify";

type RichTextProps = {
  html: string;
  className?: string;
};

export default function RichText({ html, className }: RichTextProps): ReactElement {
  const safe = useMemo(() => {
    const clean = DOMPurify.sanitize(html ?? "");
    // テーブルをスクロール可能なラッパーで囲む
    return clean.replace(/<table/g, '<div class="table-scroll-wrapper"><table').replace(/<\/table>/g, '</table></div>');
  }, [html]);

  return <div className={className} dangerouslySetInnerHTML={{ __html: safe }} />;
}
