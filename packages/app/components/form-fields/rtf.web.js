import { View } from 'app/design/view'
import { useMemo } from 'react';
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import * as ImagePicker from 'expo-image-picker';
import Field, {getValidationRules} from 'app/components/form-fields/_field';
import { useController, useFormContext } from 'react-hook-form';
import { Button, ButtonsGroup } from 'app/design/controls';
import { uploadImage,linkify2 } from 'app/lib/util';
import { useColorScheme } from 'react-native';
import { absoluteApiUrl } from 'app/lib/util'
import { useState, useEffect } from 'react'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Iframe from 'app/lib/editor-helpers'
import { Suggestion } from 'app/lib/editor-helpers2'
import Mention from '@tiptap/extension-mention'
import { mergeAttributes, Node, Extension } from '@tiptap/core'
import { Modal } from 'app/design/controls'
import { Input } from 'app/design/controls'
import { Text as TextTag } from 'app/design/typography'
import Html from 'app/ui/atoms/html'
import Editor from "app/ui/editor/ui/editor";
import Embed from 'app/ui/molecules/embed'
import { fetcher } from 'app/lib/fetcher';
import { appSetting } from 'app/lib/util'

import "app/ui/editor/styles/globals.css";
import "app/ui/editor/styles/prosemirror.css";


