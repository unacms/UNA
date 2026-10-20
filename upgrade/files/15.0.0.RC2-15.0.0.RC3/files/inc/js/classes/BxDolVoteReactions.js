/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

function BxDolVoteReactions(oOptions)
{
    BxDolVote.call(this, oOptions);
    this._bQuickMode = oOptions.bQuickMode === undefined ? 0 : oOptions.bQuickMode; // enable 'quick' mode - vote with default reaction when clicked.
    this._bSingleMode = oOptions.bSingleMode === undefined ? 0 : oOptions.bSingleMode; // enable 'single' mode - vote with the only one available reaction when clicked.

    this._iTimeoutShowId = 0;
    this._iTimeoutShowDelay = 750;
    this._iTimeoutHideId = 0;
    this._iTimeoutHideDelay = 1000;
    this._fOnVoteIn = null;
    this._fOnVoteOut = null;
    this._fOnDoPopupIn = null;
    this._fOnDoPopupOut = null;

    this._sClassDo = 'bx-vote-do-vote';
    this._sClassDoVoted = 'bx-vote-voted';
}

BxDolVoteReactions.prototype = Object.create(BxDolVote.prototype);
BxDolVoteReactions.prototype.constructor = BxDolVoteReactions;

BxDolVoteReactions.prototype.init = function()
{
    BxDolVote.prototype.init.call(this);

    var $this = this;

    if(this._bQuickMode && !this._bSingleMode) {
        if(bx_is_mouse())
            $('#' + this._aHtmlIds['main'] + ' .' + this._sClassDo).hover(function() {
                $this.onVoteIn(this);
            }, function() {
                $this.onVoteOut(this);
            });
        else
            $('#' + this._aHtmlIds['main'] + ' .' + this._sClassDo).onLongTouch(function(oElement) {
                $this.onTouch(oElement);
            });
    }
};

BxDolVoteReactions.prototype.vote = function(oLink, iValue, sReaction, onComplete)
{
    var $this = this;
    var oParams = this._getDefaultParams();
    oParams['action'] = 'Vote';
    oParams['value'] = iValue;
    oParams['reaction'] = sReaction;

    if(this._iTimeoutShowId)
        clearTimeout(this._iTimeoutShowId);

    $('#' + this._aHtmlIds['do_popup']).dolPopupHide({});

    $.post(
    	this._sActionsUrl,
    	oParams,
    	function(oData) {
            $this._cueOnVote(oData);

            if(oData && oData.message != undefined)
                bx_alert(oData.message, function() {
                    $this.onVote(oLink, oData, onComplete);
                });
            else
                $this.onVote(oLink, oData, onComplete);
        },
        'json'
    );
};

BxDolVoteReactions.prototype.onVote = function (oLink, oData, onComplete)
{
    var $this = this;

    if(oData && oData.code != 0)
        return;

    oLink = $('.' + this._aHtmlIds['main'] + ' .' + this._sClassDo);

    //--- Update Do button.
    oLink.each(function() {
        if(oData && oData.label_use)
            switch(oData.label_use) {
                case 'icon':
                    if($(this).find('.sys-action-do-icon .sys-icon').length && !$(oData.label_icon).hasClass('sys-icon'))
                        $(this).find('.sys-action-do-icon .sys-icon').attr('class', 'sys-icon ' + oData.label_icon).html('');
                    else
                        $(this).find('.sys-action-do-icon').html(oData.label_icon);
                    break;

                case 'emoji':
                    $(this).find('.sys-action-do-icon .sys-icon').attr('class', 'sys-icon sys-icon-emoji').html(oData.label_emoji);
                    break;

                case 'image':
                    $(this).find('.sys-action-do-icon').html(oData.label_image);
                    break;
            }

        if(oData && oData.label_title) {
            $(this).attr('title', oData.label_title);
            $(this).find('.sys-action-do-text').html(oData.label_title);
        }

        if(oData && oData.label_click)
            $(this).attr('onclick', 'javascript:' + oData.label_click)

        if(oData && oData.disabled)
            $(this).removeAttr('onclick').addClass($(this).hasClass('bx-btn') ? 'bx-btn-disabled' : 'bx-vote-disabled');

        if(oData && oData.voted != undefined)
            $(this).toggleClass($this._sClassDoVoted, oData.voted);
    });

    //--- Update Counter.
    var oCounter = this._getCounter(oLink);
    if(oCounter && oCounter.length > 0) {
        oCounter.filter('.' + oData.reaction).each(function() {
            $(this).html(oData.countf).toggleClass('bx-vc-hidden', !oData.count);            
        });

        //--- Update Total.
        if(oData.total)
            oCounter.filter('.total-count').each(function() {
                $(this).html(oData.total.countf).toggleClass('bx-vc-hidden', !oData.total.count);
            });

        //--- Show counter.
        oCounter.filter('.' + oData.reaction).each(function() {
            $(this).parents('.' + $this._sSP + '-counter-wrapper:first').toggleClass('bx-vc-hidden', !oData.count && !oData.total.count);
        });
    }

    if(typeof onComplete == 'function')
        onComplete(oLink, oData);
};

