import { View } from 'app/design/view'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import * as ImagePicker from 'expo-image-picker';
import { useController, useFormContext } from 'react-hook-form';
import { Button, ButtonsGroup } from 'app/design/controls';
import { uploadImage } from '../../lib/util';
import { useColorScheme } from 'react-native';
import { appSetting } from 'app/lib/util'
import { useState, useEffect } from 'react'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Iframe from 'app/lib/editor-helpers'
import { Suggestion } from 'app/lib/editor-helpers2'
import Mention from '@tiptap/extension-mention'
import { mergeAttributes, Node } from '@tiptap/core'
import { Modal } from 'app/design/controls'
import { Input } from 'app/design/controls'
import { Text as TextTag } from 'app/design/typography'


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

        if (modalType == 'link'){
            if (inputValue === '') {
                editor.chain().focus().extendMarkRange('link').unsetLink().run()
                return
            }
            editor.chain().focus().extendMarkRange('link').setLink({ href: inputValue }).run();
            setShowModal(false);
            setModalType('');
            setInputValue('');
        }
        if (modalType == 'embed'){
            if (inputValue != '') {
                let className = "w-full max-w-xl aspect-video mx-auto ";
                
                const rvUrl = appSetting("urls", "embeds") + inputValue + '&theme=' + scheme;
                editor.chain().focus().setIframe({ src: rvUrl, origin: inputValue, class: className }).run()
                setShowModal(false);
                setModalType('');
                setInputValue('');
            }
        }
    }

    const handleAddLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        setInputValue(previousUrl);
        setShowModal(true);
        setModalType('link')
       
    };

    const handleAddImage =    async () => {
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
                    {editor: editor, test:'text'}
                );
            });
        }
    };

    const handleInsertImageFinish = async (url, extraVar) => {
        extraVar.editor.chain().focus().setImage({ src: url }).run()
    }

    let aButtonsGroup = [];
    aButtonsGroup.push(<Button pressed={editor.isActive('bold') ? true : false} key="TextB" startDecorator="TextB" onPress={() => editor.chain().focus().toggleBold().run()}/>);
    aButtonsGroup.push(<Button pressed={editor.isActive('italic') ? true : false} key="TextItalic" startDecorator="TextItalic" onPress={() => editor.chain().focus().toggleItalic().run()}/>);
    aButtonsGroup.push(<Button pressed={editor.isActive('strike') ? true : false} key="TextStrikethrough" startDecorator="TextStrikethrough" onPress={() => editor.chain().focus().toggleStrike().run()}/>);
    //aButtonsGroup.push(<Button pressed={editor.isActive('code') ? true : false} key="Code" startDecorator="Code" onPress={() => editor.chain().focus().toggleCode().run()}/>);
    aButtonsGroup.push(<Button pressed={editor.isActive('heading', { level: 1 }) ? true : false} key="TextHOne" startDecorator="TextHOne" onPress={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}/>);
    aButtonsGroup.push(<Button pressed={editor.isActive('heading', { level: 2 }) ? true : false} key="TextHTwo" startDecorator="TextHTwo" onPress={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}/>);
    aButtonsGroup.push(<Button pressed={editor.isActive('heading', { level: 3 }) ? true : false} key="TextHThree" startDecorator="TextHThree" onPress={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}/>);
    aButtonsGroup.push(<Button pressed={editor.isActive('bulletList') ? true : false} key="ListBullets" startDecorator="ListBullets" onPress={() => editor.chain().focus().toggleBulletList().run()}/>);
    aButtonsGroup.push(<Button pressed={editor.isActive('orderedList') ? true : false} key="ListNumbers" startDecorator="ListNumbers" onPress={() => editor.chain().focus().toggleOrderedList().run()}/>);
    aButtonsGroup.push(<Button pressed={editor.isActive('blockquote') ? true : false} key="Quotes" startDecorator="Quotes" onPress={() => editor.chain().focus().toggleBlockquote().run()}/>);
    aButtonsGroup.push(<Button    key="ArrowUUpLeft" startDecorator="ArrowUUpLeft" onPress={() => editor.chain().focus().undo().run()}/>);
    aButtonsGroup.push(<Button key="ArrowUUpRight" startDecorator="ArrowUUpRight" onPress={() => editor.chain().focus().redo().run()}/>);
    aButtonsGroup.push(<Button key="Image" startDecorator="Image" onPress={() => handleAddImage()}/>);
    aButtonsGroup.push(<Button key="Link" startDecorator="Link" onPress={() => handleAddLink()}/>);
    aButtonsGroup.push(<Button key="Code" startDecorator="Code" onPress={() => handleAddEmbeds()}/>);
    return (
        <>
            <Modal title="Add new Post" id={'file-preview'}  onVisible={showModal} >
                    <View className="w-full">
                    
                        <TextTag className='text-lg font-bold'>Insert {modalType}</TextTag>
                        <View className='mt-4 w-full'>
                        <Input onChangeText={handleChange} value={inputValue}  />
                        </View>
                        <View className='mt-4 mx-auto flex-row gap-4'>
                            <Button variant="primary" title="Ok" onPress={handleModal}/>
                            <Button variant="default" title="Cancel" onPress={handleCancel}/>
                        </View>
                    </View>
            </Modal>
            <ButtonsGroup  variant="outline">{aButtonsGroup}</ButtonsGroup>
        </>
    )
}

var MentionEx = Mention.extend({
    renderHTML({ node, HTMLAttributes }) {
        return [
            'a',
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {href:node.attrs.id.url, title:node.attrs.id.label, dchar: node.attrs.id.symbol, 'data-profile-id': node.attrs.id.value}),
            node.attrs.id.symbol + ' ' + node.attrs.id.label,
        ]
    },
})
    
export default function FormFieldFtf(props) {

    let rules = {};
    let name = props.name;
    let defaultValue = props.value ? props.value : '';
    const formContext = useFormContext();

    const handleChange = (content) => {
        //setTimeout(() => {
            formContext.setValue(name, content)
       // }, 100);
    };
        
    const { field } = useController({ name, rules, defaultValue });

    const editor = useEditor({
        extensions: [
            Image,
            Iframe,
            Link.configure({
                openOnClick: false,
            }),

            MentionEx.configure({
                HTMLAttributes: {
                    class: 'bx-mention-link',
                },
                suggestion: Suggestion('@'),

                
            }),
            MentionEx.configure({
                HTMLAttributes: {
                    class: 'bx-mention-link',
                },
                suggestion: Suggestion('#'),
                
                
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
           formContext.setValue(name, editor.getHTML());
        }

    })

    useEffect(() => {
        if (editor && field.value == '')
            editor.commands.setContent(field.value)

    }, [field.value]);

    
    const isFullHtml = props.html == 2;


    return (
        <View className='bg-neutral-500/10    border border-neutral-500/10    focus:bg-backgroundinput-focus focus:outline-none    focus:border-bordercolorinput-focus dark:focus:border-bordercolorinput-darkfocus    text-neutral-900 rounded-lg     w-full     dark:focus:bg-backgroundinput-darkafocus placeholder-neutral-600 dark:text-neutral-100 text-base' >
        <EditorContent 
                editor={editor} 
                className={(props?.numLines == 1 ? '' : 'editor-height') + ' ' + (isFullHtml? 'p-4 ' :'p-2')}
            />
            <View className={isFullHtml? 'm-2' : 'm-0 p-0'}>
            {isFullHtml  && <MenuBar editor={editor} /> }
            </View>
        </View>
    )
}