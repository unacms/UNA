/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Reviews Reviews
 * @ingroup     UnaModules
 *
 * @{
 */

function BxReviewsManageTools(oOptions)
{
    BxBaseModTextManageTools.call(this, oOptions);

    this._sObjName = oOptions.sObjName == undefined ? 'oBxReviewsManageTools' : oOptions.sObjName;
}

BxReviewsManageTools.prototype = Object.create(BxBaseModTextManageTools.prototype);
BxReviewsManageTools.prototype.constructor = BxReviewsManageTools;

/** @} */
