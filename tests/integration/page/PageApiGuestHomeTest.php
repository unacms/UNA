<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The guest home in the apps shows what the site shows: the home cover (`cover_home`, BxBasePageHome::getCoverHomeAPI)
 * while the page's cover is on for the viewer, and the home menu as a grid. The sign-in, join and forgot password blocks
 * are off for the apps, but a guest's home still has them, marked `splash_only` (BxDolSplash::AUTH_BLOCKS): the splash's
 * sign-in form is that block, also where an app forces the splash on itself while UNA's switch is off.
 */
#[Group('integration')]
class PageApiGuestHomeTest extends BxDolIntegrationTestCase
{
    private const OPTIONS = ['sys_api_root_page_guest', 'sys_site_splash_web_enabled', 'sys_site_cover_disabled', 'sys_site_cover_common'];

    private array $_aOptionsBackup = [];
    private array $_aBlocksBackup = [];
    private $_mCoverBackup;
    private $_aGetBackup;
    private $_mPlatformBackup;

    protected function setUp(): void
    {
        parent::setUp();

        $oDb = BxDolDb::getInstance();
        foreach (self::OPTIONS as $sName)
            $this->_aOptionsBackup[$sName] = getParam($sName);
        $this->_aBlocksBackup = $oDb->getAllWithKey("SELECT `id`, `active_api`, `visible_for_levels` FROM `sys_pages_blocks` WHERE `object` = 'sys_home'", 'id');
        $this->_mCoverBackup = $oDb->getOne("SELECT `cover` FROM `sys_objects_page` WHERE `object` = 'sys_home'");
        $this->_aGetBackup = $_GET;
        $this->_mPlatformBackup = $_SERVER['HTTP_X_NEO_PLATFORM'] ?? null;

        // As installed: the home menu on for guests only, the sign-in, join and forgot password blocks off for the apps.
        $oDb->query("UPDATE `sys_pages_blocks` SET `active_api` = 1, `visible_for_levels` = 1 WHERE `object` = 'sys_home' AND `type` = 'menu' AND `content` = 'sys_homepage'");
        $oDb->query("UPDATE `sys_pages_blocks` SET `active_api` = 0 WHERE `object` = 'sys_home' AND `module` = 'system' AND `title` IN ('_sys_page_block_title_create_account', '_sys_page_block_title_login', '_sys_page_block_title_forgot_password')");
        $this->setHomeCover(2);

        $this->bxBecomeGuest();
        $GLOBALS['glMemCache'] = [];
    }

    protected function tearDown(): void
    {
        $oDb = BxDolDb::getInstance();
        foreach ($this->_aOptionsBackup as $sName => $sValue)
            setParam($sName, $sValue);
        foreach ($this->_aBlocksBackup as $iId => $aBlock)
            $oDb->query("UPDATE `sys_pages_blocks` SET `active_api` = :active_api, `visible_for_levels` = :levels WHERE `id` = :id", ['active_api' => (int)$aBlock['active_api'], 'levels' => (int)$aBlock['visible_for_levels'], 'id' => (int)$iId]);
        $this->setHomeCover((int)$this->_mCoverBackup);

        $_GET = $this->_aGetBackup ?? [];
        if ($this->_mPlatformBackup === null)
            unset($_SERVER['HTTP_X_NEO_PLATFORM']);
        else
            $_SERVER['HTTP_X_NEO_PLATFORM'] = $this->_mPlatformBackup;

        $oDb->cleanMemoryAll();
        $GLOBALS['glMemCache'] = [];
        parent::tearDown();
    }

    private function setHomeCover(int $iCover): void
    {
        $oDb = BxDolDb::getInstance();
        $oDb->query("UPDATE `sys_objects_page` SET `cover` = :cover WHERE `object` = 'sys_home'", ['cover' => $iCover]);
        $oDb->cleanCache('sys_pages_objects_data');
        $oDb->cleanMemoryAll();
    }

