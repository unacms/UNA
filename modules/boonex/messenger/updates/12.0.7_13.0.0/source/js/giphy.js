/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup	Messenger Messenger
 * @ingroup	UnaModules
 * @{
 */

/**
 * Giphy integration
 */

;window.oMessengerGiphy = class {
    constructor(oOptions) {
        this.sGiphyItems = '.bx-messenger-giphy-items';
        this.sGiphySendArea = '#bx-messenger-send-area-giphy';
        this.sGiphMain = '.giphy';
        this.sGiphyBlock = '.bx-messenger-giphy';
        this.sGiphyScroll = '.bx-messenger-giphy-scroll';
    }

    init(sSelector = '') {
        let iTotal = 0, iScrollPosition = 0;

        const _this = this,
            oContainer = $(`${sSelector}${this.sGiphyItems}`),
            oScroll = $(`${sSelector}.bx-messenger-giphy-scroll`),
            fInitVisibility = (sType, sValue) => {
                let stopLoading = false;
                oScroll.on('scroll', (e) => {
                    const { scrollLeft,  scrollWidth, clientWidth} = e.currentTarget;
                    const iItems = $('picture', oContainer).length;
                    const scrollLeftMax = scrollWidth - clientWidth;
                    let	bPassed = scrollLeft >= scrollLeftMax*0.6; // 60% passed
                    iScrollPosition = scrollLeft;

                    if (!bPassed || (iTotal && iItems && iItems >= iTotal))
                        return;

                    if (!stopLoading) {
                        stopLoading = true;
                        fGiphy(sType, sValue, () => setTimeout(() => {
                            stopLoading = false;
                            oScroll.scrollLeft(iScrollPosition);
                        }, 0));
                    }
                });
            },
            fGiphy = (sType, sValue, fCallback) => {
                const fHeight = oContainer.height();
                $('div.search', `${sSelector}${_this.sGiphyBlock}`).addClass('loading');
                $.get('modules/?r=messenger/get_giphy', {
                        height: fHeight,
                        action: sType,
                        filter: sValue,
                        start: $('picture', oContainer).length
                    }, function (oData) {
                        iTotal = oData.total;

                        oContainer
                            .append(
                                oData.code
                                    ? oData.message
                                    : oData.html
                            )
                            .setRandomBGColor();

                        $('div.search', `${sSelector}${_this.sGiphyBlock}`).removeClass('loading');
                        if (typeof fCallback === 'function')
                            fCallback(sType, sValue);
                    },
                    'json');
            };

        if ($(`${sSelector}${_this.sGiphMain}`).css('visibility') === 'visible') {
            let iTimer = 0;
            $('input', `${sSelector}${_this.sGiphMain}`).keypress(function (e) {
                clearTimeout(iTimer);
                iTimer = setTimeout(() => {
                    iScrollPosition = 0;
                    iTotal = 0;
                    oContainer.html('');
                    oScroll.scrollLeft(0);
                    const sFilter = $(this).val();
                    fGiphy(sFilter && 'search', sFilter, fInitVisibility);

                }, 1000);
                return true;
            }).on('keydown', function (e) {
                if (e.keyCode === 8 || e.keyCode === 46)
                    $(this).trigger('keypress');
            });

            if (oContainer && !oContainer.find('img').length) {
                fGiphy(undefined, undefined, fInitVisibility);
            }
        }
    };

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
        }
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

        const sTailWindClasses = $('body').hasClass('bx-artificer') ? ' rounded-md shadow  ring-1 ring-gray-200 dark:ring-gray-700 bg-white dark:bg-gray-800' : '';
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
                            ]
                        ],
                        matchVisual: false
                    },
                    keyboard: {
                        bindings: {
                            enter: {
                                key: 13,
                                shiftKey: false,
                                handler: () => this.onEnter()
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