/**
 * Options list https://github.com/missive/emoji-mart#options--props
 * @type {{init: Window.oMessengerEmoji.init}}
 */

window.oMessengerEmoji = (function($){
   const oPickerOptions = { onEmojiSelect: console.log, onClickOutside: function(e){
       const { emojiComponent, sendEmojiButton, reactionButton } = window.oMessengerSelectors.EMOJI,
             { jotLineMenu } = window.oMessengerSelectors.JOT;

           if ($(emojiComponent).is(':visible') && !$(e.target).closest(`${sendEmojiButton},${reactionButton},${jotLineMenu}`).length)
               $(emojiComponent).hide();
   }, theme: 'buk'};

   const { tableWrapper } = window.oMessengerSelectors.HISTORY,
         { emojiPopup, emojiComponent } = window.oMessengerSelectors.EMOJI;

   $.fn.attacheEmoji = function(fCallback){
        const _this = this;

        if (typeof fCallback === 'function')
            _this.on('click', (e) => fCallback(e));
   };

   return {
       init: (oOptions) => {
           let oPicker = null;

           if ($(emojiComponent).length)
               return false;

           if (typeof oOptions['lang'] === 'undefined')
               oOptions['lang'] = 'en';

           if (oOptions['lang'] !== 'en')
               oPickerOptions.i18n = async () => (await fetch(`modules/boonex/messenger/js/emoji/data/i18n/${oOptions['lang']}.json`)).json();

           if (typeof oOptions['set'] !== 'undefined')
               oPickerOptions.data = async () => (await fetch(`modules/boonex/messenger/js/emoji/data/set/${oOptions['set']}.json`)).json();

           if (typeof oOptions['onEmojiSelect'] === 'function')
               oPickerOptions.onEmojiSelect = (oEmoji) => {
                   $(oPicker).hide();
                   return oOptions['onEmojiSelect'](oEmoji);
               };

           $.extend(oPickerOptions, { locale: oOptions['lang'], skinTonePosition: 'none', previewPosition: oOptions['preview'] === 'undefined' || !oOptions['preview'] ? 'none' : 'bottom' });

           bx_get_scripts(['modules/boonex/messenger/js/emoji/emoji.min.js'], () => {
               if (oPicker === null && typeof EmojiMart !== 'undefined') {
                   oPicker = new EmojiMart.Picker(oPickerOptions);
                   $(tableWrapper).append($(oPicker).addClass(emojiPopup));
               }
           });
       }
   }
})(jQuery);