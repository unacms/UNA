/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Jobs Jobs
 * @ingroup     UnaModules
 *
 * @{
 */

function BxJobsManageTools(oOptions)
{
    BxBaseModJobsManageTools.call(this, oOptions);

    this._sObjName = oOptions.sObjName == undefined ? 'oBxJobsManageTools' : oOptions.sObjName;
}

BxJobsManageTools.prototype = Object.create(BxBaseModJobsManageTools.prototype);
BxJobsManageTools.prototype.constructor = BxJobsManageTools;

/** @} */
