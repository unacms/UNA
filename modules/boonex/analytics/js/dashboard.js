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
            sName = oTarget.getAttribute('data-bx-analytics-open');
            var sValue = oTarget.getAttribute('data-bx-analytics-value');
            $this.setUrlParam(sName, sValue);
            $this.reload(oBlock, false).then(function (oNew) {
                $this.focusAfterOpen(oNew, sName, sValue);
            });
            return;
        }

        if ((oTarget = oEvent.target.closest('[data-bx-analytics-action]'))) {
            $this.runAction(oTarget);
            return;
        }

        if ((oTarget = oEvent.target.closest('[data-bx-analytics-filter]'))) {
            // the platform has a parameter of its own (the filter bar's select), not f[platform]
            sName = oTarget.getAttribute('data-bx-analytics-filter');
            $this.setParam(sName === 'platform' ? 'platform' : 'f[' + sName + ']', oTarget.getAttribute('data-bx-analytics-value'));
            return;
        }

        if ((oTarget = oEvent.target.closest('[data-bx-analytics-unfilter]')))
            $this.setParam('f[' + oTarget.getAttribute('data-bx-analytics-unfilter') + ']', null);
    });

    document.addEventListener('submit', function (oEvent) {
        var oForm = oEvent.target.closest('[data-bx-analytics-form]');
        if (!oForm)
            return;

        oEvent.preventDefault();
        $this.submitForm(oForm);
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

    // without a timezone in the page URL the server takes the viewer's from a cookie, kept
    // here; only a page drawn before the cookie was set (or in another zone) loads again
    var sTz = this.getTimezone();
    var oUrl = new URL(window.location.href);
    if (!oUrl.searchParams.get('tz') && sTz) {
        var sRendered = this.getTimezoneCookie() || 'UTC';
        this.setTimezoneCookie(sTz);
        if (sTz !== sRendered) {
            this.setUrlParam('tz', sTz);
            this.reloadAll();
        }
    }
};

/**
 * The timezone cookie the server reads when a request has no `tz` (BxAnalyticsFilter).
 */
BxAnalyticsDashboard.prototype.getTimezoneCookie = function () {
    var aMatch = document.cookie.match(/(?:^|;\s*)bx_analytics_tz=([^;]*)/);
    try {
        return aMatch ? decodeURIComponent(aMatch[1]) : '';
    } catch (e) {
        return '';
    }
};

BxAnalyticsDashboard.prototype.setTimezoneCookie = function (sTz) {
    document.cookie = 'bx_analytics_tz=' + encodeURIComponent(sTz) + '; path=/; max-age=31536000; SameSite=Lax' + (window.location.protocol === 'https:' ? '; Secure' : '');
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

    return fetch(sUrl, {credentials: 'same-origin'})
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
                return null;
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

            return oNew;
        })
        .catch(function () {
            oBlock._bxAnalyticsBusy = false;
            oBlock.removeAttribute('aria-busy');
            oBlock.classList.remove('bx-analytics-loading');
            if (!bQuiet) {
                oBlock.classList.add('bx-analytics-failed');
                oBlock.setAttribute('data-bx-analytics-error', $this._aStrings.error || '');
            }

            return null;
        });
};

/**
 * Keyboard focus after a block opened something: the first field of a form it shows, or the
 * control for the same thing (a back or cancel leads to the control that opened it).
 */
BxAnalyticsDashboard.prototype.focusAfterOpen = function (oBlock, sName, sValue) {
    if (!oBlock)
        return;

    var oFocus = oBlock.querySelector('[data-bx-analytics-form] input:not([type="hidden"]), [data-bx-analytics-form] select');
    if (!oFocus && sValue)
        oFocus = oBlock.querySelector('[data-bx-analytics-open="' + sName + '"][data-bx-analytics-value="' + CSS.escape(sValue) + '"]');
    if (!oFocus)
        oFocus = oBlock.querySelector('[data-bx-analytics-open="' + sName + '"]');

    if (oFocus)
        oFocus.focus();
};

/**
 * Send a goal or funnel form; on success close the form and show the saved item.
 */
