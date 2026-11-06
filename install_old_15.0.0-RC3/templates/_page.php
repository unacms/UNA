<!DOCTYPE html>
<html lang="<?=bx_html_attribute($sLang); ?>">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title><?=$sTitle; ?></title>
    <style>
<?=$sInlineCSS; ?>
    </style>
<?=$sFilesCSS; ?>
    <link rel="stylesheet" href="css/styles.css" />
<?=$sFilesJS; ?>
</head>
<body class="bx-install-body bx-def-font">

<div class="bx-install-shell">
    <header class="bx-install-topbar">
        <div class="bx-install-topbar-inner">
            <img class="bx-install-header-logo" src="img/logo.svg" alt="UNA" />
            <span class="bx-install-brand-title"><?=$sTitle; ?></span>
            <?php if (!empty($aToolbarItem)): ?>
            <a class="bx-install-help" title="<?=$aToolbarItem['title']; ?>" href="<?=$aToolbarItem['link']; ?>" target="<?=$aToolbarItem['target']; ?>">
                <?php echo _t('_sys_inst_help'); ?>
            </a>
            <?php endif; ?>
        </div>
    </header>

    <main class="bx-install-main">
        <div class="bx-install-card">
            <?=$sCode; ?>
        </div>
    </main>

    <footer class="bx-install-footer">
        <div class="bx-install-footer-lang">
            <?php include('lang_swither.php'); ?>
        </div>
        <div class="bx-install-footer-links">
            <a href="https://unacms.com" target="_blank" rel="noopener"><?php echo _t('_sys_inst_footer_product'); ?></a>
            <span class="bx-install-footer-sep" aria-hidden="true"></span>
            <a href="https://unacms.com/docs" target="_blank" rel="noopener"><?php echo _t('_sys_inst_footer_docs'); ?></a>
            <span class="bx-install-footer-sep" aria-hidden="true"></span>
            <a href="https://unacms.com/contact" target="_blank" rel="noopener"><?php echo _t('_sys_inst_footer_contact'); ?></a>
        </div>
        <div class="bx-install-footer-spacer" aria-hidden="true"></div>
    </footer>
</div>

</body>
</html>
