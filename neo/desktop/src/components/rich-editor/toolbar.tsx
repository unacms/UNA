import type { ChainedCommands, Editor } from '@tiptap/core';
import { type KeyboardEvent, useRef, useState } from 'react';

import { Icon, type IconName } from '../icon';
import { Tooltip } from '../tooltip';
import { t } from '../../lib/i18n';
import { isMac } from '../../lib/platform';

type Tool = {
    id: string;
    label: string;
    icon: IconName;
    /** The keys on macOS (⌘ is Control elsewhere), as aria-keyshortcuts writes them. */
    keys: string;
    run: (c: ChainedCommands) => ChainedCommands;
    active: (e: Editor) => boolean;
    /** Starts a group: a gap before it. */
    group?: boolean;
};

const TOOLS: Tool[] = [
    { id: 'bold', label: t('Bold'), icon: 'bold', keys: 'Meta+B', run: (c) => c.toggleBold(), active: (e) => e.isActive('bold') },
    { id: 'italic', label: t('Italic'), icon: 'italic', keys: 'Meta+I', run: (c) => c.toggleItalic(), active: (e) => e.isActive('italic') },
    { id: 'underline', label: t('Underline'), icon: 'underline', keys: 'Meta+U', run: (c) => c.toggleUnderline(), active: (e) => e.isActive('underline') },
    { id: 'strike', label: t('Strikethrough'), icon: 'strikethrough', keys: 'Meta+Shift+S', run: (c) => c.toggleStrike(), active: (e) => e.isActive('strike') },
    { id: 'h2', label: t('Heading'), icon: 'heading-2', keys: 'Meta+Alt+2', run: (c) => c.toggleHeading({ level: 2 }), active: (e) => e.isActive('heading', { level: 2 }), group: true },
    { id: 'h3', label: t('Subheading'), icon: 'heading-3', keys: 'Meta+Alt+3', run: (c) => c.toggleHeading({ level: 3 }), active: (e) => e.isActive('heading', { level: 3 }) },
    { id: 'bullets', label: t('Bulleted list'), icon: 'list', keys: 'Meta+Shift+8', run: (c) => c.toggleBulletList(), active: (e) => e.isActive('bulletList'), group: true },
    { id: 'numbers', label: t('Numbered list'), icon: 'list-ordered', keys: 'Meta+Shift+7', run: (c) => c.toggleOrderedList(), active: (e) => e.isActive('orderedList') },
    { id: 'quote', label: t('Quote'), icon: 'text-quote', keys: 'Meta+Shift+B', run: (c) => c.toggleBlockquote(), active: (e) => e.isActive('blockquote') },
    { id: 'code', label: t('Code'), icon: 'code', keys: 'Meta+E', run: (c) => c.toggleCode(), active: (e) => e.isActive('code'), group: true },
    { id: 'code-block', label: t('Code block'), icon: 'square-code', keys: 'Meta+Alt+C', run: (c) => c.toggleCodeBlock(), active: (e) => e.isActive('codeBlock') },
];

const LINK = { label: t('Link'), keys: 'Meta+K' };

/** aria-keyshortcuts for this platform. */
function keysFor(keys: string): string {
    return isMac ? keys : keys.replace('Meta', 'Control');
}

/** The keys as a person reads them in a tooltip: ⌘⇧8, or Ctrl+Shift+8. */
function keyHint(keys: string): string {
    const parts = keys.split('+');
    if (!isMac) return keysFor(keys).replace('Control', 'Ctrl');
    const sym: Record<string, string> = { Meta: '⌘', Shift: '⇧', Alt: '⌥' };
    return parts.map((p) => sym[p] ?? p).join('');
}

/**
 * Full mode's formatting buttons: a toolbar (one Tab stop, arrows between the buttons, Home
 * and End), each a toggle that says whether it applies at the caret. Pressing one leaves the
 * caret in the text.
 */
export function Toolbar({ editor, controls, onLink }: { editor: Editor; controls?: string; onLink: () => void }) {
    const [focus, setFocus] = useState(0);
    const refs = useRef<(HTMLButtonElement | null)[]>([]);
    const count = TOOLS.length + 1;

    const move = (e: KeyboardEvent) => {
        let next = focus;
        if (e.key === 'ArrowRight') next = (focus + 1) % count;
        else if (e.key === 'ArrowLeft') next = (focus - 1 + count) % count;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = count - 1;
        else return;
        e.preventDefault();
        setFocus(next);
        refs.current[next]?.focus();
    };

    const button = (i: number, label: string, icon: IconName, keys: string, pressed: boolean | undefined, onPress: () => void, group?: boolean) => (
        <Tooltip key={label} text={`${label} (${keyHint(keys)})`}>
            <button
                ref={(el) => {
                    refs.current[i] = el;
                }}
                type="button"
                className={`rich-tool${group ? ' rich-tool-group' : ''}`}
                aria-label={label}
                aria-pressed={pressed}
                aria-keyshortcuts={keysFor(keys)}
                tabIndex={i === focus ? 0 : -1}
                // the text keeps its selection
                onMouseDown={(e) => e.preventDefault()}
                onFocus={() => setFocus(i)}
                onClick={onPress}
            >
                <Icon name={icon} size={16} />
            </button>
        </Tooltip>
    );

    return (
        <div className="rich-toolbar" role="toolbar" aria-label={t('Formatting')} aria-controls={controls} onKeyDown={move}>
            {TOOLS.map((tool, i) => button(i, tool.label, tool.icon, tool.keys, tool.active(editor), () => tool.run(editor.chain().focus()).run(), tool.group))}
            {button(TOOLS.length, LINK.label, 'link', LINK.keys, editor.isActive('link'), onLink, true)}
        </div>
    );
}
