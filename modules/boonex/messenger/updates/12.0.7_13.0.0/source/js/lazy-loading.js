;(function($){
    const fPassed = 0.6,
          iDelay = 700;

        $.fn.initLazyLoading = function(fCallback){
        let iTimerOut = null,
            bFinished = false,
            stopLoading = false,
            _this = this;

        $(_this).unbind('scroll').scroll(function(){
            const
                scrollTop = $(this).scrollTop(),
                scrollHeight = $(this).prop('scrollHeight'),
                clientHeight = $(this).prop('clientHeight'),
                scrollMax = scrollHeight - clientHeight,
                bPassed = scrollTop >= scrollMax * fPassed; // 60% passed

            if (!bPassed || bFinished)
                return;

            if (!stopLoading) {
                stopLoading = true;
                clearTimeout(iTimerOut);
                iTimerOut = setTimeout(() => {
                    if (typeof fCallback === 'function')
                        fCallback((bResult) => {
                                                 stopLoading = false;
                                                 bFinished = bResult;
                                                }, false);
                }, iDelay);
            }
        });
    }

})(jQuery);