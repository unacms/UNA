/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    MassMailer Mass Mailer
 * @ingroup     UnaModules
 *
 * @{
 */

function BxMassMailerChart(oOptions) {
    this._sContainerId = 'bx_massmailer_chart_container';
    this._sChartName = oOptions.sChartName;
    this._sReportName = oOptions.sReportName;
    this._sReportSelector = '#' + this._sContainerId + " .bx_massmailer_report_selector";
    this._sSegmentsSelector = '#' + this._sContainerId + " .bx_massmailer_segments_selector";
    this._sContainerDataSelector = '#' + this._sContainerId + " .bx_massmailer_data";
    this._sCanvasSelector = '#' + this._sContainerId + " .bx_massmailer_chart";
    this._sDatePickerSelector = '#' + this._sContainerId + " .bx_massmailer_date_picker";
    this._sActionsUri = oOptions.sActionUri;
    this._aStrings = oOptions.aStrings;
    this._oChart = null;
    this._oChartOptionsDefault = {
        layout: {
            padding: {
                left: 40,
                right: 40,
                top: 40,
                bottom: 20
            }
        }
    };
    var $this = this;
    $(document).ready(function () {
        $this.init(); 
    });
}

BxMassMailerChart.prototype.init = function () {
    var $this = this;
    if ($($this._sReportSelector).length > 0) {
        $($this._sReportSelector).change(function () {
            $this.reloadData();
        });
    }

    if ($($this._sSegmentsSelector).length > 0) {
        $($this._sSegmentsSelector).change(function () {
            $this.reloadData();
        });
    }
   
    $($this._sDatePickerSelector).daterangepicker({
        opens: 'left',
        locale: {
            "format": "DD/MM/YYYY"
        },
    }, function (start, end, label) {
        $this.reloadData();
    });
    $this.reloadData();
}

BxMassMailerChart.prototype.reloadData = function () {
    var $this = this;
    bx_loading($($this._sContainerDataSelector), true);
    var sStartDate = $($this._sDatePickerSelector).length > 0 ? $($this._sDatePickerSelector).data('daterangepicker').startDate.format('YYYY-MM-DD') : '-';
    var sEndDate = $($this._sDatePickerSelector).length > 0 ? $($this._sDatePickerSelector).data('daterangepicker').endDate.format('YYYY-MM-DD') : '-';
    var sReport = $($this._sReportSelector).length > 0 ? $($this._sReportSelector).val() : $this._sReportName;
    var sSegment = $($this._sSegmentsSelector).length > 0 ? $($this._sSegmentsSelector).val() : '-';
    $.getJSON($this._sActionsUri + 'GetReportsData/' + $this._sChartName + '/' + sReport + '/' + sStartDate + '/' + sEndDate + '/' + sSegment + '/', function (oData) {
        bx_loading($($this._sContainerDataSelector), false);
        var oDataForChart = oData.data || {};
        var oChartOptions = oData.options || {};
        if ($this._oChart)
            $this._oChart.destroy();
        $this._oChart = new Chart($($this._sCanvasSelector), {
            type: oData.type != undefined ? oData.type : 'line',
            data: oDataForChart,
            options: $.extend({}, $this._oChartOptionsDefault, oChartOptions)
        });
    });
};
/** @} */
