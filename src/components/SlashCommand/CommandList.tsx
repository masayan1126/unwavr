import React, { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Heading1, Heading2, Heading3, List, ListOrdered, Text, Code } from 'lucide-react';

export interface CommandItemProps {
    title: string;
    icon: React.ReactNode;
    command: (editor: any, range: any) => void;
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
        title: 'コードブロック',
        icon: <Code size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
        },
    },
];

const CommandList = forwardRef((props: any, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = useCallback((index: number) => {
        const item = props.items[index];
        if (item) {
            props.command(item);
        }
    }, [props]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [props.items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === 'ArrowUp') {
                setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
                return true;
            }
            if (event.key === 'ArrowDown') {
                setSelectedIndex((selectedIndex + 1) % props.items.length);
                return true;
            }
            if (event.key === 'Enter') {
                selectItem(selectedIndex);
                return true;
            }
            return false;
        },
    }));

    return (
        <div className="z-50 min-w-[200px] overflow-hidden rounded-md border border-black/10 dark:border-white/10 bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
            {props.items.length ? (
                props.items.map((item: CommandItemProps, index: number) => (
                    <button
                        key={index}
                        className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none ${index === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'
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
