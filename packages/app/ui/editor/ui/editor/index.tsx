"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { TiptapEditorProps } from "./props";
import { TiptapExtensions } from "./extensions";
import { useCompletion } from "ai/react";
import { EditorBubbleMenu } from "./components/bubble-menu";
import { getPrevText } from "app/ui/editor/lib/editor";
import { ImageResizer } from "./components/image-resizer";

export default function Editor({ defaultValue, formContext, field, name, viewClasses, contentf }) {
  const [content, setContent] = useState(defaultValue)
  const [hydrated, setHydrated] = useState(false);

  const editor = useEditor({
    extensions: TiptapExtensions,
    editorProps: TiptapEditorProps,
    onUpdate: (e) => {
      const selection = e.editor.state.selection;
      const lastTwo = getPrevText(e.editor, {
        chars: 2,
      });
      if (lastTwo === "++" && !isLoading) {
        e.editor.commands.deleteRange({
          from: selection.from - 2,
          to: selection.from,
        });
        complete(
          getPrevText(e.editor, {
            chars: 5000,
          }),
        );
        // complete(e.editor.storage.markdown.getMarkdown());
      } else {
        const content = formContext.watch(name)
        let cnt = e.editor.getHTML();
        if (cnt == '<p></p>')
          cnt ='';
          if (content != cnt)
            field.onChange(cnt);
        //formContext.setValue(name, e.editor.getHTML());
        // debouncedUpdates(e);
      }
    },
    autofocus: "end",
  });

  useEffect(() => {
    if (editor) { // && (contentf == '' && contentf != '')
      if (contentf != editor.getHTML())
        editor.commands.setContent(contentf);
    }
  }, [contentf]);

  const { complete, completion, isLoading, stop } = useCompletion({
    id: "novel",
    api: "/api/generate",
    onFinish: (_prompt, completion) => {
      editor?.commands.setTextSelection({
        from: editor.state.selection.from - completion.length,
        to: editor.state.selection.from,
      });
    },
    onError: (err) => {
      console.log(err.message);
      if (err.message === "You have reached your request limit for the day.") {
      }
    },
  });

  const prev = useRef("");

  // Insert chunks of the generated text
  useEffect(() => {
    const diff = completion.slice(prev.current.length);
    prev.current = completion;
    editor?.commands.insertContent(diff);
  }, [isLoading, editor, completion]);

  useEffect(() => {
    // if user presses escape or cmd + z and it's loading,
    // stop the request, delete the completion, and insert back the "++"
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || (e.metaKey && e.key === "z")) {
        stop();
        if (e.key === "Escape") {
          editor?.commands.deleteRange({
            from: editor.state.selection.from - completion.length,
            to: editor.state.selection.from,
          });
        }
        editor?.commands.insertContent("++");
      }
    };
    const mousedownHandler = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      stop();
      if (window.confirm("AI writing paused. Continue?")) {
        complete(editor?.getText() || "");
      }
    };
    if (isLoading) {
      document.addEventListener("keydown", onKeyDown);
      window.addEventListener("mousedown", mousedownHandler);
    } else {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", mousedownHandler);
    }
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", mousedownHandler);
    };
  }, [stop, isLoading, editor, complete, completion.length]);

  // Hydrate the editor with the content from localStorage.
  useEffect(() => {
    if (editor && content && !hydrated) {
      editor.commands.setContent(content);
      setHydrated(true);
    }
  }, [editor, content, hydrated]);

  let className = "relative min-h-[100px] p-4 bg-neutral-500/10 border border-neutral-500/10 focus:bg-bgrinput-focus focus:outline-none focus:border-bdrinput-focus dark:focus:border-bdrinput-df text-neutral-900 rounded-lg w-full dark:focus:bg-bgrinput-dafocus placeholder-neutral-500 dark:text-neutral-100 text-base"
  if (viewClasses) {
    className = "relative min-h-[100px] focus:outline-none " + viewClasses;
  }

  return (
    <div
      onClick={() => {
        editor?.chain().focus().run();
      }}

      className={className}
    >

      {editor && <EditorBubbleMenu editor={editor} />}
      {editor?.isActive("image") && <ImageResizer editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
