/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Analytics Analytics
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Analytics blocks on a page share one set of filters kept in the page URL: range, tz,
 * platform, f[dimension] and the chart metric. Changing a filter reloads every block
 * from the server, which renders it from the same templates as the first page load.
 * A block's own state (its tab, its page) is kept in the URL too, as tab_<name> and
 * page_<name>, so a reload or a shared link shows the same thing.
 */
function BxAnalyticsDashboard(oOptions) {
    this._sActionUrl = oOptions.sActionUrl;
    this._aStrings = oOptions.aStrings || {};

    var $this = this;
    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', function () { $this.init(); });
    else
        this.init();
}

BxAnalyticsDashboard.prototype.init = function () {
    var $this = this;

    document.addEventListener('change', function (oEvent) {
        var oSelect = oEvent.target.closest('[data-bx-analytics-param]');
        if (oSelect)
            $this.setParam(oSelect.getAttribute('data-bx-analytics-param'), oSelect.value);
    });

    document.addEventListener('click', function (oEvent) {
        var oTarget, oBlock, sName;

        if ((oTarget = oEvent.target.closest('[data-bx-analytics-metric]'))) {
            $this.selectMetric(oTarget);
            return;
        }

        if ((oTarget = oEvent.target.closest('[data-bx-analytics-tab]'))) {
            oBlock = oTarget.closest('[data-bx-analytics-block]');
            sName = $this.getBlockName(oBlock);
            $this.setUrlParam('tab_' + sName, oTarget.getAttribute('data-bx-analytics-tab'));
            $this.setUrlParam('page_' + sName, null);
            $this.reload(oBlock, true);
            return;
        }

        if ((oTarget = oEvent.target.closest('[data-bx-analytics-pager]'))) {
            oBlock = oTarget.closest('[data-bx-analytics-block]');
            $this.setUrlParam('page_' + oTarget.getAttribute('data-bx-analytics-pager'), oTarget.getAttribute('data-bx-analytics-page'));
            $this.reload(oBlock, false);
            return;
        }

        if ((oTarget = oEvent.target.closest('[data-bx-analytics-open]'))) {
            oBlock = oTarget.closest('[data-bx-analytics-block]');
            $this.setUrlParam(oTarget.getAttribute('data-bx-analytics-open'), oTarget.getAttribute('data-bx-analytics-value'));
            $this.reload(oBlock, false);
            return;
        }

        if ((oTarget = oEvent.target.closest('[data-bx-analytics-filter]'))) {
            $this.setParam('f[' + oTarget.getAttribute('data-bx-analytics-filter') + ']', oTarget.getAttribute('data-bx-analytics-value'));
            return;
        }

        if ((oTarget = oEvent.target.closest('[data-bx-analytics-unfilter]')))
            $this.setParam('f[' + oTarget.getAttribute('data-bx-analytics-unfilter') + ']', null);
    });

    // arrow keys move between tabs, as in any tab list
    document.addEventListener('keydown', function (oEvent) {
        var oTab = oEvent.target.closest('[data-bx-analytics-tab]');
        if (!oTab || (oEvent.key !== 'ArrowRight' && oEvent.key !== 'ArrowLeft'))
            return;

        var aTabs = Array.prototype.slice.call(oTab.parentNode.querySelectorAll('[data-bx-analytics-tab]'));
        var iNext = (aTabs.indexOf(oTab) + (oEvent.key === 'ArrowRight' ? 1 : -1) + aTabs.length) % aTabs.length;
        aTabs[iNext].focus();
        aTabs[iNext].click();
        oEvent.preventDefault();
    });

    this.drawCharts(document);
    this.drawMaps(document);

    // blocks that follow live data reload themselves while the page is visible
    setInterval(function () {
        if (document.visibilityState !== 'visible')
            return;

        document.querySelectorAll('[data-bx-analytics-refresh]').forEach(function (oRefresh) {
            var oBlock = oRefresh.closest('[data-bx-analytics-block]');
            var iEvery = 1000 * parseInt(oRefresh.getAttribute('data-bx-analytics-refresh'), 10);
            if (oBlock && !oBlock._bxAnalyticsBusy && Date.now() - (oBlock._bxAnalyticsLoaded || $this._iStarted) >= iEvery)
                $this.reload(oBlock, false, true);
        });
    }, 5000);
    this._iStarted = Date.now();

    // the server rendered in UTC when the page URL had no timezone
    var sTz = this.getTimezone();
    var oUrl = new URL(window.location.href);
    if (!oUrl.searchParams.get('tz') && sTz && sTz !== 'UTC') {
        this.setUrlParam('tz', sTz);
        this.reloadAll();
    }
};

