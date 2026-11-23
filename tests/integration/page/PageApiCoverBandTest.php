<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * A page's cover is a band of the picture or the template's art above the page's title and tabs, with no words on it.
 * The apps get it with the page (`cover_band`, BxBasePage::getPageCoverBandAPI) where the site draws it: covers on in
 * Studio > Designer > Cover and the page's cover on for the viewer. The home page has its own cover (`cover_home`), and
 * an entry's or a profile's page the entry's or the profile's (`cover_block`).
 */
#[Group('integration')]
class PageApiCoverBandTest extends BxDolIntegrationTestCase
{
    private const OPTIONS = ['sys_site_cover_disabled', 'sys_site_cover_common', 'sys_site_splash_web_enabled'];

    private array $_aOptionsBackup = [];
    private array $_aPagesBackup = [];
    private $_aGetBackup;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (self::OPTIONS as $sName)
            $this->_aOptionsBackup[$sName] = getParam($sName);
        $this->_aPagesBackup = BxDolDb::getInstance()->getAllWithKey("SELECT `object`, `cover`, `cover_image` FROM `sys_objects_page` WHERE `object` IN ('sys_about', 'sys_home')", 'object');
        $this->_aGetBackup = $_GET;

        setParam('sys_site_cover_disabled', '');
        setParam('sys_site_cover_common', '0');
        setParam('sys_site_splash_web_enabled', 'off');
        $this->setCover('sys_about', 1, 0);

        $this->bxBecomeGuest();
        $GLOBALS['glMemCache'] = [];
    }

    protected function tearDown(): void
    {
        foreach ($this->_aOptionsBackup as $sName => $sValue)
            setParam($sName, $sValue);
        foreach ($this->_aPagesBackup as $sObject => $aPage)
            $this->setCover($sObject, (int)$aPage['cover'], (int)$aPage['cover_image']);

        $_GET = $this->_aGetBackup ?? [];
        BxDolDb::getInstance()->cleanMemoryAll();
        $GLOBALS['glMemCache'] = [];
        parent::tearDown();
    }

    private function setCover(string $sObject, int $iCover, int $iImage): void
    {
        $oDb = BxDolDb::getInstance();
        $oDb->query("UPDATE `sys_objects_page` SET `cover` = :cover, `cover_image` = :image WHERE `object` = :object", ['cover' => $iCover, 'image' => $iImage, 'object' => $sObject]);
        $oDb->cleanCache('sys_pages_objects_data');
        $oDb->cleanMemoryAll();
    }

    /** A page as NEO asks for it; page and menu objects are cached per request, so drop the cached ones. */
    private function request(string $sUri, array $aQuery = []): array
    {
        if (($sObject = BxDolPageQuery::getPageObjectNameByURI($sUri)))
            unset($GLOBALS['bxDolClasses']['BxDolPage!' . $sObject]);
        foreach (array_keys($GLOBALS['bxDolClasses'] ?? []) as $sKey)
            if (strpos($sKey, 'BxDolMenu!') === 0)
                unset($GLOBALS['bxDolClasses'][$sKey]);
        unset($GLOBALS['bxDolClasses']['BxDolCover']);
        BxDolMenu::setSelectedGlobal('', '');

        $_GET = ['api' => 1];
        $aData = BxDolService::call('system', 'get_page_by_request', ['page/' . $sUri, '', json_encode($aQuery ?: new stdClass())], 'TemplServicePages', true);
        $this->assertIsArray($aData, $sUri);

        return $aData;
    }

    public function testAPageWithItsCoverOnGetsTheBandWithTheTemplatesArt(): void
    {
        $aBand = $this->request('about')['cover_band'] ?? null;
        $this->assertIsArray($aBand);
        $this->assertSame('', $aBand['image'], 'no picture in Studio');

        list($sLight, $sDark) = BxDolCover::getDefaultArt(BxDolModuleQuery::getInstance()->getModuleByUri(BxDolTemplate::getInstance()->getCode()));
        $this->assertNotSame('', $sLight);
        $this->assertSame(['light' => $sLight, 'dark' => $sDark], $aBand['image_default']);
    }

    public function testNoBandWhereTheSiteDrawsNoCover(): void
    {
        setParam('sys_site_cover_disabled', 'on');
        $this->assertArrayNotHasKey('cover_band', $this->request('about'), 'Studio > Designer > Cover: off');
        setParam('sys_site_cover_disabled', '');

        $this->setCover('sys_about', 0, 0);
        $this->assertArrayNotHasKey('cover_band', $this->request('about'), 'cover off');

        $this->setCover('sys_about', 3, 0);
        $this->assertArrayNotHasKey('cover_band', $this->request('about'), 'members only, asked by a guest');

        $this->setCover('sys_about', 2, 0);
        $this->assertArrayHasKey('cover_band', $this->request('about'), 'visitors only, asked by a guest');
    }

    public function testMembersGetTheBandWhereTheCoverIsOnForThem(): void
    {
        $this->bxLoginAsAdmin();

        $this->setCover('sys_about', 2, 0);
        $this->assertArrayNotHasKey('cover_band', $this->request('about'), 'visitors only');

        $this->setCover('sys_about', 3, 0);
        $this->assertArrayHasKey('cover_band', $this->request('about'), 'members only');
    }

    public function testTheHomePageKeepsItsOwnCover(): void
    {
        $this->setCover('sys_home', 1, 0);
        $aHome = $this->request('home');
        $this->assertArrayHasKey('cover_home', $aHome);
        $this->assertArrayNotHasKey('cover_band', $aHome);
    }

    public function testAProfilesPageKeepsTheProfilesCover(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_persons'))
            $this->markTestSkipped('bx_persons is not installed');

        $iContentId = (int)BxDolDb::getInstance()->getOne("SELECT `content_id` FROM `sys_profiles` WHERE `type` = 'bx_persons' AND `status` = 'active' ORDER BY `id` LIMIT 1");
        if (!$iContentId)
            $this->markTestSkipped('no active person');

        $this->bxLoginAsAdmin();
        $aData = $this->request('view-persons-profile', ['id' => $iContentId]);
        $this->assertEmpty($aData['page_status'] ?? null);
        $this->assertArrayNotHasKey('cover_band', $aData);
    }
}
