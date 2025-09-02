"use client";
import React, { useEffect } from "react";
import type { ReactElement } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Heading from "@tiptap/extension-heading";

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
    ],
    content: value || "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none dark:prose-invert w-full h-full min-h-[300px] p-3 border rounded-lg border-black/10 dark:border-white/10 focus:outline-none bg-transparent",
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

  return (
    <div className={`${className ?? ""} flex flex-col`}>
      <div className="flex-1 min-h-0 max-h-[60vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-background border-b border-black/10 dark:border-white/10 flex flex-wrap gap-2 p-2 shrink-0">
          <button type="button" className="px-2 py-1 text-sm border rounded" onClick={() => editor?.chain().focus().setParagraph().run()}>P</button>
          <button type="button" className="px-2 py-1 text-sm border rounded" onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}>H1</button>
          <button type="button" className="px-2 py-1 text-sm border rounded" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
          <button type="button" className="px-2 py-1 text-sm border rounded" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
          <button type="button" className="px-2 py-1 text-sm border rounded" onClick={() => editor?.chain().focus().toggleBold().run()}>B</button>
          <button type="button" className="px-2 py-1 text-sm border rounded" onClick={() => editor?.chain().focus().toggleItalic().run()}>I</button>
          <button type="button" className="px-2 py-1 text-sm border rounded" onClick={() => editor?.chain().focus().toggleUnderline().run()}>U</button>
          <button type="button" className="px-2 py-1 text-sm border rounded" onClick={() => editor?.chain().focus().toggleBulletList().run()}>• List</button>
          <button type="button" className="px-2 py-1 text-sm border rounded" onClick={() => editor?.chain().focus().toggleOrderedList().run()}>1. List</button>
          <button type="button" className="px-2 py-1 text-sm border rounded" onClick={() => editor?.chain().focus().toggleCode().run()}>{"< >"}</button>
        </div>
        <EditorContent editor={editor} className="tiptap prose prose-sm max-w-none dark:prose-invert w-full min-h-[300px]" />
      </div>
    </div>
  );
}


