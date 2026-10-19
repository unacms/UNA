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
 * Studio tools of Analytics, for site administrators: the API playground, new analytics
 * pages, and the tracker checks in Setup. Every action is a POST with the form token; the
 * server renders any HTML, and report data is shown as text, never as HTML.
 */
function BxAnalyticsStudioTools(oOptions) {
    this._sActionUrl = oOptions.sActionUrl;
    this._aStrings = oOptions.aStrings || {};

    // a report's response is shown up to this many characters
    this._iMaxOutput = 1024 * 1024;

    var $this = this;
    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', function () { $this.init(); });
    else
        this.init();
}

BxAnalyticsStudioTools.prototype.init = function () {
    var $this = this;

    document.addEventListener('click', function (oEvent) {
        var oTarget;

        if ((oTarget = oEvent.target.closest('[data-bx-analytics-copy]'))) {
            $this.copy(oTarget);
            return;
        }

        if ((oTarget = oEvent.target.closest('[data-bx-analytics-setup]')))
            $this.runSetup(oTarget);
    });

    document.addEventListener('submit', function (oEvent) {
        var oForm;

        if ((oForm = oEvent.target.closest('[data-bx-analytics-api-form]'))) {
            oEvent.preventDefault();
            $this.runApi(oForm);
            return;
        }

        if ((oForm = oEvent.target.closest('[data-bx-analytics-dashboard-form]'))) {
            oEvent.preventDefault();
            $this.createDashboard(oForm);
        }
    });

    var oApi = document.querySelector('[data-bx-analytics-api-form]');
    if (oApi) {
        var fUpdate = function () { $this.updateApi(oApi); };
        oApi.querySelector('[data-bx-analytics-api-report]').addEventListener('change', fUpdate);
        oApi.querySelector('[data-bx-analytics-api-params]').addEventListener('input', fUpdate);
        fUpdate();
    }
};

/**
 * Copy the text of the element a button names, and say so for a moment.
 */
BxAnalyticsStudioTools.prototype.copy = function (oButton) {
    var oSource = document.getElementById(oButton.getAttribute('data-bx-analytics-copy'));
    if (!oSource)
        return;

    var sText = oSource.textContent;
    var fDone = function () {
        var sLabel = oButton.getAttribute('data-bx-analytics-copied');
        if (!sLabel)
            return;

        if (!oButton._bxAnalyticsLabel)
            oButton._bxAnalyticsLabel = oButton.textContent;
        oButton.textContent = sLabel;
        clearTimeout(oButton._bxAnalyticsTimer);
        oButton._bxAnalyticsTimer = setTimeout(function () {
            oButton.textContent = oButton._bxAnalyticsLabel;
        }, 2000);
    };

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(sText).then(fDone, function () {
            if (BxAnalyticsStudioTools.copyFallback(sText))
                fDone();
        });
        return;
    }

    if (BxAnalyticsStudioTools.copyFallback(sText))
        fDone();
};

/**
 * Copy without the Clipboard API (a page served over plain HTTP).
 */
BxAnalyticsStudioTools.copyFallback = function (sText) {
    var oArea = document.createElement('textarea');
    oArea.value = sText;
    oArea.setAttribute('readonly', '');
    oArea.style.position = 'fixed';
    oArea.style.opacity = '0';
    document.body.appendChild(oArea);
    oArea.select();

    var bCopied = false;
    try {
        bCopied = document.execCommand('copy');
    } catch (e) {
        bCopied = false;
    }
    document.body.removeChild(oArea);

    return bCopied;
};

/**
 * The parameters typed in the playground: an object, or null when it isn't valid JSON.
 */
BxAnalyticsStudioTools.prototype.getApiParams = function (oForm) {
    var sValue = oForm.querySelector('[data-bx-analytics-api-params]').value.trim();
    if (sValue === '')
        return {};

    try {
        var oParams = JSON.parse(sValue);
        return oParams && typeof oParams === 'object' && !Array.isArray(oParams) ? oParams : null;
    } catch (e) {
        return null;
    }
};