BxAnalyticsDashboard.prototype.getTimezone = function () {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch (e) {
        return 'UTC';
    }
};

/**
 * A block's own parameters (group, table...), set by the server.
 */
BxAnalyticsDashboard.prototype.getBlockParams = function (oBlock) {
    try {
        return JSON.parse(oBlock.getAttribute('data-bx-analytics-params') || '{}') || {};
    } catch (e) {
        return {};
    }
};

/**
 * The name a block keeps its tab and page under in the URL.
 */
BxAnalyticsDashboard.prototype.getBlockName = function (oBlock) {
    var oParams = this.getBlockParams(oBlock);
    return oParams.group || oParams.table || oBlock.getAttribute('data-bx-analytics-block');
};

/**
 * Set a filter parameter (null removes it) and reload every block; lists start again
 * from their first page.
 */
BxAnalyticsDashboard.prototype.setParam = function (sName, sValue) {
    var oUrl = new URL(window.location.href);
    Array.from(oUrl.searchParams.keys()).forEach(function (sKey) {
        if (sKey.indexOf('page_') === 0)
            oUrl.searchParams.delete(sKey);
    });
    window.history.replaceState(window.history.state, '', oUrl.toString());

    this.setUrlParam(sName, sValue);
    if (!new URL(window.location.href).searchParams.get('tz'))
        this.setUrlParam('tz', this.getTimezone());

    this.reloadAll();
};

BxAnalyticsDashboard.prototype.setUrlParam = function (sName, sValue) {
    var oUrl = new URL(window.location.href);
    if (sValue === null || sValue === '')
        oUrl.searchParams.delete(sName);
    else
        oUrl.searchParams.set(sName, sValue);

    window.history.replaceState(window.history.state, '', oUrl.toString());
};

BxAnalyticsDashboard.prototype.reloadAll = function () {
    var $this = this;
    document.querySelectorAll('[data-bx-analytics-block]').forEach(function (oBlock) {
        $this.reload(oBlock, false);
    });
};

/**
 * Replace a block with a fresh copy for the current URL parameters. A quiet reload (live
 * blocks) keeps the block as it is until the new copy arrives.
 */
BxAnalyticsDashboard.prototype.reload = function (oBlock, bKeepFocus, bQuiet) {
    var $this = this;
    var sReport = oBlock.getAttribute('data-bx-analytics-block');
    var oParams = new URL(window.location.href).searchParams;
    oParams.set('bp', oBlock.getAttribute('data-bx-analytics-params') || '{}');

    var sFocusTab = bKeepFocus && document.activeElement ? document.activeElement.getAttribute('data-bx-analytics-tab') : null;

    oBlock._bxAnalyticsBusy = true;
    if (!bQuiet) {
        oBlock.setAttribute('aria-busy', 'true');
        oBlock.classList.add('bx-analytics-loading');
    }

    // the module URL is m/analytics/ with permalinks and modules/?r=analytics/ without
    var sUrl = this._sActionUrl + 'report/' + sReport + '/';
    sUrl += (sUrl.indexOf('?') === -1 ? '?' : '&') + oParams.toString();

    fetch(sUrl, {credentials: 'same-origin'})
        .then(function (oResponse) {
            if (!oResponse.ok)
                throw new Error(oResponse.status);
            return oResponse.json();
        })
        .then(function (oData) {
            var oWrapper = document.createElement('div');
            oWrapper.innerHTML = oData.html;
            var oNew = oWrapper.firstElementChild;
            if (!oNew) {
                oBlock._bxAnalyticsBusy = false;
                return;
            }

            $this.destroyChart(oBlock);
            oBlock.replaceWith(oNew);
            oNew._bxAnalyticsLoaded = Date.now();
            $this.drawCharts(oNew);
            $this.drawMaps(oNew);
            if (typeof bx_time === 'function')
                bx_time(undefined, false, oNew);

            if (sFocusTab) {
                var oTab = oNew.querySelector('[data-bx-analytics-tab="' + sFocusTab + '"]');
                if (oTab)
                    oTab.focus();
            }
        })
        .catch(function () {
            oBlock._bxAnalyticsBusy = false;
            oBlock.removeAttribute('aria-busy');
            oBlock.classList.remove('bx-analytics-loading');
            if (!bQuiet) {
                oBlock.classList.add('bx-analytics-failed');
                oBlock.setAttribute('data-bx-analytics-error', $this._aStrings.error || '');
            }
        });
};

