/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Albums Albums
 * @ingroup     UnaModules
 *
 * @{
 */

function BxAlbumsMain(oOptions) {
    this._sActionsUrl = oOptions.sActionUrl;
    this._sObjName = oOptions.sObjName == undefined ? 'oBxAlbumsMain' : oOptions.sObjName;

    this._sAnimationEffect = oOptions.sAnimationEffect == undefined ? 'fade' : oOptions.sAnimationEffect;
    this._iAnimationSpeed = oOptions.iAnimationSpeed == undefined ? 'slow' : oOptions.iAnimationSpeed;

    this._aHtmlIds = oOptions.aHtmlIds == undefined ? {} : oOptions.aHtmlIds;
    this._oRequestParams = oOptions.oRequestParams == undefined ? {} : oOptions.oRequestParams;

    var $this = this;
    $(document).ready(function() {
    	$this.init();
    });
}

BxAlbumsMain.prototype.init = function() {
    $('.bx-albums-unit-images').flickity({
        cellSelector: '.bx-albums-unit-image',
        cellAlign: 'left',
        imagesLoaded: true,
        wrapAround: true,
        pageDots: false
    });
};

BxAlbumsMain.prototype.editMedia = function(oButton, iId) {
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

BxAlbumsMain.prototype.onEditMedia = function(oData) {
    if(oData && oData.content != undefined)
        $('#' + this._oHtmlIds['subentry_votes'] + oData.content.subentry_id).html(oData.content.votes_formated);
};

BxAlbumsMain.prototype.deleteMedia = function(oButton, iId) {
    var $this = this;
    var oDate = new Date();

    this.loadingInButton(oButton, true);

    $.get(
        this._sActionsUrl + 'delete_media/' + iId, 
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

BxAlbumsMain.prototype.moveMedia = function(oButton, iId) {
    var $this = this;
    var oDate = new Date();

    this.loadingInButton(oButton, true);

    $.get(
        this._sActionsUrl + 'move_media/' + iId, 
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

BxAlbumsMain.prototype.loadingInButton = function(e, bShow) {
    if($(e).length)
        bx_loading_btn($(e), bShow);
    else
        bx_loading($('body'), bShow);
};

/** @} */
