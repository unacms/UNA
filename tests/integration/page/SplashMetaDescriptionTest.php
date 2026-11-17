<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The site's splash page (splash.php) has a meta description (BxDolSplash::getMetaDescription): the home page's own
 * one, else the site's default one, with the site's title in place of its marker.
 */
#[Group('integration')]
class SplashMetaDescriptionTest extends BxDolIntegrationTestCase
{
    protected $_sSaved;

    protected function setUp(): void
    {
        parent::setUp();

        $this->_sSaved = (string)BxDolDb::getInstance()->getOne("SELECT `meta_description` FROM `sys_objects_page` WHERE `object` = 'sys_home'");
    }

    protected function tearDown(): void
    {
        $this->_setHomeDescription($this->_sSaved);

        parent::tearDown();
    }

    protected function _setHomeDescription(string $s): void
    {
        $oDb = BxDolDb::getInstance();
        $oDb->query("UPDATE `sys_objects_page` SET `meta_description` = :value WHERE `object` = 'sys_home'", ['value' => $s]);

        // BxDolPage keeps the objects it made, and their rows are cached.
        unset($GLOBALS['bxDolClasses']['BxDolPage!sys_home']);
        $oDb->cleanCache('sys_pages_objects_data');
    }

    public function testWithoutAHomeDescriptionItIsTheSitesDefault(): void
    {
        $this->_setHomeDescription('');

        $s = BxDolSplash::getInstance()->getMetaDescription();

        $this->assertSame(bx_replace_markers(_t('_sys_page_meta_description_default'), ['site_title' => getParam('site_title')]), $s);
        $this->assertNotSame('', $s);
        $this->assertStringNotContainsString('{site_title}', $s);
        $this->assertStringContainsString(getParam('site_title'), $s);
    }

    public function testTheHomePagesOwnDescriptionWins(): void
    {
        $this->_setHomeDescription('Riverside rowers and their boats, on {site_title}.');

        $this->assertSame('Riverside rowers and their boats, on ' . getParam('site_title') . '.', BxDolSplash::getInstance()->getMetaDescription());
    }
}
