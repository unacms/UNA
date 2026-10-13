;window.oMessengerJotMenu = (function($) {
    const { jotContainer, jotMenu, moreIcon, menuSelector, jotMain, jotWrapper, jotIcons, jotAvatar, jotMessageTitle, jotAreaInfo, jotMessage, jotMessageBody } = window.oMessengerSelectors.JOT,
        { conversationBody } = window.oMessengerSelectors.HISTORY,
        { attachmentWrappers, attachmentArea, attachmentFileWrapper } = window.oMessengerSelectors.ATTACHMENTS,
        { dateIntervalsSelector } = window.oMessengerSelectors.DATE_SEPARATOR;

    /**
     * JQuery extension function to attache popup menu on messages' icons
     */

    $.fn.initJotIcons = function(){
        const oConversationBlock = $(conversationBody).parent(),
              bMobile = oMUtils.isMobile();

        $(`${jotContainer} ${moreIcon}`, this).each(function(){
             $(this).on('click', function() {
                     const oMenu = $(this).closest(jotMenu).find('[id^="jot-menu-"]');
                     if (oMenu.is(':visible'))
                         return;

                     $(menuSelector, conversationBody).hide();
                     if (bMobile)
                         oMenu.removeClass('bx-popup-responsive');

                     const iHeight = oConversationBlock.height() + oConversationBlock.offset().top,
                         bPlaceAbove = (iHeight - $(this).offset().top - $(this).height()) < oMenu.height(),
                         bPlaceBottom = (oConversationBlock.offset().top + oMenu.height()) > $(this).offset().top;

                     oMenu
                         .css({top: '1.5rem', position: 'absolute', zIndex: 10})
                         .fadeIn('fast')
                         .on('mouseleave click', function({ type }){
                             if (type === 'mouseleave' && bMobile)
                                 return false;

                                 $(this).hide();
                          });

                     oMenu.closest(jotWrapper).on('mouseleave', () => oMenu.hide());

                     if (bPlaceAbove && bPlaceBottom)
                         oMenu
                             .position({
                                 of: $(this),
                                 my: 'left-24 center',
                                 at: 'left bottom',
                                 collision: 'fit fit'
                             });
                     else if (bPlaceBottom)
                         oMenu
                             .position({
                                 of: $(this),
                                 my: 'left-24 ' + (bPlaceAbove ? 'bottom' : 'top'),
                                 at: 'left bottom',
                                 collision: 'fit fit'
                             });
                     else if (bPlaceAbove)
                         oMenu.position({
                             of: $(this),
                             my: 'left-24 bottom',
                             at: 'left top',
                             collision: 'fit fit'
                         });
             });
        });

        return this;
    }

    return {
        deleteJot : function(oObject, bCompletely, fCallback, fDesignCallback){
            const _this = this,
                oJot = $(oObject).closest(jotMain),
                iJotId = oJot.data('id') || 0,
                removeJot = function(oJot){
                    const oNext = $(oJot).next();

                    if (!$(oNext).data('my') && $(`${jotAvatar} > img`, oJot).length && !$(`${jotAvatar} > img`, oNext).length){
                        $(`${jotAvatar}`, oNext).append($(`${jotAvatar}`, oJot).html());
                        $(`${jotAreaInfo}`, oNext).prepend($(`${jotMessageTitle}`, oJot));
                    }

                    $(oJot)
                        .fadeOut('slow',
                            function () {
                                if (!$(this).next(jotMain).length)
                                    $(this).prev(dateIntervalsSelector).remove();

                                $(this).remove();

                                if (typeof fDesignCallback === 'function')
                                    fDesignCallback();
                            });
                };

            if (iJotId) {
                $.post('modules/?r=messenger/delete_jot', { jot: iJotId, completely: +bCompletely || 0 },
                    function ({ code, html }) {
                        if (!parseInt(code)) {
                            if (!bCompletely && html.length) {
                                $(jotMessageBody, oJot).removeClass('hidden');

                                $(jotMessage, oJot)
                                    .fadeOut('slow',
                                        function() {
                                            $(this)
                                                .siblings(attachmentArea)
                                                .fadeOut(function() {
                                                    $(this).remove();
                                                })
                                                .end()
                                                .html(html)
                                                .fadeIn('slow', () => {
                                                    if (typeof fDesignCallback === 'function')
                                                        fDesignCallback();
                                                });
                                        })
                                    .unbind();
                            } else
                                removeJot(oJot);

                            $(jotIcons, oJot)
                                .remove();

                            if (typeof fCallback === 'function')
                                fCallback({
                                    jot_id: iJotId,
                                    addon: 'delete'
                                });
                        }
                    }, 'json');
            }
            else
                removeJot(oJot);
        },
        removeFile: function (oEl, id) {
            $.get('modules/?r=messenger/delete_file', { id: id }, function ({ empty_jot, code, message }) {
                if (!parseInt(code)) {
                    if (empty_jot)
                        $(oEl)
                            .closest(jotMain)
                            .fadeOut('slow', function(){
                                    $(this).remove();
                            });
                    else
                        $(oEl)
                            .parents(`${attachmentWrappers},${attachmentFileWrapper}`)
                            .fadeOut('slow', function(){
                                    $(this).remove();
                            });
                } else
                    bx_alert(message);

            }, 'json');
        },
        downloadFile: function (iFileId) {
            $.get('modules/?r=messenger/download_file/' + iFileId, { id: iFileId }, function ({ code, message }) {
                if (parseInt(code))
                    bx_alert(message);
            });
        },
    }
})(jQuery);