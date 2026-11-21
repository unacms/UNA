/**
 * The Application sidebar's state before React is there, so the page does not jump: whether it is narrow, and the width
 * its edge was dragged to (`sidebarNarrow`, `sidebarWidth` in app/context/prefs), as `data-neo-sidebar` and
 * `--neo-sidebar-width-expanded` on <html>. AppSidebar keeps them in step afterwards; the styles read them only inside
 * `.neo-app-shell`, so other pages ignore them.
 *
 * The Next root layout puts it in <head>, a server component that is never rendered again on the client: a <script> in
 * a client component is not run when it mounts after a navigation, and React warns about it.
 */
export const SIDEBAR_PREPAINT = `(function(){var d=document.documentElement;try{var p=JSON.parse(localStorage.getItem('neo:v1:prefs')||'{}');d.setAttribute('data-neo-sidebar',p&&p.sidebarNarrow?'narrow':'expanded');if(p&&p.sidebarWidth>0)d.style.setProperty('--neo-sidebar-width-expanded',p.sidebarWidth+'px')}catch(e){d.setAttribute('data-neo-sidebar','expanded')}})()`;
