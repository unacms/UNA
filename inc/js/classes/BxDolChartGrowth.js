/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

function BxDolChartGrowth (oOptions) {
    this._sObjName = undefined == oOptions.sObjName ? 'oBxDolChartGrowth' : oOptions.sObjName;    // javascript object name, to run current object instance from onTimer
    this._sActionsUrl = oOptions.sRootUrl + 'chart.php'; // actions url address
    this._oRequestParams = oOptions.oRequestParams == undefined ? {} : oOptions.oRequestParams;

    this._sAnimationEffect = 'fade';
    this._iAnimationSpeed = 'slow';

    this._sKeyObjects = 'bx_chart_growth_objects';
    this._sKeyDateFrom = 'bx_chart_growth_date_from';
    this._sKeyDateTo = 'bx_chart_growth_date_to';
    this._sKeyGraph = 'bx_chart_growth_graph';

    this._sDateFormat = 'yy-mm-dd';
    this._oChart = null;
    this._oChartOptionsDefault = {};
    // the site's accent, the first chart series (bx_chart_series_colors), unless the options give colours
    this._sChartColorBorder = oOptions.sChartColorBorder;
    this._sChartColorBackground = oOptions.sChartColorBackground;
    this._sDateFromDefault = oOptions.sDateFrom;
    this._sDateToDefault = oOptions.sDateTo;

    var $this = this;
    $(document).ready(function() {
        $this._useLocalDates();
    	$this.loadData();
    });
}

/**
 * The default range ends today on the server's clock, which can be yesterday or tomorrow for the viewer: while the
 * fields still have the defaults, they show the viewer's own last 30 days up to today.
 */
BxDolChartGrowth.prototype._useLocalDates = function()
{
    var fIso = function(oDate) {
        return oDate.getFullYear() + '-' + ('0' + (oDate.getMonth() + 1)).slice(-2) + '-' + ('0' + oDate.getDate()).slice(-2);
    };
    var fSet = function(sId, sDefault, oDate) {
        var oInput = document.getElementById(sId);
        if(!oInput || !sDefault || oInput.value != sDefault)
            return;

        if(oInput._flatpickr)
            oInput._flatpickr.setDate(oDate, false);
        else
            oInput.value = fIso(oDate);
    };

    var oTo = new Date();
    var oFrom = new Date(oTo.getTime() - 30 * 24 * 60 * 60 * 1000);
    fSet(this._sKeyDateTo, this._sDateToDefault, oTo);
    fSet(this._sKeyDateFrom, this._sDateFromDefault, oFrom);
};

BxDolChartGrowth.prototype.loadData = function()
{
    var $this = this;
    var oGraph = $('#' + this._sKeyGraph);
    var oGraphWrp = oGraph.parents('div:first');
    var oGraphErr = oGraphWrp.find('.bx-chart-growth-graph-error').hide();

    $('#' + this._sKeyObjects).attr('disabled', true);

    bx_loading(oGraphWrp, true);

    $.get(
    	this._sActionsUrl,
        jQuery.extend({}, {
            object: $('#' + this._sKeyObjects).val(),
            action: 'load_data_by_interval',
            from: $('#' + $this._sKeyDateFrom).val(),
            to: $('#' + $this._sKeyDateTo).val()
    	}, this._oRequestParams),
    	function(oData) {
            $('#' + $this._sKeyObjects).attr('disabled', false);

            bx_loading(oGraphWrp, false);

            if(oData.error != undefined) {
            	if($this._oChart)
                    $this._oChart.destroy();

            	oGraphErr.html(oData.error).show();
                return;
            } 

            // hide date selector if chart doesn't support date range
            if (oData.hide_date_range) {
                $('#' + $this._sKeyDateFrom).parents('.bx-form-element-wrapper:first').fadeOut();
                $('#' + $this._sKeyDateTo).parents('.bx-form-element-wrapper:first').fadeOut();
            }
            else {
            	$('#' + $this._sKeyDateFrom).parents('.bx-form-element-wrapper:first').fadeIn();
            	$('#' + $this._sKeyDateTo).parents('.bx-form-element-wrapper:first').fadeIn();
            }

            var oChartOptions = oData.options || {};
            var oChartLabels = new Array();
            var oChartData = new Array();

            // create chart arrays
            if(oData.column_date !== false && oData.column_count !== false)
                for (var i in oData.data) {
                    var sDate = oData.data[i][oData.column_date];
                    var aDate = sDate.match(/(\d{4})-(\d{2})-(\d{2})/);
                    if(!aDate || !aDate[1] || !aDate[2] || !aDate[3])
                        continue;

                    oChartLabels[i] = sDate;
                    oChartData[i] = oData.data[i][oData.column_count];
                }

            if($this._oChart)
            	$this._oChart.destroy();

            bx_chart_theme_defaults();
	    	$this._oChart = new Chart(oGraph, {
	    		type: oData.type != undefined ? oData.type : 'line',
	    		data: {
	            	labels: oChartLabels,
	            	datasets: [{
	            		label: oData.title,
	            		data: oChartData,
	            		borderColor: $this._sChartColorBorder || bx_chart_series_colors(1)[0],
	            		backgroundColor: $this._sChartColorBackground || bx_chart_series_colors(1, 0.15)[0],
	            		fill: true
	            	}]
	            },
	    		options: $.extend({}, $this._oChartOptionsDefault, oChartOptions)
	    	});
    	},
    	'json'
    );
};

/** @} */
