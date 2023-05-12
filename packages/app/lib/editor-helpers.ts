import { Node } from '@tiptap/core'

export interface IframeOptions {
  allowFullscreen: boolean,
  HTMLAttributes: {
    [key: string]: any
  },
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    iframe: {
      /**
       * Add an iframe
       */
      setIframe: (options: { src: string }) => ReturnType,
    }
  }
}

export default Node.create<IframeOptions>({
  name: 'iframe',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      allowFullscreen: true,
      HTMLAttributes: {
        class: 'bx-embed-link',
        source: ''
      },
    }
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      origin: {
        default: null,
      },
      class:{
        default: null,
      },
      frameborder: {
        default: 0,
      },
      scrolling: {
        default: 'no',
      },
      width: {
        default: '100%',
      },
      height: {
        default: 'auto',
      },
      allowfullscreen: {
        default: this.options.allowFullscreen,
        parseHTML: () => this.options.allowFullscreen,
      },
    }
  },

  parseHTML() {
    return [{
      tag: 'iframe',
    }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', {
      ...this.options.HTMLAttributes,
      source: HTMLAttributes.origin,
    }, ['iframe', HTMLAttributes]];
},

  addCommands() {
    return {
      setIframe: (options: { src: string, origin: string, class: string }) => ({ tr, dispatch }) => {
        const { selection } = tr
        const node = this.type.create(options)

        if (dispatch) {
          tr.replaceRangeWith(selection.from, selection.to, node)
        }

        return true
      },
    }
  },
})