BxAnalyticsDashboard.prototype.selectMetric = function (oButton) {
    var oBlock = oButton.closest('[data-bx-analytics-block]');
    oBlock.querySelectorAll('[data-bx-analytics-metric]').forEach(function (o) {
        o.setAttribute('aria-pressed', o === oButton ? 'true' : 'false');
    });

    this.setUrlParam('metric', oButton.getAttribute('data-bx-analytics-metric'));

    var oData = this.getChartData(oBlock);
    if (oData) {
        oData.metric = oButton.getAttribute('data-bx-analytics-metric');
        this.destroyChart(oBlock);
        this.drawChart(oBlock, oData);
    }
};

BxAnalyticsDashboard.prototype.getChartData = function (oBlock) {
    var oJson = oBlock.querySelector('.bx-analytics-chart-data');
    if (!oJson)
        return null;

    if (!oBlock._bxAnalyticsData) {
        try {
            oBlock._bxAnalyticsData = JSON.parse(oJson.textContent);
        } catch (e) {
            return null;
        }
    }

    return oBlock._bxAnalyticsData;
};

BxAnalyticsDashboard.prototype.drawCharts = function (oRoot) {
    var $this = this;
    var aBlocks = oRoot.matches && oRoot.matches('[data-bx-analytics-block="overview"]') ? [oRoot] : oRoot.querySelectorAll('[data-bx-analytics-block="overview"]');
    Array.prototype.forEach.call(aBlocks, function (oBlock) {
        var oData = $this.getChartData(oBlock);
        if (oData)
            $this.drawChart(oBlock, oData);
    });
};

/**
 * Visitors on a Leaflet map: a circle per country (or place), its area by visitors.
 */
BxAnalyticsDashboard.prototype.drawMaps = function (oRoot) {
    if (typeof L === 'undefined')
        return;

    var aMaps = oRoot.querySelectorAll ? oRoot.querySelectorAll('.bx-analytics-map') : [];
    Array.prototype.forEach.call(aMaps, function (oElement) {
        if (oElement._bxAnalyticsMap)
            return;

        var oJson = oElement.parentNode.querySelector('.bx-analytics-map-data');
        var oData;
        try {
            oData = JSON.parse(oJson.textContent);
        } catch (e) {
            return;
        }

        var oMap = L.map(oElement, {worldCopyJump: true, minZoom: 1, scrollWheelZoom: false}).setView([25, 10], 2);
        oElement._bxAnalyticsMap = oMap;

        try {
            L.tileLayer.provider(oData.provider || 'OpenStreetMap.Mapnik').addTo(oMap);
        } catch (e) {
            L.tileLayer.provider('OpenStreetMap.Mapnik').addTo(oMap);
        }

        var sAccent = window.getComputedStyle(oElement).getPropertyValue('--bx-analytics-accent').trim() || '#4f46e5';
        var aItems = oData.points && oData.points.length ? oData.points : oData.countries;
        var iMax = 1;
        aItems.forEach(function (o) { iMax = Math.max(iMax, o.visitors); });

        // the whole world when there is little to show, otherwise just the places with visitors
        if (aItems.length > 1)
            oMap.fitBounds(L.latLngBounds(aItems.map(function (o) { return [o.lat, o.lng]; })), {padding: [30, 30], maxZoom: 5});
        else if (aItems.length === 1)
            oMap.setView([aItems[0].lat, aItems[0].lng], 4);

        aItems.forEach(function (o) {
            L.circleMarker([o.lat, o.lng], {
                radius: 4 + 26 * Math.sqrt(o.visitors / iMax),
                color: sAccent,
                weight: 1,
                fillColor: sAccent,
                fillOpacity: 0.35
            }).bindTooltip(function () {
                // place names come from request headers: text, never HTML
                var oTip = document.createElement('span');
                oTip.textContent = o.label + ': ' + o.visitors + ' ' + oData.visitors.toLowerCase();
                return oTip;
            }).addTo(oMap);
        });
    });
};

BxAnalyticsDashboard.prototype.destroyChart = function (oBlock) {
    var oMap = oBlock.querySelector('.bx-analytics-map');
    if (oMap && oMap._bxAnalyticsMap) {
        oMap._bxAnalyticsMap.remove();
        oMap._bxAnalyticsMap = null;
    }

    var oCanvas = oBlock.querySelector('canvas');
    if (oCanvas && oCanvas._bxAnalyticsChart) {
        oCanvas._bxAnalyticsChart.destroy();
        oCanvas._bxAnalyticsChart = null;
    }
};