BxAnalyticsStudioTools.prototype.getApiCatalog = function (oForm) {
    var oTool = oForm.closest('.bx-analytics-api');
    var oJson = oTool ? oTool.querySelector('[data-bx-analytics-api-catalog]') : null;
    if (!oJson)
        return {root: '/', module: 'bx_analytics'};

    if (!oJson._bxAnalyticsData) {
        try {
            oJson._bxAnalyticsData = JSON.parse(oJson.textContent);
        } catch (e) {
            oJson._bxAnalyticsData = {root: '/', module: 'bx_analytics'};
        }
    }

    return oJson._bxAnalyticsData;
};

/**
 * Show the chosen report's parameters and write the call three ways.
 */
BxAnalyticsStudioTools.prototype.updateApi = function (oForm) {
    var sReport = oForm.querySelector('[data-bx-analytics-api-report]').value;
    var oInput = oForm.querySelector('[data-bx-analytics-api-params]');
    var oParams = this.getApiParams(oForm);
    var oCatalog = this.getApiCatalog(oForm);

    oForm.querySelectorAll('[data-bx-analytics-api-doc]').forEach(function (oDoc) {
        oDoc.hidden = oDoc.getAttribute('data-bx-analytics-api-doc') !== sReport;
    });

    if (oParams === null) {
        oInput.setAttribute('aria-invalid', 'true');
        return;
    }
    oInput.removeAttribute('aria-invalid');

    var sJson = JSON.stringify(oParams);
    var aCalls = {
        'bx-analytics-api-srv': "bx_srv('" + oCatalog.module + "', 'get_report', [" + this.toPhp(sReport) + ', ' + this.toPhp(oParams) + ']);',
        'bx-analytics-api-url': oCatalog.root + 'api.php?r=' + oCatalog.module + '/get_report&params=' + encodeURIComponent(JSON.stringify([sReport, oParams])),
        'bx-analytics-api-neo': '/api.php?r=' + oCatalog.module + '/get_report&params[]=' + encodeURIComponent(sReport) + '&params[]=' + encodeURIComponent(sJson)
    };

    Object.keys(aCalls).forEach(function (sId) {
        var oCode = document.querySelector('#' + sId + ' code');
        if (oCode)
            oCode.textContent = aCalls[sId];
    });
};

/**
 * A JSON value as a PHP literal: short arrays, single-quoted strings.
 */
BxAnalyticsStudioTools.prototype.toPhp = function (mixedValue) {
    var $this = this;

    if (mixedValue === null || mixedValue === undefined)
        return 'null';
    if (typeof mixedValue === 'boolean')
        return mixedValue ? 'true' : 'false';
    if (typeof mixedValue === 'number')
        return String(mixedValue);
    if (typeof mixedValue === 'string')
        return "'" + mixedValue.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
    if (Array.isArray(mixedValue))
        return '[' + mixedValue.map(function (m) { return $this.toPhp(m); }).join(', ') + ']';

    return '[' + Object.keys(mixedValue).map(function (sKey) {
        return $this.toPhp(sKey) + ' => ' + $this.toPhp(mixedValue[sKey]);
    }).join(', ') + ']';
};

/**
 * Run the report as the signed-in administrator and show api.php's answer as text.
 */
BxAnalyticsStudioTools.prototype.runApi = function (oForm) {
    var $this = this;
    var oError = oForm.querySelector('.bx-analytics-form-error');
    var oSubmit = oForm.querySelector('[type="submit"]');
    var oTool = oForm.closest('.bx-analytics-api');
    var oResult = oTool.querySelector('[data-bx-analytics-api-result]');
    var oOutput = oTool.querySelector('[data-bx-analytics-api-output]');
    var oMeta = oTool.querySelector('[data-bx-analytics-api-meta]');

    oError.hidden = true;
    if (this.getApiParams(oForm) === null) {
        oError.textContent = this._aStrings.bad_json || '';
        oError.hidden = false;
        oForm.querySelector('[data-bx-analytics-api-params]').focus();
        return;
    }

    var oData = new FormData(oForm);
    oSubmit.disabled = true;
    oMeta.textContent = this._aStrings.running || '';

    this.post('api', oData)
        .then(function (oResponse) {
            if (!oResponse.ok)
                throw new Error(oResponse.error || $this._aStrings.error || '');

            var sJson = JSON.stringify(oResponse.response, null, 2);
            var iBytes = typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(JSON.stringify(oResponse.response)).length : sJson.length;
            var bTruncated = sJson.length > $this._iMaxOutput;

            oOutput.textContent = bTruncated ? sJson.slice(0, $this._iMaxOutput) + '\n…' : sJson;
            oMeta.textContent = ($this._aStrings.meta || '')
                .replace('{status}', String(oResponse.response.status))
                .replace('{ms}', String(oResponse.ms))
                .replace('{size}', $this.formatBytes(iBytes)) + (bTruncated ? ' ' + ($this._aStrings.truncated || '') : '');
            oResult.hidden = false;
        })
        .catch(function (oException) {
            oMeta.textContent = '';
            oError.textContent = oException.message || $this._aStrings.error || '';
            oError.hidden = false;
        })
        .then(function () {
            oSubmit.disabled = false;
        })
        .catch(function () {}); // nothing is left to fail: the catch above reports errors
};

