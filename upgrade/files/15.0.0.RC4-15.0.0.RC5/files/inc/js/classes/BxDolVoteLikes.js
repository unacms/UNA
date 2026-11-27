/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

function BxDolVoteLikes(oOptions)
{
    BxDolVote.call(this, oOptions);
}

BxDolVoteLikes.prototype = Object.create(BxDolVote.prototype);
BxDolVoteLikes.prototype.constructor = BxDolVoteLikes;

BxDolVoteLikes.prototype.onVote = function (oLink, oData, onComplete)
{
    if(oData && oData.code != 0)
        return;

    if(oData && oData.label_use)
        switch(oData.label_use) {
            case 'icon':
                bx_set_icon($(oLink).find('.sys-action-do-icon .sys-icon'), oData.label_icon);
                break;

            case 'emoji':
                bx_set_icon($(oLink).find('.sys-action-do-icon .sys-icon'), 'sys-icon-emoji', oData.label_emoji);
                break;

            case 'image':
                $(oLink).find('.sys-action-do-icon').html(oData.label_image);
                break;
        }

    if(oData && oData.label_title) {
        $(oLink).attr('title', oData.label_title);
        $(oLink).find('.sys-action-do-text').html(oData.label_title);
    }

    if(oData && oData.disabled)
        $(oLink).removeAttr('onclick').addClass($(oLink).hasClass('bx-btn') ? 'bx-btn-disabled' : 'bx-vote-disabled');

    BxDolVote.prototype.onVote.call(this, oLink, oData, onComplete);
};

BxDolVoteLikes.prototype._getCounter = function(oElement)
{
    var oCounter = BxDolVote.prototype._getCounter.call(this, oElement);
    if(oCounter && oCounter.length > 0)
        return oCounter;

    return $('#' + this._aHtmlIds['counter'] + '.' + this._sSP + '-counter');
};

/** @} */