BxAnalyticsDashboard.prototype.submitForm = function (oForm) {
    var $this = this;
    var sKind = oForm.getAttribute('data-bx-analytics-form');
    var oBlock = oForm.closest('[data-bx-analytics-block]');
    var oError = oForm.querySelector('.bx-analytics-form-error');
    var oSubmit = oForm.querySelector('[type="submit"]');
    var sSaved = '';

    var oData = new FormData(oForm);
    oData.set('op', 'save');

    oSubmit.disabled = true;
    this.post(sKind, oData)
        .then(function (oResult) {
            if (!oResult.ok)
                throw new Error(oResult.error || $this._aStrings.error || '');

            sSaved = oResult.id ? String(oResult.id) : '';
            $this.setUrlParam('edit_' + sKind, null);
            if (sKind === 'funnel' && oResult.id)
                $this.setUrlParam('funnel', String(oResult.id));

            return $this.reload(oBlock, false);
        })
        .then(function (oNew) {
            $this.focusAfterOpen(oNew, 'edit_' + sKind, sSaved);
        })
        .catch(function (oException) {
            oSubmit.disabled = false;
            oError.textContent = oException.message || $this._aStrings.error || '';
            oError.hidden = false;
        });
};

/**
 * A button that changes data: delete a goal or a funnel after the viewer confirms it.
 */
BxAnalyticsDashboard.prototype.runAction = function (oButton) {
    var $this = this;
    var sKind = oButton.getAttribute('data-bx-analytics-action');
    var sConfirm = oButton.getAttribute('data-bx-analytics-confirm');
    if (sConfirm && !window.confirm(sConfirm))
        return;

    var oBlock = oButton.closest('[data-bx-analytics-block]');
    var oData = new FormData();
    oData.set('op', oButton.getAttribute('data-bx-analytics-op'));
    oData.set('id', oButton.getAttribute('data-bx-analytics-id'));
    oData.set('csrf_token', oButton.getAttribute('data-bx-analytics-csrf') || '');

    oButton.disabled = true;
    this.post(sKind, oData)
        .then(function (oResult) {
            if (!oResult.ok)
                throw new Error(oResult.error || '');

            if (sKind === 'funnel')
                $this.setUrlParam('funnel', null);

            return $this.reload(oBlock, false);
        })
        .then(function (oNew) {
            // a status change keeps the view: focus goes to the first action left
            var oAction = oNew && sKind === 'error_status' ? oNew.querySelector('[data-bx-analytics-action="error_status"]') : null;
            if (oAction)
                oAction.focus();
            else
                $this.focusAfterOpen(oNew, 'edit_' + sKind, 'new');
        })
        .catch(function (oException) {
            oButton.disabled = false;
            window.alert(oException.message || $this._aStrings.error || '');
        });
};

BxAnalyticsDashboard.prototype.post = function (sAction, oData) {
    var sUrl = this._sActionUrl + sAction + '/';

    return fetch(sUrl, {method: 'POST', body: oData, credentials: 'same-origin'})
        .then(function (oResponse) {
            return oResponse.json().catch(function () {
                return {error: ''};
            });
        });
};

BxAnalyticsDashboard.prototype.selectMetric = function (oButton) {
    var oBlock = oButton.closest('[data-bx-analytics-block]');
    oBlock.querySelectorAll('[data-bx-analytics-metric]').forEach(function (o) {
        o.setAttribute('aria-pressed', o === oButton ? 'true' : 'false');
    });

    this.setUrlParam('metric', oButton.getAttribute('data-bx-analytics-metric'));

    var oJson = oBlock.querySelector('.bx-analytics-chart-data');
    var oData = oJson ? this.getChartData(oJson) : null;
    if (oData) {
        oData.metric = oButton.getAttribute('data-bx-analytics-metric');
        this.drawChart(oJson, oData);
    }
};

/**
 * The data of a chart: JSON in a script element right after the chart's container.
 */
BxAnalyticsDashboard.prototype.getChartData = function (oJson) {
    if (!oJson._bxAnalyticsData) {
        try {
            oJson._bxAnalyticsData = JSON.parse(oJson.textContent);
        } catch (e) {
            return null;
        }
    }

    return oJson._bxAnalyticsData;
};