BxAnalyticsStudioTools.prototype.formatBytes = function (iBytes) {
    var sLang = document.documentElement.lang || undefined;
    try {
        if (iBytes >= 1024 * 1024)
            return new Intl.NumberFormat(sLang, {maximumFractionDigits: 1}).format(iBytes / 1024 / 1024) + ' MB';
        if (iBytes >= 1024)
            return new Intl.NumberFormat(sLang, {maximumFractionDigits: 1}).format(iBytes / 1024) + ' KB';
    } catch (e) {
        // a plain number below
    }

    return iBytes + ' B';
};

/**
 * Create an analytics page and open it in the page builder.
 */
BxAnalyticsStudioTools.prototype.createDashboard = function (oForm) {
    var $this = this;
    var oError = oForm.querySelector('.bx-analytics-form-error');
    var oSubmit = oForm.querySelector('[type="submit"]');
    var oTitle = oForm.querySelector('[name="title"]');

    oError.hidden = true;
    if (!oTitle.value.trim()) {
        oTitle.setAttribute('aria-invalid', 'true');
        oTitle.focus();
        return;
    }
    oTitle.removeAttribute('aria-invalid');

    oSubmit.disabled = true;
    this.post('dashboard_create', new FormData(oForm))
        .then(function (oResponse) {
            if (!oResponse.ok || !oResponse.url)
                throw new Error(oResponse.error || $this._aStrings.error || '');

            window.location.href = oResponse.url;
        })
        .catch(function (oException) {
            oSubmit.disabled = false;
            oError.textContent = oException.message || $this._aStrings.error || '';
            oError.hidden = false;
        });
};

/**
 * Setup: check this browser (stores nothing) or send a test event (stores a visit).
 */
BxAnalyticsStudioTools.prototype.runSetup = function (oButton) {
    var $this = this;
    var sAction = oButton.getAttribute('data-bx-analytics-setup');
    var oTool = oButton.closest('.bx-analytics-setup');
    var oResult = oTool.querySelector('[data-bx-analytics-setup-result]');

    var oData = new FormData();
    oData.set('csrf_token', oButton.getAttribute('data-bx-analytics-csrf') || '');

    oButton.disabled = true;
    this.post(sAction, oData)
        .then(function (oResponse) {
            if (!oResponse.ok)
                throw new Error(oResponse.error || $this._aStrings.error || '');

            if (sAction === 'check') {
                // rendered and escaped by the server
                oResult.innerHTML = oResponse.html;
                return;
            }

            oResult.textContent = oResponse.message || '';
            var oStatus = oTool.querySelector('[data-bx-analytics-setup-status]');
            if (oStatus && oResponse.html) {
                oStatus.innerHTML = oResponse.html;
                if (typeof bx_time === 'function')
                    bx_time(undefined, false, oStatus);
            }
        })
        .catch(function (oException) {
            oResult.textContent = oException.message || $this._aStrings.error || '';
        })
        .then(function () {
            oButton.disabled = false;
        })
        .catch(function () {}); // nothing is left to fail: the catch above reports errors
};

BxAnalyticsStudioTools.prototype.post = function (sAction, oData) {
    return fetch(this._sActionUrl + sAction + '/', {method: 'POST', body: oData, credentials: 'same-origin'})
        .then(function (oResponse) {
            return oResponse.json().catch(function () {
                return {error: ''};
            });
        });
};

/** @} */
