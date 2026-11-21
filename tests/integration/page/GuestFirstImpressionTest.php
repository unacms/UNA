<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * What a guest sees first: the splash (on for the site on a fresh install) with the site's description as its one
 * tagline, the same on the site and in the apps; no home grid of links that repeats the header; Explore with content
 * of its own instead of the home cover.
 */
#[Group('integration')]
class GuestFirstImpressionTest extends BxDolIntegrationTestCase
{
    public function testSplashTaglineIsTheSiteDescription(): void
    {
        $oSplash = BxDolSplash::getInstance();
        $sDescription = $oSplash->getSiteDescription();

        $this->assertNotSame('', $sDescription);
        $this->assertSame(trim(strip_tags(BxDolPage::getMetaDescriptionByObject('sys_home'))), $sDescription);
        $this->assertStringNotContainsString('{site_title}', $sDescription);

        // The default code uses the marker, and the apps get the words in its place.
        $this->assertStringContainsString('{site_description}', $this->_installDefault('sys_site_splash_code'));
        $sCode = $oSplash->getCodeForApp('<p class="bx-landing-text">{site_description}</p>');
        $this->assertStringContainsString(htmlspecialchars($sDescription, ENT_NOQUOTES | ENT_HTML5), $sCode);
        $this->assertStringNotContainsString('{site_description}', $sCode);
    }

    public function testTaglineKeepsAnOlderSplashsSlogan(): void
    {
        $sCode = (string)getParam('sys_site_splash_code');
        try {
            setParam('sys_site_splash_code', '<p>{site_description}</p>');
            $this->assertSame(BxDolSplash::getInstance()->getSiteDescription(), BxDolSplash::getInstance()->getTagline());

            // An operator kept an older splash with the slogan: the apps and the home cover keep it too.
            setParam('sys_site_splash_code', '<p><bx_text:_sys_txt_splash_slogan /></p>');
            $this->assertSame(trim(strip_tags(_t('_sys_txt_splash_slogan'))), BxDolSplash::getInstance()->getTagline());
        }
        finally {
            setParam('sys_site_splash_code', $sCode);
        }
    }

    public function testFreshInstallShowsTheSplashOnTheSite(): void
    {
        $this->assertSame('on', $this->_installDefault('sys_site_splash_enabled'));
    }

    public function testHomeHasNoGridOfLinksAndExploreNoHomeCover(): void
    {
        $oDb = BxDolDb::getInstance();

        $aGrid = $oDb->getRow("SELECT `active`, `active_api` FROM `sys_pages_blocks` WHERE `object` = 'sys_home' AND `module` = 'system' AND `type` = 'menu' AND `content` = 'sys_homepage'");
        $this->assertSame(['active' => 0, 'active_api' => 0], array_map('intval', $aGrid));

        $this->assertSame('', (string)$oDb->getOne("SELECT `override_class_name` FROM `sys_objects_page` WHERE `object` = 'sys_explore'"));

        if (BxDolModuleQuery::getInstance()->isEnabledByName('bx_posts'))
            $this->assertSame(1, (int)$oDb->getOne("SELECT COUNT(*) FROM `sys_pages_blocks` WHERE `object` = 'sys_explore' AND `module` = 'bx_posts' AND `active` = 1"));
    }

    public function testShareImageWithoutUploadsIsTheTemplatesIcon(): void
    {
        $aBackup = [];
        foreach (['sys_site_icon_android_splash', 'sys_site_icon_android', 'sys_site_icon_apple', 'sys_site_logo'] as $sName) {
            $aBackup[$sName] = getParam($sName);
            setParam($sName, '0');
        }

        try {
            $aImage = BxTemplPage::getSiteMetaImage();
            $this->assertStringStartsWith(BX_DOL_URL_ROOT, $aImage['url'], 'A real address, not a data: URL.');
            $this->assertStringEndsWith('android-icon-512.png', $aImage['url']);
            $this->assertSame([512, 512, 'summary'], [$aImage['width'], $aImage['height'], $aImage['card']]);
        }
        finally {
            foreach ($aBackup as $sName => $sValue)
                setParam($sName, $sValue);
        }
    }

    /** An option's value as install/sql/system.sql sets it. */
    private function _installDefault(string $sName): string
    {
        $sSql = file_get_contents(BX_DIRECTORY_PATH_ROOT . 'install/sql/system.sql');
        $this->assertTrue((bool)preg_match("/\\(@iCategoryId, '" . preg_quote($sName, '/') . "', '[^']*', '((?:[^'\\\\]|\\\\.)*)'/s", $sSql, $aMatch), $sName);

        return stripcslashes($aMatch[1]);
    }
}
