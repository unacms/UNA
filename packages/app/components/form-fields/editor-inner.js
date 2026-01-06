import { useController, useFormContext } from 'react-hook-form'
import { Button } from 'app/design/controls'
import { useState, useRef, useEffect } from 'react'
import { View, ScrollView } from 'app/design/view'
import {
    DEFAULT_TOOLBAR_ITEMS,
    useEditorBridge,
    RichText,
    Toolbar,
    darkEditorTheme,
    TenTapStartKit,
    LinkBridge,
    CodeBridge,
    useEditorContent,
    ImageBridge,
    DropCursorBridge,
    PlaceholderBridge,
} from '@10play/tentap-editor'
import { useFilesData } from 'app/context/files'
import { Platform, KeyboardAvoidingView } from 'react-native'
import { Theme } from 'app/design/theme'
import { getAlert, stripTags, stripTagsWithLinks } from 'app/lib/util'
import { fetcher } from 'app/lib/fetcher'
import { appSetting } from 'app/lib/util'
import { ThemeName } from 'app/design/theme'
import emitter from 'app/context/emitter'

const inputSettings = appSetting('theme', 'inputs');

export default function RftText({
    name,
    value = '',
    minHeight,
    initialHeight= 120,
    maxHeight = 300,
    onFocus,
    onBlur,
    html,
    bg,
    enableSubmitOnEnter = false,
    ...props
}) {

    const unicFormName = `${props.form_name}` // for catch images in editor

    let b = [...DEFAULT_TOOLBAR_ITEMS]
    if (Platform.OS == 'web') {
        const images = [
            'bold.png',
            'italic.png',
            'link.png',
            'checklist.png',
            'Aa.png',
            'code.png',
            'underline.png',
            'strikethrough.png',
            'quote.png',
            'ul.png',
            'ol.png',
            'indent.png',
            'unindent.png',
            'undo.png',
            'redo.png',
        ]

        images.forEach((img, index) => {
            b[index].image = () => `/editor/${img}`
        })

        b.splice(4, 1)
    }
    const isToolBar = html == 2 || html == 1
    const isPlainText = html == 3
    const suggestionsHeight = 130
    const { filesData, setFilesData } = useFilesData()
    const { field } = useController({ name, rules: {}, defaultValue: value })
    const { colors } = Theme()
    const formContext = useFormContext()

    const [suggestions, setSuggestions] = useState([])
    const [keywordval, setKeyword] = useState(['', ''])
    const [editorHeight, setEditorHeight] = useState(initialHeight)
    const [isEnter, setIsEnter] = useState(false)
    const [suggestionsSize, setSuggestionsSize] = useState([0, 0])
    const [isWebViewReady, setIsWebViewReady] = useState(false)


    const object_privacy_view =
        formContext.watch('object_privacy_view') ||
        formContext.watch('cmt_privacy_view')
    const object_id = formContext.watch('id')
    const m = name == 'cmt_text' ? 'sys_cmts' : 'bx_timeline'

    let url1 = '/searchExtended.php?action=get_mention'
    if (m) url1 += '&m=' + m
    if (object_privacy_view)
        url1 += '&object_privacy_view=' + object_privacy_view
    if (object_id) url1 += '&cid=' + object_id

        const isCommentsEditor = props.container_class === 'comments'
    // Comments use 14px (text-sm), other editors use 16px (text-base)
    // iOS zoom prevention is handled by viewport maximumScale=1
    const editorFontSize = isCommentsEditor ? '14px' : '16px'
    const editorLineHeight = isCommentsEditor ? '20px' : '24px'
    // Match published feed font (Inter via --font-main) so the editor looks identical to posts.
    const editorFontFamily =
        'var(--font-main, "Inter", "Inter Variable", "InterVariable", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif)'
    const themeName = ThemeName() || 'light'
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
    const editorTextColor =
        themeName === 'dark' ? editorPalette.dark.text : editorPalette.light.text

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
        display: none;
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
        position: absolute;
    }
    .ProseMirror, .tiptap, .ProseMirror p, .tiptap p, .ProseMirror *, .tiptap * {
        font-family: var(--editor-font) !important;
        color: var(--color-text);
        background-color: transparent;
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

        overflow-y: scroll !important;
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
        // Forward wheel events to parent to allow modal scrolling
        window.addEventListener('wheel', function(e) {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                // For React Native WebView
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'wheel',
                    deltaY: e.deltaY,
                    deltaX: e.deltaX
                }));
            } else if (window.parent !== window) {
                // For web iframe - forward to parent
                e.preventDefault();
                const parentEvent = new WheelEvent('wheel', {
                    deltaX: e.deltaX,
                    deltaY: e.deltaY,
                    deltaZ: e.deltaZ,
                    deltaMode: e.deltaMode,
                    bubbles: true,
                    cancelable: true
                });
                window.parent.document.dispatchEvent(parentEvent);
            }
        }, { passive: false });
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

    useEffect(() => {
        if (keywordval[1] === '') return

        const fetchData = async () => {
            const url =
                url1 +
                `&symbol=${keywordval[1] === '#' ? '%23' : '%40'}&term=${
                    keywordval[0]
                }`
            const result = await fetcher(url)
            const p = result
                .map((k, index) => ({
                    ...k,
                    index,
                    ...(index === 0 && { selected: true }),
                }))
                .slice(0, 4)
            setSuggestions(p)
        }

        fetchData()
    }, [keywordval])

    let customCodeBlockCSS = buildEditorCSS(themeName)
    if (isPlainText) {
        customCodeBlockCSS += `
        b, strong, font, u, s, i, em, span, code, h1, h2, h3, h4, h5, h6{
            font-weight: normal !important;
            font-style: normal !important;
            text-decoration: none !important;
        }
        blockquote{
            all: unset;
            display: block;
            border:none !important;
            padding:0 !important;
        }
        `
    }

    useEffect(() => {
        if (editor && (field?.value == '' || field?.value?.startsWith("<!--INITED-->")) && editor.getHTML() != field.value) {
             setTimeout(() => {
                 editor.setContent(field.value.replaceAll("<!--INITED-->", ''))
            }, 500);
           
        }
    }, [field.value])

    useEffect(() => {
        if (editor && editor.getHTML() != value) {
            editor.setContent(value)
        }
    }, [value])

    const baseExtensions = [
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
            placeholder: props.placeholder,
            showOnlyWhenEditable: true,
        }),
        CodeBridge.configureCSS(customCodeBlockCSS),
    ]

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

    const customEditorTheme =
        ThemeName() === 'dark'
            ? {
                  ...darkEditorTheme,
                  toolbar: {
                      ...darkEditorTheme.toolbar,
                      ...darkThemeCustom.toolbar,
                  },
              }
            : lightTheme

    const handleSubmit = () => {
        if (props.onEnterSubmit) {
            props.onEnterSubmit()
        }
    }

    // Filter duplicate extensions to prevent TipTap warnings
    // TenTapStartKit includes listItem and textStyle which can conflict with other bridges
    const allExtensions = [...TenTapStartKit, ...baseExtensions];
    const seenNames = new Set();
    const uniqueExtensions = allExtensions.filter((ext) => {
        const name = ext?.name || ext?.tiptapExtension?.name || ext?.config?.name;
        if (name && seenNames.has(name)) {
            return false;
        }
        if (name) seenNames.add(name);
        return true;
    });

    const editor = useEditorBridge({
        autofocus: props.autofocus,
        avoidIosKeyboard: false,
        dynamicHeight: true,
        placeholder: props.placeholder,
        theme: customEditorTheme,
        initialContent: field.value,
        bridgeExtensions: uniqueExtensions,
    })

    const lastAppliedThemeRef = useRef(null)

    useEffect(() => {
        if (!editor) return
        if (lastAppliedThemeRef.current === themeName) return
        lastAppliedThemeRef.current = themeName
        editor.injectJS(applyIframeTheme(themeName))
        // Inject wheel event forwarder on web to allow modal scrolling
        if (Platform.OS === 'web') {
            editor.injectJS(wheelEventForwarder)
        }
    }, [editor, themeName])

    useEffect(() => {
        editor.setPlaceholder(props.placeholder)
    }, [props.placeholder])

    useEffect(() => {
        const subscription = emitter.addListener('editor', (data) => {
            if (data.action == 'blur') {
                if (data.timeout) {
                    setTimeout(() => {
                        console.log('editor-blur', data, editor)
                        editor.blur()
                    }, data.timeout)
                } else {
                    console.log('editor-blur', data, editor)
                    editor.blur()
                }
            }
            if (data.action == 'focus') {
                if (data.timeout) {
                    setTimeout(() => {
                        console.log('editor-focus', data, editor)
                        editor.focus('end')
                    }, 800)
                } else {
                    console.log('editor-focus', data, editor)
                    editor.focus('end')
                }
            }
        })

        // Отписываемся при размонтировании
        return () => {
            subscription.remove()
        }
    }, [])

    useEffect(() => {
        if (formContext.formState.isSubmitted && props.kb_stay_open != true) {
            /*setTimeout(() => {
                editor.blur();
            }, 800);
            */
        }
    }, [formContext.formState.isSubmitted])
    console.log("isWebViewReady", isWebViewReady, editor)
    /*const htmlContent = useEditorContent(isWebViewReady ? editor : null, { type: 'html' })
    useEffect(() => {
        if (stripTags(htmlContent)) {
            if (onFocus) onFocus()
        }
        if (isPlainText) {
            field.onChange(
                stripTagsWithLinks(htmlContent, ['a', 'p', 'br', 'span'])
            )
        } else {
            field.onChange(htmlContent)
        }
    }, [htmlContent])
*/
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
            setFilesData(
                getAlert('images:pasted', {
                    images: images,
                    form_name: formName,
                })
            )
        }
    }

    const insertMention = async (user, query) => {
        const html = await editor.getHTML()
        const mentionLink = `<a class="bx-mention-link data-profile-id=${user.value} ${user.classname || ''}" data-profile-id="${user.value}" href="${user.url}">${user.label.trim()}</a>&shy;`
        const replacementStringWithNbsp = mentionLink + '&nbsp;'
        const updatedContent = html.replace(query, replacementStringWithNbsp)
        editor.setContent(updatedContent)
        setSuggestions([])
    }

    const moveSelected = (direction) => {
        setSuggestions((prevItems) => {
            const index = prevItems.findIndex((item) => item.selected)
            if (index === -1) return prevItems
            const length = prevItems.length
            const newIndex =
                direction === 'up'
                    ? (index - 1 + length) % length
                    : (index + 1) % length

            const newItems = prevItems.map((item, i) => ({
                ...item,
                selected: i === newIndex,
                index: i,
            }))

            return newItems
        })
    }

    useEffect(() => {
        if (isEnter && suggestions.length > 0) {
            const index = suggestions.findIndex((item) => item.selected)
            insertMention(suggestions[index], keywordval[1] + keywordval[0])
        }
        setIsEnter(false)
    }, [isEnter])

    const onMessage = async (event) => {
        try {
            const message = JSON.parse(event.nativeEvent.data)

            if (message?.type == 'paste') {
                processImages(message.payload, message.form_name)
            }

            if (message?.type == 'height') {
                if (message.payload>=initialHeight && message.payload<= maxHeight){
                    setEditorHeight(message.payload)
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
                if (props.onEnterSubmit) {
                    props.onEnterSubmit()
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
                setKeyword([
                    message.payload,
                    message.sym,
                    message.left,
                    message.bottom,
                ])
            }

            if (message?.type == 'mention_hide') {
                setSuggestions([])
            }

            if (message?.type == 'editor-ready') {
                setIsWebViewReady(true)
                setTimeout(() => {
                const submitOnEnter = isCommentsEditor
                    ? appSetting('comments', 'submit_comment_on_enter')
                    : enableSubmitOnEnter
                editor.injectJS(`
                    let formName = "${unicFormName}";
                    let lastSelectionRange = null;
                    let mentionVisible = false; 
                    var editorConfig = { 
                        submitOnEnterEnabled: ${!!submitOnEnter},
                        platformOS: '${Platform.OS}'
                    };
                    const editorElement = document.getElementsByClassName("tiptap")[0];

                    ${applyIframeTheme(themeName)}

                    document.addEventListener('keydown', function(event) {
                        if (event.key === 'Enter' || event.code === 'Enter') {
                            if (mentionVisible) {
                                event.preventDefault();
                                event.stopPropagation();
                                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'enter' }));
                                return false; 
                            }
                            
                            const isModKeyPressed = event.metaKey || event.ctrlKey;

                            if (editorConfig.submitOnEnterEnabled) {
                                if (isModKeyPressed) {
                                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'requestNewline' }));
                                } else {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'requestSubmit' }));
                                    return false;
                                }
                            } else {
                                if (isModKeyPressed) {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'requestSubmit' }));
                                    return false;
                                }
                            }
                        } else if (event.key === 'Tab' && mentionVisible) {
                            event.preventDefault();
                            event.stopPropagation();
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'arrow',
                                payload: event.shiftKey ? 'ArrowUp' : 'ArrowDown'
                            }));
                            return false;
                        }
                    }, true);

                    function updateHeight() {
                        const currentHeight = editorElement.scrollHeight;
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'height',
                            payload: currentHeight,
                        }));
                    }

                    const observer = new MutationObserver(() => {
                        updateHeight();
                    });

                    

                    observer.observe(editorElement, {
                        childList: true,
                        subtree: true,
                        characterData: false // Don't observe character data changes
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
                            /*const query = text.substring(1).toLowerCase();
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
                            }));*/
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
                        const activeElement = document.activeElement;
                        
                        if (event.clipboardData.items.length > 0) {
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
                        } else {
                            console.warn("Clipboard items are empty!");
                        }
                    })`)
                     }, 100);
            }
        } catch (error) {}
    }

    const style = { left: 0 }

    const handleLayout = (event) => {
        const { width, height, x, y } = event.nativeEvent.layout
        setSuggestionsSize([width, height, x, y])
    }

    if (
        keywordval[3] - 24 < suggestionsHeight &&
        suggestionsSize[1] > suggestionsHeight
    ) {
        style.top = suggestionsSize[3] + 24
    } else {
        style.bottom =
            suggestionsSize[1] - (keywordval[3] > 0 ? keywordval[3] - 24 : 0)
    }

    return (
        <View
            onLayout={handleLayout}
            className={`flex-auto ${
                isToolBar
                    ? ' px-3 py-2 bg-input border border-border web:border-0 web:ring-1 web:ring-inset web:ring-border rounded-xl focus:bg-card focus:ring-border flex-auto overflow-hidden shadow-xs placeholder-label-tertiary text-card-foreground web:duration-100 '
                    : (bg == 'transparent' ? '' : inputSettings.multi)
            }`}
        >
            {suggestions && suggestions.length > 0 && (
                <View
                    className={`absolute max-h-[130px] w-full max-w-md bottom-0 p-1 z-50 rounded-xl border-bdr dark:border-bdr-d border bg-card backdrop-blur-xl p-1`}
                    style={style}
                >
                    <ScrollView>
                        {suggestions.map((user) => (
                            <Button
                                key={user.url}
                                variant="text"
                                pressed={user.selected}
                                fullWidth
                                align="left"
                                size="xs"
                                title={user.label}
                                onPress={() => {
                                    insertMention(
                                        user,
                                        keywordval[1] + keywordval[0]
                                    )
                                }}
                            />
                        ))}
                    </ScrollView>
                </View>
            )}
            <View style={{height:editorHeight}} >
                <RichText
                    exclusivelyUseCustomOnMessage={false}
                    style={{
                        backgroundColor: 'transparent',
                        color: editorTextColor,
                        fontFamily: editorFontFamily,
                    }}
                    editor={editor}
                    onMessage={onMessage}
                    editable={!props.disabled}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                    nestedScrollEnabled={false}
                    editorProps={{
                        attributes: {
                            class: `prose-mirror ${
                                isCommentsEditor
                                    ? 'tiptap-comments'
                                    : 'tiptap-default'
                            } ${props.classes || ''}`,
                            style: `font-family: ${editorFontFamily}; color: ${editorTextColor};`,
                        },
                    }}
                    onDebouncedUpdate={(editor) => {
                    // ... existing code ...
                }}
                />
            </View>

            {isToolBar && (
                <>
                    <View className="h-12"></View>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{
                            position: 'absolute',
                            width: '100%',
                            bottom: 8,
                        }}
                    >
                        <View className="flex-none w-full">
                            <Toolbar hidden={false} editor={editor} items={b} />
                        </View>
                    </KeyboardAvoidingView>
                </>
            )}
        </View>
    )
}
