<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Other sign-in methods (sys_objects_auths) on the login and join forms: a list of full-width buttons under the form,
 * each with its provider's logo.
 */
#[Group('integration')]
class AuthButtonsTest extends BxDolIntegrationTestCase
{
    public function testBrandIconsAreDrawnFromTheirLogoFiles(): void
    {
        $aAuths = BxDolDb::getInstance()->getAll('SELECT * FROM `sys_objects_auths`');
        if(empty($aAuths))
            $this->markTestSkipped('No sign-in method is installed.');

        $this->bxBecomeGuest();
        $sHtml = (string)(new BxTemplServiceLogin())->serviceMemberAuthCode();

        $this->assertSame(count($aAuths), substr_count($sHtml, 'class="sys-auth '), 'One button per sign-in method.');
        $this->assertStringNotContainsString('sys-auth-compact', $sHtml, 'No icon-only grid.');
        $this->assertStringNotContainsString('sys-auth-or', $sHtml, 'No "or" unless asked for: the list can stand alone.');

        $oTemplate = BxDolTemplate::getInstance();
        $iBrands = 0;
        foreach($aAuths as $aAuth) {
            $this->assertStringContainsString(_t($aAuth['Title']), $sHtml, 'Every button has its label.');

            if(preg_match('/^fab ([a-z0-9-]+)$/', $aAuth['Icon'], $aMatch) && $oTemplate->getIconPath('auth-' . $aMatch[1] . '.svg'))
                $iBrands++;
        }
        $this->assertSame($iBrands, substr_count($sHtml, '<svg'), 'A brand icon with a logo file is drawn from the file, not as a font icon.');
    }

    public function testSeparatorComesWithTheForm(): void
    {
        if(!BxDolDb::getInstance()->getOne('SELECT COUNT(*) FROM `sys_objects_auths`'))
            $this->markTestSkipped('No sign-in method is installed.');

        $this->bxBecomeGuest();
        $sHtml = (string)(new BxTemplServiceLogin())->serviceMemberAuthCode([], true);

        $this->assertStringContainsString('sys-auth-or', $sHtml);
        $this->assertLessThan(strpos($sHtml, 'sys-auth-block'), strpos($sHtml, 'sys-auth-or'), 'The "or" is above the list.');
    }

    public function testEveryBrandLogoIsAPlainSvg(): void
    {
        $aFiles = glob(BX_DIRECTORY_PATH_ROOT . 'template/images/icons/auth-*.svg');
        $this->assertNotEmpty($aFiles);

        foreach($aFiles as $sFile) {
            $sSvg = file_get_contents($sFile);
            $this->assertMatchesRegularExpression('/<svg [^>]*viewBox="0 0 24 24"/', $sSvg, basename($sFile));
            $this->assertDoesNotMatchRegularExpression('/<script|on[a-z]+\s*=|href\s*=|<foreignObject/i', $sSvg, basename($sFile) . ' is inlined into the page: no scripts, handlers or links.');
        }
    }
}
