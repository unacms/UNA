<?php

/**
 * Studio's account menu: the name row links to the signed-in profile and shows its picture; the dropdown is compact
 * (36px rows, 8px around them, 2px between) with the corners of the sidebar's rows.
 */
class AccountMenuNameRowTest extends BxDolTestCase
{
    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    public function testNameRowIsALinkToTheProfile(): void
    {
        $s = self::read('studio/template/menu_account_popup.html');

        $this->assertMatchesRegularExpression('/<li class="bx-mv-static bx-mv-label __class_add__">\s*<a href="__link__" __attrs__>__icon_html__<span>__title__<\/span><\/a>\s*<\/li>/', $s);
        $this->assertStringContainsString("'{member_url}'", self::read('install/sql/system.sql'), 'The item\'s link is the profile.');
    }

    public function testAvatarReplacesTheGlyph(): void
    {
        // the site header's avatar (BxBaseMenuToolbar): the picture, or the name's letter on its colour; decorative, the name is next to it
        $this->assertSame('<div class="bx-mv-picture" aria-hidden="true">__unit__</div>', trim(self::read('studio/template/menu_account_popup_picture.html')));

        $s = self::read('studio/template/scripts/BxBaseStudioMenuAccountPopup.php');
        $this->assertStringContainsString("if(\$sName == 'account' && (\$sPicture = \$this->getProfilePicture()) != '') {", $s);
        $this->assertStringContainsString("\$oProfile->getUnit(0, ['template' => ['name' => 'unit_wo_info_links', 'size' => 'icon']]);", $s);
        $this->assertStringContainsString("parseHtmlByName('menu_account_popup_picture.html', [", $s);
        $this->assertStringNotContainsString('getIcon()', $s, 'The icon URL of an operator was the old account.svg placeholder.');

        $sCss = self::read('studio/template/css/general.css');
        $this->assertMatchesRegularExpression('/li\.bx-mv-label \.bx-mv-picture p \{\s*width: 1\.5rem;\s*height: 1\.5rem;/', $sCss, '24px, as the glyphs.');
    }

    public function testDropdownIsCompactWithTheRowsCorners(): void
    {
        $s = self::read('template/css/tailwind.css');

        $this->assertStringContainsString("    .bx-std .bx-popup-content:has(> .bx-menu-verlit) {\n        @apply p-2;", $s, '8px around the rows.');
        $this->assertStringContainsString("    .bx-std .bx-menu-verlit li {\n        @apply mt-0.5 first:mt-0 rounded-lg duration-300;", $s, '2px between rows, 8px corners.');
        $this->assertStringContainsString('@apply flex items-center gap-3 h-9 px-2.5 rounded-lg text-sm whitespace-nowrap;', $s, '36px rows.');
        $this->assertStringContainsString("    .bx-std .bx-popup-menu .bx-popup-border {\n        @apply rounded-2xl;", $s, 'The 16px step, as the sidebar rows.');
        $this->assertMatchesRegularExpression('/\.bx-std \.bx-menu-verlit li\.bx-mv-label > a \{\s*@apply font-semibold hover:bg-black\/5 dark:hover:bg-white\/5/', $s);
        $this->assertMatchesRegularExpression('/\.bx-mv-label \.bx-mv-picture \{\s*@apply w-6 h-6 -mx-0\.5 rounded-full object-cover;/', $s);

        $this->assertMatchesRegularExpression('/set on \.bx-popup-gap \*\/\n    border-radius: var\(--bx-radius-2xl\);/', self::read('studio/template/css/common.less'));
    }

    public function testDropdownStaysAMenuOnPhones(): void
    {
        $sJs = self::read('inc/js/jquery.dolPopup.js');
        $this->assertStringContainsString("if (\$el.hasClass('bx-popup-menu') && \$el.closest('.bx-std').length)\n                \$el.removeClass('bx-popup-responsive');", $sJs, 'Not a full screen sheet (media-phone.css) in Studio.');

        $this->assertMatchesRegularExpression('/\.bx-popup-applied\.bx-popup-menu \.bx-popup-close-wrapper \{\n    display: none;\n\}/', self::read('studio/template/css/common.less'), 'A menu closes by a press outside or Escape.');
    }
}
