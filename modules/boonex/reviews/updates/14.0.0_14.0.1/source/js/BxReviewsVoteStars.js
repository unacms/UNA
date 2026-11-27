function BxReviewsVoteStars(oOptions) {
    this._iReviewId = oOptions.review_id;

    BxDolVoteStars.call(this, oOptions);
}

BxReviewsVoteStars.prototype = Object.create(BxDolVoteStars.prototype);
BxReviewsVoteStars.prototype.constructor = BxReviewsVoteStars;

BxReviewsVoteStars.prototype.init = function ()
{
    var $this = this;

    var sSelector = '.' + this._sSP + '.' + this._sSP + '-stars';
    if (this._iReviewId) sSelector += '[bx_vote_data_id=' + this._iReviewId + ']';

    $(sSelector).each(function() {
        var oDoVote = $(this);
        var fRate = oDoVote.attr('bx_vote_data_rate');
        var iStarWidth = $this._getStarWidthDo(oDoVote);

        $this._getSliderDo(oDoVote).width(Math.round(fRate * iStarWidth));
    });
};


BxReviewsVoteStars.prototype.vote = function (oLink, iValue) {
    let iCurVal = $(oLink).closest('.sys-action-element-holder').find('.bx-review-voting-input').val();
    if (iCurVal == iValue) iValue = 0; //unset

    $(oLink).closest('.sys-action-element-holder').find('.bx-review-voting-input').val(iValue);
    this.onVote(oLink, {code:0, rate:iValue});
}