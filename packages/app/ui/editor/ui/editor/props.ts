import { EditorProps } from "@tiptap/pm/view";
import { uploadImageFile } from 'app/lib/util';

export const TiptapEditorProps: EditorProps = {
  attributes: {
    class: `u-vanilla-html focus:outline-none max-w-full`,
  },
  handleDOMEvents: {
    keydown: (_view, event) => {
      // prevent default event listeners from firing when slash command is active
      if (["ArrowUp", "ArrowDown", "Enter"].includes(event.key)) {
        const slashCommand = document.querySelector("#slash-command");
        if (slashCommand) {
          return true;
        }
      }
    },
  },
  handlePaste: (view, event) => {
    if (
      event.clipboardData &&
      event.clipboardData.files &&
      event.clipboardData.files[0]
    ) {
      event.preventDefault();
      const file = event.clipboardData.files[0];
      const pos = view.state.selection.from;
      uploadImageFile(
        file, 
        '/api.php?r=system/get_data_api/TemplUploaderServices/&params[]&o=sys_images_editor&t=sys_images_editor&a=upload_inline', 
        handleInsertImageFinish,
        {editor: '', view: view, test:'text', pos:pos}
      );

      return true;
    }
    return false;
  },

  handleDrop: (view, event, _slice, moved) => {
    if (
      !moved &&
      event.dataTransfer &&
      event.dataTransfer.files &&
      event.dataTransfer.files[0]
    ) {
      event.preventDefault();
      const file = event.dataTransfer.files[0];
      const coordinates = view.posAtCoords({
        left: event.clientX,
        top: event.clientY,
      });
      // here we deduct 1 from the pos or else the image will create an extra node
      const pos = coordinates.pos - 1;
      uploadImageFile(
        file, 
        '/api.php?r=system/get_data_api/TemplUploaderServices/&params[]&o=sys_images_editor&t=sys_images_editor&a=upload_inline', 
        handleInsertImageFinish,
        {editor: '', view: view, test:'text', pos:pos}
      );


      return true;
    }
    return false;
  },
};

const handleInsertImageFinish = async (url, extraVar) => {
  //extraVar.editor.chain().focus().setImage({ src: url }).run()
  const view = extraVar.view;
  const pos = extraVar.pos;
  const { schema } = view.state;
  const node = schema.nodes.image.create({ src: url });
    const transaction = view.state.tr
      .replaceWith(pos, pos, node);
    view.dispatch(transaction);

}