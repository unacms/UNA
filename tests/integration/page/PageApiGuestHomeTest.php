<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The guest home in the apps shows what the site shows: the home cover (`cover_home`, BxBasePageHome::getCoverHomeAPI)
 * while the page's cover is on for the viewer, and the home menu as a grid. The sign-in, join and forgot password blocks
 * are off for the apps, but the splash still gets them (BxDolSplash::AUTH_BLOCKS): its sign-in form is that block.
 */
#[Group('integration')]
class PageApiGuestHomeTest extends BxDolIntegrationTestCase
{
    private const OPTIONS = ['sys_api_root_page_guest', 'sys_site_splash_web_enabled'];

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
        $this->_aBlocksBackup = $oDb->getPairs("SELECT `id`, `active_api` FROM `sys_pages_blocks` WHERE `object` = 'sys_home'", 'id', 'active_api');
        $this->_mCoverBackup = $oDb->getOne("SELECT `cover` FROM `sys_objects_page` WHERE `object` = 'sys_home'");
        $this->_aGetBackup = $_GET;
        $this->_mPlatformBackup = $_SERVER['HTTP_X_NEO_PLATFORM'] ?? null;

        // As installed: the home menu on, the sign-in, join and forgot password blocks off for the apps.
        $oDb->query("UPDATE `sys_pages_blocks` SET `active_api` = 1 WHERE `object` = 'sys_home' AND `type` = 'menu' AND `content` = 'sys_homepage'");
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
        foreach ($this->_aBlocksBackup as $iId => $iActiveApi)
            $oDb->query("UPDATE `sys_pages_blocks` SET `active_api` = :active_api WHERE `id` = :id", ['active_api' => (int)$iActiveApi, 'id' => (int)$iId]);
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

    /** The sources of the page's blocks (`module:method`, `system:block_<id>`). */
    private function sources(array $aData): array
    {
        $aResult = [];
        foreach ($aData['elements'] ?? [] as $aCell)
            foreach ($aCell as $aBlock)
                $aResult[] = $aBlock['source'] ?? '';

        return $aResult;
    }

    public function testTheSplashGetsTheSignInBlocksWhileTheyAreOffInTheApps(): void
    {
        setParam('sys_site_splash_web_enabled', 'on');
        $aData = $this->requestHome();
        $this->assertSame('splash', $aData['layout']);
        foreach (['system:login_form', 'system:create_account_form', 'system:forgot_password'] as $sSource)
            $this->assertContains($sSource, $this->sources($aData), $sSource . ': the splash draws it');

        setParam('sys_site_splash_web_enabled', 'off');
        $aData = $this->requestHome();
        $this->assertNotSame('splash', $aData['layout']);
        $aSources = $this->sources($aData);
        foreach (['system:login_form', 'system:create_account_form', 'system:forgot_password'] as $sSource)
            $this->assertNotContains($sSource, $aSources, $sSource . ': off for the apps, and no splash');

        $iMenuBlock = (int)BxDolDb::getInstance()->getOne("SELECT `id` FROM `sys_pages_blocks` WHERE `object` = 'sys_home' AND `type` = 'menu' AND `content` = 'sys_homepage'");
        $this->assertContains('system:block_' . $iMenuBlock, $aSources, 'the home menu');
    }

    public function testTheSplashLeavesOutOtherBlocksThatAreOff(): void
    {
        setParam('sys_site_splash_web_enabled', 'on');
        BxDolDb::getInstance()->query("UPDATE `sys_pages_blocks` SET `active_api` = 0 WHERE `object` = 'sys_home' AND `type` = 'menu' AND `content` = 'sys_homepage'");

        $iMenuBlock = (int)BxDolDb::getInstance()->getOne("SELECT `id` FROM `sys_pages_blocks` WHERE `object` = 'sys_home' AND `type` = 'menu' AND `content` = 'sys_homepage'");
        $this->assertNotContains('system:block_' . $iMenuBlock, $this->sources($this->requestHome()), 'only the sign-in blocks come along');
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
