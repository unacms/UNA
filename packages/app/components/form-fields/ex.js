import { Mention } from "@tiptap/extension-mention";
import { useEditorBridge, RichText, Toolbar, TenTapStartKit, CodeBridge, BridgeExtension } from '@10play/tentap-editor';


const users = [
    { name: "Alice", url: "/profile/alice" },
    { name: "Bob", url: "/profile/bob" },
    { name: "Charlie", url: "/profile/charlie" }
  ];
  
  export const MentionBridge = new BridgeExtension({
    tiptapExtension: Mention.configure({
      HTMLAttributes: {
        class: "mention",
      },
      suggestion: {
        char: "@",
        items: ({ query }) => {
          return users.filter(user => user.name.toLowerCase().startsWith(query.toLowerCase()));
        },
        render: () => {
          let dropdown;
          return {
            onStart: (props) => {
              dropdown = document.createElement("div");
              dropdown.classList.add("mention-dropdown");
              document.body.appendChild(dropdown);
              dropdown.innerHTML = props.items.map(user => 
                `<div class='mention-item' data-name='${user.name}' data-url='${user.url}'>@${user.name}</div>`
              ).join("");
              dropdown.addEventListener("click", (event) => {
                const target = event.target.closest(".mention-item");
                if (target) {
                  props.command({ name: target.dataset.name, url: target.dataset.url });
                }
              });
            },
            onUpdate: (props) => {
              dropdown.innerHTML = props.items.map(user => 
                `<div class='mention-item' data-name='${user.name}' data-url='${user.url}'>@${user.name}</div>`
              ).join("");
            },
            onKeyDown: ({ event }) => {
              if (event.key === "Enter") {
                event.preventDefault();
              }
            },
            onExit: () => {
              dropdown.remove();
            },
          };
        },
        command: ({ editor, range, props }) => {
          editor.chain().focus().insertContentAt(range, {
            type: "mention",
            attrs: { label: props.name, url: props.url },
          }).run();
        },
      },
    }),
    onBridgeMessage: (editor, message) => {
      if (message.type === "insert-mention") {
        editor.chain().focus().insertContent({
          type: "mention",
          attrs: { label: message.payload.name, url: message.payload.url },
        }).run();
      }
      return false;
    },
    extendEditorInstance: (sendBridgeMessage) => {
      return {
        insertMention: (name, url) =>
          sendBridgeMessage({ type: "insert-mention", payload: { name, url } }),
      };
    },
    extendEditorState: (editor) => {
      return {
        canInsertMention: editor.can().insertContent({ type: "mention" }),
      };
    },
    extendCSS: `
      .mention {
          color: #007bff;
          cursor: pointer;
          text-decoration: none;
      }
      .mention-dropdown {
          position: absolute;
          background: white;
          border: 1px solid #ccc;
          padding: 5px;
      }
      .mention-item {
          cursor: pointer;
          padding: 5px;
      }
      .mention-item:hover {
          background: #f0f0f0;
      }
    `,
  });