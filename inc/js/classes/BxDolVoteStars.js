/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

function BxDolVoteStars(oOptions)
{
    BxDolVote.call(this, oOptions);

    this._iSaveWidth = -1;
}

BxDolVoteStars.prototype = Object.create(BxDolVote.prototype);
BxDolVoteStars.prototype.constructor = BxDolVoteStars;

BxDolVoteStars.prototype.init = function ()
{
    BxDolVote.prototype.init.call(this);

    var $this = this;

    $('.' + this._sSP + '.' + this._sSP + '-stars').each(function() {
        var oDoVote = $(this);
        var fRate = oDoVote.attr('bx_vote_data_rate');
        var iStarWidth = $this._getStarWidthDo(oDoVote);

        $this._getSliderDo(oDoVote).width(Math.round(fRate * iStarWidth));
    });

    $('.' + this._sSP + '-legend.' + this._sSP + '-legend-stars').each(function() {
        var oLegend = $(this);
        var iStarWidth = $this._getStarWidthLegend(oLegend);

        oLegend.find('.' + $this._sSP + '-legend-item').each(function() {
            var oItem = $(this);

            oItem.find('.' + $this._sSP + '-slider').width(parseInt(oItem.attr('bx_vote_item_value')) * iStarWidth); 
        });
    });
};

/**
 * Rating is choosing a value: a select, and a toggle going off when the rating is taken back.
 */
BxDolVoteStars.prototype._cueOnVote = function(oData)
{
    if(typeof(bx_sound) != 'function' || !oData)
        return;

    if(oData.code != undefined && parseInt(oData.code) != 0)
        bx_sound('error');
    else if(oData.voted)
        bx_sound('select', {group: 'reactions'});
    else
        bx_sound('toggle', {direction: 'back', group: 'reactions'});
};

BxDolVoteStars.prototype.onVote = function (oLink, oData, onComplete)
{
    if(oData && oData.code != 0)
        return;

    this._iSaveWidth = Math.round(oData.rate * this._getStarWidthDo(oLink));

    BxDolVote.prototype.onVote.call(this, oLink, oData, onComplete);
};

BxDolVoteStars.prototype.over = function (oLink)
{
    var oSlider = this._getSliderDo(oLink);
    var iIndex = this._getButtons(oLink).index(oLink);

    this._iSaveWidth = parseInt(oSlider.width());
    oSlider.width((iIndex + 1) * this._getStarWidthDo(oLink));
};

BxDolVoteStars.prototype.out = function (oLink)
{
	var oSlider = this._getSliderDo(oLink);

	oSlider.width(this._iSaveWidth);
};

BxDolVoteStars.prototype._getButtons = function(oElement)
{
    if($(oElement).hasClass(this._sSP))
        return $(oElement).find('.' + this._sSP + '-button');
    else
        return $(oElement).parents('.' + this._sSP + ':first').find('.' + this._sSP + '-button');
};

BxDolVoteStars.prototype._getSliderDo = function(oElement)
{
    return this._getSlider(oElement, '.' + this._sSP + '-do');
};

BxDolVoteStars.prototype._getSliderLegend = function(oElement) 
{
    return this._getSlider(oElement, '.' + this._sSP + '-legend');
};

BxDolVoteStars.prototype._getSlider = function(oElement, sParent) {
    var sSlider = (sParent.length > 0 ? sParent + ' ' : '') + '.' + this._sSP + '-slider';
    if($(oElement).hasClass(this._sSP))
        return $(oElement).find(sSlider);
    else
        return $(oElement).parents('.' + this._sSP + ':first').find(sSlider);
};

BxDolVoteStars.prototype._getStarWidthDo = function(oElement)
{
    return this._getSliderDo(oElement).find('.sys-icon').width();
};

BxDolVoteStars.prototype._getStarWidthLegend = function(oElement)
{
    return this._getSliderLegend(oElement).find('.sys-icon').width();
};

/** @} */
