import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import 'app/styles/tippyjs.css'
import { fetcher } from 'app/lib/fetcher';
import MentionList from 'app/lib/editor-helpers3'
import { PluginKey } from '@tiptap/pm/state'

export function Suggestion(startfrom) {
    return {
        char: startfrom,
        pluginKey: new PluginKey('mentSuggestionPluginKey1ion'+startfrom),
        items: async ({ query }) => {
            if (query.length > 0){
            const result = await fetcher('/searchExtended.php?action=get_mention&symbol=' + (startfrom == '#' ? '%23': startfrom) + '&term=' + query); // keyword
            return result;
            }
            return [];
        },

        render: () => {
            let component
            let popup

            return {
                onStart: props => {
                    component = new ReactRenderer(MentionList, {
                        props,
                        editor: props.editor,
                    })

                    if (!props.clientRect) {
                        return
                    }

                    popup = tippy('body', {
                        theme: 'mention',
                        getReferenceClientRect: props.clientRect,
                        appendTo: () => document.body,
                        content: component.element,
                        showOnCreate: true,
                        interactive: true,
                        trigger: 'manual',
                        placement: 'bottom-start',
                    })
                },

                onUpdate(props) {
                    component.updateProps(props)

                    if (!props.clientRect) {
                        return
                    }

                    popup[0].setProps({
                        getReferenceClientRect: props.clientRect,
                    })
                },

                onKeyDown(props) {
                    if (props.event.key === 'Escape') {
                        popup[0].hide()

                        return true
                    }

                    return component?.ref?.onKeyDown(props)
                },
                onSelect: (props, { commands }) => {
                    console.log('props', props)
                    // Assuming `props` contains the necessary attributes for your mention
                    commands.insertMentionEx({
                      attrs: props,
                    });
                  },

                onExit() {
                    popup[0].destroy()
                    component.destroy()
                },
            }
        },
    }
}