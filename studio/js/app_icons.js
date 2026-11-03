/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

/**
 * Animated app icons. The launcher tiles, the dock and the current app's tile in the header show app icons as images. An app
 * icon file (studio/template/images/icons/wi-*.svg, studio/template/images/modules/*.svg) carries its own animation, which its
 * style plays on hover or keyboard focus (:is(.icon:hover, .tile:hover .icon, .tile:focus-visible .icon)), and only when the SVG
 * is part of the page. So the first time an icon is pointed at or focused, its file (already in the browser cache) takes the
 * image's place, and a click plays the animation again. Files without an animation keep their image.
 */
(function() {
    var sHosts = '.bx-std-widget-link, .bx-menu-top-center li > a, .bx-menu-breadcrumb li.bx-menu-bc-page > a';
    var oFiles = {}; // url => promise of the file's markup, '' for a file without an animation, null when the request failed
    var iCopies = 0;

    // A failed request is forgotten, so the next hover asks again; a file without an animation is remembered as such.
    function load(sUrl) {
        if(!oFiles[sUrl])
            oFiles[sUrl] = fetch(sUrl, {credentials: 'same-origin'}).then(function(oResponse) {
                if(!oResponse.ok)
                    throw new Error(oResponse.status);

                return oResponse.text();
            }).then(function(s) {
                return s.indexOf('class="icon v-') != -1 ? s : '';
            }).catch(function() {
                delete oFiles[sUrl];
                return null;
            });

        return oFiles[sUrl];
    }

    // ids are unique per icon, not per copy: the dock and the launcher may both show one
    function ownIds(s) {
        var sSuffix = '-c' + (++iCopies);
        var aIds = [];
        s.replace(/\sid="([^"]+)"/g, function(sMatch, sId) {
            aIds.push(sId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        });
        if(!aIds.length)
            return s;

        return s.replace(new RegExp('(id="|#)(' + aIds.join('|') + ')(?=["\')])', 'g'), '$1$2' + sSuffix);
    }

    function inline(oHost) {
        var oImg = oHost.querySelector('img[src$=".svg"]');
        if(!oImg || oHost.bxAppIcon)
            return;

        oHost.bxAppIcon = true;
        load(oImg.src).then(function(s) {
            if(s === null)
                oHost.bxAppIcon = false; // try again on the next hover
            if(!s || !oImg.parentNode)
                return;

            var oTemplate = document.createElement('template');
            oTemplate.innerHTML = ownIds(s);
            var oSvg = oTemplate.content.querySelector('svg');
            if(!oSvg)
                return;

            oSvg.classList.add('bx-std-app-icon');
            oSvg.setAttribute('focusable', 'false');
            if(oImg.alt) {
                oSvg.setAttribute('role', 'img');
                oSvg.setAttribute('aria-label', oImg.alt);
            }
            else
                oSvg.setAttribute('aria-hidden', 'true');

            oHost.classList.add('tile');
            oImg.replaceWith(oSvg);
            oHost.bxAppIconAt = Date.now();
        });
    }

    $(document).on('pointerover focusin', sHosts, function() {
        inline(this);
    });

    // A click plays the animation again: fresh copies of its parts start their animations over. Not on the tap that brought the
    // icon in, which is playing it already.
    $(document).on('click', sHosts, function() {
        var oSvg = this.querySelector('svg.bx-std-app-icon');
        if(oSvg && Date.now() - this.bxAppIconAt > 400)
            oSvg.replaceWith(oSvg.cloneNode(true));
    });
})();

/** @} */
