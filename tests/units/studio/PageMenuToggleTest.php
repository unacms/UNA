<?php

/**
 * The Studio page menu toggle (page_content_2_col.html): the gap between the menu and the content narrows the menu
 * to the tablet strip on wide screens. page.js stores the choice, page_3.html restores it before the first paint,
 * and the strip layout follows the menu column's width, so the breakpoint and the toggle share one set of styles.
 */
class PageMenuToggleTest extends BxDolTestCase
{
    private const STORAGE_KEY = 'bx-std-page-menu-narrow';
    private const CLASS_NARROW = 'bx-std-pmen-narrow';

    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    public function testToggleSitsBetweenTheColumnsAndControlsTheMenu(): void
    {
        $s = self::read('studio/template/page_content_2_col.html');

        $this->assertSame(1, preg_match('/<div id="bx-std-page-menu" class="bx-std-page-column bx-std-page-menu\b/', $s));

        $iMenu = strpos($s, 'id="bx-std-page-menu"');
        $iToggle = strpos($s, '<button type="button" class="bx-std-page-menu-toggle" aria-controls="bx-std-page-menu">');
        $iContent = strpos($s, '<main id="bx-std-page-content"');
        $this->assertNotFalse($iToggle);
        $this->assertTrue($iMenu < $iToggle && $iToggle < $iContent, 'The toggle is the gap between the menu and the content.');

        $this->assertStringContainsString('<span class="bx-std-pmt-collapse sr-only"><bx_text:_adm_txt_page_menu_collapse /></span>', $s);
        $this->assertStringContainsString('<span class="bx-std-pmt-expand sr-only"><bx_text:_adm_txt_page_menu_expand /></span>', $s);
    }

    public static function languages(): array
    {
        return [
            'en' => ['modules/boonex/english/data/langs/system/en.xml'],
            'ru' => ['modules/boonex/russian/data/langs/system/ru.xml'],
        ];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('languages')]
    public function testLabelsAreTranslated(string $sPath): void
    {
        $s = self::read($sPath);

        foreach (['_adm_txt_page_menu_collapse', '_adm_txt_page_menu_expand'] as $sKey)
            $this->assertMatchesRegularExpression('/<string name="' . $sKey . '"><!\[CDATA\[[^\]]+\]\]><\/string>/', $s);
    }

    public function testSavedChoiceIsRestoredBeforeTheColumns(): void
    {
        $s = self::read('studio/template/page_3.html');

        $iScript = strpos($s, "localStorage.getItem('" . self::STORAGE_KEY . "') == '1'");
        $iColumns = strpos($s, 'id="bx-std-page-columns"');
        $this->assertNotFalse($iScript);
        $this->assertTrue($iScript < $iColumns, 'The class is set before the columns paint.');
        $this->assertStringContainsString("document.documentElement.classList.add('" . self::CLASS_NARROW . "')", $s);
        $this->assertMatchesRegularExpression('/try \{[^\n]*localStorage[^\n]*\} catch\(e\) \{\}/', $s, 'Blocked storage does not break the page.');
    }

    public function testClickTogglesAndStoresTheSameState(): void
    {
        $s = self::read('studio/js/page.js');

        // delegated, so the toggle keeps working after the page content is redrawn (BxDolStudioModule re-renders page_content_2_col.html)
        $this->assertStringContainsString("\$(document).on('click', '.bx-std-page-menu-toggle', function() {", $s);
        $this->assertStringContainsString("document.documentElement.classList.toggle('" . self::CLASS_NARROW . "')", $s);
        $this->assertStringContainsString("localStorage.setItem('" . self::STORAGE_KEY . "', '1')", $s);
        $this->assertStringContainsString("localStorage.removeItem('" . self::STORAGE_KEY . "')", $s);
    }

    public function testToggleAndNarrowWidthOnlyApplyOnWideScreens(): void
    {
        $s = self::read('studio/template/css/page_columns.css');

        $this->assertMatchesRegularExpression('/\n\.bx-std-page-menu-toggle \{\s*display: none;\s*\}\n@media \(min-width: 1024px\) \{\n    \.bx-std-page-menu-toggle \{[^}]*display: block;/', $s);

        $iWide = strpos($s, '@media (min-width: 1024px) {');
        $iNarrow = strpos($s, 'html.' . self::CLASS_NARROW . ' .bx-std-page-column.bx-std-page-menu {');
        $iTablet = strpos($s, '@media (max-width: 1023px) {');
        $this->assertNotFalse($iNarrow);
        $this->assertTrue($iWide < $iNarrow && $iNarrow < $iTablet, 'The narrow width is set inside the wide-screen media query.');
        $this->assertMatchesRegularExpression('/html\.' . self::CLASS_NARROW . ' \.bx-std-page-column\.bx-std-page-menu \{[^}]*width: 6\.5rem;/', $s, 'Narrowed, the menu is as wide as the tablet strip.');
        $this->assertMatchesRegularExpression('/\.bx-std-page-column\.bx-std-page-menu \{[^}]*container: bx-std-pmen \/ inline-size;/', $s);
    }

    public function testStripLayoutFollowsTheColumnWidth(): void
    {
        $s = self::read('studio/template/css/general.css');

        $this->assertSame(2, substr_count($s, '@container bx-std-pmen (max-width: 10rem) {'), 'The strip items and the column title switch by the column width.');
        $this->assertDoesNotMatchRegularExpression('/@media \(max-width: 1023px\) \{\s*div\.bx-std-(pmen-item|pcm-title)/', $s);
    }
}
