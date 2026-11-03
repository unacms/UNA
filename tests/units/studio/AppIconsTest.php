<?php

/**
 * Studio app icons (studio/template/images/icons/wi-*.svg, studio/template/images/modules/<module>.svg) carry their own animation:
 * as an image they show its resting frame, and studio/js/app_icons.js puts the file in the page on hover so the animation plays.
 * Inline SVG styles are global, so every icon scopes its rules to its own class and names its keyframes and ids apart.
 */
class AppIconsTest extends BxDolTestCase
{
    private const ROOT = __DIR__ . '/../../../';
    private const TRIGGER = ':is(.icon:hover,.tile:hover .icon,.tile:focus-visible .icon)';
    private const SYSTEM = ['agents', 'api', 'audit', 'badges', 'bld-forms', 'bld-navigation', 'bld-pages', 'bld-permissions', 'bld-roles', 'dashboard', 'designer', 'home', 'polyglot', 'settings', 'storages', 'store'];

    private static function read(string $sPath): string
    {
        $s = file_get_contents(self::ROOT . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    /**
     * @return array<string, string> path => markup, for every animated app icon
     */
    private static function animated(): array
    {
        $a = [];
        foreach (array_merge(glob(self::ROOT . 'studio/template/images/icons/wi-*.svg'), glob(self::ROOT . 'studio/template/images/modules/*.svg')) as $sFile) {
            $s = file_get_contents($sFile);
            if (strpos($s, 'class="icon v-') !== false)
                $a[substr($sFile, strlen(self::ROOT))] = $s;
        }

        return $a;
    }

    public function testEverySystemAppIsAnimated(): void
    {
        $a = self::animated();
        foreach (self::SYSTEM as $sName)
            $this->assertArrayHasKey('studio/template/images/icons/wi-' . $sName . '.svg', $a);

        $this->assertGreaterThanOrEqual(42, count(array_filter(array_keys($a), fn($s) => strpos($s, '/images/modules/') !== false)));
    }

    public static function icons(): array
    {
        return array_map(fn($s) => [$s], array_combine(array_keys(self::animated()), array_keys(self::animated())));
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('icons')]
    public function testIconIsSelfContained(string $sPath): void
    {
        $s = self::read($sPath);

        $this->assertSame(1, preg_match('/^<svg class="icon v-([\w-]+)" width="72" height="72" viewBox="0 0 72 72"/', $s, $a), 'A 72px tile with its own class.');
        $sKey = $a[1];

        $this->assertStringContainsString(self::TRIGGER . '.v-' . $sKey . ' ', $s, 'Plays on hover and keyboard focus (studio/js/app_icons.js adds .tile to the link).');
        $this->assertStringContainsString('@media (prefers-reduced-motion:reduce){.v-' . $sKey . ' *{animation:none!important}}', $s);

        preg_match_all('/\sid="([^"]+)"/', $s, $aIds);
        $this->assertNotEmpty($aIds[1]);
        foreach ($aIds[1] as $sId)
            $this->assertStringEndsWith('-' . $sKey, $sId, 'Ids are named apart, so icons can share a page.');

        preg_match('/<style>(.*?)<\/style>/s', $s, $aStyle);
        foreach (preg_split('/\n/', trim($aStyle[1] ?? '')) as $sLine)
            if ($sLine !== '' && strpos($sLine, '@keyframes') !== 0 && strpos($sLine, '@media') !== 0)
                $this->assertStringContainsString('.v-' . $sKey, $sLine, 'Every rule is scoped to the icon.');
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('icons')]
    public function testIconClassesAreOutOfThePagesReach(string $sPath): void
    {
        $s = self::read($sPath);

        // the page's CSS reaches into an inline SVG: template/css/common.css spins any `svg .outer` and `svg .inner` forever, so every
        // class below the root carries the bx-ai- prefix (scripts/studio_app_icons.py)
        preg_match_all('/class="([^"]+)"/', substr($s, strpos($s, '>') + 1), $a);
        foreach ($a[1] as $sClasses)
            foreach (explode(' ', $sClasses) as $sClass)
                $this->assertStringStartsWith('bx-ai-', $sClass);

        preg_match('/<style>(.*?)<\/style>/s', $s, $aStyle);
        preg_match_all('/(?<![\w-])\.([a-z][\w-]*)/', preg_replace('/\d\.\d/', '', $aStyle[1] ?? ''), $aSelectors);
        foreach (array_unique($aSelectors[1]) as $sClass)
            $this->assertMatchesRegularExpression('/^(bx-ai-|v-|icon$|tile$)/', $sClass, 'The style names only the prefixed classes, the root and its tile.');
    }

    public function testKeyframeNamesAreUniqueAcrossIcons(): void
    {
        $aSeen = [];
        foreach (self::animated() as $sPath => $s) {
            preg_match_all('/@keyframes ([\w-]+)/', $s, $a);
            foreach (array_unique($a[1]) as $sName) {
                $this->assertArrayNotHasKey($sName, $aSeen, $sName . ' in ' . $sPath . ' is also in ' . ($aSeen[$sName] ?? ''));
                $aSeen[$sName] = $sPath;
            }
        }
    }

    public function testModuleIconsAreNamedAfterModules(): void
    {
        $aModules = [];
        foreach (glob(self::ROOT . 'modules/*/*/install/config.php') as $sFile)
            if (preg_match("/'name' => '([\w]+)'/", file_get_contents($sFile), $a))
                $aModules[$a[1]] = true;

        foreach (glob(self::ROOT . 'studio/template/images/modules/*.svg') as $sFile) {
            $sName = basename($sFile, '.svg');
            if ($sName === 'bx_projects') // the Projects app isn't in this repository
                continue;

            $this->assertArrayHasKey($sName, $aModules, basename($sFile) . ' is used only for a module of that name (BxDolStudioTemplate::_getModuleIcon).');
        }
    }

    public function testAppIconUrlsCarryTheRevision(): void
    {
        // a release replaces the icons under the same names and they are cached for 30 days: the revision, bumped by every update,
        // makes browsers fetch the new files (and studio/js/app_icons.js inline them, not the old ones)
        $oTemplate = BxDolStudioTemplate::getInstance();
        $sRev = 'rev=' . $oTemplate->getRevision();

        $this->assertStringEndsWith('/images/modules/bx_posts.svg?' . $sRev, $oTemplate->getModuleIconUrl('bx_posts.svg'));
        $this->assertStringEndsWith('/images/modules/bx_posts.svg?' . $sRev, $oTemplate->getIconUrl('bx_posts@modules/boonex/posts/|std-icon.svg'));
        $this->assertStringEndsWith('/images/icons/wi-agents.svg?' . $sRev, $oTemplate->getIconUrl('wi-agents.svg'));

        $this->assertSame('', $oTemplate->getModuleIconUrl('bx_no_such_module.svg'), 'A missing icon stays empty, so callers fall back.');
        $this->assertStringNotContainsString('rev=', $oTemplate->getIconUrl('mi-cog.svg'), 'Other Studio icons are unchanged.');

        $this->assertStringContainsString("oHost.querySelector('img[src*=\".svg\"]')", self::read('studio/js/app_icons.js'), 'The script finds the icon with its query string.');
    }

    public function testScriptLoadsWithTheHeaderAndCoversItsTiles(): void
    {
        $this->assertStringContainsString("array('menu_top.js', 'context_menu.js', 'app_icons.js')", self::read('studio/template/scripts/BxBaseStudioMenuTop.php'));

        $s = self::read('studio/js/app_icons.js');
        $this->assertStringContainsString("var sHosts = '.bx-std-widget-link, .bx-menu-top-center li > a, .bx-menu-breadcrumb li.bx-menu-bc-page > a';", $s);
        $this->assertStringContainsString("\$(document).on('pointerover focusin', sHosts,", $s);
        $this->assertStringContainsString("oHost.classList.add('tile');", $s);
        $this->assertStringContainsString("oSvg.replaceWith(oSvg.cloneNode(true));", $s, 'A click plays it again.');

        $this->assertStringContainsString('class="bx-std-widget-link ', self::read('studio/template/widget.html'));
        $this->assertStringContainsString('<ul class="bx-menu-top-center ', self::read('studio/template/menu_top_center.html'));
    }

    public function testInlineIconTakesTheImagesPlace(): void
    {
        $sLauncher = self::read('studio/template/css/launcher.css');
        $this->assertStringContainsString(".bx-std-widget-link > img,\n.bx-std-widget-link > svg.bx-std-app-icon {", $sLauncher);
        $this->assertStringContainsString(".bx-std-launcher-browser .bx-std-widget-link > img,\n.bx-std-launcher-browser .bx-std-widget-link > svg.bx-std-app-icon,", $sLauncher);

        $sTop = self::read('studio/template/css/menu_top.css');
        $this->assertStringContainsString(".bx-mi-icon.bx-icon-tile img,\ndiv.bx-std-menu-top .bx-menu-breadcrumb li.bx-menu-bc-item.bx-menu-bc-page .bx-mi-icon.bx-icon-tile svg.bx-std-app-icon {", $sTop);
        $this->assertSame(2, substr_count($sTop, 'div.bx-std-menu-top .bx-menu-top-center li svg.bx-std-app-icon'));
    }
}
