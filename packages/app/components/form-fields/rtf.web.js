import { View, Row, Pressable } from 'app/design/view'

import { Color } from '@tiptap/extension-color'
import ListItem from '@tiptap/extension-list-item'
import TextStyle from '@tiptap/extension-text-style'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import React from 'react'
import { useController } from 'react-hook-form';
import { ButtonsGroup } from 'app/design/controls';
import { Button } from 'app/design/controls';

const MenuBar = ({ editor }) => {
    if (!editor) {
      return null
    }

    let aButtonsGroup = [];
    aButtonsGroup.push(<Button disabled={editor.isActive('bold') ? true : false} key="TextB" startDecorator="TextB" onPress={() => editor.chain().focus().toggleBold().run()}/>);
    aButtonsGroup.push(<Button disabled={editor.isActive('italic') ? true : false} key="TextB" startDecorator="TextItalic" onPress={() => editor.chain().focus().toggleItalic().run()}/>);
    aButtonsGroup.push(<Button disabled={editor.isActive('strike') ? true : false} key="TextB" startDecorator="TextStrikethrough" onPress={() => editor.chain().focus().toggleStrike().run()}/>);
    aButtonsGroup.push(<Button disabled={editor.isActive('code') ? true : false} key="TextB" startDecorator="Code" onPress={() => editor.chain().focus().toggleCode().run()}/>);
    aButtonsGroup.push(<Button disabled={editor.isActive('heading', { level: 1 }) ? true : false} key="TextB" startDecorator="TextHOne" onPress={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}/>);
    aButtonsGroup.push(<Button disabled={editor.isActive('heading', { level: 2 }) ? true : false} key="TextB" startDecorator="TextHTwo" onPress={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}/>);
    aButtonsGroup.push(<Button disabled={editor.isActive('heading', { level: 3 }) ? true : false} key="TextB" startDecorator="TextHThree" onPress={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}/>);
    aButtonsGroup.push(<Button disabled={editor.isActive('bulletList') ? true : false} key="ist-bullets" startDecorator="ListBullets" onPress={() => editor.chain().focus().toggleBulletList().run()}/>);
    aButtonsGroup.push(<Button disabled={editor.isActive('orderedList') ? true : false} key="TextB" startDecorator="ListNumbers" onPress={() => editor.chain().focus().toggleOrderedList().run()}/>);
    aButtonsGroup.push(<Button disabled={editor.isActive('blockquote') ? true : false} key="TextB" startDecorator="Quotes" onPress={() => editor.chain().focus().toggleBlockquote().run()}/>);
    aButtonsGroup.push(<Button  key="TextB" startDecorator="ArrowUUpLeft" onPress={() => editor.chain().focus().undo().run()}/>);
    aButtonsGroup.push(<Button key="TextB" startDecorator="ArrowUUpRight" onPress={() => editor.chain().focus().redo().run()}/>);
    



    return (
       
      <>
       <ButtonsGroup >{aButtonsGroup}</ButtonsGroup>
      </>
    )
  }

export default function FormFieldFtf(props) {

    let rules = {};
    let name = props.name;
    let defaultValue = props.value ? props.value : '';
    
    const { field } = useController({ name, rules, defaultValue });

      const editor = useEditor({
        extensions: [
          Color.configure({ types: [TextStyle.name, ListItem.name] }),
          TextStyle.configure({ types: [ListItem.name] }),
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
      })
    
      return (
        <div>
          <MenuBar editor={editor} />
          <EditorContent editor={editor} />
        </div>
      )
}