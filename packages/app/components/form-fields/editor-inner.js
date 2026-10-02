import { useFormContext } from 'react-hook-form'
import { useState, useRef, useEffect, useMemo } from 'react'
import { View, Pressable } from 'app/design/view'
import {
    useEditorBridge,
    RichText,
    darkEditorTheme,
    TenTapStartKit,
    LinkBridge,
    CodeBridge,
    useEditorContent,
    ImageBridge,
    DropCursorBridge,
    PlaceholderBridge,
} from '@10play/tentap-editor'
import { EditorToolbar } from 'app/lib/editor/editor-toolbar'
import { useTentapToolbar } from 'app/lib/editor/editor-toolbar-tentap'
import { Platform } from 'react-native'
import { useThemeName, useThemeValue } from 'app/design/theme'
import { stripTags, appSetting, cn } from 'app/lib/util'
import { commitEditorHtml, normalizeEditorHtml } from 'app/lib/editor/editor-form'
import { useEditorFormField } from 'app/lib/form/use-form-field'
import emitter, { EVENTS } from 'app/context/emitter'
import { TextInput } from 'react-native'
import { useEditorMentions } from 'app/lib/editor/use-editor-mentions'
import { MentionSuggestionsDropdown } from 'app/lib/editor/mention-suggestions-dropdown'
import { buildUnaMentionHtml } from 'app/lib/editor/editor-mention-shared'
import { useIsDesktop } from 'app/context/measure'
import { getEditorPasteImagesMode } from 'app/lib/editor/editor-paste-images'


const inputSettings = appSetting('theme', 'inputs');

