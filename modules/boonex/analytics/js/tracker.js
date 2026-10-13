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
 * Pageviews, engaged time, custom events, errors and web vitals from the classic UI.
 *
 * Sends a pageview when a page loads and after every htmx navigation (not on preload), and the
 * time the page was visible when it is hidden or left. Custom events:
 *     bx_analytics.track('signup_click', {plan: 'pro'});
 * Clicks on links to other sites and to files are sent as the custom events `outbound_link` and
 * `file_download`, with the link (without its query string) in the `link` property.
 * Errors the page catches itself:
 *     bx_analytics.trackError(oError);
 * Uncaught errors, unhandled rejections, failed htmx requests (500 and up) and the site's own
 * scripts and styles that fail to load are sent when the site tracks errors: the same error
 * once per page view with a count of repeats, at most 10 different ones, without query strings.
 * Web vitals (TTFB, FCP, LCP, CLS, INP) are measured on a share of page loads and sent once,
 * with the time the page was visible; an htmx navigation sends its load time, CLS and INP.
 * Stores nothing in the browser unless the site uses persistent visitor ids: then a random id in
 * localStorage, and in the bx_analytics_vid cookie for the site's own requests, so sign-ups and
 * other actions join this browser's visit. To stop counting
 * your own visits in this browser: localStorage.setItem('bx_analytics_ignore', '1').
 */
