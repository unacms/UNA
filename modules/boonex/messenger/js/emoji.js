/**
 * Options list https://github.com/missive/emoji-mart#options--props
 * @type {{init: Window.oMessengerEmoji.init}}
 */

window.oMessengerEmoji = (function($){
   const { emojiPopup, emojiComponent} = window.oMessengerSelectors.EMOJI,
         oPickerOptions = { onEmojiSelect: console.log, onClickOutside: function(e){
         const { sendEmojiButton, reactionButton } = window.oMessengerSelectors.EMOJI,
             { jotLineMenu } = window.oMessengerSelectors.JOT;

           if ($(emojiComponent).is(':visible') && !$(e.target).closest(`${sendEmojiButton},${reactionButton},${jotLineMenu}`).length)
               $(emojiComponent).hide();
   }, theme: 'buk'};

    let oPicker = null,
        oLangs = null,
        oSets = null;

   $.fn.attacheEmoji = function(fCallback){
        const _this = this;

        if (typeof fCallback === 'function')
            _this.on('click', (e) => fCallback(e));
   };

   const initEmojiConfig = async (oOptions) => {
       if (oLangs === null) {
           const oLang = await fetch(`modules/boonex/messenger/js/emoji/data/i18n/${oOptions['lang']}.json`);
           if (!oLang.ok)
               throw new Error(`Error: emoji language is not found: ${oLang.status}. Please check boonex/messenger/js/emoji/data/i18n/ folder in order to find ${oOptions['lang']}.json file`);
           else
               oLangs = await oLang.json();
       }

       if (oSets === null) {
           const oSet = await fetch(`modules/boonex/messenger/js/emoji/data/set/${oOptions['set']}.json`);
           if (!oSet.ok)
              throw new Error(`Error: emoji sets file is not found: ${oSet.status}. Please check messenger/js/emoji/data/set folder in order to find ${oOptions['set']}.json file`);
           else
              oSets = await oSet.json();
       }

     return { data: oSets, i18n: oLangs };
   };

   return {
       init: (oOptions) => {
           if ($(emojiComponent).length)
               return false;

           if (typeof oOptions['lang'] === 'undefined')
               oOptions['lang'] = 'en';

           if (typeof oOptions['onEmojiSelect'] === 'function')
               oPickerOptions.onEmojiSelect = (oEmoji) => {
                   $(oPicker).hide();
                   return oOptions['onEmojiSelect'](oEmoji);
               };

           $.extend(oPickerOptions, {
               locale: oOptions['lang'],
               skinTonePosition: 'none',
               previewPosition: oOptions['preview'] === 'undefined' || !oOptions['preview'] ? 'none' : 'bottom',
               set: typeof oOptions['set'] !== 'undefined' ? oOptions['set'] : 'native'
           });

           bx_get_scripts(['modules/boonex/messenger/js/emoji/emoji.min.js'], async () => await initEmojiConfig(oOptions)
                   .then( data => $.extend(oPickerOptions, data))
                   .catch((e) => {
                        console.log(e);
                    }).finally(() => {
               if (oPicker === null && typeof EmojiMart !== 'undefined') {
                   oPicker = new EmojiMart.Picker(oPickerOptions);
                       }
                    })
           );
       },
       emojiCall:(oPos, fCallback)=> {
           if (typeof oPos === 'undefined')
               return;

           const { tableWrapper } = window.oMessengerSelectors.HISTORY;
           if ($(emojiComponent).is(':visible'))
               $(emojiComponent).hide();
           else
           {
               // init WEB Component only once on the first call
               if (!$(emojiComponent).length)
                   $(tableWrapper).append($(oPicker).addClass(emojiPopup));

               const oCss = typeof oPos === 'function' ? oPos($(emojiComponent)) : oPos;

               $(emojiComponent).css(oCss).show();
               if (typeof fCallback === 'function')
                   fCallback();
               }
       }
   }
})(jQuery);