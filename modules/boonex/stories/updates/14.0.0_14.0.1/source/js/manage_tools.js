/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Stories Stories
 * @ingroup     UnaModules
 *
 * @{
 */

function BxStoriesManageTools(oOptions)
{
    BxBaseModTextManageTools.call(this, oOptions);

    this._sObjName = oOptions.sObjName == undefined ? 'oBxStoriesManageTools' : oOptions.sObjName;
}

BxStoriesManageTools.prototype = Object.create(BxBaseModTextManageTools.prototype);
BxStoriesManageTools.prototype.constructor = BxStoriesManageTools;

/** @} */