const MenuBar = ({ editor }) => {
    const scheme = useColorScheme();
    const [showModal, setShowModal] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [modalType, setModalType] = useState('')

    if (!editor) return null;

    function handleChange(e) {
        setInputValue(e);
    }

    const handleAddEmbeds = () => {
        setInputValue('');
        setShowModal(true);
        setModalType('embed')
    };


    const handleCancel = () => {
        setInputValue('');
        setShowModal(false);
        setModalType('')
    };

    const handleModal = () => {

        if (modalType == 'link') {
            if (inputValue === '') {
                editor.chain().focus().extendMarkRange('link').unsetLink().run()
                return
            }
            editor.chain().focus().extendMarkRange('link').setLink({ href: inputValue }).run();
            setShowModal(false);
            setModalType('');
            setInputValue('');
        }
        /*if (modalType == 'embed') {
            if (inputValue != '') {
                let className = "w-full max-w-xl aspect-video mx-auto ";

                const rvUrl = absoluteApiUrl("embeds") + inputValue + '&theme=' + scheme;
                editor.chain().focus().setIframe({ src: rvUrl, origin: inputValue, class: className }).run()
                setShowModal(false);
                setModalType('');
                setInputValue('');
            }
        }*/
    }

    const handleAddLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        setInputValue(previousUrl);
        setShowModal(true);
        setModalType('link')

    };

    const handleAddImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
            allowsMultipleSelection: false,
        });

        if (!result.canceled) {
            result.assets.forEach(function (i) {
                uploadImage(
                    i.uri,
                    '/api.php?r=system/get_data_api/TemplUploaderServices/&params[]&o=sys_images_editor&t=sys_images_editor&a=upload_inline',
                    handleInsertImageFinish,
                    { editor: editor, test: 'text' }
                );
            });
        }
    };

    const handleInsertImageFinish = async (url, extraVar) => {
        extraVar.editor.chain().focus().setImage({ src: url }).run()
    }

    let aButtonsGroup = [];
    aButtonsGroup.push(<Button pressed={editor.isActive('bold') ? true : false} key="TextB" startDecorator="TextB" onPress={() => editor.chain().focus().toggleBold().run()} />);
    aButtonsGroup.push(<Button pressed={editor.isActive('italic') ? true : false} key="TextItalic" startDecorator="TextItalic" onPress={() => editor.chain().focus().toggleItalic().run()} />);
    aButtonsGroup.push(<Button pressed={editor.isActive('strike') ? true : false} key="TextStrikethrough" startDecorator="TextStrikethrough" onPress={() => editor.chain().focus().toggleStrike().run()} />);
    //aButtonsGroup.push(<Button pressed={editor.isActive('code') ? true : false} key="Code" startDecorator="Code" onPress={() => editor.chain().focus().toggleCode().run()}/>);
    aButtonsGroup.push(<Button pressed={editor.isActive('heading', { level: 1 }) ? true : false} key="TextHOne" startDecorator="TextHOne" onPress={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />);
    aButtonsGroup.push(<Button pressed={editor.isActive('heading', { level: 2 }) ? true : false} key="TextHTwo" startDecorator="TextHTwo" onPress={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />);
    aButtonsGroup.push(<Button pressed={editor.isActive('heading', { level: 3 }) ? true : false} key="TextHThree" startDecorator="TextHThree" onPress={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />);
    aButtonsGroup.push(<Button pressed={editor.isActive('bulletList') ? true : false} key="ListBullets" startDecorator="ListBullets" onPress={() => editor.chain().focus().toggleBulletList().run()} />);
    aButtonsGroup.push(<Button pressed={editor.isActive('orderedList') ? true : false} key="ListNumbers" startDecorator="ListNumbers" onPress={() => editor.chain().focus().toggleOrderedList().run()} />);
    aButtonsGroup.push(<Button pressed={editor.isActive('blockquote') ? true : false} key="Quotes" startDecorator="Quotes" onPress={() => editor.chain().focus().toggleBlockquote().run()} />);
    aButtonsGroup.push(<Button key="ArrowUUpLeft" startDecorator="ArrowUUpLeft" onPress={() => editor.chain().focus().undo().run()} />);
    aButtonsGroup.push(<Button key="ArrowUUpRight" startDecorator="ArrowUUpRight" onPress={() => editor.chain().focus().redo().run()} />);
    aButtonsGroup.push(<Button key="Image" startDecorator="Image" onPress={() => handleAddImage()} />);
    aButtonsGroup.push(<Button key="Link" startDecorator="Link" onPress={() => handleAddLink()} />);
    aButtonsGroup.push(<Button key="Code" startDecorator="Code" onPress={() => handleAddEmbeds()} />);
    return (
        <>
            <Modal id={'file-preview'} onVisible={showModal} >
                <View className="w-full">

                    <TextTag className='text-lg font-bold'>Insert {modalType}</TextTag>
                    <View className='mt-4 w-full'>
                        <Input onChangeText={handleChange} value={inputValue} />
                    </View>
                    <View className='mt-4 mx-auto flex-row gap-4'>
                        <Button variant="primary" title="Ok" onPress={handleModal} />
                        <Button variant="default" title="Cancel" onPress={handleCancel} />
                    </View>
                </View>
            </Modal>
            <ButtonsGroup variant="outline">{aButtonsGroup}</ButtonsGroup>
        </>
    )
}

var MentionEx = Mention.extend({
    addCommands() {
        return {
            insertMentionEx: (options) => ({ commands }) => {
                commands.insertContent({
                    type: 'mention',
                    attrs: options.attrs,
                });
                commands.insertContent(' '); // Insert space after mention
                return true;
            },
        };
    },
    renderHTML({ node, HTMLAttributes }) {
        return [
            'a',
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { href: node.attrs.id.url, title: node.attrs.id.label, dchar: node.attrs.id.symbol, 'data-profile-id': node.attrs.id.value }),
            (node.attrs.id.symbol == '@' ? '' : node.attrs.id.symbol) + '' + node.attrs.id.label,
        ]
    },
})

const BxMentionSpan = Node.create({
    name: 'bxMentionLink',

    inline: true,
    group: 'inline',
    content: 'inline*',
    selectable: false,
    atom: true,

    addAttributes() {
        return {
            class: {
                default: 'bx-mention-link',
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span.bx-mention-link',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
    },

    addCommands() {
        return {
            setBxMentionLink: () => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                });
            },
        };
    },
});

