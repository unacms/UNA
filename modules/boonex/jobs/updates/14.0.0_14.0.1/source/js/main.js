/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Jobs Jobs
 * @ingroup     UnaModules
 *
 * @{
 */

function BxJobsMain(oOptions) {
    BxBaseModGroupsMain.call(this, oOptions);

    this._sObjName = oOptions.sObjName == undefined ? 'oBxJobsMain' : oOptions.sObjName;
}

BxJobsMain.prototype = Object.create(BxBaseModGroupsMain.prototype);
BxJobsMain.prototype.constructor = BxJobsMain;

/** @} */
