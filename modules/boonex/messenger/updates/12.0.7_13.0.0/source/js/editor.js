/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup	Messenger Messenger
 * @ingroup	UnaModules
 * @{
 */

/**
 * Quill Editor integration
 */

;window.oMessengerEditor = class {
    constructor(oOptions) {
        const aEditorFunctions = ['onEnter', 'onChange', 'onESC', 'onUp', 'showToolbar', 'onInit', 'onFocus', 'onBlur'];

        this.oHtmlEditorObject = oOptions['selector'] ? oOptions['selector'] : '.editor';
        this.oHtmlSendButton = oOptions['button'] ? oOptions['button'] : '.send-button';
        this.oPlaceholder = oOptions['placeholder'] || null;
        this.bUseMantions = typeof oOptions['mentions'] === 'undefined' || oOptions['mentions'];

        aEditorFunctions.map(sFunc => {
             this[sFunc] = typeof oOptions[sFunc] === 'function' ? oOptions[sFunc] : () => true;
        });

        this.aToolbarSettings = [
            ['bold', 'italic', 'underline', 'strike', 'link'],
            ['blockquote', 'code-block'],
            [{ 'color': [] }, { 'background': [] }]
        ];

        if ($(this.oHtmlEditorObject).length){
            if (!this.oEditor){
                this.initClipboard();
                // Mentions initialization
                this.oMentions = typeof quillMention !== 'undefined' && this.bUseMantions ? { mention: this.initMentions() } : {};
            }
            this.oEditor = null;
            this.init();
        }
    }

    init(){
        if (typeof Quill === 'undefined')
            bx_get_scripts(['modules/boonex/messenger/js/quill/quill.min.js'], () => {
                this.initEditor();
            });
        else
            this.initEditor();
    }

    setText(mixedValue){
        if (this.oEditor)
            this.oEditor.setText(mixedValue);
    }

    getText(){
        if (this.oEditor)
            this.oEditor.getText();
    }

    editor(){
        this.init();
        return this.oEditor;
    }

    html(){
        return this.oEditor && this.oEditor.root && this.oEditor.root.innerHTML;
    }

    focus(){
        if (this.oEditor)
            this.oEditor.focus();
    }

    blur(){
        if (this.oEditor)
            this.oEditor.blur();
    }

    getContents(){
        return this.oEditor && this.oEditor.getContents();
    }

    get length(){
       return this.oEditor && this.oEditor.getLength();
    }

    setContents(aValues){
        if (this.oEditor)
            this.oEditor.setContents(!Array.isArray(aValues) ? [] : aValues);
    }

    addToCurrentPosition(sText){
        if (!this.oEditor)
            return false;

        let range = this.oEditor.getSelection(true);
        this.oEditor.insertText(range.index, sText, Quill.sources.USER);
        this.oEditor.setSelection(range.index + sText.length, 1, Quill.sources.API);
    }

    initClipboard(){
        const QuillClipboard = Quill.import('modules/clipboard');
        class Clipboard extends QuillClipboard {
            onPaste (event) {
                super.onPaste(event);
                if (event.clipboardData.getData('text/plain').length > 0)
                    $(this.oHtmlSendButton).fadeIn();
            }
        };
        Quill.register('modules/clipboard', Clipboard, true);
    }

    initMentions(){
        const Embed = Quill.import("blots/embed");
        class MessengerMentionBlot extends Embed {
            static create(data) {
                const { denotationChar, value, url, id } = data;
                const node = document.createElement('a');
                node.innerHTML = denotationChar + value;
                node.setAttribute('class', 'bx-mention');
                node.setAttribute('href', url);
                return MessengerMentionBlot.setDataValues(node, { denotationChar, value, id, url });
            }
            static setDataValues(element, data) {
                const domNode = element;
                Object.keys(data).forEach(key => {
                    domNode.dataset[key] = data[key];
                });
                return domNode;
            }
            static value(domNode) {
                return domNode.dataset;
            }
        }

        MessengerMentionBlot.blotName = "MessengerMentionBlot";
        Quill.register(MessengerMentionBlot);

        const sTailWindClasses = $('body').hasClass('bx-artificer') ? ' rounded-md shadow ring-1 ring-gray-200 dark:ring-gray-700 bg-white dark:bg-gray-800' : '';
        return {
            allowedChars: /^[\w]*$/,
            mentionDenotationChars: ["@"],
            positioningStrategy: "fixed",
            dataAttributes: ['url', 'value', 'id'],
            blotName: 'MessengerMentionBlot',
            minChars: 1,
            listItemClass: 'ql-mention-list-item',
            mentionContainerClass: 'ql-mention-list-container bx-popup bx-popup-color-bg bx-popup-border' + sTailWindClasses,
            linkTarget: '_blank',
            renderItem: data => `<span class="bx-def-font-small bx-def-padding-right">${data.value}</span><img src="${data.thumb}" />`,
            renderLoading: () => _t('_bx_messenger_loading'),
            source: function(searchTerm, renderList, mentionChar) {
                if (searchTerm.length)
                    $.get("searchExtended.php?action=get_authors", { term: searchTerm}, oData => {
                            if (Array.isArray(oData) && oData.length){
                                renderList(oData.map((oValue => {
                                    const { value, label, url, thumb } = oValue;
                                    return {id: value, value: label, url, thumb };
                                })));
                            }
                        }
                        ,'json');
            }
        };
    }

    initEditor(){
        const _this = this;
        const Delta = Quill.import('delta');
        this.oEditor = new Quill(this.oHtmlEditorObject, {
                placeholder: this.oPlaceholder,
                theme: 'bubble',
                bounds: this.oHtmlEditorObject,
                debug: 'error',
                modules: Object.assign({
                    toolbar: _this.showToolbar() && _this.aToolbarSettings,
                    clipboard: {
                        matchers: [
                            [
                                'IMG', () => { return { ops: [] } }
                            ],
                            [ Node.ELEMENT_NODE, function(node, delta) {
                                return delta.compose(new Delta().retain(delta.length(),
                                        {
                                            color: false,
                                            background: false,
                                        }
                                    ));
                                }
                            ]
                        ],
                        matchVisual: false
                    },
                    keyboard: {
                        bindings: {
                            enter: {
                                key: 13,
                                shiftKey: false,
                                handler: (range, context) => {
                                    if (!this.onEnter())
                                        return true;
                                }
                            },
                            up: {
                                key: 38,
                                shiftKey: false,
                                handler: () => this.onUp()
                            },
                            esc: {
                                key: 27,
                                shiftKey: false,
                                handler: () => this.onESC()
                            }
                        }
                    }
                }, this.oMentions)
            });

           this.oEditor.on('text-change', function(delta, oldDelta, source) {
                  if (source === 'user')
                        _this.onChange();

           }).on('selection-change', function(range, oldRange, source) {
               if (range && !range.length)
                   _this.onFocus();
                else
                   _this.onBlur();
           })

          this.onInit();
    }
}