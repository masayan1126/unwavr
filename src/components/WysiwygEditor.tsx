"use client";
import React, { useEffect } from "react";
import type { ReactElement } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Heading from "@tiptap/extension-heading";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Extension, mergeAttributes } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { DOMParser as ProseMirrorDOMParser } from "@tiptap/pm/model";
import { SlashCommand } from "./SlashCommand/extension";
import AIPromptDialog from "./AIPromptDialog";
import "tippy.js/dist/tippy.css";

// テーブルをスクロール可能なラッパーで囲むカスタム拡張
const ScrollableTable = Table.extend({
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      { class: 'table-scroll-wrapper' },
      ['table', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), ['tbody', 0]],
    ];
  },
});

// マークダウンテーブル記法をHTMLテーブルに変換する関数
function parseMarkdownTable(text: string): string | null {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return null;

  // テーブル行を解析（パイプで区切られた行を検出）
  const tableLines: string[][] = [];
  let separatorIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('|') && !line.includes('|')) continue;

    // セパレータ行を検出 (例: |---|---|---)
    if (/^\|?[\s\-:]+\|[\s\-:|]+\|?$/.test(line)) {
      separatorIndex = tableLines.length;
      tableLines.push([]);
      continue;
    }

    // セルを抽出
    const cells = line
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map(cell => cell.trim());

    if (cells.length > 0) {
      tableLines.push(cells);
    }
  }

  // 有効なテーブルか確認（ヘッダー + セパレータ + 少なくとも1行のデータ）
  if (tableLines.length < 2 || separatorIndex === -1) {
    // セパレータなしでもテーブルとして解析を試みる
    if (tableLines.length >= 1 && tableLines.every(row => row.length > 0)) {
      // 最初の行をヘッダーとして扱う
      const headerRow = tableLines[0];
      const bodyRows = tableLines.slice(1);

      let html = '<table><thead><tr>';
      for (const cell of headerRow) {
        html += `<th>${escapeHtml(cell)}</th>`;
      }
      html += '</tr></thead>';

      if (bodyRows.length > 0) {
        html += '<tbody>';
        for (const row of bodyRows) {
          if (row.length === 0) continue;
          html += '<tr>';
          for (let i = 0; i < headerRow.length; i++) {
            html += `<td>${escapeHtml(row[i] || '')}</td>`;
          }
          html += '</tr>';
        }
        html += '</tbody>';
      }
      html += '</table>';
      return html;
    }
    return null;
  }

  // ヘッダー行とデータ行を取得
  const headerRows = tableLines.slice(0, separatorIndex);
  const dataRows = tableLines.slice(separatorIndex + 1).filter(row => row.length > 0);

  if (headerRows.length === 0) return null;

  const columnCount = Math.max(...tableLines.filter(r => r.length > 0).map(r => r.length));

  let html = '<table><thead>';
  for (const headerRow of headerRows) {
    html += '<tr>';
    for (let i = 0; i < columnCount; i++) {
      html += `<th>${escapeHtml(headerRow[i] || '')}</th>`;
    }
    html += '</tr>';
  }
  html += '</thead>';

  if (dataRows.length > 0) {
    html += '<tbody>';
    for (const row of dataRows) {
      html += '<tr>';
      for (let i = 0; i < columnCount; i++) {
        html += `<td>${escapeHtml(row[i] || '')}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody>';
  }
  html += '</table>';

  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// テキストがマークダウンテーブルかどうかを判定
function isMarkdownTable(text: string): boolean {
  const lines = text.trim().split('\n');
  if (lines.length < 1) return false;

  // パイプ文字を含む行があるかチェック
  const pipeLines = lines.filter(line => line.includes('|'));
  if (pipeLines.length < 1) return false;

  // セパレータ行のパターンをチェック
  const hasSeparator = lines.some(line => /^\|?[\s\-:]+\|[\s\-:|]+\|?$/.test(line.trim()));

  // パイプで区切られた複数列があるかチェック
  const hasMultipleColumns = pipeLines.some(line => {
    const cells = line.replace(/^\|/, '').replace(/\|$/, '').split('|');
    return cells.length >= 2;
  });

  return hasMultipleColumns && (hasSeparator || pipeLines.length >= 2);
}

// マークダウンテーブルペースト用のカスタム拡張
const MarkdownTablePaste = Extension.create({
  name: 'markdownTablePaste',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('markdownTablePaste'),
        props: {
          handlePaste: (view, event) => {
            const text = event.clipboardData?.getData('text/plain');
            if (text && isMarkdownTable(text)) {
              const tableHtml = parseMarkdownTable(text);
              if (tableHtml) {
                event.preventDefault();
                // HTMLをProseMirrorのスライスに変換して挿入
                const { schema } = view.state;
                const parser = ProseMirrorDOMParser.fromSchema(schema);
                const dom = document.createElement('div');
                dom.innerHTML = tableHtml;
                const slice = parser.parseSlice(dom);
                const tr = view.state.tr.replaceSelection(slice);
                view.dispatch(tr);
                return true;
              }
            }
            return false;
          },
        },
      }),
    ];
  },
});

type WysiwygEditorProps = {
  value: string;
  onChange: (nextHtml: string) => void;
  className?: string;
  onBlur?: (latestHtml: string) => void;
};

export default function WysiwygEditor({ value, onChange, className, onBlur }: WysiwygEditorProps): ReactElement {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Underline,
      Link.configure({ openOnClick: false }),
      Heading.configure({ levels: [1, 2, 3] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      ScrollableTable.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'table-auto border-collapse',
        },
      }),
      TableRow,
      TableCell,
      TableHeader,
      MarkdownTablePaste,
      SlashCommand,
    ],
    content: value || "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none dark:prose-invert w-full h-full min-h-[300px] p-4 focus:outline-none bg-transparent",
      },
      handleDOMEvents: {
        blur: () => {
          if (onBlur) onBlur(editor?.getHTML() ?? "");
          return false;
        },
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if ((value || "") !== current) editor.commands.setContent(value || "", { emitUpdate: false });
  }, [value, editor]);

  const [showAIPrompt, setShowAIPrompt] = React.useState(false);

  useEffect(() => {
    const handleAIPrompt = () => setShowAIPrompt(true);
    window.addEventListener("unwavr:ai-prompt", handleAIPrompt);
    return () => window.removeEventListener("unwavr:ai-prompt", handleAIPrompt);
  }, []);

  return (
    <div className={`${className ?? ""} flex flex-col border border-black/10 dark:border-white/10 rounded-xl bg-card shadow-sm focus-within:ring-2 focus-within:ring-[var(--primary)]/20 transition-all`}>
      <div className="flex-1 min-h-0 overflow-auto flex flex-col">
        <div className="sticky top-0 z-10 bg-muted border-b border-black/10 dark:border-white/10 flex flex-wrap gap-1 p-2 shrink-0">
          <ToolbarButton onClick={() => editor?.chain().focus().setParagraph().run()} label="P" isActive={editor?.isActive('paragraph')} />
          <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} label="H1" isActive={editor?.isActive('heading', { level: 1 })} />
          <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} label="H2" isActive={editor?.isActive('heading', { level: 2 })} />
          <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} label="H3" isActive={editor?.isActive('heading', { level: 3 })} />
          <div className="w-px h-4 bg-black/10 dark:bg-white/10 mx-1 self-center" />
          <ToolbarButton onClick={() => editor?.chain().focus().toggleBold().run()} label="B" isActive={editor?.isActive('bold')} />
          <ToolbarButton onClick={() => editor?.chain().focus().toggleItalic().run()} label="I" isActive={editor?.isActive('italic')} />
          <ToolbarButton onClick={() => editor?.chain().focus().toggleUnderline().run()} label="U" isActive={editor?.isActive('underline')} />
          <ToolbarButton onClick={() => editor?.chain().focus().toggleStrike().run()} label="S" isActive={editor?.isActive('strike')} />
          <div className="w-px h-4 bg-black/10 dark:bg-white/10 mx-1 self-center" />
          <ToolbarButton onClick={() => editor?.chain().focus().toggleBulletList().run()} label="• List" isActive={editor?.isActive('bulletList')} />
          <ToolbarButton onClick={() => editor?.chain().focus().toggleOrderedList().run()} label="1. List" isActive={editor?.isActive('orderedList')} />
          <ToolbarButton onClick={() => editor?.chain().focus().toggleTaskList().run()} label="☑ Task" isActive={editor?.isActive('taskList')} />
          <ToolbarButton onClick={() => editor?.chain().focus().toggleBlockquote().run()} label='"' isActive={editor?.isActive('blockquote')} />
          <ToolbarButton onClick={() => editor?.chain().focus().setHorizontalRule().run()} label="—" />
          <ToolbarButton onClick={() => editor?.chain().focus().toggleCode().run()} label="< >" isActive={editor?.isActive('code')} />
          <div className="w-px h-4 bg-black/10 dark:bg-white/10 mx-1 self-center" />
          <ToolbarButton onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} label="⊞ Table" isActive={editor?.isActive('table')} />
        </div>
        <EditorContent editor={editor} className="tiptap prose prose-sm max-w-none dark:prose-invert w-full min-h-[300px] flex-1" />
      </div>
      <AIPromptDialog
        isOpen={showAIPrompt}
        onClose={() => setShowAIPrompt(false)}
        onInsert={(text) => editor?.chain().focus().insertContent(text).run()}
      />
    </div>
  );
}

function ToolbarButton({ onClick, label, isActive }: { onClick: () => void, label: string, isActive?: boolean }) {
  return (
    <button
      type="button"
      className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${isActive ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "hover:bg-black/10 dark:hover:bg-white/15 text-foreground/80 hover:text-foreground"}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
