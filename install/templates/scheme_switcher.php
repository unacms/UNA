<?php
/**
 * Footer theme switcher: System, Light or Dark, kept in this browser (see the script in _page.php's head).
 */
$aSchemes = array(
    'auto' => array('title' => _t('_sys_menu_item_title_sa_scheme_auto'), 'icon' => '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>'),
    'light' => array('title' => _t('_sys_menu_item_title_sa_scheme_light'), 'icon' => '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>'),
    'dark' => array('title' => _t('_sys_menu_item_title_sa_scheme_dark'), 'icon' => '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>'),
);
$sSvg = '<svg class="bx-install-lang-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">%s</svg>';
?>
<details class="bx-install-lang bx-install-scheme">
    <summary class="bx-install-lang-trigger" aria-label="<?php echo bx_html_attribute(_t('_sys_menu_item_title_sa_scheme')); ?>">
        <?php foreach ($aSchemes as $sScheme => $a): ?>
        <span class="bx-install-scheme-current" data-scheme="<?php echo $sScheme; ?>" hidden><?php printf($sSvg, $a['icon']); ?><span><?php echo $a['title']; ?></span></span>
        <?php endforeach; ?>
    </summary>
    <div class="bx-install-lang-menu bx-popup-color-bg bx-popup-border" role="menu">
        <?php foreach ($aSchemes as $sScheme => $a): ?>
        <button type="button" role="menuitemradio" aria-checked="false" class="bx-install-lang-item" data-scheme="<?php echo $sScheme; ?>">
            <?php printf($sSvg, $a['icon']); ?>
            <span><?php echo $a['title']; ?></span>
        </button>
        <?php endforeach; ?>
    </div>
</details>
<script>
(function () {
    var oMenu = document.querySelector('.bx-install-scheme');
    var show = function () {
        var sScheme = window.bxInstallScheme.get();
        oMenu.querySelectorAll('.bx-install-scheme-current').forEach(function (o) {
            o.hidden = o.getAttribute('data-scheme') !== sScheme;
        });
        oMenu.querySelectorAll('[role="menuitemradio"]').forEach(function (o) {
            var bOn = o.getAttribute('data-scheme') === sScheme;
            o.setAttribute('aria-checked', bOn ? 'true' : 'false');
            o.classList.toggle('is-selected', bOn);
        });
    };
    oMenu.querySelectorAll('[role="menuitemradio"]').forEach(function (o) {
        o.addEventListener('click', function () {
            window.bxInstallScheme.set(o.getAttribute('data-scheme'));
            oMenu.removeAttribute('open');
            show();
        });
    });
    show();
})();
</script>
