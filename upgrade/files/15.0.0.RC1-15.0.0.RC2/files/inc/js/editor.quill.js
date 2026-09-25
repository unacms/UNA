/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */
function bx_editor_init(oParams) {
    var oEditor = null;

    hljs.configure({   
        languages: ['javascript', 'php', 'html', 'css']
    });

    bEmptyToolbar = oParams.toolbar == false ? true : false;
    
    if (oParams.query_params == undefined)
        oParams.query_params = {};

    oParams.toolbar = {
        container: bEmptyToolbar ? [] : oParams.toolbar,
            handlers: {
            'show-html': function() {
                 bx_alert('<textarea class="bx-def-font-inputs bx-form-input-textarea bx-form-input-html-quill-code" id="' + oParams.name + '_code">' + oEditor.container.firstChild.innerHTML + '</textarea>',function() {
                     oEditor.container.firstChild.innerHTML = $('#'+oParams.name+'_code').val();
                 });
            },  
            'embed': function(value) {
                var range = oEditor.getSelection();
                bx_prompt(_t('_sys_txt_quill_tooltip_embed_popup_header'), '', function(oPopup){
                    sLink = $(oPopup).find("input[type = 'text']").val()
                    $.getJSON(oParams.root_url + 'embed.php?', {a: 'get_link', l: sLink}, function(aData){
                        if (range) {
                            oEditor.clipboard.dangerouslyPasteHTML(range.index, "</p>&#8205; <p>&#8205; </p>", 'api');
                            oEditor.insertEmbed(range.index+2, 'embed-link', {source: sLink, inlinecode : aData.code}, 'api');
                        }
                        else{
                            oEditor.insertEmbed(0, 'embed-link', {source: sLink, inlinecode : aData.code}, 'api');
                        }
                            
                        if ($(oParams.selector).next().next().find('.bx-embed-link a[href="' + aData.link + '"]').length > 0)
                            bx_embed_link($(oParams.selector).next().next().find('.bx-embed-link a[href="' + aData.link + '"]')[0]);
                        else
                            bx_embed_link();
                    });
                });
            },
            'link': function(value) {
                if (value) {
                    var range = oEditor.getSelection();
                    bx_prompt(_t('_sys_txt_quill_tooltip_link_popup_header'), '', function(oPopup){
                        var sLink = $(oPopup).find("input[type = 'text']").val();
                        if (range) {
                            if (range.length > 0){
                                oEditor.format('link', sLink);
                            }
                            else{
                                oEditor.insertText(range.index, sLink, 'link', sLink);
                            }
                        }
                        else{
                            oEditor.insertText(0, sLink, 'link', sLink);
                        }
                    });
                } else {
                    oEditor.format('link', false);
                }
            }
        }
    }
    
    sVal = $(oParams.selector).val();    
    if(!oParams.empty_tags){
        sVal = sVal.replaceAll('<p><br></p>','');    
    }
    $(oParams.selector).after("<div id='" + oParams.name + "' class='bx-def-font-inputs bx-form-input-textarea bx-form-input-html bx-form-input-html-quill " + oParams.css_class + "'>" + sVal + "</div>" );
    
    $(oParams.selector).hide();
    
    $(oParams.selector).attr('object_editor', oParams.name);
                
    if (typeof bQuillRegistred === 'undefined' ) {
        
        var Embed = Quill.import('blots/embed');
        
        const BaseLink = Quill.import("formats/link");
        class Link extends BaseLink {
            format(name, value) {
                if (["href", "target"].indexOf(name) > -1) {
                    if (value) {
                        this.domNode.setAttribute(name, value);
                    } else {
                        this.domNode.removeAttribute(name);
                    }
                } else {
                    super.format(name, value);
                    if (name == 'link'){
                        if (value){
                            if (!value.startsWith(oParams.root_url) && (value.startsWith('http://') || value.startsWith('https://'))){
                                this.domNode.setAttribute("target", "_blank");  
                            }
                            else{
                                this.domNode.removeAttribute('target');
                            }
                        }
                    }
                }
            }
            static create(value) {
                const node = super.create(value);
                node.setAttribute("href", this.sanitize(value));
                if (!value.startsWith(oParams.root_url) && (value.startsWith('http://') || value.startsWith('https://'))){
                    node.setAttribute("target", "_blank");  
                }
                else{
                    node.removeAttribute('target');
                }
                return node;
            }
        }
        Quill.register(Link, true);
        
        class MenthionLink extends Embed {
            static create(value) {
                let node = super.create(value);
                if (value.id && value.value){
                    
                    node.setAttribute('href', value.id);
                    node.innerHTML = value.denotationChar + value.value;
                    node.setAttribute('title', value.value);
                    node.setAttribute('dchar', value.denotationChar);
                    node.setAttribute('data-profile-id', value.dataProfileId);
                }
                if (value.url && value.title && value.dataProfileId){
                    node.setAttribute('href', value.url);
                    node.innerHTML = value.text;
                    node.setAttribute('title', value.title);
                    if (value.dchar)
                        node.setAttribute('dchar', value.dchar);
                    else
                        node.setAttribute('dchar', '@');
                    node.setAttribute('data-profile-id', value.dataProfileId);
                }

                const sDenotationChar = node.getAttribute('dchar');
                if(sDenotationChar == '@')
                    node.setAttribute('class', 'bx-mention-link');
                else if(sDenotationChar == '#')
                    node.setAttribute('class', 'bx-tag-link');

                return node;
            }

            format(name, value) {
                if (name === 'href' || name === 'title' || name === 'dchar' || name === 'data-profile-id' || name === 'dataProfileId') {
                    if (value) {
                        if (name === 'dchar'){
                            this.domNode.innerHTML = value + this.domNode.getAttribute('title');
                        }
                        if (name === 'dataProfileId'){
                            this.domNode.setAttribute('data-profile-id', value);
                        }
                        else{
                            this.domNode.setAttribute(name, value);
                        }
                    } else {
                        this.domNode.removeAttribute(name, value);
                    }
                } 
                else {
                    super.format(name, value);
                }
            };
            
            static value(node) {
                return { url: node.getAttribute('href') ,title: node.getAttribute('title'), dchar: node.getAttribute('dchar'), dataProfileId: node.getAttribute('data-profile-id'), text: node.innerText }
            }
                
            static formats(node) {
                let format = {};
                if (node.hasAttribute('href')) {
                    format.href = node.getAttribute('href');
                }
                if (node.hasAttribute('title')) {
                    format.title = node.getAttribute('title');
                }
                else{
                     format.title = node.innerText.replace(node.getAttribute('dchar'), '');
                }
                if (node.hasAttribute('dchar')) {
                    format.dchar = node.getAttribute('dchar');
                }
                if (node.hasAttribute('data-profile-id')) {
                    format['data-profile-id'] = node.getAttribute('data-profile-id');
                }
                if (node.hasAttribute('dataProfileId')) {
                    format.dataProfileId = node.getAttribute('dataProfileId');
                }
                return format;
            }  
            
        }
        MenthionLink.blotName = 'menthion-link'; 
        //MenthionLink.className = '1';
        MenthionLink.tagName = 'a';                
        Quill.register({
            'formats/menthion-link': MenthionLink
        });
        
        class EmbedCode extends Embed {
            static create(value) {
                let node = super.create(value);
                if (value.source && value.inlinecode){
                    node.setAttribute('source', value.source);
                    node.innerHTML = value.inlinecode + "&nbsp;";
                    return node;
                }
                return node;
            };
           
            format(name, value) {
                if (name === 'source') {
                    if (value) {
                        this.domNode.setAttribute(name, value);
                    } else {
                        this.domNode.removeAttribute(name, value);
                    }
                } 
                else {
                    super.format(name, value);
                }
            };
            
            static value(node) {
                return { source: node.getAttribute('source'), inlinecode: "emded"}
            }
                
            static formats(node) {
                let format = {};
                if (node.hasAttribute('source')) {
                  format.source = node.getAttribute('source');
                }
                return format;
            }    
        }
        EmbedCode.className = 'bx-embed-link';
        EmbedCode.blotName = 'embed-link'; 
        EmbedCode.tagName = 'div';                
        Quill.register({
            'formats/embed-link': EmbedCode
        });
        
        var AlignStyle = Quill.import('attributors/style/align');
        Quill.register(AlignStyle, true);
        
        var DirectionStyle = Quill.import('attributors/style/direction');
        Quill.register(DirectionStyle, true);
        
        const ImageFormatAttributesList = [
            'alt',
            'height',
            'width',
            'style'
        ];

        const BaseImageFormat = Quill.import('formats/image');
        class ImageFormat extends BaseImageFormat {
            
            static formats(domNode) {
                return ImageFormatAttributesList.reduce(function(formats, attribute) {
                    if (domNode.hasAttribute(attribute)) {
                        formats[attribute] = domNode.getAttribute(attribute);
                    }
                    return formats;
                }, {});
            }

            format(name, value) {
                if (ImageFormatAttributesList.indexOf(name) > -1) {
                    if (value) {
                        this.domNode.setAttribute(name, value);
                    } else {
                        this.domNode.removeAttribute(name);
                    }
                } else {
                    super.format(name, value);
                }
            }
        }

        Quill.register(ImageFormat, true);
        
        const Parchment = Quill.import("parchment");
        const pixelLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
        const TAB_MULTIPLIER = 30

        class IndentAttributor extends Parchment.Attributor.Style {
            add(node, value) {
                return super.add(node, `${+value * TAB_MULTIPLIER}px`)
            }
            value(node) {
                return parseFloat(super.value(node)) / TAB_MULTIPLIER || undefined // Don't return NaN
            }
        }

        const IndentStyle = new IndentAttributor("indent", "margin-left", {
            scope: Parchment.Scope.BLOCK,
            whitelist: pixelLevels.map(value => `${value * TAB_MULTIPLIER}px`),
        })

        Quill.register({"formats/indent": IndentStyle}, true);
        
        bQuillRegistred = true; 
        
        var icons = Quill.import('ui/icons');
        icons['embed'] = '<svg class="fr-svg" focusable="false" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path class="ql-fill" d="M20.73889,15.45929a3.4768,3.4768,0,0,0-5.45965-.28662L9.5661,12.50861a3.49811,3.49811,0,0,0-.00873-1.01331l5.72174-2.66809a3.55783,3.55783,0,1,0-.84527-1.81262L8.70966,9.6839a3.50851,3.50851,0,1,0,.0111,4.63727l5.7132,2.66412a3.49763,3.49763,0,1,0,6.30493-1.526ZM18.00745,5.01056A1.49993,1.49993,0,1,1,16.39551,6.3894,1.49994,1.49994,0,0,1,18.00745,5.01056ZM5.99237,13.49536a1.49989,1.49989,0,1,1,1.61194-1.37878A1.49982,1.49982,0,0,1,5.99237,13.49536Zm11.78211,5.494a1.49993,1.49993,0,1,1,1.61193-1.37885A1.49987,1.49987,0,0,1,17.77448,18.98932Z"></path></svg>';
        icons['show-html'] = '<svg class="fr-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path class="ql-fill" d="M162.1 257.8c-7.812-7.812-20.47-7.812-28.28 0l-48 48c-7.812 7.812-7.812 20.5 0 28.31l48 48C137.8 386.1 142.9 388 148 388s10.23-1.938 14.14-5.844c7.812-7.812 7.812-20.5 0-28.31L128.3 320l33.86-33.84C169.1 278.3 169.1 265.7 162.1 257.8zM365.3 93.38l-74.63-74.64C278.6 6.742 262.3 0 245.4 0H64C28.65 0 0 28.65 0 64l.0065 384c0 35.34 28.65 64 64 64H320c35.2 0 64-28.8 64-64V138.6C384 121.7 377.3 105.4 365.3 93.38zM336 448c0 8.836-7.164 16-16 16H64.02c-8.838 0-16-7.164-16-16L48 64.13c0-8.836 7.164-16 16-16h160L224 128c0 17.67 14.33 32 32 32h79.1V448zM221.9 257.8c-7.812 7.812-7.812 20.5 0 28.31L255.7 320l-33.86 33.84c-7.812 7.812-7.812 20.5 0 28.31C225.8 386.1 230.9 388 236 388s10.23-1.938 14.14-5.844l48-48c7.812-7.812 7.812-20.5 0-28.31l-48-48C242.3 250 229.7 250 221.9 257.8z"/></svg>';
    }
    
    var oConfig = {              
         theme: oParams.skin,
         modules: {
            clipboard: {
                matchVisual: false
            },
            syntax: true, 
            imageResize: {},
            toolbar: oParams.toolbar,
            "emoji-toolbar": true,
            mention: {
                allowedChars: /^[\S]*$/,
                mentionDenotationChars: ["@", "#"],
                showDenotationChar: true,
                blotName: 'menthion-link',
                mentionContainerClass: 'bx-popup bx-popup-trans bx-popup-border bx-popup-color-bg',
                mentionListClass: 'ql-mention-list bx-menu-ver',
                dataAttributes: ['id', 'value', 'denotationChar', 'link', 'target','disabled', 'dataProfileId'], 
                listItemClass: 'bx-menu-item bx-def-color-bg-hl-hover',
                source: function (searchTerm, renderList, mentionChar) {
                    var aFlds = oParams.query_params['fi'].split(",");
                    aFlds.forEach(fld => {
                        oParams.query_params[fld] = $('#' + oParams.query_params['f'] + ' [name="' + fld + '"]').val()
                    });
                        
                    $.getJSON(oParams.root_url + 'searchExtended.php?action=get_mention', $.extend({}, {symbol: mentionChar, term: searchTerm}, oParams.query_params), function(data){
                        renderList(data, searchTerm);
                    });
                },
                renderItem: function(item, searchTerm){
                    item.id = item.url;
                    item.dataProfileId = item.value;
                    item.value = item.label;
                    return item.symbol + item.value;
                },
                onSelect: function(item, insertItem){
                    insertItem(item, false)
                }
            },
        }
    };
    
    if (oParams.allowed_tags){
        oConfig.formats = oParams.allowed_tags;
    }

    if(!Quill.imports['modules/imageUploader'])
        Quill.register('modules/imageUploader', ImageUploader);

    oConfig.modules.imageUploader = {
        upload: file => {
            return new Promise((resolve, reject) => {
                var bProcessed = false;
                
                if (typeof glOnInsertImageInEditor !== 'undefined' && glOnInsertImageInEditor instanceof Array && glOnInsertImageInEditor.length > 0) {
                    for (var i = 0; i < glOnInsertImageInEditor.length; i++) {
                        if (typeof glOnInsertImageInEditor[i] === "function") {
                            var bTmp = glOnInsertImageInEditor[i](file,oParams.selector);
                            if (bTmp)
                                bProcessed = true;
                        }
                    }
                    if(bProcessed)
                        reject("External uploader");
                }
                
                if(!bProcessed){
                    const formData = new FormData();
                   
                    formData.append("file", file);
                    fetch(oParams.root_url + "storage.php?o=sys_images_editor&t=sys_images_editor&a=upload", {
                            method: "POST",
                            body: formData
                        }
                    )
                    .then(response => response.json())
                    .then(result => {
                        if ('undefined' != typeof(result.link))
                            resolve(result.link);
                        else
                            reject("Upload failed");
                    })
                    .catch(error => {
                        reject("Upload failed");
                    });
                }
            });
        }
    }

    oEditor = new Quill('#' + oParams.name, oConfig)
    $(oParams.selector).next().find('button.ql-bold').attr('title', _t('_sys_txt_quill_tooltip_bold'));
    $(oParams.selector).next().find('button.ql-italic').attr('title', _t('_sys_txt_quill_tooltip_italic'));
    $(oParams.selector).next().find('button.ql-underline').attr('title', _t('_sys_txt_quill_tooltip_underline'));
    $(oParams.selector).next().find('button.ql-clean').attr('title', _t('_sys_txt_quill_tooltip_clean'));
    $(oParams.selector).next().find('button.ql-list[value = "ordered"]').attr('title', _t('_sys_txt_quill_tooltip_list_ordered'));
    $(oParams.selector).next().find('button.ql-list[value = "bullet"]').attr('title', _t('_sys_txt_quill_tooltip_list_bullet'));
    $(oParams.selector).next().find('button.ql-indent[value = "-1"]').attr('title', _t('_sys_txt_quill_tooltip_indent_1'));
    $(oParams.selector).next().find('button.ql-indent[value = "+1"]').attr('title', _t('_sys_txt_quill_tooltip_indent_2'));
    $(oParams.selector).next().find('button.ql-blockquote').attr('title', _t('_sys_txt_quill_tooltip_blockquote'));
    $(oParams.selector).next().find('button.ql-direction').attr('title', _t('_sys_txt_quill_tooltip_direction'));
    $(oParams.selector).next().find('button.ql-script[value="sub"]').attr('title', _t('_sys_txt_quill_tooltip_script_sub'));
    $(oParams.selector).next().find('button.ql-script[value="super"]').attr('title', _t('_sys_txt_quill_tooltip_script_super'));
    $(oParams.selector).next().find('button.ql-link').attr('title', _t('_sys_txt_quill_tooltip_link'));
    $(oParams.selector).next().find('button.ql-image').attr('title', _t('_sys_txt_quill_tooltip_image'));
    $(oParams.selector).next().find('button.ql-code-block').attr('title', _t('_sys_txt_quill_tooltip_code_block'));
    $(oParams.selector).next().find('button.ql-embed').attr('title', _t('_sys_txt_quill_tooltip_embed'));
    $(oParams.selector).next().find('button.ql-emoji').attr('title', _t('_sys_txt_quill_tooltip_emoji'));
    $(oParams.selector).next().find('button.ql-show-html').attr('title', _t('_sys_txt_quill_tooltip_show_html'));
    $(oParams.selector).next().find('span.ql-color .ql-picker-label').attr({'title': _t('_sys_txt_quill_tooltip_color'), 'aria-label': _t('_sys_txt_quill_tooltip_color')});
    $(oParams.selector).next().find('span.ql-background .ql-picker-label').attr({'title': _t('_sys_txt_quill_tooltip_background'), 'aria-label': _t('_sys_txt_quill_tooltip_background')});
    $(oParams.selector).next().find('span.ql-align .ql-picker-label').attr({'title': _t('_sys_txt_quill_tooltip_align'), 'aria-label': _t('_sys_txt_quill_tooltip_align')});
    //--- a mini toolbar renders alignment as four separate buttons rather than one picker
    $(oParams.selector).next().find('button.ql-align[value=""]').attr('title', _t('_sys_txt_quill_tooltip_align_left'));
    $(oParams.selector).next().find('button.ql-align[value="center"]').attr('title', _t('_sys_txt_quill_tooltip_align_center'));
    $(oParams.selector).next().find('button.ql-align[value="right"]').attr('title', _t('_sys_txt_quill_tooltip_align_right'));
    $(oParams.selector).next().find('button.ql-align[value="justify"]').attr('title', _t('_sys_txt_quill_tooltip_align_justify'));
    $(oParams.selector).next().find('span.ql-header .ql-picker-label').attr({'title': _t('_sys_txt_quill_tooltip_header'), 'aria-label': _t('_sys_txt_quill_tooltip_header')});

    //--- quill-mention points aria-owns at its list, but only inserts that list into the document when
    //--- the list opens, so the reference dangles and every page with an editor reports an invalid
    //--- ARIA value. The editor is not a combobox, so the attribute has nothing to say here.
    $('#' + oParams.name).find('.ql-editor').addClass('bx-def-vanilla-html').removeAttr('aria-owns');

    if (bEmptyToolbar)
        $(oParams.selector).next().hide();

    oEditor.clipboard.addMatcher (Node.TEXT_NODE, function (node, delta) {
        const Delta = Quill.import('delta')
        bx_editor_on_space_enter(node.data, oParams.selector, false);
        return delta; 
    });
    
    if (oParams.insert_as_plain_text) {
        oEditor.clipboard.addMatcher (Node.ELEMENT_NODE, function (node, delta) {
            let ops = []
            delta.ops.forEach(op => {
                if (op.insert && typeof op.insert === 'string') {
                    ops.push({
                        insert: op.insert
                    })
                }
            })
            delta.ops = ops
            return delta
        });
    }
    else{
        oEditor.clipboard.addMatcher (Node.ELEMENT_NODE, function (node, delta) {
            delta.forEach(e => {
                //if(typeof e.insert == 'string' && e.attributes == null)
                //    e.insert = e.insert.replace(/\n/g, '') + "\n";

                if(e.attributes){
                    e.attributes.color = '';
                    e.attributes.background = '';
                }
            });
            return delta;
        });
    }

    oEditor.keyboard.addBinding({
        key: ' ',
        handler: function(range, context) {
            bx_editor_on_space_enter (oEditor.container.firstChild.innerHTML, oParams.selector);
            return true;
        }
    });
    
   oEditor.container.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' || event.keyCode === 13) {
             bx_editor_on_space_enter (oEditor.container.firstChild.innerHTML, oParams.selector);
        }
    });
    
    oEditor.on('editor-change', function(delta, oldDelta, source) {
        sVal = oEditor.container.firstChild.innerHTML;
        if(!oParams.empty_tags){
            sVal = sVal.replaceAll('<p><br></p>','');
        }
        if ((oEditor.getContents()['ops'] || []).length == 1 && oEditor.getText().trim().length === 0) { 
            sVal = '' 
        }
        $(oParams.selector).val(sVal); 
    });

    return oEditor
}
    
