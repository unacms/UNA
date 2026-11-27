/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Stories Stories
 * @ingroup     UnaModules
 *
 * @{
 */

function BxStoriesMain(oOptions) {
    this._sActionsUrl = oOptions.sActionUrl;
    this._sObjName = oOptions.sObjName == undefined ? 'oBxStoriesMain' : oOptions.sObjName;

    this._sAnimationEffect = oOptions.sAnimationEffect == undefined ? 'fade' : oOptions.sAnimationEffect;
    this._iAnimationSpeed = oOptions.iAnimationSpeed == undefined ? 'slow' : oOptions.iAnimationSpeed;

    this._aHtmlIds = oOptions.aHtmlIds == undefined ? {} : oOptions.aHtmlIds;
    this._oRequestParams = oOptions.oRequestParams == undefined ? {} : oOptions.oRequestParams;

    this._iDuration = oOptions.iDuration == undefined ? 0 : oOptions.iDuration;
    this._iPlayHandle = 0;

    var $this = this;
    $(document).ready(function() {
    	$this.init();
    });
}

BxStoriesMain.prototype.init = function() {
    $('.bx-stories-unit-images').flickity({
        cellSelector: '.bx-stories-unit-image',
        cellAlign: 'left',
        imagesLoaded: true,
        wrapAround: true,
        pageDots: false
    });
};

BxStoriesMain.prototype.play = function(oElement, iId) {
    var $this = this;
    var oDate = new Date();

    this.loadingInBlock(oElement, true);

    $.get(
        this._sActionsUrl + 'play/' + iId, 
        {
            _t: oDate.getTime()
        },
        function(oData) {
            $this.loadingInBlock(oElement, false);

            processJsonData(oData);
        },
        'json'
    );

    return false;
};

BxStoriesMain.prototype.playInit = function() {
    const $this = this;

    const oVideos = document.querySelectorAll('.bx-popup-applied .bx-stories-play video');

    if(oVideos)
        oVideos.forEach((oVideo) => {
            oVideo.addEventListener("play", (event) => {
                $this.playStop();
            });
            oVideo.addEventListener("ended", (event) => {
                $this.showNext();
                $this.playStart();
            });
        });

    var oVideo = $('.bx-popup-applied .bx-stories-play .bx-stories-pl-media:visible video');
    if(oVideo.length)
        oVideo.get(0).play();
    else
        this.playStart();
};

BxStoriesMain.prototype.playDestroy = function() {
    this.playStop();
};

BxStoriesMain.prototype.playStart = function() {
    var $this = this;

    if(this._iPlayHandle)
        this.playStop();

    this._iPlayHandle = setInterval(function() {
        $this.showNext();
    }, 1000 * this._iDuration);
};

BxStoriesMain.prototype.playStop = function() {
    if(this._iPlayHandle)
        clearInterval(this._iPlayHandle);
};

BxStoriesMain.prototype.showNext = function() {
    var oPlayer = $('.bx-popup-applied .bx-stories-play');

    var oPointer = oPlayer.find('.bx-stories-pp-pointer');
    if(oPointer) {
        var iLeft = parseInt(oPointer.css('left'));
        if(!iLeft)
            iLeft = 0;

        oPointer.css('left', iLeft + oPointer.width());
    }

    var oNext = oPlayer.find('.bx-stories-pl-media:visible').hide().next();
    if(oNext.length)
        oNext.show({complete: function() {
            var oVideo = $('.bx-popup-applied .bx-stories-play .bx-stories-pl-media:visible video');
            if(oVideo.length)
                oVideo.get(0).play();
        }});
    else
        $('.bx-popup-applied:visible').dolPopupHide();
};

BxStoriesMain.prototype.editMedia = function(oButton, iId) {
    var $this = this;
    var oDate = new Date();

    this.loadingInButton(oButton, true);

    $.get(
        this._sActionsUrl + 'edit_media/' + iId, 
        {
            _t: oDate.getTime()
        },
        function(oData) {
            $this.loadingInButton(oButton, false);

            processJsonData(oData);
        },
        'json'
    );
};

BxStoriesMain.prototype.onEditMedia = function(oData) {
    if(oData && oData.content != undefined)
        $('#' + this._oHtmlIds['subentry_votes'] + oData.content.subentry_id).html(oData.content.votes_formated);
};

BxStoriesMain.prototype.deleteMedia = function(oButton, iId) {
    var $this = this;

    bx_confirm(_t('_Are_you_sure'), function() {
        var oDate = new Date();
        $this.loadingInButton(oButton, true);

        $.get(
            $this._sActionsUrl + 'delete_media/' + iId, 
            {
                _t: oDate.getTime()
            },
            function(oData) {
                $this.loadingInButton(oButton, false);

                processJsonData(oData);
            },
            'json'
        );
    });
};

BxStoriesMain.prototype.loadingInButton = function(e, bShow) {
    if($(e).length)
        bx_loading_btn($(e), bShow);
    else
        bx_loading($('body'), bShow);
};

BxStoriesMain.prototype.loadingInBlock = function(e, bShow) {
    var oParent = $(e).length ? $(e).parents('.bx-db-container:first') : $('body'); 
    bx_loading(oParent, bShow);
};

/** @} */
