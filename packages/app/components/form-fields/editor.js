import Field, { getValidationRules } from './_field';
import { useController, useFormContext } from 'react-hook-form';
import { InputMulti, Input, TextInputClear, Button } from 'app/design/controls'
import { useState, useRef, useEffect } from 'react';
import { View } from 'app/design/view'
import { DEFAULT_TOOLBAR_ITEMS, useEditorBridge, RichText, Toolbar, TenTapStartKit, LinkBridge, CodeBridge, useEditorContent, ImageBridge, DropCursorBridge, PlaceholderBridge } from '@10play/tentap-editor';
import { useLayoutData } from 'app/context/layout';
import { Keyboard } from 'react-native';
import { Theme } from 'app/design/theme';
import { getAlert,stripTags } from 'app/lib/util';
import { Text } from 'app/design/typography'
import { KeyboardAvoidingView, Platform } from 'react-native'
import { fetcher } from 'app/lib/fetcher';

export default function FormFieldText(props) {
    const formContext = useFormContext();
    return (
        <Field {...props} error2={formContext.formState.errors[props.name]}>
            <View className='h-0 w-0 absolute top-0 z-0 opacity-0'><Input autoFocus={true} /></View>
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
            className='placeholder-neutral-500 text-neutral-900 leading-6 dark:text-neutral-100 text-lg font-medium py-3'
            aria-label={accessibility}
        />
    }

    useEffect(() => {
        if (props.value !== undefined)
            field.onChange(props.value)
    }, [props.name, props.value]);

    return (
        <Field {...props} error2={formContext.formState.errors[name]}>
            <View className='h-0 w-0 absolute top-0 z-0 opacity-0'><Input autoFocus={true} /></View>
            {input}
        </Field>
    );
}
/*
    /*img{
        display: none;
    }*/
