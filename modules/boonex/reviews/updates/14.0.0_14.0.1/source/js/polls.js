/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Reviews Reviews
 * @ingroup     UnaModules
 *
 * @{
 */

function BxReviewsPolls(oOptions)
{
    BxBaseModTextPolls.call(this, oOptions);

    this._sObjName = oOptions.sObjName == undefined ? 'oBxReviewsPolls' : oOptions.sObjName;
}

BxReviewsPolls.prototype = Object.create(BxBaseModTextPolls.prototype);
BxReviewsPolls.prototype.constructor = BxReviewsPolls;

/** @} */