export default function FormFieldFtf(props) {

    const rules = getValidationRules(props);
    let name = props.name;
    let defaultValue = props.value ? props.value : '';
    const [link, setLink] = useState(null);
    const formContext = useFormContext();
    const { field } = useController({ name, rules, defaultValue });
    const object_privacy_view = formContext.watch('object_privacy_view');
    const object_id = formContext.watch('id');
    const m = name == "cmt_text" ? "sys_cmts" : "bx_timeline";


    useEffect(() => {
        if (props.value !== undefined) {
            field.onChange(props.value);
        }
        //formContext.setValue(props.name, props.value)
    }, [props.name, props.value]);

    // may be need not, fix for edit post text content
    useEffect(() => {
        if (props.html == 2 && props.value)
            formContext.setValue(props.name, props.value)
    }, []);


    if (props.html == 2) {
        return <Editor contentf={field.value} defaultValue={defaultValue} field={field} formContext={formContext} name={name} viewClasses={props.viewClasses} />
    }

    const SubmitOnEnter = props.submitOnEnter && Extension.create({
        addKeyboardShortcuts() {
            return {
                ShiftEnter: () => false,
                Enter: () => {
                    if (typeof props.handleSubmit === 'function')
                        props.handleSubmit();

                    return true;
                },
            };
        },
    });

    const editor = useEditor({
        parseOptions: {
            preserveWhitespace: 'full',
        },
        extensions: [
            Image,
            Iframe,
            SubmitOnEnter,
            BxMentionSpan,
            Link.extend({ inclusive: false }).configure({
                autolink: true,
                openOnClick: false,
            }),
            Placeholder.configure({
                placeholder: props.placeholder,
            }),

            MentionEx.configure({
                HTMLAttributes: {
                    class: 'bx-mention-link',
                },
                suggestion: Suggestion('@', object_privacy_view, m, object_id),


            }),
            MentionEx.configure({
                HTMLAttributes: {
                    class: 'bx-mention-link',
                },
                suggestion: Suggestion('#', object_privacy_view, m, object_id),


            }),

            StarterKit.configure({
                bulletList: {
                    keepMarks: true,
                    keepAttributes: false, // TODO : Making this as `false` becase marks are not preserved when I try to preserve attrs, awaiting a bit of help
                },
                orderedList: {
                    keepMarks: true,
                    keepAttributes: false, // TODO : Making this as `false` becase marks are not preserved when I try to preserve attrs, awaiting a bit of help
                },
            }),
        ],
        content: field.value,
        onUpdate({ editor }) {
            if (props.linkify) {
                let l = linkify2(editor.getHTML());
                if (l != link) {
                    setLink(l);
                }
            }
            field.onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'tiptap-'+(props.container_class ? props.container_class : 'default'),
            },
            handlePaste: function (view, event, slice) {
                const hasImages = Array.from(event.clipboardData.items).some(
                    item => item.type.indexOf('image') !== -1
                );

                if (hasImages) {
                    return true; // Prevent image pasting
                }

                return false; // Allow other pasting
            },
        },
    })

    useEffect(() => {
        if (editor && editor.getHTML() != field.value) {//&& field.value == ''{}
            editor.commands.setContent(field.value, false, {
                preserveWhitespace: "full",
              });
            editor.commands.focus()
        }

    }, [field.value]);

    let size = props.name == 'cmt_text' ? 'text-sm' : 'text-base';
    /*useEffect(() => {
        
        if (editor && props.name == 'cmt_text'){

            editor.commands.focus()
        }
    }, [editor]);*/

    useEffect(() => {
        if (editor && props.focus == true) {
            editor.commands.focus('end')
        }
    }, [editor]);

    const isFullHtml = (props.html == 2 || props.html == 1);

    const  computedData = useMemo(async () => {
        if (link){
            const a = await fetcher('/api.php?r=' + appSetting("urls", "embeds_new") + link);
            return <View className='w-full mt-2'>
                <Embed data={a.data}/>
            </View>
        }
        return <></>
    }, [link]);

    const bgClass = props.bg == 'transparent' ? '' : " dark:focus:bg-bgrinput-dafocus bg-neutral-500/10 border border-bdr dark:border-bdr-d focus:bg-bgrinput-focus focus:outline-none focus:border-bdrinput-focus dark:focus:border-bdrinput-df rounded-lg "
    return (
        <>
            <View>
                <EditorContent
                    editor={editor}
                    className={(props?.numLines == 1 ? bgClass + ' text-neutral-800 w-full placeholder-neutral-500 dark:text-neutral-200 font-default ' + size + ' ' : bgClass + ' text-neutral-800 rounded-xl w-full placeholder-neutral-500 dark:text-neutral-200 text-base ') + ' ' + (isFullHtml ? ' p-4 ' : ' px-0.5 ')}

                />
                <View className={isFullHtml ? 'm-2' : 'm-0 p-0'}>
                    {isFullHtml && <MenuBar editor={editor} />}
                </View>
            </View>
            {computedData}
        </>
    )
}