function RftText({ name, value = '', numLines = 4, minHeight, maxHeight, onFocus, onBlur, html, ...props }) {
    console.log("valuevaluevalue", value)
    let b = [...DEFAULT_TOOLBAR_ITEMS]; 

    if(Platform.OS == 'web'){
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
    const [height, setHeight] = useState(minHeight);
    const [suggestions, setSuggestions] = useState([]);
    const [keywordval, setKeyword] = useState(['', '']);

    const object_privacy_view = formContext.watch('object_privacy_view');
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
        if (keywordval[0] === '') return;

        const fetchData = async () => {
            let url = url1 + `&symbol=${keywordval[1] === '#' ? '%23' : '%40'}&term=${keywordval[0]}`;
            const result = await fetcher(url);
            let p = result.map(k => ({ url: k.url,  value: k.value, label: k.label }));

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
    }
    img{
        display:none;
    }
    body P {
        margin-bottom: 4px;
        margin-top: 4px;
    }
    body P:first-child {
        margin-top: 6px;
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
    }`;

    /*useEffect(() => {
        if (formContext.formState.isSubmitted)
            console.log("field.value", field.value)
    }, [formContext.formState.isSubmitted]);*/

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
        avoidIosKeyboard: true,
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

    const htmlContent = useEditorContent(editor, { type: 'html' });
    useEffect(() => {
        if (stripTags(htmlContent)) {
            if(onFocus)
                onFocus()
            field.onChange(htmlContent)
        }
    }, [htmlContent]);

    


   /* useEffect(() => {
        console.log("aaaa", height)
        if (onHeight) {
            onHeight(height)
        }
    }, [height]);
    */

    useEffect(() => {
        if (suggestions.length > 0) {
            let a = JSON.stringify(suggestions);
            editor.injectJS(`
            document.getElementById("mention-list").innerHTML = "";
            ${ a }.forEach(user => {
                const li = document.createElement("li");
                li.textContent = user.label;
                li.data = user;
               
                li.style.cursor = "pointer";
                li.addEventListener("click", () => {

                    document.getElementsByClassName("tiptap")[0].focus();
                    const selection = window.getSelection();
                    if (selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        const startContainer = range.startContainer;
                        const startOffset = range.startOffset;

                        // Проверяем, есть ли возможность отступить на N символов назад
                        const newOffset = Math.max(startOffset - document.getElementsByClassName("tiptap")[0].getAttribute('query').length, 0);

                        // Создаем новый Range
                        const newRange = document.createRange();
                        newRange.setStart(startContainer, newOffset);
                        newRange.setEnd(startContainer, startOffset);
                        newRange.deleteContents();

                        // Вставляем новый текст
                        const textNode = document.createTextNode(user.label);
                        newRange.insertNode(textNode);

                        // Добавляем пробел после textNode
                        const spaceNode = document.createTextNode(" ");
                        textNode.after(spaceNode); // Вставляем пробел после textNode

                        // Выделяем только вставленный текст (без пробела)
                        const finalRange = document.createRange();
                        finalRange.setStart(textNode, 0);
                        finalRange.setEnd(textNode, user.label.length);

                        // Устанавливаем новое выделение
                        selection.removeAllRanges();
                        selection.addRange(finalRange);
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'addmention', payload: user.url }));
                    }
                    document.getElementById("mention-list").style.display = "none";
                });
                document.getElementById("mention-list").appendChild(li);
            });
            document.getElementById("mention-list").style.display = "block";

            document.getElementById("mention-list").style.left = document.getElementsByClassName("tiptap")[0].getAttribute('queryX') + 'px';
            document.getElementById("mention-list").style.top = document.getElementsByClassName("tiptap")[0].getAttribute('queryY') + 'px';`);
        }
    }, [suggestions]);

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

    const onMessage = (event) => {
      
        try {
            const message = JSON.parse(event.nativeEvent.data);
            console.log("document-height", message?.type)
           /* if (message?.type == "document-height") {
                console.log("document-height", message.payload)
                const h = parseInt(message.payload);
                if (h != height && h < maxHeight)
                    setHeight(message.payload);
                editor.focus('end');
            }*/
            if (message?.type == "paste") {
                processImages(message.payload)
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
                setKeyword([message.payload, message.sym])
            }
            if (message?.type == "addmention") {
                console.log("message.payload", "/"+message.payload)
                editor.setLink("/"+message.payload)
                
            }
            

            if (message?.type == "editor-ready") {
                editor.injectJS(`
                    let lastSelectionRange = null;
                    const editor = document.getElementsByClassName("tiptap")[0];

                    editor.addEventListener("blur", () => {
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'blur' }));
                        const selection = window.getSelection();
                        if (selection.rangeCount > 0) {
                            lastSelectionRange = selection.getRangeAt(0).cloneRange();
                        }
                    });

                    // Восстановление позиции курсора при фокусе
                    editor.addEventListener("focus", () => {
                          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'focus' }));
                        if (lastSelectionRange) {
                            console.log("focus")
                            const selection = window.getSelection();
                            selection.removeAllRanges();
                            selection.addRange(lastSelectionRange);
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

                    editor.addEventListener("input", async function (event) {

                        const text = getTextBeforeCursor();
                        const symbol = text.charAt(0);

                        if (symbol === '@' || symbol === '#') {
                            const query = text.substring(1).toLowerCase();
                            editor.setAttribute('query', symbol + query);
                            const selection = window.getSelection();
                            

                            if (selection.rangeCount > 0) {
                                const range = selection.getRangeAt(0);
                                const rect = range.getBoundingClientRect();
      
                                editor.setAttribute('queryX', rect.left);
                                editor.setAttribute('queryY', rect.bottom);
                            }

                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'mention',
                                payload: query,
                                sym: symbol
                            }));
                        }

                    });

                    function getTextBeforeCursor() {
                        const selection = window.getSelection();
                        if (!selection.rangeCount) return "";
                        const range = selection.getRangeAt(0);
                        const text = range.startContainer.textContent.substring(0, range.startOffset);
                        return text.split(" ").pop();
                    }

                    document.addEventListener('click', (event) => {
                        if (event.target.tagName === 'A') {
                            event.preventDefault();
                        }
                    });

                    document.addEventListener('paste', (event) => {
                        console.log("Paste event:", event.clipboardData);
                        console.log("Types:", event.clipboardData.types); // Посмотрим, какие данные доступны
                        if (event.clipboardData.items.length > 0) {
                            console.log("Items:", event.clipboardData.items);

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

    return <View className={`flex-1 ${isToolBar ? 'h-48': ''}`} >
        <RichText exclusivelyUseCustomOnMessage={false} style={{ backgroundColor: 'transparent' }} editor={editor} onMessage={onMessage} />
        {isToolBar &&  <KeyboardAvoidingView
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
/*  <View className="h-24 w-full"><Toolbar editor={editor} /></View>*/