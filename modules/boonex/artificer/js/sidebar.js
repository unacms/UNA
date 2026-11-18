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
    var WIDE = '(min-width: 1280px)';

    function init() {
        var oSidebar = document.getElementById('sidebar');
        var oMain = oSidebar ? oSidebar.closest('.bx-main') : null;
        if(!oSidebar || !oMain)
            return;

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