function bx_editor_activate(oEditor)
{
    oEditor.focus();
}

function bx_editor_insert_html (sEditorId, sImgId, sHtml) 
{
    if ($('#' + sEditorId) &&  $('#' + sEditorId).attr('object_editor')) {
        eval ('oEditor = ' + $('#' + sEditorId).attr('object_editor'));
        if (oEditor.getSelection())
            oEditor.clipboard.dangerouslyPasteHTML(oEditor.getSelection().index, sHtml, 'api');
        else
            oEditor.clipboard.dangerouslyPasteHTML(0, sHtml, 'api');
    }
}

function bx_editor_insert_img (sEditorId, sImgId, sImgUrl, sClasses) 
{
    if ('undefined' == typeof(sClasses))
        sClasses = '';

    bx_editor_insert_html(sEditorId, sImgId, '<img id="' + sImgId + '" class="' + sClasses + '" src="' + sImgUrl + '" />')
}

function bx_editor_on_space_enter (sCode, sEditorId, bSpace = true)
{
    if (typeof glBxEditorOnSpaceEnterTimer !== 'undefined')
        clearTimeout(glBxEditorOnSpaceEnterTimer);

    if (bSpace)
        glBxEditorOnSpaceEnterTimer = setTimeout(bx_editor_on_space_enter_in, 500, sCode, sEditorId);
    else
        bx_editor_on_space_enter_in(sCode, sEditorId);
}

function bx_editor_on_space_enter_in(sCode, sEditorId) {
    glBxEditorOnSpaceEnterTimer = undefined;
    if (typeof glOnSpaceEnterInEditor !== 'undefined' && glOnSpaceEnterInEditor instanceof Array) {
        for (var i = 0; i < glOnSpaceEnterInEditor.length; i++) {
            if (typeof glOnSpaceEnterInEditor[i] === "function") {
                glOnSpaceEnterInEditor[i](sCode, sEditorId);
            }
        }
    }
}

function bx_editor_remove_img (aEditorIds, aMarkers) 
{
    for (var i = 0; i < aEditorIds.length; i++) {
        var eEditor = $('#' + $('#' + aEditorIds[i]).attr('object_editor'));
        // delete images in html editor
        for (var k = 0; k < aMarkers.length; k++) {
            var jFiles = eEditor.find(aMarkers[k]);
            jFiles.each(function () {
                $(this).remove(); 
            });
        }
    }
}

/** @} */
