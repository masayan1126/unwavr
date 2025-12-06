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
import { SlashCommand } from "./SlashCommand/extension";
import AIPromptDialog from "./AIPromptDialog";
import "tippy.js/dist/tippy.css";

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
    <div className={`${className ?? ""} flex flex-col border border-black/10 dark:border-white/10 rounded-xl overflow-hidden bg-card shadow-sm focus-within:ring-2 focus-within:ring-[var(--primary)]/20 transition-all`}>
      <div className="flex-1 min-h-0 max-h-[60vh] overflow-y-auto flex flex-col">
        <div className="sticky top-0 z-10 bg-muted/50 backdrop-blur-sm border-b border-black/5 dark:border-white/5 flex flex-wrap gap-1 p-2 shrink-0">
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
      className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${isActive ? "bg-[var(--primary)] text-white" : "hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground"}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}


