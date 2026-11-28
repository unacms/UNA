/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Jobs Jobs
 * @ingroup     UnaModules
 *
 * @{
 */

function BxJobsPrices(oOptions) {
    BxBaseModGroupsPrices.call(this, oOptions);

    this._sObjName = oOptions.sObjName == undefined ? 'oBxJobsPrices' : oOptions.sObjName;
}

BxJobsPrices.prototype = Object.create(BxBaseModGroupsPrices.prototype);
BxJobsPrices.prototype.constructor = BxJobsPrices;

/** @} */
