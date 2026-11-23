<?php

/**
 * The header's main menu tabs are padded by what they show, the same way on UNA's site (Artificer tailwind.css) and in
 * NEO (navbarTabPadding, lib/navbar-fit.ts): an icon and a label 12px / 16px, a label alone 16px on both sides, an icon
 * alone (Studio's "Icon only", More) a 44px square. Read from the files, so the two can't drift apart.
 */
class HeaderTabCompositionTest extends \PHPUnit\Framework\TestCase
{
    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    public function testSiteTabsArePaddedByWhatTheyShow(): void
    {
        $s = self::read('template/css/tailwind.css');
        $sTab = '#bx-toolbar \.bx-menu-main > \.bx-menu-item';

        $this->assertMatchesRegularExpression('/' . $sTab . ' > \.bx-stl-mil \{\s*@apply h-11 py-0 ltr:pl-3 ltr:pr-4 rtl:pr-3 rtl:pl-4 /', $s, 'An icon and a label: 12px before the icon, 16px after the label.');
        $this->assertMatchesRegularExpression('/' . $sTab . ' > \.bx-stl-mil:not\(:has\(> \.bx-stl-mii > \*\)\) \{\s*@apply px-4;/', $s, 'A label alone: 16px on both sides.');
        $this->assertMatchesRegularExpression('/' . $sTab . ':is\(\.bx-menu-item-icon-only, \.bx-menu-item-more-auto\) > \.bx-stl-mil \{\s*@apply w-11 px-0 justify-center;/', $s, 'An icon alone: a 44px square.');
        $this->assertMatchesRegularExpression('/' . $sTab . ':is\(\.bx-menu-item-icon-only, \.bx-menu-item-more-auto\) > \.bx-stl-mil > \.bx-stl-mii > \* \{\s*@apply m-0;/', $s, 'The icon in the middle of the square, without the label\'s gap.');
        $this->assertMatchesRegularExpression('/' . $sTab . '\.bx-menu-item-icon-only > \.bx-stl-mil > \.bx-stl-mit \{\s*@apply hidden;/', $s, 'An "Icon only" tab hides its label in the bar; the More list shows it.');
    }

    public function testNeoTabsTakeTheSamePadding(): void
    {
        $sFit = self::read('neo/packages/app/lib/navbar-fit.ts');
        $this->assertStringContainsString("iconLabel: 'ps-3 pe-4',", $sFit);
        $this->assertStringContainsString("label: 'px-4',", $sFit);
        $this->assertStringContainsString("icon: 'px-2.5',", $sFit, '10px around the 24px icon: 44px, as the site\'s w-11.');

        // The tab and the hidden copy that measures it for the fit both take it from there.
        $this->assertStringContainsString('${navbarTabPadding(!!icon, !!isTitle)}', self::read('neo/packages/app/components/menu-items/topmenu.tsx'));
        $this->assertStringContainsString('${navbarTabPadding(!!item.icon, !!item.showTitle)}', self::read('neo/packages/app/components/nav/menu-top.tsx'));
    }

    public function testNeoDrawsNoIconForAnItemWithout(): void
    {
        $s = self::read('neo/packages/app/lib/util/menu.ts');
        $this->assertStringContainsString("if (raw === '') return '';", $s, 'An empty icon is none, not the placeholder circle.');
        $this->assertStringContainsString('showTitle: !icon || !Number(item.icon_only),', $s, '"Icon only" without an icon shows the label.');
    }

    public function testArtificerSiteMenuKeepsIconOnlyLabelsForMore(): void
    {
        $s = self::read('modules/boonex/artificer/data/template/system/scripts/BxTemplMenuSite.php');
        $this->assertMatchesRegularExpression('/if\(\$this->_bSiteMenu\) \{\s*(\/\/[^\n]*\n\s*)?\$this->_bIconOnlyKeepsTitle = true;/', $s);
    }
}
