import { ReactRenderer } from '@tiptap/react';
import tippy, { Instance } from 'tippy.js';
import CommandList, { ITEMS, CommandItemProps } from './CommandList';
import { Editor, Range } from '@tiptap/core';

interface SuggestionProps {
    editor: Editor;
    range: Range;
    query: string;
    text: string;
    items: CommandItemProps[];
    command: (props: { editor: Editor; range: Range }) => void;
    decorationNode: Element | null;
    clientRect?: (() => DOMRect) | null;
    event?: KeyboardEvent;
}

const suggestion = {
    items: ({ query }: { query: string }) => {
        return ITEMS.filter(item => item.title.toLowerCase().includes(query.toLowerCase())).slice(0, 10);
    },
    render: () => {
        let component: ReactRenderer;
        let popup: Instance[];

        return {
            onStart: (props: SuggestionProps) => {
                component = new ReactRenderer(CommandList, {
                    props,
                    editor: props.editor,
                });

                if (!props.clientRect) {
                    return;
                }

                popup = tippy('body', {
                    getReferenceClientRect: props.clientRect,
                    appendTo: () => document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-start',
                });
            },
            onUpdate(props: SuggestionProps) {
                component.updateProps(props);

                if (!props.clientRect) {
                    return;
                }

                popup[0].setProps({
                    getReferenceClientRect: props.clientRect,
                });
            },
            onKeyDown(props: SuggestionProps) {
                if (props.event?.key === 'Escape') {
                    popup[0].hide();
                    return true;
                }
                // @ts-expect-error: component.ref might be undefined or not have onKeyDown
                return component.ref?.onKeyDown(props);
            },
            onExit() {
                popup[0].destroy();
                component.destroy();
            },
        };
    },
};

export default suggestion;
