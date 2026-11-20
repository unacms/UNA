<!DOCTYPE html>
<html lang="<?=bx_html_attribute($sLang); ?>">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <title><?=$sTitle; ?></title>
    <script>
        // Studio's dark scheme is the "dark" class (Tailwind's class strategy); the installer follows the system setting
        (function () {
            var oQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
            var apply = function () { document.documentElement.classList.toggle('dark', !!(oQuery && oQuery.matches)); };
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
        <span class="bx-install-brand-title"><?=$sTitle; ?></span>
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
            <?php include('lang_switcher.php'); ?>
        </div>
        <div class="bx-install-footer-links">
            <a href="https://unacms.com" target="_blank" rel="noopener"><?php echo _t('_sys_inst_footer_product'); ?></a>
            <a href="https://unacms.com/docs" target="_blank" rel="noopener"><?php echo _t('_sys_inst_footer_docs'); ?></a>
            <a href="https://unacms.com/contact" target="_blank" rel="noopener"><?php echo _t('_sys_inst_footer_contact'); ?></a>
        </div>
    </footer>
</div>

</body>
</html>
