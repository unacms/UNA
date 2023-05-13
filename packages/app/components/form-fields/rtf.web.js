import { View } from 'app/design/view'

import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import * as ImagePicker from 'expo-image-picker';
import { useController, useFormContext } from 'react-hook-form';
import { Button, ButtonsGroup } from 'app/design/controls';
import { uploadImage } from '../../lib/util';
import { useColorScheme } from 'react-native';
import { appSetting } from 'app/lib/util'

import Document from '@tiptap/extension-document'
import Image from '@tiptap/extension-image'
import Text from '@tiptap/extension-text'
import Link from '@tiptap/extension-link'
import Iframe from 'app/lib/editor-helpers'
import suggestion from 'app/lib/editor-helpers2'
import Mention from '@tiptap/extension-mention'
import { mergeAttributes, Node } from '@tiptap/core'

const MenuBar = ({ editor }) => {
    const scheme = useColorScheme();
    
    if (!editor) {
        return null
    }

    const handleAddEmbeds = () => {
        const url = window.prompt('URL')
       
        if (url) {
            let className = "w-full max-w-xl aspect-video mx-auto ";
            if (url.includes('twitter.com') ) {
                className = "w-full max-w-xl aspect-square mx-auto ";
            }
            const rvUrl = appSetting("urls", "embeds") + url + '&theme=' + scheme;
            editor.chain().focus().setIframe({ src: rvUrl, origin: url, class: className }).run()
        }
    };

    const handleAddLink = () => {
        const previousUrl = editor.getAttributes('link').href
        const url = window.prompt('URL', previousUrl)

        if (url === null)
            return

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            return
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    };

    const handleAddImage =  async () => {
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
    aButtonsGroup.push(<Button disabled={editor.isActive('bold') ? true : false} key="TextB" startDecorator="TextB" onPress={() => editor.chain().focus().toggleBold().run()}/>);
    aButtonsGroup.push(<Button disabled={editor.isActive('italic') ? true : false} key="TextItalic" startDecorator="TextItalic" onPress={() => editor.chain().focus().toggleItalic().run()}/>);
    aButtonsGroup.push(<Button disabled={editor.isActive('strike') ? true : false} key="TextStrikethrough" startDecorator="TextStrikethrough" onPress={() => editor.chain().focus().toggleStrike().run()}/>);
    //aButtonsGroup.push(<Button disabled={editor.isActive('code') ? true : false} key="Code" startDecorator="Code" onPress={() => editor.chain().focus().toggleCode().run()}/>);
    aButtonsGroup.push(<Button disabled={editor.isActive('heading', { level: 1 }) ? true : false} key="TextHOne" startDecorator="TextHOne" onPress={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}/>);
    aButtonsGroup.push(<Button disabled={editor.isActive('heading', { level: 2 }) ? true : false} key="TextHTwo" startDecorator="TextHTwo" onPress={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}/>);
    aButtonsGroup.push(<Button disabled={editor.isActive('heading', { level: 3 }) ? true : false} key="TextHThree" startDecorator="TextHThree" onPress={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}/>);
    aButtonsGroup.push(<Button disabled={editor.isActive('bulletList') ? true : false} key="ListBullets" startDecorator="ListBullets" onPress={() => editor.chain().focus().toggleBulletList().run()}/>);
    aButtonsGroup.push(<Button disabled={editor.isActive('orderedList') ? true : false} key="ListNumbers" startDecorator="ListNumbers" onPress={() => editor.chain().focus().toggleOrderedList().run()}/>);
    aButtonsGroup.push(<Button disabled={editor.isActive('blockquote') ? true : false} key="Quotes" startDecorator="Quotes" onPress={() => editor.chain().focus().toggleBlockquote().run()}/>);
    aButtonsGroup.push(<Button  key="ArrowUUpLeft" startDecorator="ArrowUUpLeft" onPress={() => editor.chain().focus().undo().run()}/>);
    aButtonsGroup.push(<Button key="ArrowUUpRight" startDecorator="ArrowUUpRight" onPress={() => editor.chain().focus().redo().run()}/>);
    aButtonsGroup.push(<Button key="Image" startDecorator="Image" onPress={() => handleAddImage()}/>);
    aButtonsGroup.push(<Button key="Link" startDecorator="Link" onPress={() => handleAddLink()}/>);
    aButtonsGroup.push(<Button key="Code" startDecorator="Code" onPress={() => handleAddEmbeds()}/>);
    return (
       
      <>
       <ButtonsGroup >{aButtonsGroup}</ButtonsGroup>
      </>
    )
  }

  var MentionAt = Mention.extend({
    renderHTML({ node, HTMLAttributes }) {
      return [
        'a',
        mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {href:node.attrs.id.url, title:node.attrs.id.label, dchar: node.attrs.id.symbol, 'data-profile-id': node.attrs.id.value}),
        this.options.renderLabel({
          options: this.options,
          node,
        }),
      ]
    }
  })

  var MentionHash = Mention.extend({
    renderHTML({ node, HTMLAttributes }) {
      return [
        'a',
        mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {href:node.attrs.id.url, title:node.attrs.id.label, dchar: node.attrs.id.symbol, 'data-profile-id': node.attrs.id.value}),
        this.options.renderLabel({
          options: this.options,
          node,
        }),
      ]
    }
  })
  

  
export default function FormFieldFtf(props) {

    let rules = {};
    let name = props.name;
    let defaultValue = props.value ? props.value : '';
    const formContext = useFormContext();

    const handleChange = (content) => {
      setTimeout(() => {
          formContext.setValue(name, content)
      }, 100);
  };
    
    const { field } = useController({ name, rules, defaultValue });

      const editor = useEditor({
        extensions: [
          Document,
          Text,
          Image,
          Iframe,
          Link.configure({
            openOnClick: false,
          }),

          MentionAt.configure({
            HTMLAttributes: {
              class: 'bx-mention-link',
            },
            suggestion: suggestion('@'),
            renderLabel({ options, node }) {
              return options.suggestion.char + ' ' + node.attrs.id.label
            },
            
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
          handleChange(editor.getHTML());
        },
      })
    
      return (
        <View className='bg-neutral-500/10  border border-neutral-500/10  focus:bg-backgroundinput-focus focus:outline-none  focus:border-bordercolorinput-focus dark:focus:border-bordercolorinput-darkfocus  text-neutral-900 rounded-lg   w-full   dark:focus:bg-backgroundinput-darkafocus placeholder-neutral-600 dark:text-neutral-100 text-base' >
          <MenuBar editor={editor} />
          <EditorContent 
            editor={editor} 
            className='p-4' 
          />
        </View>
      )
}