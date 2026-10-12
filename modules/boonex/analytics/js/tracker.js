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
 * Pageviews, engaged time and custom events from the classic UI.
 *
 * Sends a pageview when a page loads and after every htmx navigation (not on preload), and the
 * time the page was visible when it is hidden or left. Custom events:
 *     bx_analytics.track('signup_click', {plan: 'pro'});
 * Stores nothing in the browser unless the site uses persistent visitor ids. To stop counting
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

    var oNavigator = window.navigator || {};

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
    var sReferrer = document.referrer;
    var sCurrentUrl = '';
    var iVisibleSince = 0;
    var iEngaged = 0;

    function send(aHits) {
        if (bDisabled || !aHits.length)
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

    function pageview() {
        var sUrl = window.location.href;
        if (sUrl === sCurrentUrl)
            return;

        var aHits = [];
        var oLeave = leaveHit();
        if (oLeave)
            aHits.push(oLeave);

        // after the first page, the referrer of a page is the page before it
        if (sCurrentUrl)
            sReferrer = sCurrentUrl;

        sCurrentUrl = sUrl;
        aHits.push({type: 'pageview', url: sUrl, title: document.title});

        send(aHits);
    }

    function onVisibility() {
        if (document.visibilityState === 'hidden') {
            var oLeave = leaveHit();
            if (oLeave)
                send([oLeave]);
        }
        else if (!iVisibleSince) {
            iVisibleSince = Date.now();
        }
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

    if (bDisabled)
        return;

    iVisibleSince = document.visibilityState === 'visible' ? Date.now() : 0;
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', function () {
        var oLeave = leaveHit();
        if (oLeave)
            send([oLeave]);
    });

    // htmx navigation pushes the new URL after swapping the page in
    document.addEventListener('htmx:pushedIntoHistory', function () {
        setTimeout(pageview, 0);
    });
    document.addEventListener('htmx:replacedInHistory', function () {
        setTimeout(pageview, 0);
    });
    window.addEventListener('popstate', function () {
        setTimeout(pageview, 0);
    });

    pageview();
})(window, document);

/** @} */