BxDolVoteReactions.prototype.onVoteIn = function(oLink)
{
    var $this = this;

    if($(oLink).hasClass(this._sClassDoVoted))
        return;

    if(this._iTimeoutHideId)
        clearTimeout(this._iTimeoutHideId);

    var oPopup = this.getDoPopup();
    if(oPopup !== false)
        return;

    this._iTimeoutShowId = setTimeout(function() {
        $this.toggleDoPopup(oLink, $(oLink).attr('bx-vote-value'));
    }, this._iTimeoutShowDelay);
};

BxDolVoteReactions.prototype.onVoteOut = function(oLink)
{
    if($(oLink).hasClass(this._sClassDoVoted))
        return;

    if(this._iTimeoutShowId)
        clearTimeout(this._iTimeoutShowId);

    this.hideDoPopup();
};

BxDolVoteReactions.prototype.onTouch = function(oLink)
{
    if($(oLink).hasClass(this._sClassDoVoted))
        return;

    var oPopup = this.getDoPopup();
    if(oPopup !== false)
        return;

    this.toggleDoPopup(oLink, $(oLink).attr('bx-vote-value'), {
        closeOnOuterClick: false
    });
};

BxDolVoteReactions.prototype.getDoPopup = function()
{
    var oPopup = $('#' + this._aHtmlIds['do_popup'] + ':visible');
    return oPopup.length > 0 && oPopup.hasClass('bx-popup-applied') ? oPopup : false;
};

BxDolVoteReactions.prototype.toggleDoPopup = function(oLink, iValue, oOptions)
{
    var $this = this;
    var oParams = this._getDefaultParams();
    oParams['action'] = 'GetDoVotePopup';

    if(this._iTimeoutShowId)
        clearTimeout(this._iTimeoutShowId);

    oOptions = oOptions || {};
    oOptions = $.extend({}, {
        id: {value: this._aHtmlIds['do_popup'], force: true}, 
        url: bx_append_url_params(this._sActionsUri, oParams),
        value: iValue,
        onShow: function(oPopup) {
            $this.onDoPopupShow(oPopup);
        },
        onHide: function(oPopup) {
            $this.onDoPopupHide(oPopup);
        },
        cssClass: 'bx-popup-vote-reactions ' + $this._sSystem.replaceAll('_', '-')
    }, oOptions);

    $(oLink).dolPopupAjax(oOptions);
};

BxDolVoteReactions.prototype.hideDoPopup = function()
{
    var oPopup = this.getDoPopup();
    if(!oPopup)
        return;

    this._iTimeoutHideId = setTimeout(function() {
        oPopup.dolPopupHide();
    }, this._iTimeoutHideDelay);
};

BxDolVoteReactions.prototype.onDoPopupShow = function(oPopup)
{
    var $this = this;

    this._fOnDoPopupIn = function() {
        $this.onDoPopupIn(this);
    };

    this._fOnDoPopupOut = function() {
        $this.onDoPopupOut(this);
    };

    $(oPopup).hover(this._fOnDoPopupIn, this._fOnDoPopupOut);
};

BxDolVoteReactions.prototype.onDoPopupHide = function(oPopup)
{
    $(oPopup).unbind('mouseenter', this._fOnDoPopupIn).unbind('mouseleave', this._fOnDoPopupOut);
};

BxDolVoteReactions.prototype.onDoPopupIn = function(oPopup)
{
    if(this._iTimeoutHideId)
        clearTimeout(this._iTimeoutHideId);
};

BxDolVoteReactions.prototype.onDoPopupOut = function(oPopup)
{
    this.hideDoPopup();
};

BxDolVoteReactions.prototype.toggleByPopup = function(oLink, sReaction)
{
    var oParams = this._getDefaultParams();
    oParams['action'] = 'GetVotedBy';
    if(sReaction)
        oParams['reaction'] = sReaction;

    $(oLink).dolPopupAjax({
        id: {value: this._aHtmlIds['by_popup'], force: true}, 
        url: bx_append_url_params(this._sActionsUri, oParams),
        removeOnClose: true
    });
};

BxDolVoteReactions.prototype.changeVotedBy = function(oLink, sReaction)
{
    var oContent = $('#' + this._aHtmlIds['by_popup'] + ' .' + this._sSP + '-bls-content');
    if(oContent.length > 0)
        oContent.children(':visible').hide().siblings('.' + this._sSP + '-bl-' + sReaction).show();
};

BxDolVoteReactions.prototype._getCounter = function(oElement)
{
    var oCounter = BxDolVote.prototype._getCounter.call(this, oElement);
    if(oCounter && oCounter.length > 0)
        return oCounter;

    return $('.' + this._aHtmlIds['counter']).find('.' + this._sSP + '-counter');
};

(function($) {
    $.fn.onLongTouch = function(fCallback) {
        return this.each(function() {
            var oSource = this;
            var iTimeoutId = null;

            this.addEventListener('touchstart', function(e) {
                iTimeoutId = setTimeout(function() {
                    iTimeoutId = null;
                    e.stopPropagation();
                    fCallback(oSource);
                }, 500);
            });

            this.addEventListener('contextmenu', function(e) {
                e.preventDefault();
            });

            this.addEventListener('touchend', function() {
                if(iTimeoutId) 
                    clearTimeout(iTimeoutId);
            });

            this.addEventListener('touchmove', function() {
                if(iTimeoutId) 
                    clearTimeout(iTimeoutId);
            });
        });
    };
})(jQuery);

/** @} */
