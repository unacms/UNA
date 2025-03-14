import Field, { getValidationRules } from './_field';
import { useController, useFormContext } from 'react-hook-form';
import { InputMulti, Input, TextInputClear, Button } from 'app/design/controls'
import { useState, useRef, useEffect } from 'react';
import { View, ScrollView } from 'app/design/view'
import { DEFAULT_TOOLBAR_ITEMS, useEditorBridge, RichText, Toolbar, TenTapStartKit, LinkBridge, CodeBridge, useEditorContent, ImageBridge, DropCursorBridge, PlaceholderBridge } from '@10play/tentap-editor';
import { useLayoutData } from 'app/context/layout';
import { Keyboard } from 'react-native';
import { Theme } from 'app/design/theme';
import { getAlert, stripTags } from 'app/lib/util';
import { Text } from 'app/design/typography'
import { KeyboardAvoidingView, Platform } from 'react-native'
import { fetcher } from 'app/lib/fetcher';

export default function FormFieldText(props) {
    const formContext = useFormContext();
    return (
        <Field {...props} error2={formContext.formState.errors[props.name]}>
            {props.html == 1 || props.html == 2 || props.html == 3 ? <RftText {...props} /> : <PlainText {...props} />}
        </Field>
    );
}

function PlainText(props) {

    const rules = getValidationRules(props);
    const name = props.name;
    const defaultValue = props.value ? props.value : '';
    const formContext = useFormContext();
    const { field } = useController({ name, rules, defaultValue });
    let h = props.height ? props.height : null;
    const [height, setHeight] = useState(h);
    const accessibility = props.caption.length > 0 ? props.caption : 'text';
    const placeholder = props.use_caption_as_placeholder ? props.caption : props.placeholder;

    let input = <InputMulti
        multiline
        editable
        numberOfLines={4}
        name={props.name}
        placeholder={placeholder}
        onChangeText={field.onChange}
        onBlur={field.onBlur}
        value={field.value}
        aria-label={accessibility}
    />
    if (props.autoheight)
        input = <Input
            multiline
            editable
            style={{ height: height }}
            placeholder={placeholder}
            numberOfLines={props.numLines ? props.numLines : 4}
            name={props.name}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            value={field.value}
            aria-label={accessibility}
        />

    if (props.viewClasses) {
        input = <TextInputClear
            multiline
            editable
            style={{ height: height }}
            placeholder={props.placeholder}
            onContentSizeChange={e => setHeight(e.nativeEvent.contentSize.height > 70 ? e.nativeEvent.contentSize.height : e.nativeEvent.contentSize.height < 32 ? 32 : e.nativeEvent.contentSize.height)}
            name={props.name}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            value={field.value}
            className='focus:bg-bgrinput-f dark:focus:bg-bgrinput-df focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus:outline-primary/50 duration-100 placeholder-neutral-500 text-neutral-900 rounded-lgflex-auto p-3 leading-6 dark:text-neutral-100 text-base'
            aria-label={accessibility}
        />
    }

    useEffect(() => {
        if (props.value !== undefined)
            field.onChange(props.value)
    }, [props.name, props.value]);

    return input
}
/*
    /*img{
        display: none;
    }*/
