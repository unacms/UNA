<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title><?=$sTitle; ?></title>
    <style>
<?=$sInlineCSS; ?>
    </style>
    <link rel="stylesheet" href="css/styles.css" />
<?=$sFilesCSS; ?>
<?=$sFilesJS; ?>
</head>
<body class="bx-install-body bx-def-font">

<div class="bx-install-shell">
    <header class="bx-install-topbar">
        <div class="bx-install-topbar-inner">
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
        <span>UNA Community Management System</span>
    </footer>
</div>

</body>
</html>