    /** The home page as the web app asks for it. */
    private function requestHome(): array
    {
        $_SERVER['HTTP_X_NEO_PLATFORM'] = 'web';

        if (($sObject = BxDolPageQuery::getPageObjectNameByURI('home')))
            unset($GLOBALS['bxDolClasses']['BxDolPage!' . $sObject]);
        foreach (array_keys($GLOBALS['bxDolClasses'] ?? []) as $sKey)
            if (strpos($sKey, 'BxDolMenu!') === 0)
                unset($GLOBALS['bxDolClasses'][$sKey]);
        BxDolMenu::setSelectedGlobal('', '');
        BxDolDb::getInstance()->cleanMemoryAll();

        $_GET = ['api' => 1];
        // BxDolService::call keeps results per params within a process: each request here is a new one.
        $aData = BxDolService::call('system', 'get_page_by_request', ['page/home', '', '[]'], 'TemplServicePages', true);
        $this->assertIsArray($aData);

        return $aData;
    }

    /** The sources of the page's blocks (`module:method`, `system:block_<id>`), `$bSplashOnly` the ones marked `splash_only` or the others. */
    private function sources(array $aData, bool $bSplashOnly = false): array
    {
        $aResult = [];
        foreach ($aData['elements'] ?? [] as $aCell)
            foreach ($aCell as $aBlock)
                if (!empty($aBlock['splash_only']) === $bSplashOnly)
                    $aResult[] = $aBlock['source'] ?? '';

        return $aResult;
    }

    public function testAGuestsHomeHasTheSignInBlocksForTheSplashOnly(): void
    {
        $aAuth = ['system:login_form', 'system:create_account_form', 'system:forgot_password'];
        $iMenuBlock = (int)BxDolDb::getInstance()->getOne("SELECT `id` FROM `sys_pages_blocks` WHERE `object` = 'sys_home' AND `type` = 'menu' AND `content` = 'sys_homepage'");

        foreach (['on', 'off'] as $sSplash) {
            setParam('sys_site_splash_web_enabled', $sSplash);
            $aData = $this->requestHome();
            $this->assertSame($sSplash == 'on', $aData['layout'] === 'splash', 'splash ' . $sSplash);

            foreach ($aAuth as $sSource) {
                $this->assertContains($sSource, $this->sources($aData, true), $sSource . ', splash ' . $sSplash . ': there for a splash, also one an app forces');
                $this->assertNotContains($sSource, $this->sources($aData), $sSource . ', splash ' . $sSplash . ': not for the home page');
            }
            $this->assertContains('system:block_' . $iMenuBlock, $this->sources($aData), 'the home menu is on for the apps');
        }
    }

    public function testASignInBlockOnForTheAppsIsAnOrdinaryBlock(): void
    {
        setParam('sys_site_splash_web_enabled', 'off');
        BxDolDb::getInstance()->query("UPDATE `sys_pages_blocks` SET `active_api` = 1 WHERE `object` = 'sys_home' AND `module` = 'system' AND `title` = '_sys_page_block_title_login'");

        $aData = $this->requestHome();
        $this->assertContains('system:login_form', $this->sources($aData), 'on for the apps: the home page shows it');
        $this->assertNotContains('system:login_form', $this->sources($aData, true));
    }

    public function testOnlyTheSignInBlocksComeAlongAndNotForMembersOrOtherPages(): void
    {
        setParam('sys_site_splash_web_enabled', 'on');
        BxDolDb::getInstance()->query("UPDATE `sys_pages_blocks` SET `active_api` = 0 WHERE `object` = 'sys_home' AND `type` = 'menu' AND `content` = 'sys_homepage'");

        $iMenuBlock = (int)BxDolDb::getInstance()->getOne("SELECT `id` FROM `sys_pages_blocks` WHERE `object` = 'sys_home' AND `type` = 'menu' AND `content` = 'sys_homepage'");
        $aData = $this->requestHome();
        $this->assertNotContains('system:block_' . $iMenuBlock, array_merge($this->sources($aData), $this->sources($aData, true)), 'a menu that is off stays out');

        $this->bxLoginAsAdmin();
        $this->assertSame([], $this->sources($this->requestHome(), true), 'a member gets none');
    }