function RftText({ name, value = '', numLines = 4, minHeight, maxHeight, onFocus, onBlur, html, ...props }) {
    let b = [...DEFAULT_TOOLBAR_ITEMS];

    if (Platform.OS == 'web') {
        const images = [
            "bold.png", "italic.png", "link.png", "checklist.png", "Aa.png",
            "code.png", "underline.png", "strikethrough.png", "quote.png",
            "ul.png", "ol.png", "indent.png", "unindent.png", "undo.png", "redo.png"
        ];

        images.forEach((img, index) => {
            b[index].image = () => `/editor/${img}`;
        });

        b.splice(4, 1);
    }


    const { layoutData, setLayoutData } = useLayoutData();
    const { field } = useController({ name, rules: {}, defaultValue: value });
    const { colors } = Theme();
    const formContext = useFormContext();
    const [suggestions, setSuggestions] = useState([]);
    const [keywordval, setKeyword] = useState(['', '']);
    const [editorHeight, setEditorHeight] = useState(0); 

    const object_privacy_view = formContext.watch('object_privacy_view') || formContext.watch('cmt_privacy_view');
    const object_id = formContext.watch('id');
    const m = name == "cmt_text" ? "sys_cmts" : "bx_timeline";

    let url1 = '/searchExtended.php?action=get_mention';
    if (m)
        url1 += '&m=' + m;
    if (object_privacy_view)
        url1 += '&object_privacy_view=' + object_privacy_view;
    if (object_id)
        url1 += '&cid=' + object_id;

    useEffect(() => {
        if (keywordval[1] === '') return;

        const fetchData = async () => {
            let url = url1 + `&symbol=${keywordval[1] === '#' ? '%23' : '%40'}&term=${keywordval[0]}`;
            const result = await fetcher(url);
            let p = result.map(k => ({ url: k.url, value: k.value, label: k.label }));

            setSuggestions(p);
        };

        fetchData();
    }, [keywordval]);


    const customCodeBlockCSS = `
    body{
        font-family: system-ui, -apple-system, BlinkMacSystemFont, ".SFNSText-Regular", sans-serif;
        font-size: ${props.fontSize || 16}px;
        line-height:  ${props.lineHeight || 20}px;
        color:  ${colors.text};
        margin:0;
        white-space: pre;
        
        overflow: hidden;
    }
    img{
        display:none;
    }
    body P {
        margin-bottom: 4px;
        margin-top: 4px;
        
    }
    body P:first-child {
        margin-top: ${Platform.OS == 'web' ? '4' : '6'}px;
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
    .bx-mention-link,
    .bx-tag{
        color: ${colors.primary};
    }

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
    }
    `;

    useEffect(() => {
        if (editor && field.value == '' && editor.getHTML() != field.value) {
            editor.setContent(field.value);
            editor.focus('end');
        }
    }, [field.value]);

    useEffect(() => {
        if (editor && editor.getHTML() != value) {
            editor.setContent(value);
            editor.focus('end');
        }
    }, [value]);

    const editor = useEditorBridge({
        autofocus: field.value ? true : (props.autofocus || false),
        avoidIosKeyboard: false,
        dynamicHeight: false,
        placeholder: props.placeholder,

        initialContent: field.value,
        bridgeExtensions: [
            ...TenTapStartKit,
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
        ],

    });

    useEffect(() => {
        editor.setPlaceholder(props.placeholder)
    }, [props.placeholder]);
    

    const htmlContent = useEditorContent(editor, { type: 'html' });
    useEffect(() => {
        if (stripTags(htmlContent)) {
            if (onFocus)
                onFocus()
            field.onChange(htmlContent)
        }
    }, [htmlContent]);

    const processImages = (src) => {
        let images = [];
        const fileName = src.split('/').pop() + '.png';
        const fileTypeMatch = src.match(/\.([a-z0-9]+)$/i);
        const fileType = fileTypeMatch ? `image/${fileTypeMatch[1]}` : 'image/png';

        images.push({
            uri: src,
            fileName: fileName,
            mimeType: fileType,
        });

        if (images.length > 0) {
            setLayoutData(getAlert('images:pasted', images));
        }
    }

    const insertMention = async (label, url, query) => {
        const html = await editor.getHTML();
        const mentionLink = `<a class="bx-mention-link" href="${url}">${label}</a> &shy; `;
        const updatedContent = html.replace(query, mentionLink);
        editor.setContent(updatedContent);
        editor.focus('end');
        setSuggestions([])
    }

    const onMessage = async (event) => {

        try {
            const message = JSON.parse(event.nativeEvent.data);

            if (message?.type == "paste") {
                processImages(message.payload)
            }

            if (message?.type == "height") {
                setEditorHeight(message.payload);
                if (props.onHeight) {
                    props.onHeight(message.payload);
                }
            }

            if (message?.type == "focus") {
                if (onFocus)
                    onFocus()
            }

            if (message?.type == "blur") {
                if (onBlur)
                    onBlur()
            }

            if (message?.type == "mention") {
                //console.log("mention", [message.payload, message.sym])
                setKeyword([message.payload, message.sym, message.left, message.bottom])
            }

            if (message?.type == "mention_hide") {
                //console.log("mention", [message.payload, message.sym])
                setSuggestions([])
            }

            if (message?.type == "addmention") {
                insertMention(message.payload.label, message.payload.url, message.payload.query)
            }


            if (message?.type == "editor-ready") {
                editor.injectJS(`
                    let lastSelectionRange = null;
                    let mentionVisible = false; 
                    const editor = document.getElementsByClassName("tiptap")[0];

                    function updateHeight() {
                        const currentHeight = editor.scrollHeight;
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'height',
                            payload: currentHeight,
                        }));
                    }

                    // Отслеживаем изменения через MutationObserver
                    const observer = new MutationObserver(() => {
                        updateHeight();
                    });

                    observer.observe(editor, {
                        childList: true,
                        subtree: true,
                        characterData: true
                    });

                    editor.addEventListener("blur", () => {
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'blur' }));
                        const selection = window.getSelection();
                        if (selection.rangeCount > 0) {
                            lastSelectionRange = selection.getRangeAt(0).cloneRange();
                        }
                        updateHeight();
                    });

                    editor.addEventListener("focus", () => {
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

                    editor.addEventListener("keydown", function (event) {
                        if (event.key === "Backspace") {
                            const selection = window.getSelection();
                            if (selection.rangeCount === 0) return;

                            const range = selection.getRangeAt(0);
                            const node = range.startContainer;

                            // Проверяем, находится ли курсор внутри ссылки
                            const link = node.nodeType === 3 ? node.parentElement.closest("a") : node.closest("a");

                            if (link) {
                                event.preventDefault(); // Отменяем стандартное удаление
                                link.remove(); // Удаляем ссылку целиком

                                // Перемещаем курсор в правильное место
                                const newRange = document.createRange();
                                newRange.setStartBefore(link.nextSibling || editor);
                                newRange.collapse(true);
                                selection.removeAllRanges();
                                selection.addRange(newRange);
                            }
                        }
                    });

                    editor.addEventListener("input", function (event) {
                        updateHeight();

                        const text = getTextBeforeCursor();
                        const symbol = text.charAt(0);

                        if (symbol === '@' || symbol === '#') {
                            const query = text.substring(1).toLowerCase();
                            editor.setAttribute('query', symbol + query);
                            const selection = window.getSelection();
                            let range;
                            let rect;
                            if (selection.rangeCount > 0) {
                                range = selection.getRangeAt(0);
                                rect = range.getBoundingClientRect();

                                editor.setAttribute('queryX', rect.left);
                                editor.setAttribute('queryY', rect.bottom);
                            }
                            if (!mentionVisible) { // Отправляем сообщение только если ментшены ещё не были показаны
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
                            // Если ментшены были показаны, но теперь их нужно скрыть
                            mentionVisible = false;
                            editor.removeAttribute('query');

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
                            editor.focus();
                        }
                    });

                    document.addEventListener('click', (event) => {
                        if (event.target.tagName === 'A') {
                            event.preventDefault();
                        }
                    });

                    document.addEventListener('paste', (event) => {
                        if (event.clipboardData.items.length > 0) {
                            for (let item of event.clipboardData.items) {
                                if (item.kind === 'file') {
                                    const file = item.getAsFile();
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = function (e) {
                                            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'paste', payload: e.target.result }));
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }
                            }
                        } else {
                            console.warn("Clipboard items are empty!");
                        }
                    })`
                )
            }
        }
        catch (error) {
        }
    }

    const isToolBar = (html == 2 || html == 1)

    const style = {left: 0 /*keywordval[2]*/}
   
    const editorContH = maxHeight ? Math.min(maxHeight, editorHeight) : editorHeight

    if (editorContH-keywordval[3] > 144){
        style.top = keywordval[3]
    }
    else{
        style.bottom = editorContH - keywordval[3] + 24; 
    }


    return <View className={`flex-1 relative ${isToolBar ? 'h-48' : ''}`} >
        {(suggestions && suggestions.length > 0) && (
            <View 
                className="absolute max-h-[144px] w-full max-w-md bottom-0 p-1 z-50 rounded border-bdr dark:border-bdr-d border bg-bgrcard dark:bg-bgrcard-d " 
                style={style}>
                <ScrollView>
                    {suggestions.map((user) => (
                        <Button key={user.url} variant="text" fullWidth align="left" size="sm" title={user.label} onPress={() => { insertMention(user.label, user.url, keywordval[1] + keywordval[0]) }} />

                    ))}
                </ScrollView>
            </View>
        )}
        <RichText
            exclusivelyUseCustomOnMessage={false}
            style={{ backgroundColor: 'transparent' }}
            editor={editor}
            onMessage={onMessage} />
        {isToolBar && <KeyboardAvoidingView
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
        </KeyboardAvoidingView>}
    </View>
}
