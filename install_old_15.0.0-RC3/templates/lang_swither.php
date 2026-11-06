<?php
/**
 * Footer language switcher. Hidden when fewer than two language modules exist.
 */
if (empty($aLangs) || count($aLangs) < 2)
    return;

if (!function_exists('bx_install_lang_url')) {
    function bx_install_lang_url($sCode)
    {
        $a = array();
        if (!empty($_GET['action']))
            $a['action'] = $_GET['action'];
        $a['lang'] = $sCode;
        return '?' . http_build_query($a);
    }
}

$sTranslateSvg = '<svg class="bx-install-lang-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>';
?>
<details class="bx-install-lang">
    <summary class="bx-install-lang-trigger">
        <?php echo $sTranslateSvg; ?>
        <span class="bx-install-lang-current"><?php echo bx_html_attribute($sLangTitle); ?></span>
    </summary>
    <div class="bx-install-lang-menu" role="menu">
        <?php foreach ($aLangs as $aLang): ?>
        <a role="menuitem" class="bx-install-lang-item<?php echo ($aLang['code'] === $sLang) ? ' is-selected' : ''; ?>" href="<?php echo bx_html_attribute(bx_install_lang_url($aLang['code'])); ?>">
            <span class="bx-install-lang-badge"><?php echo $sTranslateSvg; ?></span>
            <span><?php echo bx_html_attribute($aLang['title']); ?></span>
        </a>
        <?php endforeach; ?>
    </div>
</details>
<script>
(function () {
    var d = document.querySelector('.bx-install-lang');
    if (!d) return;
    document.addEventListener('click', function (e) {
        if (!d.contains(e.target))
            d.removeAttribute('open');
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape')
            d.removeAttribute('open');
    });
})();
</script>