(function (window, document) {
    'use strict';

    var oScript = document.currentScript || document.querySelector('script[data-bx-analytics-endpoint]');
    if (!oScript || window.bx_analytics_tracker)
        return;

    var sEndpoint = oScript.getAttribute('data-bx-analytics-endpoint');
    var sPlatform = oScript.getAttribute('data-bx-analytics-platform') || 'core-web';
    var bPersistent = oScript.getAttribute('data-bx-analytics-identity') === 'persistent';
    var bRespectDnt = oScript.getAttribute('data-bx-analytics-dnt') === '1';
    var bTrackErrors = oScript.getAttribute('data-bx-analytics-errors') === '1';
    var iVitalsSample = parseInt(oScript.getAttribute('data-bx-analytics-vitals') || '0', 10) || 0;

    var oNavigator = window.navigator || {};
    var oPerformance = window.performance;

    function storageGet(sKey) {
        try {
            return window.localStorage.getItem(sKey);
        } catch (e) {
            return null;
        }
    }

    function isDisabled() {
        if (!sEndpoint || oNavigator.webdriver)
            return true;
        if (bRespectDnt && (oNavigator.doNotTrack === '1' || window.doNotTrack === '1' || oNavigator.globalPrivacyControl === true))
            return true;
        return storageGet('bx_analytics_ignore') === '1';
    }

    function getVisitorId() {
        if (!bPersistent)
            return '';

        var sId = storageGet('bx_analytics_vid');
        if (sId && /^[a-f0-9]{32}$/.test(sId))
            return sId;

        sId = '';
        var aBytes = new Uint8Array(16);
        (window.crypto || window.msCrypto).getRandomValues(aBytes);
        for (var i = 0; i < aBytes.length; i++)
            sId += ('0' + aBytes[i].toString(16)).slice(-2);

        try {
            window.localStorage.setItem('bx_analytics_vid', sId);
        } catch (e) {
            return '';
        }

        return sId;
    }

    var bDisabled = isDisabled();
    var sVisitorId = bDisabled ? '' : getVisitorId();

    /**
     * The visitor id for the site's own requests (persistent mode), or none: a cookie left
     * from persistent mode, or from before tracking was turned off here, is removed.
     */
    function setVisitorCookie(sId) {
        var sCookie = 'bx_analytics_vid=' + sId + '; path=/; SameSite=Lax; max-age=' + (sId ? 34560000 : 0);
        if (window.location.protocol === 'https:')
            sCookie += '; Secure';
        try {
            document.cookie = sCookie;
        } catch (e) {
            // cookies blocked: site actions are counted outside the visit
        }
    }

    function hasVisitorCookie() {
        try {
            return /(?:^|;\s*)bx_analytics_vid=/.test(document.cookie || '');
        } catch (e) {
            return false;
        }
    }

    if (sVisitorId)
        setVisitorCookie(sVisitorId);
    else if (hasVisitorCookie())
        setVisitorCookie('');
    var sReferrer = document.referrer;
    var sCurrentUrl = '';
    var iVisibleSince = 0;
    var iEngaged = 0;

    function send(aHits, bLeaving) {
        if (bDisabled)
            return;

        // errors waiting for their batch go with whatever is sent
        aHits = aHits.concat(takeErrors(bLeaving));
        if (!aHits.length)
            return;

        var oPayload = {
            platform: sPlatform,
            language: oNavigator.language || '',
            screen: window.screen ? window.screen.width + 'x' + window.screen.height : '',
            hits: aHits
        };
        if (sReferrer)
            oPayload.referrer = sReferrer;
        if (sVisitorId)
            oPayload.vid = sVisitorId;

        var sBody = JSON.stringify(oPayload);

        // text/plain keeps the beacon a simple request
        if (oNavigator.sendBeacon && oNavigator.sendBeacon(sEndpoint, new Blob([sBody], {type: 'text/plain'})))
            return;

        if (window.fetch)
            window.fetch(sEndpoint, {method: 'POST', body: sBody, keepalive: true, credentials: 'same-origin', headers: {'Content-Type': 'text/plain'}}).catch(function () {});
    }

    function engagedNow() {
        var iTotal = iEngaged;
        if (iVisibleSince)
            iTotal += Date.now() - iVisibleSince;
        return iTotal;
    }

    function leaveHit() {
        var iMs = engagedNow();
        iEngaged = 0;
        iVisibleSince = document.visibilityState === 'visible' ? Date.now() : 0;

        return iMs > 0 && sCurrentUrl ? {type: 'leave', url: sCurrentUrl, engaged: iMs} : null;
    }

    /**
     * What a page left behind: engaged time and its vitals, sent together.
     */
    function leaveHits() {
        var aHits = [];
        var oLeave = leaveHit();
        if (oLeave)
            aHits.push(oLeave);

        var oVitals = takeVitals();
        if (oVitals)
            aHits.push(oVitals);

        return aHits;
    }

    function pageview(sNav) {
        var sUrl = window.location.href;
        if (sUrl === sCurrentUrl)
            return;

        var aHits = [];
        var bFirst = !sCurrentUrl;
        if (!bFirst) {
            aHits = leaveHits().concat(takeErrors(true));
            resetErrors();
            startSoftView(sNav || 'soft');
        }

        // after the first page, the referrer of a page is the page before it
        if (sCurrentUrl)
            sReferrer = sCurrentUrl;

        sCurrentUrl = sUrl;
        aHits.push({type: 'pageview', url: sUrl, title: document.title});

        send(aHits);
    }

    /*
     * Errors
     */

    var MAX_ERRORS = 10;
    var oErrors = {};
    var aErrorKeys = [];
    var iErrorTimer = 0;

    function isSameOrigin(sUrl) {
        try {
            return new URL(sUrl, window.location.href).origin === window.location.origin;
        } catch (e) {
            return false;
        }
    }

    /**
     * A URL without its query string and fragment (only the page parameters `i` and `r` stay),
     * and without the site's own origin.
     */
    function cleanUrl(sUrl) {
        var oUrl;
        try {
            oUrl = new URL(sUrl, window.location.href);
        } catch (e) {
            return String(sUrl || '').replace(/[?#].*$/, '');
        }

        var aKeep = [];
        ['i', 'r'].forEach(function (sKey) {
            var sValue = oUrl.searchParams.get(sKey);
            if (sValue)
                aKeep.push(sKey + '=' + encodeURIComponent(sValue).replace(/%2F/gi, '/'));
        });

        return (oUrl.origin === window.location.origin ? '' : oUrl.origin) + oUrl.pathname + (aKeep.length ? '?' + aKeep.join('&') : '');
    }

    function pageUrl() {
        var sPath = cleanUrl(window.location.href);
        return window.location.origin + sPath;
    }

    /**
     * Text with every URL in it cleaned; a stack frame's :line:column stays.
     */
    function cleanText(s) {
        return String(s || '').replace(/\b(?:https?|wss?):\/\/[^\s()<>"'`]+/gi, function (sUrl) {
            var aPosition = sUrl.match(/(:\d+){1,2}$/);
            var sPosition = aPosition ? aPosition[0] : '';
            return cleanUrl(sPosition ? sUrl.slice(0, -sPosition.length) : sUrl) + sPosition;
        });
    }

    function isExtension(s) {
        return /\b[a-z-]*extension:\/\//i.test(String(s || ''));
    }

    /**
     * At most 30 frames, without the frames of browser extensions.
     */
    function cleanStack(sStack) {
        if (typeof sStack !== 'string' || !sStack)
            return '';

        return cleanText(sStack.split('\n').filter(function (sLine) {
            return sLine.trim() !== '' && !isExtension(sLine);
        }).slice(0, 30).join('\n')).slice(0, 8000);
    }

    /**
     * Message and stack of whatever was thrown.
     */
    function describe(mixedError, sPrefix) {
        if (mixedError && typeof mixedError === 'object' && typeof mixedError.message === 'string')
            return {message: (mixedError.name ? mixedError.name + ': ' : '') + mixedError.message, stack: mixedError.stack};

        // an object that is no Error: its kind and keys, not its values (a form or an API
        // payload would carry what someone typed)
        var sText;
        try {
            if (Array.isArray(mixedError))
                sText = 'Array(' + mixedError.length + ')';
            else if (mixedError && typeof mixedError === 'object') {
                var aKeys = Object.keys(mixedError);
                sText = (mixedError.constructor && mixedError.constructor.name || 'Object') + '{' + aKeys.slice(0, 10).join(',') + (aKeys.length > 10 ? ',...' : '') + '}';
            }
            else
                sText = String(mixedError);
        } catch (e) {
            sText = Object.prototype.toString.call(mixedError);
        }

        return {message: (sPrefix || '') + String(sText).slice(0, 200), stack: ''};
    }

    function captureError(sKind, oData) {
        if (bDisabled || !bTrackErrors)
            return;

        var sStack = cleanStack(oData.stack);
        var sMessage = cleanText(oData.message).trim().slice(0, 500);
        var sSource = cleanText(oData.source || '');
        if (!sMessage || (/^Script error\.?$/i.test(sMessage) && !sStack))
            return;

        // an extension's error, or one whose stack was all extension frames
        if (isExtension(oData.source) || (oData.stack && !sStack && isExtension(oData.stack)))
            return;

        var sKey = [sKind, sMessage, sSource, oData.line || 0].join('|');
        var oItem = oErrors[sKey];
        if (!oItem) {
            if (aErrorKeys.length >= MAX_ERRORS)
                return;

            aErrorKeys.push(sKey);
            oItem = oErrors[sKey] = {
                hit: {
                    type: 'error',
                    url: pageUrl(),
                    kind: sKind,
                    message: sMessage,
                    source: sSource || undefined,
                    line: oData.line || undefined,
                    col: oData.col || undefined,
                    stack: sStack || undefined,
                    status: oData.status || undefined,
                    fatal: oData.fatal ? 1 : undefined
                },
                pending: 0,
                sent: false,
                time: 0
            };
        }

        oItem.pending = Math.min(100, oItem.pending + 1);
        oItem.time = Date.now();

        // a new error goes out within 2 seconds; its repeats go with the page's last beacon
        if (!oItem.sent && !iErrorTimer)
            iErrorTimer = setTimeout(function () {
                iErrorTimer = 0;
                send([]);
            }, 2000);
    }

    /**
     * Error hits to send: new errors, and the repeats of sent ones when the page is left.
     */
    function takeErrors(bLeaving) {
        var aHits = [];
        aErrorKeys.forEach(function (sKey) {
            var oItem = oErrors[sKey];
            if (!oItem.pending || (oItem.sent && !bLeaving))
                return;

            var oHit = {};
            for (var sField in oItem.hit)
                oHit[sField] = oItem.hit[sField];
            oHit.repeats = oItem.pending;
            oHit.age = Math.max(0, Date.now() - oItem.time);

            oItem.pending = 0;
            oItem.sent = true;
            aHits.push(oHit);
        });

        return aHits;
    }

    function resetErrors() {
        oErrors = {};
        aErrorKeys = [];
    }

    function onHttpError(oEvent) {
        var oDetail = oEvent.detail || {};
        var oCtx = oDetail.ctx || {};
        var iStatus = oCtx.response ? oCtx.response.status : (oDetail.xhr ? oDetail.xhr.status : 0);
        if (!iStatus || iStatus < 500)
            return;

        var sUrl = oCtx.request && oCtx.request.action ? oCtx.request.action : (oDetail.pathInfo && oDetail.pathInfo.requestPath ? oDetail.pathInfo.requestPath : (oDetail.xhr && oDetail.xhr.responseURL) || '');
        var sPath = cleanUrl(sUrl);
        captureError('http', {message: 'HTTP ' + iStatus + ' ' + sPath, source: sPath, status: iStatus});
    }

    /*
     * Web vitals
     */

    // a roll in [0, 100) from the CSPRNG getVisitorId() uses; no vitals without one
    var oCrypto = window.crypto || window.msCrypto;
    var fVitalsRoll = oCrypto && oCrypto.getRandomValues ? oCrypto.getRandomValues(new Uint32Array(1))[0] / 4294967296 * 100 : 100;
    var bVitals = !bDisabled && iVitalsSample > 0 && fVitalsRoll < iVitalsSample && typeof window.PerformanceObserver === 'function' && !!oPerformance && typeof oPerformance.now === 'function';
    var aSupported = bVitals && window.PerformanceObserver.supportedEntryTypes ? window.PerformanceObserver.supportedEntryTypes : [];
    var oView = null;
    var aObservers = [];
    var iFirstHidden = document.visibilityState === 'hidden' ? 0 : Infinity;
    var iSoftStart = 0;
    var iLastSettle = 0;

    function getNavigation() {
        var aEntries = oPerformance && oPerformance.getEntriesByType ? oPerformance.getEntriesByType('navigation') : [];
        return aEntries && aEntries[0] ? aEntries[0] : null;
    }

    function getActivationStart() {
        var oNavigation = getNavigation();
        return oNavigation && oNavigation.activationStart > 0 ? oNavigation.activationStart : 0;
    }

    function newView(sNav, iStart, bHard) {
        oView = {nav: sNav, url: pageUrl(), start: iStart, hard: bHard, metrics: {}, lcpDone: !bHard, cls: 0, clsWindow: 0, clsFirst: 0, clsLast: 0, inp: {}, interactions: 0, waitLoad: false, sent: false};
    }

    function startSoftView(sNav) {
        if (!bVitals)
            return;

        // the navigation's request, when htmx made one for it a moment ago
        var iNow = oPerformance.now();
        var iStart = iSoftStart && iNow - iSoftStart < 30000 ? iSoftStart : 0;
        iSoftStart = 0;

        newView(sNav, iStart || iNow, false);
        if (iStart && iLastSettle > iStart)
            oView.metrics.screen_load = iLastSettle - iStart;
        else if (iStart)
            oView.waitLoad = true;
    }

    function observe(sType, fCallback, oOptions) {
        if (aSupported.indexOf(sType) === -1)
            return false;

        try {
            var oParams = {type: sType, buffered: true};
            for (var sKey in oOptions || {})
                oParams[sKey] = oOptions[sKey];

            var oObserver = new window.PerformanceObserver(function (oList) {
                oList.getEntries().forEach(fCallback);
            });
            oObserver.observe(oParams);
            aObservers.push({observer: oObserver, callback: fCallback});
        } catch (e) {
            return false;
        }

        return true;
    }

    /**
     * Entries recorded but not yet delivered (observers are called in a later task), so the
     * last shifts, interaction and paint count before a view's vitals are read.
     */
    function flushObservers() {
        aObservers.forEach(function (oItem) {
            try {
                oItem.observer.takeRecords().forEach(oItem.callback);
            } catch (e) {}
        });
    }

    function onInteraction(oEntry) {
        if (!oView || !oEntry.interactionId || oEntry.startTime < oView.start)
            return;

        var iId = oEntry.interactionId;
        if (oView.inp[iId] === undefined)
            oView.interactions++;
        if (oView.inp[iId] === undefined || oEntry.duration > oView.inp[iId])
            oView.inp[iId] = oEntry.duration;

        // only the longest ones matter: keep the list short
        var aIds = Object.keys(oView.inp);
        if (aIds.length > 50) {
            aIds.sort(function (a, b) { return oView.inp[b] - oView.inp[a]; });
            aIds.slice(10).forEach(function (sId) { delete oView.inp[sId]; });
        }
    }

    /**
     * The view's vitals hit, once; null when nothing was measured.
     */
    function takeVitals() {
        if (!oView || oView.sent)
            return null;
        flushObservers();
        oView.sent = true;

        var oMetrics = {};
        for (var sKey in oView.metrics)
            oMetrics[sKey] = oView.metrics[sKey];

        if (oView.hard) {
            var oNavigation = getNavigation();
            if (oNavigation && oNavigation.responseStart > 0)
                oMetrics.ttfb = Math.max(0, oNavigation.responseStart - getActivationStart());
        }

        if (aSupported.indexOf('layout-shift') !== -1)
            oMetrics.cls = Math.round(oView.cls * 10000) / 10000;

        // INP: the longest interaction, or a high percentile of many (one in 50 left out)
        var aDurations = Object.keys(oView.inp).map(function (sId) { return oView.inp[sId]; }).sort(function (a, b) { return b - a; });
        var iCount = Math.max(oView.interactions, oView.hard && oPerformance.interactionCount ? oPerformance.interactionCount : 0);
        if (aDurations.length)
            oMetrics.inp = aDurations[Math.min(aDurations.length - 1, Math.min(9, Math.floor(iCount / 50)))];

        var bAny = false;
        for (sKey in oMetrics) {
            if (sKey !== 'cls')
                oMetrics[sKey] = Math.round(oMetrics[sKey]);
            bAny = true;
        }

        return bAny ? {type: 'vitals', url: oView.url, nav: oView.nav, metrics: oMetrics} : null;
    }

    function stopLcp() {
        if (!oView || oView.lcpDone)
            return;
        // a paint before the input may not be delivered yet
        flushObservers();
        oView.lcpDone = true;
    }

    function startVitals() {
        var oNavigation = getNavigation();
        var sNav = oNavigation && oNavigation.type ? String(oNavigation.type).replace('-', '_') : 'navigate';
        if (document.prerendering || getActivationStart() > 0)
            sNav = 'prerender';

        newView(sNav, 0, true);

        observe('paint', function (oEntry) {
            if (oView && oView.hard && oEntry.name === 'first-contentful-paint' && oEntry.startTime < iFirstHidden)
                oView.metrics.fcp = Math.max(0, oEntry.startTime - getActivationStart());
        });

        // the largest paint until the visitor first clicks or types, or leaves
        observe('largest-contentful-paint', function (oEntry) {
            if (oView && oView.hard && !oView.lcpDone && oEntry.startTime < iFirstHidden)
                oView.metrics.lcp = Math.max(0, oEntry.startTime - getActivationStart());
        });
        ['pointerdown', 'keydown'].forEach(function (sEvent) {
            window.addEventListener(sEvent, stopLcp, {capture: true, passive: true});
        });

        // layout shifts in session windows (less than 1 s apart, 5 s at most): the largest counts
        observe('layout-shift', function (oEntry) {
            if (!oView || oEntry.hadRecentInput || oEntry.startTime < oView.start)
                return;

            if (oView.clsWindow && oEntry.startTime - oView.clsLast < 1000 && oEntry.startTime - oView.clsFirst < 5000)
                oView.clsWindow += oEntry.value;
            else {
                oView.clsWindow = oEntry.value;
                oView.clsFirst = oEntry.startTime;
            }
            oView.clsLast = oEntry.startTime;
            oView.cls = Math.max(oView.cls, oView.clsWindow);
        });

        observe('event', onInteraction, {durationThreshold: 40});
        observe('first-input', onInteraction);

        // htmx navigations: from the page's request to its content settled
        var fRequest = function (oEvent) {
            var oCtx = oEvent.detail && oEvent.detail.ctx;
            var oHeaders = oCtx && oCtx.request && oCtx.request.headers;
            if (!oHeaders || !oHeaders['HX-Request-Type'] || oHeaders['HX-Request-Type'] === 'full')
                iSoftStart = oPerformance.now();
        };
        var fSettle = function () {
            iLastSettle = oPerformance.now();
            if (oView && oView.waitLoad) {
                oView.metrics.screen_load = iLastSettle - oView.start;
                oView.waitLoad = false;
            }
        };
        document.addEventListener('htmx:before:request', fRequest);
        document.addEventListener('htmx:beforeRequest', fRequest);
        document.addEventListener('htmx:after:settle', fSettle);
        document.addEventListener('htmx:afterSettle', fSettle);

        // a page restored from the back-forward cache is a new view without a load
        window.addEventListener('pageshow', function (oEvent) {
            if (oEvent.persisted)
                newView('restore', oPerformance.now(), false);
        });
    }

    window.bx_analytics_tracker = true;

    /**
     * Public API for custom events. `props` holds short scalar values.
     */
    window.bx_analytics = window.bx_analytics || {};
    window.bx_analytics.track = function (sName, oProps, oOptions) {
        if (!sName)
            return;

        send([{
            type: 'event',
            name: String(sName),
            url: window.location.href,
            props: oProps || undefined,
            value: oOptions && typeof oOptions.value === 'number' ? oOptions.value : undefined,
            non_interactive: oOptions && oOptions.nonInteractive ? 1 : undefined
        }]);
    };

    /**
     * An error the page caught itself. Options: `fatal` when the page can't go on.
     */
    window.bx_analytics.trackError = function (mixedError, oOptions) {
        var oError = describe(mixedError);
        captureError('js', {message: oError.message, stack: oError.stack, fatal: oOptions && oOptions.fatal});
    };

    if (bDisabled)
        return;

    iVisibleSince = document.visibilityState === 'visible' ? Date.now() : 0;

    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') {
            iFirstHidden = Math.min(iFirstHidden, oPerformance && oPerformance.now ? oPerformance.now() : 0);
            stopLcp();
            send(leaveHits(), true);
        }
        else if (!iVisibleSince) {
            iVisibleSince = Date.now();
        }
    });
    window.addEventListener('pagehide', function () {
        stopLcp();
        send(leaveHits(), true);
    });

    if (bTrackErrors) {
        // capture: script and stylesheet elements that fail to load don't bubble
        window.addEventListener('error', function (oEvent) {
            var oTarget = oEvent.target;
            if (oTarget && oTarget !== window && oTarget.nodeType === 1) {
                var sUrl = oTarget.tagName === 'SCRIPT' ? oTarget.src : (oTarget.tagName === 'LINK' && /stylesheet/i.test(oTarget.rel) ? oTarget.href : '');
                // the site's own files: a blocked tracker or ad elsewhere is not the site's error
                if (sUrl && isSameOrigin(sUrl))
                    captureError('resource', {message: 'Failed to load ' + (oTarget.tagName === 'SCRIPT' ? 'script' : 'stylesheet') + ' ' + cleanUrl(sUrl), source: sUrl});
                return;
            }

            captureError('js', {
                message: oEvent.message || (oEvent.error && oEvent.error.message) || '',
                source: oEvent.filename,
                line: oEvent.lineno,
                col: oEvent.colno,
                stack: oEvent.error && oEvent.error.stack
            });
        }, true);

        window.addEventListener('unhandledrejection', function (oEvent) {
            var oError = describe(oEvent.reason, 'Non-Error promise rejection: ');
            captureError('promise', {message: oError.message, stack: oError.stack});
        });

        document.addEventListener('htmx:response:error', onHttpError);
        document.addEventListener('htmx:responseError', onHttpError);
    }

    if (bVitals)
        startVitals();

    // htmx navigation pushes the new URL after swapping the page in (htmx 4 and older names)
    ['htmx:after:history:push', 'htmx:after:history:replace', 'htmx:pushedIntoHistory', 'htmx:replacedInHistory'].forEach(function (sEvent) {
        document.addEventListener(sEvent, function () {
            setTimeout(pageview, 0);
        });
    });
    window.addEventListener('popstate', function () {
        setTimeout(function () {
            pageview('back_forward');
        }, 0);
    });

    /*
     * Outbound links and downloads
     */

    var rDownload = /\.(pdf|zip|rar|7z|gz|tgz|tar|dmg|exe|msi|pkg|apk|ipa|docx?|xlsx?|pptx?|odt|ods|csv|txt|rtf|mp3|wav|flac|mp4|mov|avi|mkv|webm|epub)$/i;

    /**
     * A click on a link to another site (`outbound_link`) or to a file (`file_download`: a
     * `download` attribute or a file extension), sent as a custom event with the link without
     * its query string. The beacon survives the navigation the click starts.
     */
    function onLinkClick(oEvent) {
        if (oEvent.type === 'auxclick' && oEvent.button !== 1)
            return;

        var oLink = oEvent.target && oEvent.target.closest ? oEvent.target.closest('a[href]') : null;
        if (!oLink)
            return;

        var sHref = oLink.getAttribute('href') || '';
        if (!sHref || sHref.charAt(0) === '#' || /^(javascript|mailto|tel|sms|data|blob):/i.test(sHref))
            return;

        var oUrl;
        try {
            oUrl = new URL(oLink.href, window.location.href);
        } catch (e) {
            return;
        }
        if (oUrl.protocol !== 'http:' && oUrl.protocol !== 'https:')
            return;

        var sName = '';
        if (oLink.hasAttribute('download') || rDownload.test(oUrl.pathname))
            sName = 'file_download';
        else if (oUrl.origin !== window.location.origin)
            sName = 'outbound_link';
        if (!sName)
            return;

        send([{type: 'event', name: sName, url: window.location.href, props: {link: cleanUrl(oUrl.href)}}]);
    }

    // on the document, so links htmx swaps in later count too
    document.addEventListener('click', onLinkClick, true);
    document.addEventListener('auxclick', onLinkClick, true);

    pageview();
})(window, document);

/** @} */
