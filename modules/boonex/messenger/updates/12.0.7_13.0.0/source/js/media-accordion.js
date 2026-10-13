(function($){
    const { mediaAccordion, switcher, attPrefixSelector, attachmentWrappers } = window.oMessengerSelectors.ATTACHMENTS;

    $.fn.initAccordion = function(){
        $(attachmentWrappers, this).each(function(){
            const _this = this,
                  oMedia = $(`[class^="${attPrefixSelector}"]`, this);

            $(mediaAccordion, this).on('click', function(){
                    const oItem = $(switcher, this),
                        { hidden } = oItem.data();

                    if (hidden) {
                        oMedia.fadeIn();
                        oItem.data('hidden', 0);
                    }
                    else
                    {
                        oMedia.fadeOut();
                        oItem.data('hidden', 1);
                    }

                    oItem.find( hidden ? '.chevron-down' : '.chevron-up').
                        removeClass('hidden').
                        siblings().
                        addClass('hidden');

                $.get('modules/?r=messenger/media_accordion', { id: $(oMedia).data('media-id'), hidden });
            });
        });

        return this;
    };
})(jQuery);