    public function testTheHomeMenuIsForGuests(): void
    {
        setParam('sys_site_splash_web_enabled', 'off');
        $iMenuBlock = (int)BxDolDb::getInstance()->getOne("SELECT `id` FROM `sys_pages_blocks` WHERE `object` = 'sys_home' AND `type` = 'menu' AND `content` = 'sys_homepage'");
        $sMenu = 'system:block_' . $iMenuBlock;

        $this->assertContains($sMenu, $this->sources($this->requestHome()), 'a guest gets the home menu');

        $this->bxLoginAsAdmin();
        $this->assertNotContains($sMenu, $this->sources($this->requestHome()), 'a member does not');

        // The site's own home page follows the same visibility.
        $oPage = BxDolPage::getObjectInstance('sys_home');
        $aBlock = BxDolDb::getInstance()->getRow("SELECT * FROM `sys_pages_blocks` WHERE `id` = :id", ['id' => $iMenuBlock]);
        $this->assertEmpty((new ReflectionMethod($oPage, '_isVisibleBlock'))->invoke($oPage, $aBlock), 'not on the site either');
    }

    public function testGuestsGetTheHomeCoverWithSignUpAndLogIn(): void
    {
        setParam('sys_site_splash_web_enabled', 'off');

        $aCover = $this->requestHome()['cover_home'] ?? null;
        $this->assertIsArray($aCover);
        $this->assertNotSame('', $aCover['title'] . $aCover['title_accent']);
        $this->assertNotSame('', $aCover['text']);
        $this->assertArrayHasKey('image', $aCover);
        $this->assertSame(['join', 'login'], array_column($aCover['actions'], 'name'));
        $this->assertSame(['/create-account', '/login'], array_column($aCover['actions'], 'link'));
        $this->assertSame([true, false], array_column($aCover['actions'], 'primary'));
    }

    public function testWithoutAPictureTheCoverHasTheTemplatesArt(): void
    {
        setParam('sys_site_splash_web_enabled', 'off');
        setParam('sys_site_cover_common', '0');

        $aCover = $this->requestHome()['cover_home'] ?? null;
        $this->assertIsArray($aCover);
        if ((int)BxDolDb::getInstance()->getOne("SELECT `cover_image` FROM `sys_objects_page` WHERE `object` = 'sys_home'") === 0)
            $this->assertSame('', $aCover['image'], 'no picture in Studio');
        // The default Studio > Designer > Cover shows for the site's template.
        list($sLight, $sDark) = BxDolCover::getDefaultArt(BxDolModuleQuery::getInstance()->getModuleByUri(BxDolTemplate::getInstance()->getCode()));
        $this->assertNotSame('', $sLight);
        $this->assertSame(['light' => $sLight, 'dark' => $sDark], $aCover['image_default']);
    }

    public function testCoversOffInTheDesignerLeaveTheHomeCoverOut(): void
    {
        setParam('sys_site_splash_web_enabled', 'off');

        setParam('sys_site_cover_disabled', 'on');
        $this->assertArrayNotHasKey('cover_home', $this->requestHome(), 'Studio > Designer > Cover: off');

        setParam('sys_site_cover_disabled', '');
        $this->assertArrayHasKey('cover_home', $this->requestHome(), 'on again');
    }

    public function testNoHomeCoverOnTheSplashOrWhereTheCoverIsOff(): void
    {
        setParam('sys_site_splash_web_enabled', 'on');
        $this->assertArrayNotHasKey('cover_home', $this->requestHome(), 'the splash replaces the page');

        setParam('sys_site_splash_web_enabled', 'off');
        $this->setHomeCover(0);
        $this->assertArrayNotHasKey('cover_home', $this->requestHome(), 'cover off');

        $this->setHomeCover(3);
        $this->assertArrayNotHasKey('cover_home', $this->requestHome(), 'members only');
    }

    public function testMembersGetTheCoverWithoutTheGuestLinks(): void
    {
        $this->bxLoginAsAdmin();

        $this->assertArrayNotHasKey('cover_home', $this->requestHome(), 'visitors only');

        $this->setHomeCover(1);
        $aCover = $this->requestHome()['cover_home'] ?? null;
        $this->assertIsArray($aCover, 'on for all');
        $this->assertSame([], $aCover['actions'], 'no Sign up or Log in for a member');
    }

    public function testTheHomeMenuIsAGridInTheApps(): void
    {
        $sConfig = (string)BxDolDb::getInstance()->getOne("SELECT `config_api` FROM `sys_objects_menu` WHERE `object` = 'sys_homepage'");
        $this->assertSame(['view' => 'grid'], json_decode($sConfig, true));
    }
}
