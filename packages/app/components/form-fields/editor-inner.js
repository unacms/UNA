import Field, { getValidationRules } from './_field'
import { useController, useFormContext } from 'react-hook-form'
import { InputMulti, Input, TextInputClear, Button } from 'app/design/controls'
import { useState, useRef, useEffect, useMemo } from 'react'
import { View, ScrollView } from 'app/design/view'
import {
    DEFAULT_TOOLBAR_ITEMS,
    useEditorBridge,
    RichText,
    Toolbar,
    darkEditorTheme,
    TenTapStartKit,
    LinkBridge,
    CoreBridge,
    CodeBridge,
    useEditorContent,
    ImageBridge,
    DropCursorBridge,
    PlaceholderBridge,
    Extension,
} from '@10play/tentap-editor'
import { useFilesData } from 'app/context/files'
import { Keyboard, Platform, KeyboardAvoidingView } from 'react-native'
import { Theme } from 'app/design/theme'
import { getAlert, stripTags, stripTagsWithLinks } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { fetcher } from 'app/lib/fetcher'
import { appSetting } from 'app/lib/util'
import { ThemeName } from 'app/design/theme'
import { TextInput } from 'react-native'
import emitter from 'app/context/emitter'

export default function RftText({
    name,
    value = '',
    numLines = 4,
    minHeight,
    maxHeight,
    onFocus,
    onBlur,
    html,
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
    const [editorHeight, setEditorHeight] = useState(0)
    const [isEnter, setIsEnter] = useState(false)
    const [suggestionsSize, setSuggestionsSize] = useState([0, 0])
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

    const isCommentsEditor = props.container_class === 'comments';
    const editorFontSize = isCommentsEditor ? '14px' : '16px';
    const editorLineHeight = isCommentsEditor ? '20px' : '24px';

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

    let customCodeBlockCSS = `
    body{
        font-family: system-ui, -apple-system, BlinkMacSystemFont, ".SFNSText-Regular", sans-serif;
        font-size: ${editorFontSize};
        line-height:  ${editorLineHeight};
        color:  ${colors.text};
        margin:0;
        white-space: pre;
        overflow: hidden;
    }
    img{
        display:none;
    }
    body P {
        margin-bottom: 0px;
        margin-top: 0px;
    }
    body P:first-child {
        margin-top: 0px;
    }
    .is-editor-empty:first-child::before{
        float:none !important;
        position:absolute;
    }
    .mention-list {
        position: absolute;
        background: white;
        border: 1px solid #ccc;
        list-style: none;
        padding: 5px;
        margin: 0;
        max-height: 150px;
        overflow-y: auto;
    }
    .mention-list li {
        padding: 5px;
        cursor: pointer;
    }
    .mention-list li:hover,
    .mention-list li.active {
        background: lightblue;
    }
    A.bx-mention-link,
    A.bx-tag{
        color: ${colors.primary};
    }
    ${appSetting('editor', 'css')}

    .tiptap, #root > div:nth-of-type(1){
        scrollbar-width: none; /* Firefox */
        -ms-overflow-style: none;  /* IE и Edge */
        &::-webkit-scrollbar {
            display: none; /* Chrome, Safari и Opera */
            width: 0;
            height: 0;
        }
    }   
    .ProseMirror.tiptap{
        height:auto !important;
        overflow:visible !important;
        /* Experimental CSS transition for height changes within WebView */
        transition: height 0.15s ease-out, min-height 0.15s ease-out;
    }
    `
    if (isPlainText) {
        customCodeBlockCSS += `
        b, strong, font, u, s, i, em, span, code, h1, h2, h3, h4, h5, h6{
            font-weight: normal !important;
            font-style: normal !important;
            text-decoration: none !important;
            color: initial !important;
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
        if (editor && field.value == '' && editor.getHTML() != field.value) {
            console.log('editor.focus1', field.value, editor.getHTML())
            editor.setContent(field.value)
            //  editor.focus('end');
        }
    }, [field.value])

    useEffect(() => {
        if (editor && editor.getHTML() != value) {
            console.log('editor.focus2', value, editor.getHTML())
            editor.setContent(value)
            // editor.focus('end');
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
        CodeBridge.configureCSS(customCodeBlockCSS), // Custom codeblock css
    ]

    const CustomKeyboardShortcuts = []; // Temporarily disable by setting to empty array

    const editor = useEditorBridge({
        autofocus: props.autofocus,
        avoidIosKeyboard: false,
        dynamicHeight: false,
        placeholder: props.placeholder,
        ...(ThemeName() === 'dark' && { theme: darkEditorTheme }),
        initialContent: field.value,
        bridgeExtensions: [
            ...TenTapStartKit,
            ...baseExtensions,
            ...CustomKeyboardShortcuts,
        ],
    })

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

    const htmlContent = useEditorContent(editor, { type: 'html' })
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
        const mentionLink = `<a class="bx-mention-link ${user.classname}" href="${user.url}">${user.label.trim()}</a>&shy;`
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
                setEditorHeight(message.payload)
                if (props.onHeight) {
                    props.onHeight(message.payload)
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
                editor.injectJS(`
                    let formName = "${unicFormName}";
                    let lastSelectionRange = null;
                    let mentionVisible = false; 
                    var editorConfig = { 
                        submitOnEnterEnabled: ${!!enableSubmitOnEnter},
                        platformOS: '${Platform.OS}'
                    };
                    const editorElement = document.getElementsByClassName("tiptap")[0];

                    document.addEventListener('keydown', function(event) {
                        if (event.key === 'Enter' || event.code === 'Enter') {
                            if (mentionVisible) {
                                event.preventDefault();
                                event.stopPropagation();
                                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'enter' }));
                                return false; // Mention selection handled
                            }
                            
                            if (editorConfig.submitOnEnterEnabled) {
                                if (editorConfig.platformOS === 'web') {
                                    // Alt-Enter and Mod-Enter are now handled by Tiptap extension.
                                    // We only care about plain Enter here for submit.
                                    if (!event.ctrlKey && !event.altKey && !event.metaKey) { // Check no modifiers for plain Enter
                                        event.preventDefault();
                                        event.stopPropagation();
                                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'requestSubmit' }));
                                        return false; // Submit handled
                                    }
                                    // If modifiers are pressed, let Tiptap extension handle it (don't return false here)
                                } else {
                                    // Mobile: Fall through for Tiptap default (newline)
                                }
                            } else {
                                // Not submitOnEnterEnabled: Fall through for Tiptap default (newline)
                            }
                        } else if (event.key === 'Tab' && mentionVisible) {
                            // Tab for mentions - existing logic
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
                        characterData: true
                    });

                    editorElement.addEventListener("blur", () => {
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'blur' }));
                        const selection = window.getSelection();
                        if (selection.rangeCount > 0) {
                            lastSelectionRange = selection.getRangeAt(0).cloneRange();
                        }
                        updateHeight();
                    });

                    editorElement.addEventListener("focus", () => {
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'focus' }));
                        if (lastSelectionRange) {
                            const selection = window.getSelection();
                            selection.removeAllRanges();
                            selection.addRange(lastSelectionRange);
                        }
                        updateHeight();
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
                        updateHeight();

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
            className={`flex-1 relative ${isToolBar ? 'h-48' : ''}`}
        >
            {suggestions && suggestions.length > 0 && (
                <View
                    className={`absolute max-h-[130px] w-full max-w-md bottom-0 p-1 z-50 rounded-xl border-bdr dark:border-bdr-d border bg-bgrcard dark:bg-bgrcard-d backdrop-blur-xl p-[4px]`}
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
            <RichText
                exclusivelyUseCustomOnMessage={false}
                style={{ backgroundColor: 'transparent' }}
                editor={editor}
                onMessage={onMessage}
                editable={!props.disabled}
                editorProps={{
                    attributes: {
                        class: `prose-mirror ${isCommentsEditor ? 'tiptap-comments' : 'tiptap-default'} ${props.classes || ''}`,
                    },
                }}
                onDebouncedUpdate={(editor) => {
                    // ... existing code ...
                }}
            />

            {isToolBar && (
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{
                        position: 'absolute',
                        width: '100%',
                        bottom: 0,
                    }}
                >
                    <View className="h-18">
                        <Toolbar hidden={false} editor={editor} items={b} />
                    </View>
                </KeyboardAvoidingView>
            )}
        </View>
    )
}
