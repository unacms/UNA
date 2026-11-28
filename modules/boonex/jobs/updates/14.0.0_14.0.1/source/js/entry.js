/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Events Events
 * @ingroup     UnaModules
 *
 * @{
 */

function BxJobsEntry(oOptions) {
    BxBaseModGroupsEntry.call(this, oOptions);

    this._sObjName = oOptions.sObjName == undefined ? 'oBxJobsEntry' : oOptions.sObjName;

    var $this = this;
    $(document).ready(function() {
        $this.init();
    });
}

BxJobsEntry.prototype = Object.create(BxBaseModGroupsEntry.prototype);
BxJobsEntry.prototype.constructor = BxJobsEntry;

BxJobsEntry.prototype.init = function() {
    if ('UTC' == $("[name = 'timezone']").val())
        $("[name = 'timezone']").val(moment.tz.guess());
};

/** @} */
