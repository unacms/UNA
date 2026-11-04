function bx_ex_editor_init(oEditor, oParams)
{
    $(oParams.selector).after("<div id='" + oParams.name + "' class='" + oParams.name + " bx-def-font-inputs bx-form-input-textarea bx-form-input-html bx-form-input-html-editor mt-px text-gray-700 dark:text-gray-300  w-full p-4  ring-1 ring-gray-300 dark:ring-gray-700 dark:focus:placeholder-700 bg-gray-50 dark:bg-gray-900/50 placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:placeholder-gray-300 dark:focus:placeholder-gray-700  focus:text-gray-900 dark:focus:text-gray-100 text-base border-0 flex-wrap" + oParams.css_class + "'></div>" );
    
    $(oParams.selector).hide();
    
    var oImage = {
        class: ImageTool,
            config: {
            field: 'file',    
            uploader: {
              uploadByFile(file){
                    return new Promise((resolve, reject) => {
                        const formData = new FormData();
                        formData.append("file", file);
                        if (oParams.upload_token)
                            formData.append("ut", oParams.upload_token);
                        fetch(oParams.root_url + "storage.php?o=sys_images_editor&t=sys_images_editor&a=upload", {
                                method: "POST",
                                body: formData
                            }
                        )
                        .then(response => response.json())
                        .then(result => {
                            if ('undefined' != typeof(result.link))
                                resolve({
                                    success: 1,
                                    file: {
                                        url: result.link,
                                    }
                                });
                            else
                                reject("Upload failed");
                        })
                        .catch(error => {
                            reject("Upload failed");
                        });
                    });    
              },

              uploadByUrl(url){
                  return new Promise((resolve, reject) => {
                      resolve({
                        success: 1,
                        file: {
                            url: url,
                        }
                      });
                  });
              }
            }    
        }
    };
    
    var oTools = {
        paragraph: {
          class: Paragraph,
          inlineToolbar: true,
        },
        mention: BxMention,
        marker: Marker,
        inlineCode: InlineCode,
    };

    if (oParams.toolbar){
        oParams.toolbar.forEach(function(item){
            switch(item) {
                case 'header':
                    oTools.header = Header;
                    break;

                case 'list':
                    oTools.list = List;
                    break;

                case 'image':
                    oTools.image = oImage;
                    break;

                case 'embed':
                    oTools.embedblock = BxEmbedBlock;
                    break;

                case 'code':
                    oTools.code = CodeTool;
                    break;

                case 'delimiter':
                    oTools.delimiter = Delimiter;
                    break;
            }
        })
    }
    oEditor = new EditorJS({
        holder : document.getElementById(oParams.name),
        inlineToolbar: oParams.toolbar_inline.concat(['mention']),
        tools: oTools,
        onReady: () => {
            if ($(oParams.selector).val() != ''){
               
                const doc = new DOMParser().parseFromString($(oParams.selector).val(), "text/html");
                var a = doc.getElementsByClassName('bx-embed-link');
                Array.prototype.forEach.call(a, function(i) {
                    i.innerHTML = i.getAttribute('source');
                });
                
                oEditor.blocks.renderFromHTML(doc.documentElement.getElementsByTagName('body')[0].innerHTML);
            }
        },
        onChange:() =>{
            oEditor.save().then((savedData) =>{
                const edjsParser = edjsHTML({embedblock: bx_ex_editor_custom_parser_embedblock});
                oData = edjsParser.parse(savedData);
                var s ='';
                oData.forEach(function(item){
                    s += item;
                })
                
                $(oParams.selector).val(s);
                
                bx_editor_on_space_enter (s, oParams.selector);
                
            }).catch((error) =>{
                console.log("error", error)
            })  
        }
    }); 

    tribute = new Tribute({
        collection: [
            {
                selectTemplate: function(item) {
                    if (this.range.isContentEditable(this.current.element)) {
                        return ('<a class="bx-mention-link" title="' + item.original.label + '" dchar="@" data-profile-id="' + item.original.value + '" href="' + item.original.url + '">@' + item.original.label + '</a>');
                    }
                    return "@" + item.original.value;
                },
                values: function (text, cb) {
                    $.getJSON(oParams.root_url + "/searchExtended.php?action=get_mention&symbol=%40&", {term: text}, function(data) {
                        cb(data);
                    });
                },
                lookup: "label",
                fillAttr: "label"
            },
            {
                trigger: "#",
                selectTemplate: function(item) {
                    if (this.range.isContentEditable(this.current.element)) {
                        return ('<a class="bx-mention-link" title="' + item.original.label + '" dchar="#" data-profile-id="' + item.original.value + '" href="' + item.original.url + '">#' + item.original.label + '</a>');
                    }
                    return "#" + item.original.value;
                },
                values: function (text, cb) {
                    $.getJSON(oParams.root_url + "/searchExtended.php?action=get_mention&symbol=%23&", {term: text}, function(data) {
                        cb(data);
                    });
                },
                lookup: "label",
                fillAttr: "label"
            }
        ]
    })
    tribute.attach(document.getElementById(oParams.name));
    
    document.getElementById(oParams.name).removeAttribute("contenteditable");
}


