import { Editor, Extension, type JSONContent } from '@tiptap/core';
import { Placeholder } from '@tiptap/extensions';
import { Plugin, Selection } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { type Ref, useCallback, useEffect, useId, useImperativeHandle, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react';

import { useWindowAnnounce } from '../../lib/announce';
import { FIELD_SHORTCUT_EVENT } from '../../lib/command-bus';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { t, tn } from '../../lib/i18n';
import { mediaSrc } from '../../lib/media';
import { inApp } from '../../lib/native';
import { isMac } from '../../lib/platform';
import { docToHtml, docToText, type EditorMode } from '../../lib/rich-html';
import type { Staging } from '../../lib/uploads';
import { DEFAULT_REFUSAL, type ImageSink, placementOf, registerDropTarget } from './images';
import { LinkForm } from './link-form';
import { cleanPastedHtml } from './paste';
import { htmlToDoc, schemaExtensions } from './schema';
import { SuggestionList, type SuggestionItem } from './suggestion-list';
import { findTrigger, type HashtagSource, searchProfiles, siteHashtags, type Trigger } from './suggestions';
import { Toolbar } from './toolbar';
import './rich-editor.css';

export type RichEditorHandle = {
    /** Focus the text, the caret at its end (or start). */
    focus: (where?: 'start' | 'end') => void;
    /** Pictures for the text from outside it (a drop the composer took): the same path as a paste. */
    placeImages: (staging: Staging) => void;
    /** The Tiptap editor (tests, and commands from outside). */
    editor: () => Editor | null;
};

type Props = {
    ref?: Ref<RichEditorHandle>;
    mode: EditorMode;
    /** The id of the text box itself, so `getElementById(id).focus()` lands in it. */
    id?: string;
    /** Its name for screen readers, unless `labelledBy` names a visible label. */
    label: string;
    labelledBy?: string;
    placeholder?: string;
    /** The text as the site keeps it (the mode's HTML). A value other than the last one written replaces the text. */
    value: string;
    /** The text changed: its HTML (lib/rich-html.ts `docToHtml`) and plain text. */
    onChange: (html: string, text: string) => void;
    /** Keys the composer takes (send, cancel) after the editor's own (suggestions, ⌘K): true when it did. */
    onKeyDown?: (e: KeyboardEvent) => boolean;
    describedBy?: string;
    invalid?: boolean;
    /** While sending: the text can't change, but keeps focus (a disabled box would drop it). */
    readOnly?: boolean;
    autoFocus?: boolean;
    /** `@` suggests people (off where the text is sent as plain text). */
    mentions?: boolean;
    /** `#` suggests hashtags: the site's and recent ones by default; false for none. */
    hashtags?: HashtagSource | false;
    images?: ImageSink;
    /** Take drops on the app window over the editor (the compose sheet takes its own). */
    windowDrops?: boolean;
    /** Said in the composer's live region (else the window's). */
    announce?: (text: string) => void;
    className?: string;
    /** The box's height in lines before it grows. */
    rows?: number;
    onFocus?: () => void;
};

const READ_ONLY_FORCE = 'rich-editor-force';
const NONE: SuggestionItem[] = [];

/** Keys the suggestions take while they are shown. */
function isPlain(e: KeyboardEvent): boolean {
    return !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey;
}

function isMod(e: KeyboardEvent): boolean {
    return isMac ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey;
}

/** The caret's trigger, from the text of its paragraph (atoms count as one character, line breaks as space). */
function triggerAt(editor: Editor): Trigger | null {
    const { selection } = editor.state;
    if (!selection.empty) return null;
    const $from = selection.$from;
    if (!$from.parent.isTextblock || $from.parent.type.spec.code) return null;
    const before = $from.parent.textBetween(0, $from.parentOffset, undefined, (leaf) => (leaf.type.name === 'hardBreak' ? '\n' : '￼'));
    return findTrigger(before, $from.pos);
}

/**
 * The rich text box of the app's composers: `mini` (feed posts, comments, messages: paragraphs,
 * line breaks, links, mentions and hashtags) or `full` (posts, discussions: formatting, lists,
 * quotes, code and pictures too, with a toolbar). It reads and writes the site's HTML
 * (lib/rich-html.ts). A textbox (multi-line) with its name and placeholder; ⌘B, ⌘I, ⌘U format
 * in full mode, ⌘K adds a link in both; `@` and `#` show suggestions as a listbox it points to
 * with aria-activedescendant.
 */
export function RichEditor(props: Props) {
    const { ref, mode, id, label, labelledBy, placeholder, value, describedBy, invalid, readOnly = false, mentions = true, hashtags: givenHashtags, windowDrops = false, className, rows = 3 } = props;
    const { api, siteUrl } = useApp();
    const ownHashtags = useMemo(() => siteHashtags(api), [api]);
    const hashtags = givenHashtags === undefined ? ownHashtags : givenHashtags;
    const host = useRef<HTMLDivElement>(null);
    const mount = useRef<HTMLDivElement>(null);
    const editorRef = useRef<Editor | null>(null);
    const latest = useRef(props);
    const lastValue = useRef<string | null>(null);
    const readOnlyRef = useRef(readOnly);
    const [, rerender] = useReducer((n: number) => n + 1, 0);
    const listId = useId();
    const windowSay = useWindowAnnounce();

    // what the suggestions show
    const [trigger, setTrigger] = useState<Trigger | null>(null);
    const [caret, setCaret] = useState<{ left: number; top: number } | null>(null);
    // what was found for a trigger (its char and words): shown while that trigger is typed
    const [found, setFound] = useState<{ key: string; list: SuggestionItem[] }>({ key: '', list: [] });
    const triggerKey = trigger?.query ? `${trigger.char}${trigger.query}` : '';
    const items = triggerKey && found.key === triggerKey ? found.list : NONE;
    const [active, setActive] = useState(0);
    const dismissed = useRef<number | null>(null);
    const suggest = useRef({ trigger, items, active });
    // the composer's live region, else the window's (one region per box would be many on a page)
    const sayInWindow = useRef(windowSay);
    const say = useCallback((text: string) => (latest.current.announce ?? sayInWindow.current)(text), []);
    const [linking, setLinking] = useState(false);

    useLayoutEffect(() => {
        latest.current = props;
        sayInWindow.current = windowSay;
        readOnlyRef.current = readOnly;
        suggest.current = { trigger, items, active };
    });

    const emit = useCallback((editor: Editor) => {
        const json = editor.getJSON();
        const html = docToHtml(json, latest.current.mode);
        if (html === lastValue.current) return;
        lastValue.current = html;
        latest.current.onChange(html, docToText(json));
    }, []);

    const pick = useCallback(
        (item: SuggestionItem) => {
            const editor = editorRef.current;
            const typed = suggest.current.trigger;
            if (!editor || !typed) return;
            const range = { from: typed.from, to: typed.to };
            const content: JSONContent[] =
                item.kind === 'profile'
                    ? [{ type: 'mention', attrs: { id: item.profile.id, label: item.profile.display_name, href: item.profile.url ?? null } }, { type: 'text', text: ' ' }]
                    : item.tag.href
                      ? [{ type: 'hashtag', attrs: { tag: item.tag.tag, href: item.tag.href } }, { type: 'text', text: ' ' }]
                      : [{ type: 'text', text: `#${item.tag.tag} ` }];
            editor.chain().focus().insertContentAt(range, content).run();
            if (item.kind === 'tag' && hashtags) hashtags.used(item.tag.tag);
            setTrigger(null);
            setFound({ key: '', list: [] });
            say(item.kind === 'profile' ? t('{{name}} mentioned', { name: item.profile.display_name }) : t('#{{tag}} added', { tag: item.tag.tag }));
        },
        [hashtags, say],
    );

    // pictures: the composer's attachments, the text (phase 2), or a refusal
    const placeImages = useCallback(
        (staging: Staging) => {
            const sink = latest.current.images;
            const placement = placementOf(latest.current.mode, sink);
            if (!sink || placement === 'none') {
                if (staging.files.length || staging.refused.length) say(sink?.refusal ?? DEFAULT_REFUSAL);
                return;
            }
            if (placement === 'attach') {
                sink.attach?.(staging);
                return;
            }
            const upload = sink.uploadInline;
            if (!upload) return;
            const pictures = staging.files.filter((f) => f.kind === 'image');
            if (staging.refused.length || pictures.length < staging.files.length) say(t('Only pictures go in the text.'));
            for (const file of pictures) {
                say(t('Uploading {{name}}…', { name: file.name }));
                upload(file).then(
                    (img) => {
                        const editor = editorRef.current;
                        if (!editor || editor.isDestroyed) return;
                        editor.chain().focus().insertContent({ type: 'image', attrs: { src: img.src, alt: img.alt ?? null, width: img.width ?? null, height: img.height ?? null } }).run();
                        say(t('{{name}} added to the text', { name: file.name }));
                    },
                    (e: unknown) => say(t('{{name}} was not added: {{reason}}', { name: file.name, reason: errorMessage(e) })),
                );
            }
        },
        [say],
    );

    const takeFiles = useCallback(
        (files: File[]) => {
            const sink = latest.current.images;
            if (!sink?.uploader || placementOf(latest.current.mode, sink) === 'none') {
                say(sink?.refusal ?? DEFAULT_REFUSAL);
                return;
            }
            void sink.uploader.fromFiles(files).then(placeImages);
        },
        [placeImages, say],
    );

    // the editor, made once per mode (mounted in the box by the effect below)
    const make = (m: EditorMode, initial: string): Editor => {
        const guard = Extension.create({
            name: 'readOnlyGuard',
            addProseMirrorPlugins() {
                return [new Plugin({ filterTransaction: (tr) => !tr.docChanged || !readOnlyRef.current || !!tr.getMeta(READ_ONLY_FORCE) })];
            },
        });
        const handleKeyDown = (view: EditorView, e: KeyboardEvent): boolean => {
            if (e.isComposing || e.keyCode === 229 || view.composing) return false;
            const s = suggest.current;
            const consume = () => {
                e.preventDefault();
                e.stopPropagation();
                return true;
            };
            if (s.trigger && s.items.length) {
                if (e.key === 'ArrowDown' && isPlain(e)) {
                    setActive((s.active + 1) % s.items.length);
                    return consume();
                }
                if (e.key === 'ArrowUp' && isPlain(e)) {
                    setActive((s.active - 1 + s.items.length) % s.items.length);
                    return consume();
                }
                if ((e.key === 'Enter' || e.key === 'Tab') && isPlain(e)) {
                    const item = s.items[s.active];
                    if (item) pick(item);
                    return consume();
                }
                if (e.key === 'Escape') {
                    dismissed.current = s.trigger.from;
                    setFound({ key: '', list: [] });
                    say(t('Suggestions closed'));
                    return consume();
                }
            }
            if (e.key.toLowerCase() === 'k' && isMod(e) && !e.altKey && !e.shiftKey) {
                setLinking(true);
                return consume();
            }
            if (latest.current.onKeyDown?.(e)) return consume();
            return false;
        };
        return new Editor({
            element: null,
            injectCSS: false,
            extensions: [
                ...schemaExtensions(m, { displaySrc: (src) => mediaSrc(src, siteUrl) }),
                Placeholder.configure({ placeholder: () => latest.current.placeholder ?? '' }),
                guard,
            ],
            content: htmlToDoc(initial, m),
            editorProps: {
                attributes: { role: 'textbox', 'aria-multiline': 'true', class: 'rich-editor-text', dir: 'auto', spellcheck: 'true' },
                handleKeyDown,
                transformPastedHTML: (html) => cleanPastedHtml(html, latest.current.mode),
                handlePaste: (_view, e) => {
                    const files = Array.from(e.clipboardData?.files ?? []);
                    if (!files.length) return false;
                    e.preventDefault();
                    // the composer's own paste handler (outside the text) must not take them again
                    e.stopPropagation();
                    takeFiles(files);
                    return true;
                },
                handleDrop: (_view, e) => {
                    const files = Array.from((e as DragEvent).dataTransfer?.files ?? []);
                    if (!files.length) return false;
                    e.preventDefault();
                    e.stopPropagation();
                    takeFiles(files);
                    return true;
                },
            },
            onUpdate: ({ editor: ed }) => emit(ed),
            onTransaction: ({ editor: ed }) => {
                const typed = triggerAt(ed);
                const off = !typed || (typed.char === '@' ? latest.current.mentions === false : latest.current.hashtags === false);
                if (off || (typed && dismissed.current === typed.from)) {
                    if (!typed) dismissed.current = null;
                    setTrigger(null);
                } else {
                    setTrigger((prev) => (prev && typed && prev.from === typed.from && prev.query === typed.query && prev.char === typed.char ? prev : typed));
                    if (typed) setCaret(caretBox(ed, typed.from, host.current));
                }
                rerender();
            },
        });
    };
    // make() reads no ref: the callbacks it gives the editor read them when the editor calls them
    // eslint-disable-next-line react-hooks/refs
    const [made, setMade] = useState(() => ({ mode, value, editor: make(mode, value) }));
    // eslint-disable-next-line react-hooks/refs
    if (made.mode !== mode) setMade({ mode, value, editor: make(mode, value) });
    const editor = made.editor;

    useLayoutEffect(() => {
        const el = mount.current;
        if (!el) return;
        editor.mount(el);
        editorRef.current = editor;
        lastValue.current = made.value;
        // the caret after a kept text: focus lands where typing goes on
        selectEdge(editor, 'end');
        if (latest.current.autoFocus) focusNow(editor, 'end');
        return () => {
            editorRef.current = null;
            // unmounted, not destroyed: React may mount the same box again (its state is kept)
            editor.unmount();
        };
    }, [editor, made.value]);

    // a value from outside (a draft read, the text cleared after sending) replaces the text
    useEffect(() => {
        if (!editorRef.current || value === lastValue.current) return;
        lastValue.current = value;
        editor.chain().setMeta(READ_ONLY_FORCE, true).setContent(htmlToDoc(value, mode), { emitUpdate: false }).run();
        selectEdge(editor, 'end');
    }, [editor, value, mode]);

    // what screen readers hear of the box: set on the editable element itself
    const open = !!trigger && items.length > 0;
    const activeId = open ? `${listId}-opt-${active}` : undefined;
    useLayoutEffect(() => {
        const dom = editorRef.current === editor ? editor.view.dom : null;
        if (!dom) return;
        const set = (name: string, v: string | undefined) => (v === undefined ? dom.removeAttribute(name) : dom.setAttribute(name, v));
        set('id', id);
        set('aria-label', labelledBy ? undefined : label);
        set('aria-labelledby', labelledBy);
        set('aria-placeholder', placeholder || undefined);
        set('aria-describedby', describedBy || undefined);
        set('aria-invalid', invalid ? 'true' : undefined);
        set('aria-readonly', readOnly ? 'true' : undefined);
        set('aria-autocomplete', mentions || hashtags ? 'list' : undefined);
        set('aria-controls', open ? listId : undefined);
        set('aria-activedescendant', activeId);
        // ⌘K is the Command Palette's in the menu: here it adds a link (lib/command-bus.ts)
        set('data-field-shortcuts', 'command-palette');
    });

    // ⌘K when the menu took it first (macOS gives key equivalents to the menu): a link
    useEffect(() => {
        const dom = editorRef.current === editor ? editor.view.dom : null;
        if (!dom) return;
        const onShortcut = (e: Event) => {
            if ((e as CustomEvent<string>).detail !== 'command-palette') return;
            e.preventDefault();
            setLinking(true);
        };
        dom.addEventListener(FIELD_SHORTCUT_EVENT, onShortcut);
        return () => dom.removeEventListener(FIELD_SHORTCUT_EVENT, onShortcut);
    }, [editor]);

    // people for `@`, tags for `#`, a moment after typing stops
    const char = trigger?.char;
    const query = trigger?.query;
    useEffect(() => {
        if (!char || !query) return;
        const key = `${char}${query}`;
        const abort = new AbortController();
        const timer = setTimeout(() => {
            const found: Promise<SuggestionItem[]> =
                char === '@'
                    ? searchProfiles(api, query, 6, abort.signal).then((list) => list.map((profile) => ({ kind: 'profile' as const, profile })))
                    : hashtags
                      ? hashtags.suggest(query, abort.signal).then((list) => {
                            const all = list.map((tag) => ({ kind: 'tag' as const, tag }));
                            // only the typed tag: nothing to choose, so Enter keeps its own job
                            return all.length === 1 && !all[0]!.tag.href && all[0]!.tag.tag === query ? [] : all;
                        })
                      : Promise.resolve([]);
            found.then(
                (list) => {
                    if (abort.signal.aborted) return;
                    setFound({ key, list });
                    setActive(0);
                    if (list.length)
                        say(
                            char === '@'
                                ? tn(list.length, '{{count}} person. Up and down to choose, Enter to add.', '{{count}} people. Up and down to choose, Enter to add.')
                                : tn(list.length, '{{count}} hashtag. Up and down to choose, Enter to add.', '{{count}} hashtags. Up and down to choose, Enter to add.'),
                        );
                },
                () => {
                    if (!abort.signal.aborted) setFound({ key, list: [] });
                },
            );
        }, 150);
        return () => {
            abort.abort();
            clearTimeout(timer);
        };
    }, [api, char, query, hashtags, say]);

    // drops on the app window over the text (Rust delivers paths): the paste's path
    useEffect(() => {
        if (!inApp || !windowDrops || !host.current) return;
        const el = host.current;
        const release = registerDropTarget(el);
        let stop: (() => void) | null = null;
        let live = true;
        void getCurrentWebview()
            .onDragDropEvent((e) => {
                const p = e.payload;
                if (p.type !== 'drop') return;
                const r = el.getBoundingClientRect();
                const ratio = window.devicePixelRatio || 1;
                const x = p.position.x / ratio;
                const y = p.position.y / ratio;
                if (x < r.left || x > r.right || y < r.top || y > r.bottom) return;
                const sink = latest.current.images;
                if (!sink?.uploader || placementOf(latest.current.mode, sink) === 'none') {
                    say(sink?.refusal ?? DEFAULT_REFUSAL);
                    return;
                }
                void sink.uploader.fromPaths(p.paths).then(placeImages);
            })
            .then(
                (fn) => {
                    if (live) stop = fn;
                    else fn();
                },
                (err: unknown) => console.error('drag and drop', err),
            );
        return () => {
            live = false;
            release();
            stop?.();
        };
    }, [windowDrops, placeImages, say]);

    useImperativeHandle(
        ref,
        () => ({
            focus: (where = 'end') => {
                if (editorRef.current) focusNow(editorRef.current, where);
            },
            placeImages,
            editor: () => editorRef.current,
        }),
        [placeImages],
    );

    return (
        <div
            ref={host}
            className={`rich-editor rich-editor-${mode}${readOnly ? ' is-readonly' : ''}${invalid ? ' is-invalid' : ''}${className ? ` ${className}` : ''}`}
            style={{ ['--rich-rows' as string]: rows }}
            onFocus={props.onFocus}
            // a link in the text is edited, not followed (the app opens links on any click)
            onClick={(e) => {
                if ((e.target as Element).closest('a') && mount.current?.contains(e.target as Node)) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }}
        >
            {mode === 'full' ? <Toolbar editor={editor} controls={id} onLink={() => setLinking(true)} /> : null}
            <div ref={mount} className="rich-editor-body" />
            {open && trigger ? <SuggestionList id={listId} items={items} active={active} char={trigger.char} onPick={pick} onHover={setActive} position={caret} /> : null}
            {linking ? (
                <LinkForm
                    editor={editor}
                    onClose={() => {
                        setLinking(false);
                        editor.commands.focus();
                    }}
                    announce={say}
                />
            ) : null}
        </div>
    );
}

/**
 * Focus the text at once, the caret at its start or end (Tiptap's focus command waits a frame,
 * so a dialog opening would put focus elsewhere first).
 */
function focusNow(editor: Editor, where: 'start' | 'end'): void {
    if (editor.isDestroyed) return;
    selectEdge(editor, where);
    editor.view.focus();
}

/** The caret at the text's start or end. */
function selectEdge(editor: Editor, where: 'start' | 'end'): void {
    const { state } = editor;
    editor.view.dispatch(state.tr.setSelection(where === 'end' ? Selection.atEnd(state.doc) : Selection.atStart(state.doc)));
}

/** Where the suggestions go: under the `@` or `#`, in the editor's box. */
function caretBox(editor: Editor, pos: number, host: HTMLElement | null): { left: number; top: number } | null {
    if (!host) return null;
    try {
        const at = editor.view.coordsAtPos(pos);
        const box = host.getBoundingClientRect();
        return { left: Math.max(0, at.left - box.left), top: at.bottom - box.top + 4 };
    } catch {
        return null;
    }
}