BxAnalyticsDashboard.prototype.drawChart = function (oBlock, oData) {
    var oCanvas = oBlock.querySelector('canvas');
    if (!oCanvas || typeof Chart === 'undefined')
        return;

    var $this = this;
    var sMetric = oData.metric;
    var oStyle = window.getComputedStyle(oBlock);
    var sAccent = oStyle.getPropertyValue('--bx-analytics-accent').trim() || '#4f46e5';
    var sFill = oStyle.getPropertyValue('--bx-analytics-accent-fill').trim() || 'rgba(79, 70, 229, 0.15)';
    var sGrid = oStyle.getPropertyValue('--bx-analytics-grid').trim() || 'rgba(0, 0, 0, 0.08)';
    var sMuted = oStyle.getPropertyValue('--bx-analytics-muted').trim() || '#6b7280';

    var aLabels = [];
    var aValues = [];
    var aPartial = [];
    oData.series.forEach(function (oPoint) {
        aLabels.push($this.formatBucket(oPoint.t, oData.bucket, oData.tz));
        aValues.push(oPoint.future ? null : oPoint[sMetric]);
        aPartial.push(!!oPoint.partial);
    });

    var bReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    oCanvas._bxAnalyticsChart = new Chart(oCanvas, {
        type: 'line',
        data: {
            labels: aLabels,
            datasets: [{
                label: oData.titles[sMetric],
                data: aValues,
                borderColor: sAccent,
                backgroundColor: sFill,
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointRadius: 0,
                pointHoverRadius: 4,
                spanGaps: false,
                // the period still in progress is drawn dashed, so its low value doesn't read as a drop
                segment: {
                    borderDash: function (oContext) {
                        return aPartial[oContext.p1DataIndex] ? [4, 4] : undefined;
                    }
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: bReducedMotion ? false : {duration: 300},
            interaction: {mode: 'index', intersect: false},
            plugins: {
                legend: {display: false},
                tooltip: {
                    callbacks: {
                        label: function (oContext) {
                            return oData.titles[sMetric] + ': ' + $this.formatMetric(sMetric, oContext.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {display: false},
                    ticks: {color: sMuted, autoSkip: true, maxRotation: 0, maxTicksLimit: 8}
                },
                y: {
                    beginAtZero: true,
                    grid: {color: sGrid},
                    border: {display: false},
                    ticks: {
                        color: sMuted,
                        precision: sMetric === 'pages_per_session' ? 1 : 0,
                        callback: function (fValue) {
                            return $this.formatMetric(sMetric, fValue);
                        }
                    }
                }
            }
        }
    });
};

BxAnalyticsDashboard.prototype.formatBucket = function (iTime, sBucket, sTz) {
    var oDate = new Date(iTime * 1000);
    var oOptions = {timeZone: sTz || 'UTC'};

    if (sBucket === 'hour') {
        oOptions.hour = 'numeric';
        oOptions.minute = '2-digit';
    }
    else if (sBucket === 'month') {
        oOptions.month = 'short';
        oOptions.year = 'numeric';
    }
    else {
        oOptions.month = 'short';
        oOptions.day = 'numeric';
    }

    try {
        return new Intl.DateTimeFormat(document.documentElement.lang || undefined, oOptions).format(oDate);
    } catch (e) {
        return oDate.toISOString().slice(0, sBucket === 'hour' ? 16 : 10);
    }
};

BxAnalyticsDashboard.prototype.formatMetric = function (sMetric, fValue) {
    if (fValue === null || fValue === undefined)
        return '';

    switch (sMetric) {
        case 'bounce_rate':
            return Math.round(fValue) + '%';

        case 'pages_per_session':
            return Number(fValue).toFixed(1);

        case 'duration':
            var iSeconds = Math.round(fValue);
            if (iSeconds < 60)
                return iSeconds + (this._aStrings.duration_s || 's');
            if (iSeconds < 3600)
                return Math.floor(iSeconds / 60) + (this._aStrings.duration_m || 'm') + ' ' + (iSeconds % 60) + (this._aStrings.duration_s || 's');
            return Math.floor(iSeconds / 3600) + (this._aStrings.duration_h || 'h') + ' ' + Math.floor((iSeconds % 3600) / 60) + (this._aStrings.duration_m || 'm');
    }

    try {
        return new Intl.NumberFormat(document.documentElement.lang || undefined, {notation: 'compact', maximumFractionDigits: 1}).format(fValue);
    } catch (e) {
        return String(fValue);
    }
};

/** @} */