function bx_ex_editor_custom_parser_embedblock(block)
{
    if (block.data && block.data.source)
        return '<div class="bx-embed-link" source="' + block.data.source + '"></div>';
}

var oLink ='';

class BxEmbedBlock {
    constructor({ data, block }){
        this.blockAPI = block

        this.nodes = {
            linkContent: null,
        };
        if (this.data && this.data.source)
            this.source = data.source;
        
        this.wrapper = undefined;
        this.data = data;    
    }
    
    static get toolbox() {
        return {
          title: 'Embed',
          icon: '<svg width="19" height="13" viewBox="0 0 19 13"><path d="M18.004 5.794c.24.422.18.968-.18 1.328l-4.943 4.943a1.105 1.105 0 1 1-1.562-1.562l4.162-4.162-4.103-4.103A1.125 1.125 0 1 1 12.97.648l4.796 4.796c.104.104.184.223.239.35zm-15.142.547l4.162 4.162a1.105 1.105 0 1 1-1.562 1.562L.519 7.122c-.36-.36-.42-.906-.18-1.328a1.13 1.13 0 0 1 .239-.35L5.374.647a1.125 1.125 0 0 1 1.591 1.591L2.862 6.341z"></path></svg>'
        };
    }

     render() {
        this.wrapper = document.createElement('p');
        if (this.data && this.data.source){
            this._createEmbed(this.data.source);
            return this.wrapper;
        }
         else{
             this._createInput();
         }

         return this.wrapper; 
    }
    
    _createEmbed(sLink){
        var oObj = document.createElement('div');
        oObj.setAttribute('source', sLink)
        oObj.className = 'bx-embed-link';
        this.wrapper.removeChild(this.wrapper.querySelector('input'));
        this.wrapper.appendChild(oObj);
        this.blockAPI.dispatchChange();
    }
    
     _createInput(){
        var oObj = document.createElement('input');
        oObj.className = 'bx-def-font-inputs bx-form-input-text';
        oObj.setAttribute('placeholder', _t('_bx_editor_embed_popup_header'));
        oObj.addEventListener('blur', (event) => {
            if (oObj.value != ''){
                this._createEmbed(oObj.value);
            }
        });
        this.wrapper.appendChild(oObj);
    }
   
    save(blockContent){
        const div = blockContent.querySelector('div');
        if (div){
            return {
                source: div.getAttribute('source')
            }
        }
    }
   
    static get pasteConfig() {
        return {
            tags: ['DIV'],
        }
    }
    
    onPaste(event) {
        if (event.detail.data.attributes.source){
            var sSource = event.detail.data.attributes.source.nodeValue;
            this._createEmbed(sSource);
            this.data.source = sSource;
        }
    }
    
    static get sanitize(){
        return {
            url: true, // disallow HTML
        }
    }
    
    validate(savedData) {

        return true;
    }
}

class BxMention {

    static get CSS() {
        return 'bx-mention-link';
    };

    constructor({api}) {
        this.api = api;

        this.button = null;

        this.tag = 'a';

        this.iconClasses = {
          base: this.api.styles.inlineToolButton,
          active: this.api.styles.inlineToolButtonActive
        };
    }

    static get isInline() {
        return true;
    }

    render() {
        return;
    }
    
    surround(range) {
        if (!range) {
            return;
        }

        let termWrapper = this.api.selection.findParentTag(this.tag, BxMention.CSS);

        if (termWrapper) {
            this.unwrap(termWrapper);
        } else {
            this.wrap(range);
        }
    }

    wrap(range) {
        let marker = document.createElement(this.tag);

        marker.classList.add(BxMention.CSS);

        marker.appendChild(range.extractContents());
        range.insertNode(marker);

        this.api.selection.expandToTag(marker);
    }

    unwrap(termWrapper) {
        this.api.selection.expandToTag(termWrapper);

        let sel = window.getSelection();
        let range = sel.getRangeAt(0);

        let unwrappedContent = range.extractContents();

        termWrapper.parentNode.removeChild(termWrapper);

        range.insertNode(unwrappedContent);

        sel.removeAllRanges();
        sel.addRange(range);
    }
    
    checkState() {
        const termTag = this.api.selection.findParentTag(this.tag, BxMention.CSS);

        this.button.classList.toggle(this.iconClasses.active, !!termTag);
    }
    
    get toolboxIcon() {
        return require('./../assets/icon.svg').default;
    }
    
    static get sanitize() {
        return {
            a: function(el) {
                return {
                  class: BxMention.CSS,
                  href: el.getAttribute('href'),
                  'data-profile-id': el.getAttribute('data-profile-id'),
                  title: el.getAttribute('title'),
                  dchar: el.getAttribute('dchar')
                }
            }
        };
    }
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
            if (typeof glOnSpaceEnterInEditor[i] === "function") {;                                             
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
