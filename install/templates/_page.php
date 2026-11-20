<!DOCTYPE html>
<html lang="<?=bx_html_attribute($sLang); ?>">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <title><?=$sTitle; ?></title>
    <!-- The site's default favicon; a dark browser/OS colour scheme gets the white one (template/meta_icons.html). -->
    <link rel="icon" href="../template/images/icons/favicon.svg" type="image/svg+xml" data-bx-icon-light="../template/images/icons/favicon.svg" data-bx-icon-dark="../template/images/icons/favicon-dark.svg" />
    <script>
        (function () {
            var oMedia = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
            if (!oMedia)
                return;
            var fUpdate = function () {
                document.querySelectorAll('link[data-bx-icon-dark]').forEach(function (oLink) {
                    oLink.href = oLink.getAttribute(oMedia.matches ? 'data-bx-icon-dark' : 'data-bx-icon-light');
                });
            };
            fUpdate();
            if (oMedia.addEventListener)
                oMedia.addEventListener('change', fUpdate);
        })();
    </script>
    <script>
        // Studio's dark scheme is the "dark" class (Tailwind's class strategy). The installer follows the system
        // setting unless the footer's theme menu chose Light or Dark in this browser.
        (function () {
            var sKey = 'bx_install_scheme';
            var oQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
            var get = function () {
                var s = null;
                try { s = localStorage.getItem(sKey); } catch (e) {}
                return 'light' === s || 'dark' === s ? s : 'auto';
            };
            var apply = function () {
                var s = get();
                document.documentElement.classList.toggle('dark', 'dark' === s || ('auto' === s && !!(oQuery && oQuery.matches)));
            };
            window.bxInstallScheme = {
                get: get,
                set: function (s) {
                    try { 'auto' === s ? localStorage.removeItem(sKey) : localStorage.setItem(sKey, s); } catch (e) {}
                    apply();
                }
            };
            apply();
            if (oQuery && oQuery.addEventListener)
                oQuery.addEventListener('change', apply);
        })();
    </script>
    <style>
<?=$sInlineCSS; ?>
    </style>
<?=$sFilesCSS; ?>
    <link rel="stylesheet" href="css/styles.css?v=<?=filemtime(BX_INSTALL_DIR . 'css/styles.css'); ?>" />
<?=$sFilesJS; ?>
</head>
<body class="bx-std bx-std-bg bx-def-font bx-def-color-bg-page bx-install-body">

<div class="bx-install-shell">
    <header class="bx-install-topbar bx-std-block cnt-bg">
        <img class="bx-install-header-logo" src="<?=BX_INSTALL_URL_ROOT; ?>studio/template/images/dbd_version.svg" alt="" />
        <span class="bx-install-brand">
            <span class="bx-install-brand-title">UNA <?=BX_DOL_VER; ?></span>
            <span class="bx-install-brand-meta"><?php echo _t('_sys_inst_title_meta'); ?></span>
        </span>
        <?php if (!empty($aSteps)): ?>
        <nav class="bx-install-stepper-nav" aria-label="<?=bx_html_attribute(_t('_sys_inst_steps')); ?>">
            <ol class="bx-install-stepper">
            <?php $iIndex = 0; foreach ($aSteps as $sStep => $sStepTitle): $iIndex++; ?>
                <li data-step="<?=$sStep; ?>" class="<?=$sStep === $sStepCurrent ? 'is-current' : (in_array($sStep, $aStepsDone) ? 'is-done' : ''); ?>"<?=$sStep === $sStepCurrent ? ' aria-current="step"' : ''; ?>>
                    <span class="bx-install-stepper-dot" aria-hidden="true"><?=$iIndex; ?></span>
                    <span class="bx-install-stepper-title"><?=$sStepTitle; ?></span>
                </li>
            <?php endforeach; ?>
            </ol>
        </nav>
        <?php endif; ?>
        <?php if (!empty($aToolbarItem)): ?>
        <a class="bx-btn bx-btn-small bx-install-help" href="<?=bx_html_attribute($aToolbarItem['link']); ?>" target="<?=bx_html_attribute($aToolbarItem['target']); ?>" rel="noopener" title="<?=bx_html_attribute($aToolbarItem['title']); ?>" aria-label="<?=bx_html_attribute($aToolbarItem['title']); ?>">
            <?php echo _t('_sys_inst_help'); ?>
        </a>
        <?php endif; ?>
    </header>

    <main class="bx-install-main">
        <div class="bx-install-card bx-std-block cnt-ttl-bg">
            <?=$sCode; ?>
        </div>
    </main>

    <footer class="bx-install-footer">
        <div class="bx-install-footer-lang">
            <?php include_once 'lang_switcher.php'; ?>
            <?php include_once 'scheme_switcher.php'; ?>
        </div>
        <div class="bx-install-footer-links">
            <a href="https://unacms.com/docs" target="_blank" rel="noopener"><?php echo _t('_sys_inst_footer_docs'); ?></a>
            <a href="https://unacms.com/contact" target="_blank" rel="noopener"><?php echo _t('_sys_inst_footer_contact'); ?></a>
        </div>
    </footer>
</div>
<script>
// the footer menus (language, theme) close on a click outside them and on Escape
(function () {
    var close = function (oExcept) {
        document.querySelectorAll('.bx-install-lang[open]').forEach(function (d) {
            if (d !== oExcept)
                d.removeAttribute('open');
        });
    };
    document.addEventListener('click', function (e) {
        close(e.target.closest ? e.target.closest('.bx-install-lang') : null);
    });
    document.addEventListener('keydown', function (e) {
        if ('Escape' === e.key)
            close(null);
    });
})();
</script>

</body>
</html>
