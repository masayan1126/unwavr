import React, { useState, useEffect, useCallback, useImperativeHandle, forwardRef, useRef } from 'react';
import { Heading1, Heading2, Heading3, List, ListOrdered, Text, Code, Sparkles, Quote, Minus, CheckSquare, Bold, Italic, Underline, Strikethrough } from 'lucide-react';
import { Editor, Range } from '@tiptap/core';

export interface CommandItemProps {
    title: string;
    icon: React.ReactNode;
    command: (props: { editor: Editor; range: Range }) => void;
}

export const ITEMS: CommandItemProps[] = [
    {
        title: 'テキスト',
        icon: <Text size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setParagraph().run();
        },
    },
    {
        title: '見出し 1',
        icon: <Heading1 size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
        },
    },
    {
        title: '見出し 2',
        icon: <Heading2 size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
        },
    },
    {
        title: '見出し 3',
        icon: <Heading3 size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
        },
    },
    {
        title: '太字',
        icon: <Bold size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleBold().run();
        },
    },
    {
        title: '斜体',
        icon: <Italic size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleItalic().run();
        },
    },
    {
        title: '下線',
        icon: <Underline size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleUnderline().run();
        },
    },
    {
        title: '取り消し線',
        icon: <Strikethrough size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleStrike().run();
        },
    },
    {
        title: '箇条書き',
        icon: <List size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleBulletList().run();
        },
    },
    {
        title: '番号付きリスト',
        icon: <ListOrdered size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleOrderedList().run();
        },
    },
    {
        title: 'タスクリスト',
        icon: <CheckSquare size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleTaskList().run();
        },
    },
    {
        title: '引用',
        icon: <Quote size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleBlockquote().run();
        },
    },
    {
        title: '区切り線',
        icon: <Minus size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setHorizontalRule().run();
        },
    },
    {
        title: 'コードブロック',
        icon: <Code size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
        },
    },
    {
        title: 'AI アシスタント',
        icon: <Sparkles size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).run();
            window.dispatchEvent(new CustomEvent("unwavr:ai-prompt"));
        },
    },
];

interface CommandListProps {
    items: CommandItemProps[];
    command: (item: CommandItemProps) => void;
}

const CommandList = forwardRef((props: CommandListProps, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const selectedIndexRef = useRef(selectedIndex);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Keep ref in sync with state for event handlers
    useEffect(() => {
        selectedIndexRef.current = selectedIndex;

        // Scroll selected item into view
        const container = scrollContainerRef.current;
        if (container) {
            const selectedElement = container.children[selectedIndex] as HTMLElement;
            if (selectedElement) {
                const containerTop = container.scrollTop;
                const containerBottom = containerTop + container.clientHeight;
                const elementTop = selectedElement.offsetTop;
                const elementBottom = elementTop + selectedElement.offsetHeight;

                if (elementTop < containerTop) {
                    container.scrollTop = elementTop;
                } else if (elementBottom > containerBottom) {
                    container.scrollTop = elementBottom - container.clientHeight;
                }
            }
        }
    }, [selectedIndex]);

    const selectItem = useCallback((index: number) => {
        const item = props.items[index];
        if (item) {
            props.command(item);
        }
    }, [props]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [props.items.map(item => item.title).join(',')]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (props.items.length === 0) return false;

            if (event.key === 'ArrowUp') {
                setSelectedIndex((prev) => (prev + props.items.length - 1) % props.items.length);
                return true;
            }
            if (event.key === 'ArrowDown') {
                setSelectedIndex((prev) => (prev + 1) % props.items.length);
                return true;
            }
            if (event.key === 'Enter') {
                selectItem(selectedIndexRef.current);
                return true;
            }
            return false;
        },
    }), [props.items, selectItem]);

    return (
        <div
            ref={scrollContainerRef}
            className="z-50 min-w-[200px] max-h-[300px] overflow-y-auto overflow-x-hidden rounded-md border border-black/10 dark:border-white/10 bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
        >
            {props.items.length ? (
                props.items.map((item: CommandItemProps, index: number) => (
                    <button
                        key={index}
                        className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors ${index === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'
                            }`}
                        onClick={() => selectItem(index)}
                    >
                        <span className="opacity-70">{item.icon}</span>
                        <span>{item.title}</span>
                    </button>
                ))
            ) : (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">No result</div>
            )}
        </div>
    );
});

CommandList.displayName = 'CommandList';

export default CommandList;
