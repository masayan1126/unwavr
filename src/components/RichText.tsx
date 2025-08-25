"use client";
import React, { useMemo } from "react";
import DOMPurify from "dompurify";

type RichTextProps = {
  html: string;
  className?: string;
};

export default function RichText({ html, className }: RichTextProps): JSX.Element {
  const safe = useMemo(() => DOMPurify.sanitize(html ?? ""), [html]);
  return <div className={className} dangerouslySetInnerHTML={{ __html: safe }} />;
}


