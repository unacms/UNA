<?php

/**
 * Artificer's account menu is a popup under the member's avatar (sys_account_popup, menu_account_popup.html), as the
 * apps have it, not a sidebar across the page: the footer prints the popup, the avatar's button opens it, and the
 * sidebar's template, styles and script branch are gone, with a way in for callers that still ask for the sidebar.
 */
class AccountMenuPopupTest extends BxDolTestCase
{
    const DIR = 'modules/boonex/artificer/data/template/system/';

    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    public function testTheFooterPrintsThePopupForMembers(): void
    {
        $s = self::read(self::DIR . 'scripts/BxTemplFunctions.php');

        $this->assertMatchesRegularExpression('/if\(isLogged\(\)\) \{\s*\$sContent \.= \$this->_oTemplate->getMenu\(\'sys_add_content\'\);\s*\$sContent \.= \$this->_oTemplate->getMenu\(\'sys_account_popup\'\);/', $s);
        $this->assertStringNotContainsString('getInjFooterSidebarAccount', $s);
        $this->assertFileDoesNotExist(__DIR__ . '/../../../' . self::DIR . 'sidebar_account.html');
    }

    public function testTheAvatarsButtonOpensThePopup(): void
    {
        $s = self::read(self::DIR . 'scripts/BxTemplMenuToolbar.php');

        $this->assertStringContainsString("oBxArtificerUtils.getAccountMenu('#bx-sliding-menu-account', this);", $s);
        $this->assertStringContainsString('aria-haspopup="true" aria-expanded="false" aria-controls="bx-sliding-menu-account"', $s);
        $this->assertStringNotContainsString('bx-sidebar-account', $s);

        $this->assertStringContainsString('id="bx-sliding-menu-account" class="bx-popup-wrapper', self::read(self::DIR . 'menu_account_popup.html'));
    }

    public function testThePopupOpensAtTheHeadersEndAndClosesTheOthers(): void
    {
        $s = self::read('modules/boonex/artificer/js/utils.js');

        $this->assertMatchesRegularExpression('/getAccountMenu = function\(sMenu, e, oPointer\) \{\s*\$\(\'\.bx-popup-applied:visible\'\)\.not\(sMenu\)\.dolPopupHide\(\);\s*\/\/[^\n]*\n\s*bx_menu_popup_inline\(sMenu, e, \{pointer: \$\.extend\(\{align: \'right\'\}, oPointer \|\| \{\}\)\}\);/', $s);
        $this->assertStringNotContainsString("var sSidebar = 'account';", $s);
    }

    public function testTheSidebarCodeHasNoAccountBranchButAnswersOldCallers(): void
    {
        $s = self::read(self::DIR . '_header_js_custom.html');

        $this->assertStringContainsString("var aSidebars = ['site'];", $s);
        $this->assertMatchesRegularExpression('/function bx_sidebar_toggle\(sType\) \{\s*if\(sType == \'account\'\)\s*return bx_sidebar_account_menu\(\);/', $s);
        $this->assertMatchesRegularExpression('/function bx_sidebar_account_menu\(\) \{.*?oBxArtificerUtils\.getAccountMenu\(\'#bx-sliding-menu-account\', oAccount\);/s', $s);

        $this->assertStringContainsString("oBxArtificerUtils.getAccountMenu('#bx-sliding-menu-account'", self::read('modules/boonex/nexus/template/js.html'));
    }

    public function testTheSidebarsStylesAreGoneAndThePopupHasItsOwn(): void
    {
        $this->assertStringNotContainsString('bx-sidebar-account', self::read(self::DIR . 'css/menu-sidebar.css'));

        $s = self::read(self::DIR . 'css/menu.css');
        $this->assertMatchesRegularExpression('/#bx-sliding-menu-account \.bx-popup-content \{\s*width: 16rem;/', $s);
        $this->assertMatchesRegularExpression('/#bx-sliding-menu-account \.bx-menu-account-popup > \.bx-menu-account-popup-profile-notifications \{[^}]*overflow-y: auto;/', $s, 'A menu taller than the window scrolls its rows.');
    }
}