export default function RftText(props) {
    const {
        value = '',
        initialHeight = 120,
        maxHeight = 300,
        onFocus,
        html,
        bg,
        enableSubmitOnEnter = false,
        placeholder,
        form_name,
        container_class,
        kb_stay_open,
        onEnterSubmit,
        disabled,
        classes,
        autofocus
    } = props

    const { name, field, readOnly } = useEditorFormField(props)
    const { resetField, formState } = useFormContext()
    const isDisabled = !!(disabled || readOnly)

    const isWeb = Platform.OS === 'web'
    const isDesktop = useIsDesktop()
    const unicFormName = `${form_name}` // for catch images in editor

    const isToolBar = html == 2 || html == 1
    // UNA html=3: rich editor, no toolbar. Images paste into attachments, not <img>.
    const isLimitedHtml = html == 3
    const suggestionsHeight = 130
    const [inputKey, setInputKey] = useState(0);

    // Shared mention pipeline (same fetch/recents/UI as enriched).
    const {
        suggestions,
        setTrigger,
        clearTrigger,
        moveSelected,
        selectedSuggestion,
        recordMention,
        queryToken,
    } = useEditorMentions({ fieldName: name, mentions: props.mentions })
    // Layout coords from iframe mention messages: [left, bottom]
    const [mentionCoords, setMentionCoords] = useState([0, 0])
    const [editorHeight, setEditorHeight] = useState(initialHeight)
    const [isEnter, setIsEnter] = useState(false)
    const [suggestionsSize, setSuggestionsSize] = useState([0, 0])

    const isCommentsEditor = container_class === 'comments'
    // text-base (16px) — inputs below 16px trigger mobile web zoom on focus
    const editorFontSize = '16px'
    const editorLineHeight = '24px'
    // Match published feed font (Inter via --font-main) so the editor looks identical to posts.
    const editorFontFamily =
        'var(--font-main, "Inter", "Inter Variable", "InterVariable", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif)'
    const themeName = useThemeName() || 'light'
    const editorPalette = {
        light: {
            text: 'rgba(30, 40, 55, 1)',
            background: 'rgba(255, 255, 255, 1)',
        },
        dark: {
            text: 'rgba(225, 230, 240, 1)',
            background: 'rgba(15, 25, 40, 1)',
        },
    }
    const editorTextColor = useThemeValue(editorPalette.light.text, editorPalette.dark.text)

    const buildEditorCSS = (mode) => {
        const isDark = mode === 'dark'
        const cssOverrides = isDark
            ? appSetting('editor', 'css_dark')
            : appSetting('editor', 'css')

        return `
    /* Load Inter inside the editor iframe to match published posts */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    :root {
      --editor-font: ${editorFontFamily};
      --color-text-light: ${editorPalette.light.text};
      --color-text-dark: ${editorPalette.dark.text};
      --color-background-light: ${editorPalette.light.background};
      --color-background-dark: ${editorPalette.dark.background};
      --color-text: ${isDark ? editorPalette.dark.text : editorPalette.light.text};
      --color-background: ${isDark ? editorPalette.dark.background : editorPalette.light.background};
    }

    @media (prefers-color-scheme: dark) {
        :root {
            --color-text: var(--color-text-dark);
            --color-background: var(--color-background-dark);
        }
    }

    html, body, *, *::before, *::after {
        font-family: var(--editor-font) !important;
        color: var(--color-text);
    }
    html, body {
        overflow: hidden !important;
        margin: 0;
        padding: 0;
        height: 100%;
        overscroll-behavior: none;
    }
    body {
        font-size: ${editorFontSize};
        line-height: ${editorLineHeight};
        color: var(--color-text);
        background-color: transparent;
        white-space: pre-wrap;
        word-wrap: break-word;
        overflow-wrap: break-word;
    }
    img {
        max-width: 100%;
        height: auto;
        display: block;
        border-radius: 8px;
    }
    body P, body p {
        margin-bottom: 12px;
        margin-top: 12px;
        font-family: inherit !important;
        color: var(--color-text);
    }
    body P:first-child, body p:first-child {
        margin-top: 0px;
    }
    body P:last-child, body p:last-child {
        margin-bottom: 0px;
    }
    .is-editor-empty:first-child::before {
        float: none !important;
        position: fixed;
    }
    .ProseMirror, .tiptap, .ProseMirror p, .tiptap p, .ProseMirror *, .tiptap * {
        font-family: var(--editor-font) !important;
        color: var(--color-text);
        background-color: transparent;
        box-sizing: border-box;
        padding: 0 !important;
        margin: 0 !important;
    }
    .ProseMirror, .tiptap {
        cursor: text;
    }
    .ProseMirror a, .tiptap a {
        cursor: pointer;
    }
    .mention-list {
        position: absolute;
        background: var(--color-background);
        border: 1px solid #ccc;
        list-style: none;
        padding: 5px;
        margin: 0;
        max-height: 150px;
        overflow-y: auto;
        color: var(--color-text);
    }
    .mention-list li {
        padding: 5px;
        cursor: pointer;
    }
    .mention-list li:hover,
    .mention-list li.active {
        background: lightblue;
    }

    ${cssOverrides}

 

    .tiptap, #root > div:nth-of-type(1)  {
        scrollbar-width: none;
        
        overflow: hidden !important;
    }
    .tiptap, #root > div:nth-of-type(1):focus-within  {
        scrollbar-width: auto;
        overflow-y: auto !important;
    }
    .ProseMirror.tiptap{
        margin-right:20px;
    }
    .ProseMirror-focused.tiptap{
        margin-right:0px;
    }
    /*#root, #root > div {
        overflow: hidden !important;
    }
    .tiptap::-webkit-scrollbar, #root > div:nth-of-type(1)::-webkit-scrollbar {
        display: none;
        width: 0;
        height: 0;
    }*/
    .ProseMirror.tiptap {
    scrollbar-width: none;
        height: auto !important;
        /*overflow: visible !important;*/
        min-height: auto !important;
    }
    `
    }

    const wheelEventForwarder = `
        (function() {
            if (window.__neoModalWheelBound) return;
            window.__neoModalWheelBound = true;
            window.addEventListener('wheel', function(e) {
                if (window.parent === window) return;
                e.preventDefault();
                e.stopPropagation();
                window.parent.postMessage(JSON.stringify({
                    type: 'neo-modal-wheel',
                    deltaY: e.deltaY,
                    deltaX: e.deltaX,
                    deltaMode: e.deltaMode,
                }), '*');
            }, { passive: false, capture: true });
        })();
    `

    const applyIframeTheme = (mode) => {
        const css = JSON.stringify(buildEditorCSS(mode))
        const themeAttr = mode === 'dark' ? 'dark' : 'light'

        return `
        (function() {
            const css = ${css};
            const styleId = 'neo-editor-font-style';
            const headEl = document.head || document.getElementsByTagName('head')[0];
            if (!headEl) return;
            let styleTag = document.getElementById(styleId);
            if (!styleTag) {
                styleTag = document.createElement('style');
                styleTag.id = styleId;
                headEl.appendChild(styleTag);
            }
            styleTag.innerHTML = css;
            const setThemeAttr = (target) => {
                if (target) target.setAttribute('data-theme', '${themeAttr}');
            };
            setThemeAttr(document.documentElement);
            setThemeAttr(document.body);
        })();
        `
    }

    // Get the editor settings for toolbar configuration
    const editorSettings = appSetting('editor', 'toolbar')

    let customCodeBlockCSS = buildEditorCSS(themeName)
    if (isLimitedHtml) {
        customCodeBlockCSS += `
        b, strong, font, u, s, i, em, span, code, h1, h2, h3, h4, h5, h6{
            font-weight: normal !important;
            font-style: normal !important;
            text-decoration: none !important;
            color: inherit !important;
            background: transparent !important;
        }
        blockquote{
            all: unset;
            display: block;
            border:none !important;
            padding:0 !important;
        }
        `
    }
    //TODO FIX ONE SIDE REPLY/ ANOTHER NOT CLEAR TEXT AFTER POST
    /*useEffect(() => {
        if (editor && (field?.value == '' || field?.value?.startsWith("<!--INITED-->")) && editor.getHTML() != field.value) {
            setTimeout(() => {
                editor.setContent(field.value.replaceAll("<!--INITED-->", ''))
            }, 500);

        }
    }, [field.value])*/

    useEffect(() => {
        if (editor && editor.getHTML() != value) {
            editor.setContent(value)
        }
    }, [value])

    const baseExtensions = useMemo(() => [
        ImageBridge.configureExtension({
            inline: false,
            allowBase64: false,
        }),
        DropCursorBridge,
        LinkBridge.configureExtension({
            HTMLAttributes: {
                class: 'bx-mention-link',
            },
        }),
        PlaceholderBridge.configureExtension({
            placeholder: placeholder,
        }),
        CodeBridge.configureCSS(customCodeBlockCSS),
    ], [placeholder, customCodeBlockCSS])

    // Extract toolbar styling values from settings
    const toolbarPadding = editorSettings?.padding || 8
    const toolbarColors = editorSettings?.colors || {}

    // Light mode colors
    const toolbarBgColor = toolbarColors.background || 'rgba(248, 249, 250, 1)'
    const toolbarIconColor = toolbarColors.icon || 'rgba(209, 213, 219, 1)'

    // Dark mode colors
    const toolbarBgColorDark =
        toolbarColors.backgroundDark || 'rgba(33, 37, 41, 1)'
    const toolbarIconColorDark = toolbarColors.iconDark || 'rgba(75, 85, 99, 1)'

    // Check if background colors are transparent and determine active colors
    const isLightBgTransparent = toolbarBgColor.includes(', 0)')
    const isDarkBgTransparent = toolbarBgColorDark.includes(', 0)')

    const lightActiveColor = isLightBgTransparent
        ? toolbarIconColor
        : toolbarBgColor
    const darkActiveColor = isDarkBgTransparent
        ? toolbarIconColorDark
        : toolbarBgColorDark

    // Create theme configurations
    const lightTheme = {
        toolbar: {
            iconWrapper: {
                backgroundColor: toolbarIconColor,
                borderRadius: 4,
                padding: 4,
                marginHorizontal: 2,
            },
            toolbarButton: {
                backgroundColor: toolbarBgColor,
                paddingHorizontal: toolbarPadding,
                borderRadius: 4,
                alignItems: 'center',
                justifyContent: 'center',
                padding: 4,
            },
            iconWrapperActive: {
                backgroundColor: lightActiveColor,
                borderRadius: 4,
                opacity: isLightBgTransparent ? 0.6 : 0.8,
            },
            iconWrapperDisabled: {
                backgroundColor: toolbarIconColor,
                opacity: 0.5,
                borderRadius: 4,
            },
        },
    }

    const darkThemeCustom = {
        toolbar: {
            iconWrapper: {
                backgroundColor: toolbarIconColorDark,
                borderRadius: 4,
                padding: 4,
                marginHorizontal: 2,
            },
            toolbarButton: {
                backgroundColor: toolbarBgColorDark,
                paddingHorizontal: toolbarPadding,
                borderRadius: 4,
                alignItems: 'center',
                justifyContent: 'center',
                padding: 4,
            },
            iconWrapperActive: {
                backgroundColor: darkActiveColor,
                borderRadius: 4,
                opacity: isDarkBgTransparent ? 0.6 : 0.8,
            },
            iconWrapperDisabled: {
                backgroundColor: toolbarIconColorDark,
                opacity: 0.5,
                borderRadius: 4,
            },
        },
    }

    const customEditorTheme = useThemeValue(lightTheme, {
                ...darkEditorTheme,
                toolbar: {
                    ...darkEditorTheme.toolbar,
                    ...darkThemeCustom.toolbar,
                },
            })

    const handleSubmit = () => {
        if (onEnterSubmit) {
            onEnterSubmit()
        }
    }

    // Filter duplicate extensions to prevent TipTap warnings.
    // Drop color/highlight — TenTapStartKit includes ColorBridge (TextStyle), which
    // keeps pasted docs colors (`style="color: rgb(…)"`) in saved HTML.
    const EXCLUDED_BRIDGES = new Set(['color', 'highlight'])
    const allExtensions = [...baseExtensions, ...TenTapStartKit];
    const seenNames = new Set();
    const uniqueExtensions = allExtensions.filter((ext) => {
        const name = ext?.name || ext?.tiptapExtension?.name;
        if (name && EXCLUDED_BRIDGES.has(name)) return false;
        if (name && seenNames.has(name)) {
            return false;
        }
        if (name) seenNames.add(name);
        return true;
    });



    const editor = useEditorBridge({
        autofocus: autofocus,
        avoidIosKeyboard: isWeb ? false : autofocus,
        dynamicHeight: false, //!!! true not work in IOS if true
        theme: customEditorTheme,
        initialContent: field.value,
        bridgeExtensions: uniqueExtensions,
    })

    const { items: toolbarItems, linkBar } = useTentapToolbar({
        editor,
        enabled: isToolBar,
    })

    const lastAppliedThemeRef = useRef(null)

    useEffect(() => {
        if (!editor) return
        if (lastAppliedThemeRef.current === themeName) return
        lastAppliedThemeRef.current = themeName
        editor.injectJS(applyIframeTheme(themeName))
        // Wheel forwarder is injected once on editor-ready (iframe must be loaded).
    }, [editor, themeName])

    useEffect(() => {
        if (editor && placeholder) {
            // TenTap Editor bug: setPlaceholder() does not update the DOM in the iframe
            // CSS injection is the only working workaround
            const t = setTimeout(() => {
                editor.injectCSS(`
                .tiptap.ProseMirror p.is-editor-empty:first-child::before {
                    content: "${placeholder.replace(/"/g, '\\"')}" !important;
                }
            `, 'placeholder-dynamic')
            }, 200);

            return () => clearTimeout(t);
        }
    }, [editor, placeholder])

    const openKeyboard = () => {
        setInputKey(k => k + 1); // recreate TextInput
    };


    useEffect(() => {
        const subscription = emitter.addListener(EVENTS.editor, (data) => {
            if (data.action == 'blur') {
                if (data.timeout) {
                    setTimeout(() => {
                        editor.blur()
                    }, data.timeout)
                } else {
                    editor.blur()
                }
            }
            if (data.action == 'focus') {
                // Prefer direct bridge focus (no ghost TextInput remount) to avoid
                // keyboard bounce. Remount fallback when timeout is set (deep link /
                // cold open after dismiss, where focus() alone often no-ops on iOS).
                if (data.timeout) {
                    setTimeout(() => openKeyboard(), data.timeout);
                } else {
                    editor.focus('end');
                }
            }
            if (data.action == 'set_content') {
                editor.setContent(data.value)
            }
            if (data.action == 'insert_inline_image') {
                if (data.form_name && form_name && data.form_name !== form_name) return
                if (!data.src || isLimitedHtml) return
                editor.setImage(data.src)
            }
        })

        //                                 
        return () => {
            subscription.remove()
        }
    }, [])


    useEffect(() => {
        if (formState.isSubmitted && kb_stay_open != true) {
            editor?.blur?.()
        }
    }, [formState.isSubmitted])

    const htmlContent = useEditorContent(editor, { type: 'html' })
    const isInitialHtmlContent = useRef(true)
    useEffect(() => {
        if (htmlContent === undefined || htmlContent === null) return
        if (stripTags(htmlContent)) {
            if (onFocus) onFocus()
        }
        commitEditorHtml({
            next: normalizeEditorHtml(htmlContent, { isLimitedHtml }),
            field,
            name,
            resetField,
            isInitialRef: isInitialHtmlContent,
        })
    }, [htmlContent])

    const processImages = (src, formName) => {
        let images = []
        const fileName = src.split('/').pop() + '.png'
        const fileTypeMatch = src.match(/\.([a-z0-9]+)$/i)
        const fileType = fileTypeMatch
            ? `image/${fileTypeMatch[1]}`
            : 'image/png'

        images.push({
            uri: src,
            fileName: fileName,
            mimeType: fileType,
        })

        if (images.length > 0) {
            emitter.emit(EVENTS.form(formName), {
                action: 'pasted_images',
                images,
                ...(isLimitedHtml ? { inlinePaste: false } : null),
            })
        }
    }

    const insertMention = async (user, query) => {
        const html = await editor.getHTML()
        const mentionLink = buildUnaMentionHtml(user) + '&shy;'
        const replacementStringWithNbsp = mentionLink + '&nbsp;'
        const updatedContent = html.replace(query, replacementStringWithNbsp)
        editor.setContent(updatedContent)
        recordMention(user)
        clearTrigger()
    }

    useEffect(() => {
        if (isEnter && suggestions.length > 0) {
            const sel = selectedSuggestion || suggestions[0]
            if (sel) insertMention(sel, queryToken)
        }
        setIsEnter(false)
    }, [isEnter])

    const onMessage = async (event) => {
        try {
            const message = JSON.parse(event.nativeEvent.data)

            if (message?.type == 'paste') {
                if (getEditorPasteImagesMode(unicFormName) === 'off') return
                processImages(message.payload, message.form_name)
            }

            if (message?.type == 'height') {
                if (message.payload >= initialHeight && message.payload <= maxHeight) {
                    setEditorHeight(message.payload)
                }
                if (message.payload < initialHeight) {
                    setEditorHeight(initialHeight)
                }
            }

            if (message?.type == 'focus') {
                if (onFocus) onFocus()
            }

            if (message?.type == 'blur') {
                //  console.log('blur')
            }

            if (message?.type == 'enter') {
                setIsEnter(true)
            }

            if (message?.type === 'requestSubmit') {
                if (isDesktop && onEnterSubmit) {
                    onEnterSubmit()
                }
            }

            if (message?.type === 'requestNewline') {
                if (editor && editor.chain) {
                    editor.chain().focus().setHardBreak().run()
                }
            }

            if (message?.type == 'arrow') {
                moveSelected(
                    ['ArrowDown', 'ArrowRight'].includes(message.payload)
                        ? 'down'
                        : 'up'
                )
            }

            if (message?.type == 'mention') {
                setTrigger(message.payload, message.sym)
                setMentionCoords([message.left, message.bottom])
            }

            if (message?.type == 'mention_hide') {
                clearTrigger()
            }

            if (message?.type == 'editor-ready') {
                if (isWeb) {
                    editor.injectJS(wheelEventForwarder)
                }
                const submitOnEnter = isDesktop && (
                    isCommentsEditor
                        ? (enableSubmitOnEnter || appSetting('comments', 'submit_comment_on_enter'))
                        : enableSubmitOnEnter
                )
                editor.injectJS(`
                    let formName = "${unicFormName}";
                    let lastSelectionRange = null;
                    let mentionVisible = false; 
                    var editorConfig = { 
                        submitOnEnterEnabled: ${!!submitOnEnter},
                        platformOS: '${Platform.OS}'
                    };
                    const editorElement = document.getElementsByClassName("tiptap")[0];
                    const useParagraphBreakOnShiftEnter = ${isCommentsEditor ? 'true' : 'false'};
                    editorElement.setAttribute('autocomplete', 'off');
                    editorElement.setAttribute('autocorrect', 'off');
                    editorElement.setAttribute('autocapitalize', 'off');
                    editorElement.setAttribute('spellcheck', 'false');

                    ${applyIframeTheme(themeName)}

                    document.addEventListener('keydown', function(event) {
                        if (event.key === 'Enter' || event.code === 'Enter') {
                            if (mentionVisible) {
                                event.preventDefault();
                                event.stopPropagation();
                                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'enter' }));
                                return false; 
                            }
                            
                            if ((event.shiftKey || event.altKey) && useParagraphBreakOnShiftEnter) {
                                event.preventDefault();
                                event.stopPropagation();
                                insertParagraphBreak();
                                syncHeightAfterParagraphBreak();
                                return false;
                            }

                            if (editorConfig.submitOnEnterEnabled) {
                                event.preventDefault();
                                event.stopPropagation();
                                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'requestSubmit' }));
                                return false;
                            }

                            const isModKeyPressed = event.metaKey || event.ctrlKey;
                            if (isModKeyPressed) {
                                event.preventDefault();
                                event.stopPropagation();
                                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'requestSubmit' }));
                                return false;
                            }
                        } else if (event.key === 'Tab' && mentionVisible) {
                            event.preventDefault();
                            event.stopPropagation();
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'arrow',
                                payload: event.shiftKey ? 'ArrowUp' : 'ArrowDown'
                            }));
                            return false;
                        } else if (event.key === 'Escape') {
                            if (mentionVisible) {
                                event.preventDefault();
                                event.stopPropagation();
                                mentionVisible = false;
                                editorElement.removeAttribute('query');
                                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mention_hide' }));
                                return false;
                            }
                            if (window.parent && window.parent !== window) {
                                window.parent.postMessage(JSON.stringify({ type: 'neo-modal-escape' }), '*');
                            }
                        }
                    }, true);

                    function insertParagraphBreak() {
                        editorElement.focus();
                        document.execCommand('insertParagraph', false, null);
                    }

                    function syncHeightAfterParagraphBreak() {
                        requestAnimationFrame(() => {
                            updateHeight();
                            setTimeout(updateHeight, 0);
                        });
                    }

                    function updateHeight() {
                        requestAnimationFrame(() => {
                            setTimeout(() => {
                                const currentHeight = editorElement.scrollHeight;
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                    type: 'height',
                                    payload: currentHeight,
                                }));
                            }, 0);
                        });
                    }

                    const observer = new MutationObserver(() => {
                        updateHeight();
                    });

                    

                    observer.observe(editorElement, {
                        childList: true,
                        subtree: true,
                        characterData: true // Don't observe character data changes
                    });

                    editorElement.addEventListener("blur", () => {
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'blur' }));
                        const selection = window.getSelection();
                        if (selection.rangeCount > 0) {
                            lastSelectionRange = selection.getRangeAt(0).cloneRange();
                        }
                        updateHeight(true);
                    });

                    editorElement.addEventListener("focus", () => {
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'focus' }));
                        if (lastSelectionRange) {
                            const selection = window.getSelection();
                            selection.removeAllRanges();
                            selection.addRange(lastSelectionRange);
                        }
                        updateHeight(true);
                    });

                    function getTextBeforeCursor() {
                        const selection = window.getSelection();
                        if (!selection.rangeCount) return "";
                        const range = selection.getRangeAt(0);
                        const text = range.startContainer.textContent.substring(0, range.startOffset);
                        return text.split(" ").pop();
                    }


                    editorElement.addEventListener("keydown", function (event) {
                        if (event.key === "Backspace") {
                            const selection = window.getSelection();
                            if (selection.rangeCount === 0) return;

                            const range = selection.getRangeAt(0);
                            const node = range.startContainer;

                            const link = node.nodeType === 3 ? node.parentElement.closest("a") : node.closest("a");

                            if (link) {
                                event.preventDefault(); 
                                link.remove(); 

                                const newRange = document.createRange();
                                newRange.setStartBefore(link.nextSibling || editorElement);
                                newRange.collapse(true);
                                selection.removeAllRanges();
                                selection.addRange(newRange);
                            }
                        }
                        if ((event.key === "ArrowUp" || event.key === "ArrowDown" || event.key === "ArrowLeft" || event.key === "ArrowRight") && mentionVisible) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'arrow',
                                payload: event.key,
                            }));
                        }
                    });

                    editorElement.addEventListener("input", function (event) {
                        const text = getTextBeforeCursor();
                        const symbol = text.charAt(0);

                        if (symbol === '@' || symbol === '#') {
                            const query = text.substring(1).toLowerCase();
                            editorElement.setAttribute('query', symbol + query);
                            const selection = window.getSelection();
                            let range;
                            let rect;
                            if (selection.rangeCount > 0) {
                                range = selection.getRangeAt(0);
                                rect = range.getBoundingClientRect();

                                editorElement.setAttribute('queryX', rect.left);
                                editorElement.setAttribute('queryY', rect.bottom);
                            }
                            if (!mentionVisible) { 
                                mentionVisible = true;
                            }

                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'mention',
                                payload: query,
                                sym: symbol,
                                left:rect.left,
                                bottom:rect.bottom
                            }));
                        } else if (mentionVisible) { 
                            mentionVisible = false;
                            editorElement.removeAttribute('query');

                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'mention_hide'
                            }));
                        }
                    });

                    const mentionList = document.createElement("ul");
                    mentionList.id = "mention-list";
                    mentionList.className = "mention-list";
                    mentionList.style.display = "none";
                    mentionList.style.position = "absolute";
                    document.body.appendChild(mentionList);

                    document.addEventListener("click", function (event) {
                        if (!mentionList.contains(event.target)) {
                            mentionList.style.display = "none";
                            editorElement.focus();
                        }
                    });

                    document.addEventListener('click', (event) => {
                        if (event.target.tagName === 'A') {
                            event.preventDefault();
                        }
                    });

                    document.addEventListener('paste', (event) => {
                        if (!event.clipboardData?.items?.length) return;
                        for (let item of event.clipboardData.items) {
                            if (item.kind === 'file') {
                                event.preventDefault();
                                const file = item.getAsFile();
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onload = function (e) {
                                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'paste', form_name: formName, payload: e.target.result }));
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }
                        }
                    })`)
            }
        } catch (error) { }
    }

    const style = { left: 0 }

    const handleLayout = (event) => {
        const { width, height, x, y } = event.nativeEvent.layout
        setSuggestionsSize([width, height, x, y])
    }

    if (
        mentionCoords[1] - 24 < suggestionsHeight &&
        suggestionsSize[1] > suggestionsHeight
    ) {
        style.top = suggestionsSize[3] + 24
    } else {
        style.bottom =
            suggestionsSize[1] - (mentionCoords[1] > 0 ? mentionCoords[1] - 24 : 0)
    }
    return (
        <View
            onLayout={handleLayout}
            className={`relative flex-auto ${isToolBar
                ? ' px-3 py-2 bg-input/60 shadow-input-outline dark:shadow-input-outline-deep rounded-xl focus:bg-card focus:ring-border flex-auto overflow-hidden placeholder-muted-foreground text-card-foreground web:duration-100 '
                : (bg == 'transparent' ? '' : cn(inputSettings.base, inputSettings.size.regular))
                }`}
        >
            <MentionSuggestionsDropdown
                suggestions={suggestions}
                onSelect={(user) => insertMention(user, queryToken)}
                style={style}
            />

            <Pressable
                style={{ height: editorHeight }}
                className={isWeb ? 'web:cursor-text' : undefined}
                {...(!isWeb && {
                    onPress: (event) => {
                        event.stopPropagation()
                    },
                })}
            >
                <RichText
                    exclusivelyUseCustomOnMessage={false}
                    hideKeyboardAccessoryView={true}
                    style={{
                        backgroundColor: 'transparent',
                        color: editorTextColor,
                        fontFamily: editorFontFamily,
                    }}
                    editor={editor}
                    onMessage={onMessage}
                    editable={!isDisabled}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                    nestedScrollEnabled={false}
                    editorProps={{
                        attributes: {
                            class: `prose-mirror ${isCommentsEditor
                                ? 'tiptap-comments'
                                : 'tiptap-default'
                                } ${classes || ''}`,
                            style: `font-family: ${editorFontFamily}; color: ${editorTextColor};`,
                        },
                        autocomplete: 'off',
                        autocorrect: 'off',
                        autocapitalize: 'off',
                        spellcheck: 'false',
                    }}
                    onDebouncedUpdate={(editor) => {
                        // ... existing code ...
                    }}
                />
            </Pressable>

            {isToolBar ? (
                <EditorToolbar items={toolbarItems} linkBar={linkBar} />
            ) : null}
            <TextInput
                key={inputKey}
                autoFocus={inputKey > 0}
                textContentType="none"
                autoComplete="off"
                autoCorrect={false}
                spellCheck={false}
                onFocus={() => {
                    // Keyboard is open — forward IME to WebView
                    setTimeout(() => {
                        editor.focus();
                    }, 50);

                }}
                style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
                pointerEvents="none"
            />
        </View>
    )
}