BxAnalyticsDashboard.prototype.drawCharts = function (oRoot) {
    var $this = this;
    var aJson = oRoot.querySelectorAll ? oRoot.querySelectorAll('.bx-analytics-chart-data') : [];
    Array.prototype.forEach.call(aJson, function (oJson) {
        var oData = $this.getChartData(oJson);
        if (oData)
            $this.drawChart(oJson, oData);
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

    oBlock.querySelectorAll('canvas').forEach(function (oCanvas) {
        if (oCanvas._bxAnalyticsChart) {
            oCanvas._bxAnalyticsChart.destroy();
            oCanvas._bxAnalyticsChart = null;
        }
    });
};

/**
 * Colours for the chart: the accent and a categorical palette, from the block's CSS.
 */
BxAnalyticsDashboard.prototype.getColors = function (oElement) {
    var oStyle = window.getComputedStyle(oElement);
    var get = function (sName, sDefault) {
        return oStyle.getPropertyValue(sName).trim() || sDefault;
    };

    var aPalette = [];
    for (var i = 1; i <= 8; i++)
        aPalette.push(get('--bx-analytics-c' + i, '#4f46e5'));

    return {
        accent: get('--bx-analytics-accent', '#4f46e5'),
        fill: get('--bx-analytics-accent-fill', 'rgba(79, 70, 229, 0.15)'),
        grid: get('--bx-analytics-grid', 'rgba(0, 0, 0, 0.08)'),
        muted: get('--bx-analytics-muted', '#6b7280'),
        good: get('--bx-analytics-good', '#047857'),
        bad: get('--bx-analytics-bad', '#b91c1c'),
        palette: aPalette
    };
};

/**
 * Several values over time (kind `series`: `series` of {label, points of {t, v, partial}})
 * as lines per category, the bucket in progress dashed.
 */
BxAnalyticsDashboard.prototype.getSeriesLines = function (oData) {
    var aSeries = oData.series || [];

    return {
        kind: 'lines',
        metric: oData.metric,
        bucket: oData.bucket,
        tz: oData.tz,
        legend: true,
        labels: aSeries.length ? aSeries[0].points.map(function (oPoint) { return oPoint.t; }) : [],
        datasets: aSeries.map(function (oSeries) {
            return {
                label: oSeries.label,
                values: oSeries.points.map(function (oPoint) { return oPoint.v; }),
                partial: oSeries.points.map(function (oPoint) { return !!oPoint.partial; })
            };
        })
    };
};

/**
 * Draw the chart a JSON element describes, in the canvas of the container before it.
 * Kinds: a metric over time (the overview, `series` with every metric), stacked bars per
 * category (`labels` and `datasets`), lines per category (`datasets`, kind `lines`), and
 * several values of one metric over time (kind `series`, the query).
 */
BxAnalyticsDashboard.prototype.drawChart = function (oJson, oData) {
    var oContainer = oJson.previousElementSibling;
    var oCanvas = oContainer ? oContainer.querySelector('canvas') : null;
    if (!oCanvas || typeof Chart === 'undefined')
        return;

    if (oCanvas._bxAnalyticsChart) {
        oCanvas._bxAnalyticsChart.destroy();
        oCanvas._bxAnalyticsChart = null;
    }

    var $this = this;
    var oColors = this.getColors(oContainer);
    var bReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (oData.kind === 'series')
        oData = this.getSeriesLines(oData);

    var sKind = oData.kind || 'metric';
    var sMetric = oData.metric || 'number';
    var oChart;

    var oScales = {
        x: {
            stacked: sKind === 'stacked',
            grid: {display: false},
            ticks: {color: oColors.muted, autoSkip: true, maxRotation: 0, maxTicksLimit: 8}
        },
        y: {
            stacked: sKind === 'stacked',
            beginAtZero: true,
            grid: {color: oColors.grid},
            border: {display: false},
            ticks: {
                color: oColors.muted,
                precision: sMetric === 'pages_per_session' ? 1 : (sMetric === 'cls' ? undefined : 0),
                callback: function (fValue) {
                    return $this.formatMetric(sMetric, fValue, oData);
                }
            }
        }
    };

    if (sKind === 'metric') {
        var aLabels = [], aValues = [], aPartial = [];
        oData.series.forEach(function (oPoint) {
            aLabels.push($this.formatBucket(oPoint.t, oData.bucket, oData.tz));
            aValues.push(oPoint.future ? null : oPoint[sMetric]);
            aPartial.push(!!oPoint.partial);
        });

        oChart = {
            type: 'line',
            data: {
                labels: aLabels,
                datasets: [{
                    label: oData.titles[sMetric],
                    data: aValues,
                    borderColor: oColors.accent,
                    backgroundColor: oColors.fill,
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
            legend: false,
            label: function (oContext) {
                return oData.titles[sMetric] + ': ' + $this.formatMetric(sMetric, oContext.parsed.y, oData);
            }
        };
    }
    else {
        oChart = {
            type: sKind === 'stacked' ? 'bar' : 'line',
            data: {
                labels: oData.labels.map(function (iTime) { return $this.formatBucket(iTime, oData.bucket || 'day', oData.tz || 'UTC'); }),
                datasets: oData.datasets.map(function (oSet, iIndex) {
                    // a set may ask for a meaning colour (good, bad) instead of the next in the palette
                    var sColor = oSet.tone && oColors[oSet.tone] ? oColors[oSet.tone] : oColors.palette[iIndex % oColors.palette.length];
                    return {
                        label: oSet.label,
                        data: oSet.values,
                        backgroundColor: sColor,
                        borderColor: sColor,
                        borderWidth: sKind === 'stacked' ? 0 : (oSet.dashed ? 1.5 : 2),
                        // reference lines, such as a metric's thresholds
                        borderDash: oSet.dashed ? [6, 4] : undefined,
                        spanGaps: false,
                        borderRadius: sKind === 'stacked' ? 2 : 0,
                        pointRadius: 0,
                        pointHoverRadius: sKind === 'stacked' ? 0 : 4,
                        tension: 0.3,
                        // the bucket still in progress is drawn dashed
                        segment: oSet.partial ? {
                            borderDash: function (oContext) {
                                return oSet.partial[oContext.p1DataIndex] ? [4, 4] : undefined;
                            }
                        } : undefined
                    };
                })
            },
            legend: oData.legend || oData.datasets.length > 1,
            label: function (oContext) {
                return oContext.dataset.label + ': ' + $this.formatMetric(sMetric, oContext.parsed.y, oData);
            }
        };
    }

    oCanvas._bxAnalyticsChart = new Chart(oCanvas, {
        type: oChart.type,
        data: oChart.data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: bReducedMotion ? false : {duration: 300},
            interaction: {mode: 'index', intersect: false},
            plugins: {
                legend: {
                    display: oChart.legend,
                    position: 'bottom',
                    labels: {color: oColors.muted, boxWidth: 12, boxHeight: 12}
                },
                tooltip: {
                    callbacks: {label: oChart.label}
                }
            },
            scales: oScales
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

BxAnalyticsDashboard.prototype.formatMetric = function (sMetric, fValue, oData) {
    if (fValue === null || fValue === undefined)
        return '';

    switch (sMetric) {
        // amounts in the site's default currency, which the chart data names
        case 'money':
            try {
                if (oData && oData.currency)
                    return new Intl.NumberFormat(document.documentElement.lang || undefined, {style: 'currency', currency: oData.currency, notation: Math.abs(fValue) >= 10000 ? 'compact' : 'standard', minimumFractionDigits: 0, maximumFractionDigits: Math.abs(fValue) >= 100 ? 0 : 2}).format(fValue);
            } catch (e) {
                // an unknown currency code: the number alone
            }
            break;

        case 'bounce_rate':
            return Math.round(fValue) + '%';

        // timings: 850ms, 2.40s
        case 'ms':
            return fValue >= 1000 ? (fValue / 1000).toFixed(2) + (this._aStrings.duration_s || 's') : Math.round(fValue) + (this._aStrings.ms || 'ms');

        // layout shift: a score
        case 'cls':
            return Number(fValue).toFixed(fValue && fValue < 0.1 ? 3 : 2);

        case 'pages_per_session':
            return Number(fValue).toFixed(1);

        case 'duration':
        case 'engaged':
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
