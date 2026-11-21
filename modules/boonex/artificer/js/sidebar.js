/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Artificer Artificer template
 * @ingroup     UnaModules
 * @{
 */

/**
 * The Application layout's sidebar (pt_application.html): the page's left column.
 *
 * One state, two classes on .bx-main, and the styles do the rest (css/common.css "Application"):
 *   - wide screens (1280px and up): expanded, or narrow with icons only (bx-app-sidebar-narrow). The member's choice is kept in
 *     localStorage ('sidebarExpanded': 'true' or 'false') and the template applies it before the first paint.
 *   - below that: a drawer over the page, shown while bx-app-sidebar-open is set. It is a modal: the page behind is inert, Escape and
 *     a press outside close it, and focus returns to the button that opened it.
 * #sidebar also carries bx-mc-narrowed / bx-mc-expanded, which the menu styles of the sidebar's items read.
 *
 * NEO and the native apps show the same sidebar: the same three states (expanded, narrow, drawer), sizes (16rem, 4rem) and
 * breakpoint, with the choice kept per device.
 */
(function() {
    var KEY = 'sidebarExpanded';
    var KEY_WIDTH = 'sidebarWidth';
    var WIDE = '(min-width: 1280px)';

    // The handle (#sidebarResizer): the expanded sidebar is 240px (room for the logo and two buttons) to 400px wide; dragged
    // under 160px it snaps to the 64px icons.
    var WIDTH_MIN = 240;
    var WIDTH_MAX = 400;
    var WIDTH_SNAP = 160;
    var WIDTH_STEP = 16;

    function init() {
        var oSidebar = document.getElementById('sidebar');
        var oMain = oSidebar ? oSidebar.closest('.bx-main') : null;
        if(!oSidebar || !oMain)
            return;

        // The header and footer strips' heights, which the sidebar and the content start under and end above (css/common.css,
        // --bx-app-header and --bx-app-footer): 16px while a strip is empty, more where it holds something (the header: the
        // drawer's button, a guest's Log in and Join).
        [['bx-toolbar', '--bx-app-header'], ['bx-app-footer', '--bx-app-footer']].forEach(function(aStrip) {
            var oStrip = document.getElementById(aStrip[0]);
            if(!oStrip)
                return;

            var fSync = function() {
                oMain.style.setProperty(aStrip[1], oStrip.offsetHeight + 'px');
            };
            fSync();
            if(window.ResizeObserver)
                new ResizeObserver(fSync).observe(oStrip);
        });

        // The content is one block that scrolls inside itself (css/common.css, .bx-app-content), so the window does not: its
        // scroll is passed on to the window, where the page's scripts listen (the feed's infinite scroll measures against the
        // window, which holds while the document stays put).
        var oContent = document.getElementById('main-content');
        if(oContent)
            oContent.addEventListener('scroll', function() {
                window.dispatchEvent(new Event('scroll'));
            }, {passive: true});

        var oToggle = document.getElementById('toggleSidebar');
        var oOpen = document.getElementById('toggleSidebarMobile');
        var oBackdrop = document.getElementById('sidebarBackdrop');
        var oWide = window.matchMedia(WIDE);
        var oOpener = null;

        function stored() {
            try {
                return localStorage.getItem(KEY) !== 'false';
            }
            catch(e) {
                return true;
            }
        }

        function store(bExpanded) {
            try {
                localStorage.setItem(KEY, bExpanded ? 'true' : 'false');
            }
            catch(e) {}
        }

        function isOpen() {
            return oMain.classList.contains('bx-app-sidebar-open');
        }

        // The page behind an open drawer takes no focus or presses.
        function setInert(bInert) {
            Array.prototype.forEach.call(oMain.querySelectorAll('#bx-toolbar, #main-content'), function(oElement) {
                oElement.inert = bInert;
            });
        }

        function render() {
            var bWide = oWide.matches;
            var bNarrow = bWide && !stored();

            oMain.classList.toggle('bx-app-sidebar-narrow', bNarrow);
            oSidebar.classList.toggle('bx-mc-narrowed', bNarrow);
            oSidebar.classList.toggle('bx-mc-expanded', !bNarrow);

            if(bWide && isOpen())
                close(false);

            if(oToggle)
                oToggle.setAttribute('aria-expanded', bWide ? String(!bNarrow) : String(isOpen()));
            var oHandle = document.getElementById('sidebarResizer');
            if(oHandle)
                oHandle.setAttribute('aria-valuenow', String(Math.round(oSidebar.getBoundingClientRect().width)));
            if(oOpen)
                oOpen.setAttribute('aria-expanded', String(isOpen()));
        }

        function open() {
            oOpener = document.activeElement;
            oMain.classList.add('bx-app-sidebar-open');
            setInert(true);
            render();

            if(oToggle)
                oToggle.focus();
        }

        function close(bFocus) {
            oMain.classList.remove('bx-app-sidebar-open');
            setInert(false);
            render();

            if(bFocus !== false && oOpener && oOpener.focus)
                oOpener.focus();
            oOpener = null;
        }

        if(oToggle)
            oToggle.addEventListener('click', function() {
                if(!oWide.matches)
                    return close();

                store(!stored());
                render();
            });

        // Wide screens: the sidebar's edge. Dragged, it sizes the expanded sidebar, and narrower than WIDTH_SNAP it snaps to the
        // icons (and back out of them, dragged wider); pressed without a drag, it narrows or widens it. The arrow keys size it,
        // Enter and Space narrow or widen it. The width is kept in localStorage ('sidebarWidth'), applied before the first paint.
        var oResizer = document.getElementById('sidebarResizer');
        if(oResizer) {
            var bRtl = document.documentElement.getAttribute('dir') == 'rtl' || oMain.closest('.bx-dir-rtl') !== null;

            var fSetWidth = function(iWidth) {
                var bNarrow = iWidth < WIDTH_SNAP;
                if(!bNarrow)
                    oMain.style.setProperty('--bx-sidebar-width-expanded', Math.min(WIDTH_MAX, Math.max(WIDTH_MIN, iWidth)) + 'px');

                oMain.classList.toggle('bx-app-sidebar-narrow', bNarrow);
                oSidebar.classList.toggle('bx-mc-narrowed', bNarrow);
                oSidebar.classList.toggle('bx-mc-expanded', !bNarrow);
            };

            var fSave = function() {
                var bNarrow = oMain.classList.contains('bx-app-sidebar-narrow');
                store(!bNarrow);
                if(!bNarrow)
                    try {
                        localStorage.setItem(KEY_WIDTH, String(Math.round(oSidebar.getBoundingClientRect().width)));
                    }
                    catch(e) {}

                render();
            };

            var fToggle = function() {
                store(!stored());
                render();
            };

            var iStartX = 0, iStartWidth = 0, bMoved = false, iPointer = null;
            oResizer.addEventListener('pointerdown', function(oEvent) {
                if(!oWide.matches || oEvent.button !== 0)
                    return;

                iPointer = oEvent.pointerId;
                iStartX = oEvent.clientX;
                iStartWidth = oSidebar.getBoundingClientRect().width;
                bMoved = false;
                oResizer.setPointerCapture(iPointer);
                oMain.classList.add('bx-app-sidebar-dragging');
                oEvent.preventDefault();
            });
            oResizer.addEventListener('pointermove', function(oEvent) {
                if(iPointer === null || oEvent.pointerId !== iPointer)
                    return;

                var iDelta = (oEvent.clientX - iStartX) * (bRtl ? -1 : 1);
                if(!bMoved && Math.abs(iDelta) < 4)
                    return;

                bMoved = true;
                fSetWidth(iStartWidth + iDelta);
            });
            var fEnd = function(oEvent) {
                if(iPointer === null || oEvent.pointerId !== iPointer)
                    return;

                iPointer = null;
                oMain.classList.remove('bx-app-sidebar-dragging');
                if(bMoved)
                    fSave();
                else
                    fToggle();
            };
            oResizer.addEventListener('pointerup', fEnd);
            oResizer.addEventListener('pointercancel', fEnd);

            oResizer.addEventListener('keydown', function(oEvent) {
                if(!oWide.matches)
                    return;

                if(oEvent.key == 'Enter' || oEvent.key == ' ') {
                    oEvent.preventDefault();
                    return fToggle();
                }

                var iDir = {ArrowLeft: -1, ArrowRight: 1}[oEvent.key];
                if(!iDir)
                    return;

                oEvent.preventDefault();
                var iWidth = oMain.classList.contains('bx-app-sidebar-narrow') ? (iDir > 0 ? WIDTH_MIN : 0) : oSidebar.getBoundingClientRect().width + iDir * (bRtl ? -1 : 1) * WIDTH_STEP;
                fSetWidth(iWidth);
                fSave();
            });
        }

        if(oOpen)
            oOpen.addEventListener('click', function() {
                if(isOpen())
                    close();
                else
                    open();
            });

        if(oBackdrop)
            oBackdrop.addEventListener('click', function() {
                close();
            });

        document.addEventListener('keydown', function(oEvent) {
            if(oEvent.key == 'Escape' && isOpen() && !oEvent.defaultPrevented)
                close();
        });

        // A link in the drawer goes to another page; the drawer does not stay over a page that changes in place.
        oSidebar.addEventListener('click', function(oEvent) {
            if(isOpen() && oEvent.target.closest('a[href]:not([href^="javascript:"])'))
                close(false);
        });

        if(oWide.addEventListener)
            oWide.addEventListener('change', render);
        else if(oWide.addListener)
            oWide.addListener(render);

        render();
    }

    if(document.readyState == 'loading')
        document.addEventListener('DOMContentLoaded', init);
    else
        init();
})();

/** @} */
