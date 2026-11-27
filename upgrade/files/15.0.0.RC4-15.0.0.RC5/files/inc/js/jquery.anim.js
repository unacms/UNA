/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

$.fn.bx_anim = function(action, effect, speed, h) {
   return this.each(function() {
           var sFunc = '';
           var sEval;

           if (speed == 0)
               effect = 'default';

          switch (action) {
              case 'show':
                  switch (effect) {
                      case 'slide': sFunc = 'slideDown'; break;
                      case 'fade': sFunc = 'fadeIn'; break;
                      default: sFunc = 'show';
                  }
                  break;
              case 'hide':
                  switch (effect) {
                      case 'slide': sFunc = 'slideUp'; break;
                      case 'fade': sFunc = 'fadeOut'; break;
                      default: sFunc = 'hide';
                  }
                  break;
              default:
              case 'toggle':
                  switch (effect) {
                      case 'slide': sFunc = 'slideToggle'; break;
                      case 'fade': sFunc = ($(this).filter(':visible').length) ? 'fadeOut' : 'fadeIn'; break;
                      default: sFunc = 'toggle';
                  }
          }

          if ((0 == speed || undefined == speed) && undefined == h) {
              sEval = '$(this).' + sFunc + '();';
          }
          else if ((0 == speed || undefined == speed) && undefined != h) {
              sEval = '$(this).' + sFunc + '(); $(this).each(h);';
          }
          else {
              sEval = '$(this).' + sFunc + "('" + speed + "', h);";
          }
          eval(sEval);

          return this;
   });
};

$.fn.bx_loading = function(bForceIndicator) {
    return $.fn._bx_loading('.bx-loading-ajax', bForceIndicator);
};

$.fn.bx_loading_btn = function(bForceIndicator) {
    return $.fn._bx_loading('.bx-loading-ajax-btn', bForceIndicator);
};

$.fn._bx_loading = function(sLoadingSelector, bForceIndicator) {
    return this.each(function() {
        var oContainer = $(this);
        var oLoading = oContainer.find(sLoadingSelector);
        bForceIndicator = 'undefined' == typeof(bForceIndicator) ? oLoading.length && oLoading.is(':visible') : bForceIndicator;
        bx_loading_btn(oContainer, bForceIndicator);
    });
};

$.fn.bx_message_box = function(sMessage, iTimer, onClose) {
    return this.each(function() {
        var oParent = $(this);
        
        if(oParent.children(':first').hasClass('MsgBox'))
            oParent.children(':first').replaceWith(sMessage);
        else 
            oParent.prepend(sMessage);

        if(iTimer == undefined || parseInt(iTimer) == 0)
            return;

        setTimeout(function(oParent, onClose) {
            oParent.children('div.MsgBox:first').bx_anim('hide', 'fade', 'slow', function(){
                $(this).remove();
                if(onClose != undefined)
                    onClose();
            });
        }, 1000 * parseInt(iTimer), oParent, onClose);
    });
};

$.fn.bx_show_more_check_overflow = function(sClass, onFind) {
    if(!sClass)
        sClass = 'bx-overflow';

    return this.each(function() {
        var oElement = $(this);
        if(oElement.hasClass(sClass) || oElement.css('overflow') != 'hidden')
            return;

        if(oElement.prop('scrollHeight') <= oElement.height())
            return;

        oElement.addClass(sClass);
        if(typeof onFind === 'function')
            onFind(oElement);
        else
            oElement.after('<div class="bx-show-more bx-def-border-top"><a href="javascript:void(0)" onclick="bx_show_more(this);"><i class="sys-icon chevrons-down"></i></div>');
    });
};

function bx_show_more(oLink) {
    var sClass = 'bx-overflow';
    var oShowMore = $(oLink).parent();

    oShowMore.siblings('.' + sClass).css('max-height', 'none').removeClass(sClass);
    oShowMore.remove();
};
/** @} */
