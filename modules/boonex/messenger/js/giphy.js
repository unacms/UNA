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
    initGiphy(){
        const { giphySendArea, giphyMain } = window.oMessengerSelectors.GIPHY,
            _this = this;

        $(giphySendArea)
            .on('click',
                function(e){
                    if ($(giphyMain).is(':visible'))
                        $(giphyMain).fadeOut();
                    else
                        $(giphyMain).fadeIn(function(){
                            $(this).css('display', 'flex');
                            _this.init();
                        });
                });
    }
    init(sSelector = '') {
        const { giphyItems, giphyScroll, giphyMain, giphyInput } = window.oMessengerSelectors.GIPHY;
        let iTotal = 0, iScrollPosition = 0;

        const _this = this,
            oContainer = $(`${sSelector}${giphyItems}`),
            oScroll = $(`${sSelector}${giphyScroll}`),
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
                $('.loading', giphyInput).show(function(){
                    bx_loading_btn($(this), true);
                });
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

                        $('.loading', giphyInput).hide(function(){
                            bx_loading_btn($(this), false);
                        });

                        if (typeof fCallback === 'function')
                            fCallback(sType, sValue);
                    },
                    'json');
            };

        if ($(`${sSelector}${giphyMain}`).css('visibility') === 'visible') {
            let iTimer = 0;
            $('input', `${sSelector}${giphyMain}`).on('keyup', function (e) {
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
                    $(this).trigger('keypup');
            });

            if (oContainer && !oContainer.find('img').length) {
                fGiphy(undefined, undefined, fInitVisibility);
            }
        }
    };
}