import Field, { getValidationRules } from './_field';
import { useController, useFormContext } from 'react-hook-form';
import { InputMulti, Input, TextInputClear } from 'app/design/controls'
import { useState, useRef, useEffect } from 'react';
import { View } from 'app/design/view'
import { useEditorBridge, RichText, Toolbar, TenTapStartKit, CodeBridge, useEditorContent, ImageBridge, DropCursorBridge, PlaceholderBridge } from '@10play/tentap-editor';
import { useLayoutData } from 'app/context/layout';
import { Keyboard } from 'react-native';
import { Theme } from 'app/design/theme';
import { getAlert } from 'app/lib/util';

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
function RftText({ name, value = '', numLines = 4, minHeight, maxHeight,  ...props }) {
    const { layoutData, setLayoutData } = useLayoutData();
    const { field } = useController({ name, rules: {}, defaultValue: value });
    const { colors } = Theme();
    const webviewRef = useRef(null);
    const formContext = useFormContext();
    const [height, setHeight] = useState(minHeight);
    const [suggestions, setSuggestions] = useState([]);
    const [keywordval, setKeyword] = useState(['', '']);

     const object_privacy_view = formContext.watch('object_privacy_view');
        const object_id = formContext.watch('id');
        const m = name == "cmt_text" ? "sys_cmts" : "bx_timeline";
    
        let url1 = '/searchExtended.php?action=get_mention';
        if (m)
            url1 += '&m='+m;
        if (object_privacy_view)
            url1 += '&object_privacy_view='+object_privacy_view;
        if (object_id)
            url1 += '&cid='+object_id;
    
        useEffect(() => {
            if (keywordval[0] === '') return;

            const fetchData = async () => {
                let url = url1+`&symbol=${keywordval[1] === '#' ? '%23' : '%40'}&term=${keywordval[0]}`;
                const result = await fetcher(url);
                let p = result.map(k => ({ id: k.value, name: k.label }));
    
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

        margin:0
        
    }

    body   P {
        margin-bottom: 4px;
        margin-top: 4px;
    }

        body   P:first-child {
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
        }

    `;

    useEffect(() => {
        if (formContext.formState.isSubmitted)
            console.log("field.value", field.value)
    }, [formContext.formState.isSubmitted]);

    

    

    useEffect(() => {

        if (editor && field.value == '' && editor.getHTML() != field.value) {
            editor.setContent(field.value);
        }

    }, [field.value]);


    const editor = useEditorBridge({
        autofocus: field.value ? true : (props.autofocus || false),
        avoidIosKeyboard: true,
        dynamicHeight: true,
        placeholder: props.placeholder,

        initialContent: field.value,
        bridgeExtensions: [
            // It is important to spread StarterKit BEFORE our extended plugin,
            // as plugin duplicated will be ignored
            ...TenTapStartKit,
            ImageBridge.configureExtension({
                inline: false,
                allowBase64: false,

              }),
            DropCursorBridge,
            PlaceholderBridge.configureExtension({
                placeholder: props.placeholder,
                showOnlyWhenEditable: true,

              }),
            CodeBridge.configureCSS(customCodeBlockCSS), // Custom codeblock css
        ],

    });
    useEffect(() => {
        if (suggestions.length > 0){
            console.log("suggestions", suggestions)
        let a = JSON.stringify(suggestions);
        editor.injectJS(`
            document.getElementById("mention-list").innerHTML = "";
            ${a}.forEach(user => {
                const li = document.createElement("li");
                li.textContent = user.name;
                li.data = user;
                li.style.cursor = "pointer";
                li.addEventListener("click", () => { document.getElementsByClassName("tiptap")[0].textContent += user.name;
                  document.getElementById("mention-list").style.display = "none";});
                document.getElementById("mention-list").appendChild(li);
            });
            document.getElementById("mention-list").style.display = "block";
        
            const rect = document.getElementsByClassName("tiptap")[0].getBoundingClientRect();
            document.getElementById("mention-list").style.left = rect.left + 'px';
            document.getElementById("mention-list").style.top = rect.bottom + 'px';`);
        }
    }, [suggestions]);


    const processImages =  (src) => {
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

    

    const htmlContent = useEditorContent(editor, { type: 'html' });
    useEffect(() => {
        if (htmlContent) {
            field.onChange(htmlContent)
        }
    }, [htmlContent]);

    const onMessage = (event) => {
        try {
            const message = JSON.parse(event.nativeEvent.data);
            console.log("message", message)
            if (message?.type == "document-height") {
                const h = parseInt(message.payload);
                if (h != height && h< maxHeight)
                    setHeight(message.payload);
            }
            if (message?.type == "paste") {
                console.log("message.payload", message.payload)
                processImages(message.payload)
               
            }

            if (message?.type == "mention") {
          setKeyword([message.payload, message.sym])
             
            }

            if (message?.type == "editor-ready") {
                editor.injectJS(`
                   
                    const mentionList = document.createElement("ul");
mentionList.id = "mention-list";
mentionList.className = "mention-list";
mentionList.style.display = "none";
mentionList.style.position = "absolute";
document.body.appendChild(mentionList);


document.addEventListener("click", function (event) {
    if (!mentionList.contains(event.target)) {
        mentionList.style.display = "none"; // Скрываем div
    }
});


    const editor = document.getElementsByClassName("tiptap")[0];
    let mentionIndex = -1; // Индекс активного элемента

   editor.addEventListener("input", async function(event) {

    const text = getTextBeforeCursor();
    if (text.startsWith("@") ) {
        const query = text.substring(1).toLowerCase();
        window.ReactNativeWebView.postMessage(JSON.stringify({type: 'mention', payload: query, sym: '@' }));
    }

    if (text.startsWith("#")) {
        const query = text.substring(1).toLowerCase();
        window.ReactNativeWebView.postMessage(JSON.stringify({type: 'mention', payload: query, sym: '#' }));
    }
});



      function getTextBeforeCursor() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return "";
        const range = selection.getRangeAt(0);
        const text = range.startContainer.textContent.substring(0, range.startOffset);
        return text.split(" ").pop();
    }

    

    

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
                                        reader.onload = function(e) {
                                            window.ReactNativeWebView.postMessage(JSON.stringify({type: 'paste', payload: e.target.result }));
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

    return <View className="flex-auto" style={{height:height}}>
        <RichText exclusivelyUseCustomOnMessage={false} style={{ backgroundColor: 'transparent' }} editor={editor} onMessage={onMessage} />
    </View>
}
/*  <View className="h-24 w-full"><Toolbar editor={editor} /></View>*/