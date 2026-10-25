<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * A site locked from guests (sys_lock_from_unauthenticated) opens them only the pages listed in
 * sys_lock_from_unauthenticated_exceptions. page.php sends a guest to the login form; the page API
 * (NEO web, the apps and link previews made from it) gives 403 and nothing of the page's content.
 *
 * The options are changed in memory only, so the site itself is never locked by the test.
 * The test makes its own post and deletes it, so it runs on any site with Posts installed.
 */
#[Group('integration')]
class PageApiGuestLockTest extends BxDolIntegrationTestCase
{
    private const OPTIONS = ['sys_lock_from_unauthenticated', 'sys_lock_from_unauthenticated_exceptions'];
    private const EXCEPTIONS = 'login,forgot-password,create-account,confirm-email,terms,privacy,contact,about,home';
    private const MARK = 'PageApiGuestLockTest';

    protected $_aGetBackup;
    protected $_aServerBackup;
    protected $_aOptionsBackup = [];
    protected $_iPostId = 0;

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aGetBackup = $_GET;
        $this->_aServerBackup = $_SERVER;

        foreach (self::OPTIONS as $sName)
            $this->_aOptionsBackup[$sName] = getParam($sName);

        // The lock reads the request: api.php is not one of its exceptions, unlike member.php and the OAuth2 urls.
        $_SERVER['REQUEST_URI'] = '/api.php?r=system/get_page_by_request/TemplServicePages';
        $_SERVER['PHP_SELF'] = '/api.php';

        $this->bxBecomeGuest();
        $GLOBALS['glMemCache'] = []; // view checks are remembered for a page load
    }

    protected function tearDown(): void
    {
        $oDb = BxDolDb::getInstance();
        if ($this->_iPostId) {
            BxDolPage::deleteSeoLink('bx_posts', 'bx_posts', $this->_iPostId);
            $oDb->query("DELETE FROM `bx_posts_posts` WHERE `id` = :id", ['id' => $this->_iPostId]);
        }

        foreach ($this->_aOptionsBackup as $sName => $mixedValue)
            $this->bxSetParamCache($sName, $mixedValue);

        $oDb->cleanMemoryAll();
        $GLOBALS['glMemCache'] = [];

        $_GET = $this->_aGetBackup ?? [];
        $_SERVER = $this->_aServerBackup ?? $_SERVER;
        $this->dropModules();
        parent::tearDown();
    }

    protected function bxSetParamCache(string $sKey, $mixedValue): void
    {
        $oProp = new ReflectionProperty(BxDolDb::class, '_aParams');
        $aParams = $oProp->getValue();
        $aParams[$sKey] = $mixedValue;
        $oProp->setValue(null, $aParams);
    }

    protected function lock(bool $bLocked): void
    {
        $this->bxSetParamCache('sys_lock_from_unauthenticated', $bLocked ? 'on' : '');
        $this->bxSetParamCache('sys_lock_from_unauthenticated_exceptions', self::EXCEPTIONS);
    }

    protected function addPost(array $aFields = []): int
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_posts'))
            $this->markTestSkipped('Posts are not installed.');

        $iAuthor = (int)BxDolProfile::getInstanceAccountProfile($this->bxAccount('admin')->id())->id();
        $iNow = time();

        $oDb = BxDolDb::getInstance();
        $oDb->query("INSERT INTO `bx_posts_posts` SET " . $oDb->arrayToSQL(array_merge([
            'author' => $iAuthor,
            'added' => $iNow,
            'changed' => $iNow,
            'published' => $iNow,
            'thumb' => 0,
            'thumb_data' => '',
            'title' => self::MARK . ' post',
            'cat' => 0,
            'multicat' => '',
            'abstract' => '',
            'text' => '<p>' . self::MARK . ' members only text.</p>',
            'labels' => '',
            'location' => '',
            'allow_view_to' => BX_DOL_PG_ALL,
            'status' => 'active',
            'status_admin' => 'active',
        ], $aFields)));
        $this->_iPostId = (int)$oDb->lastId();
        $oDb->cleanMemoryAll();

        return $this->_iPostId;
    }

    /**
     * Modules read the API mode once, when created: another test may have left one for the site.
     */
    protected function dropModules(): void
    {
        unset($GLOBALS['bxDolClasses']['BxPostsModule'], $GLOBALS['bxDolClasses']['BxPersonsModule']);
    }

    /**
     * A page as NEO asks for it ($sWhat is 'page' or 'page_content'); page objects are cached per request, so drop the cached one.
     */
    protected function request(string $sUri, array $aParams = [], string $sWhat = 'page'): array
    {
        if (($sObject = BxDolPageQuery::getPageObjectNameByURI($sUri)))
            unset($GLOBALS['bxDolClasses']['BxDolPage!' . $sObject]);

        $_GET = ['api' => 1];
        $this->dropModules();
        $aData = bx_srv('system', 'get_' . $sWhat . '_by_request', ['page/' . $sUri, '', json_encode($aParams)], 'TemplServicePages');
        $this->assertIsArray($aData);

        return $aData;
    }

    protected function assertSiteLevelOnly(array $aData): void
    {
        $sSiteTitle = getParam('site_title');

        $this->assertSame(403, $aData['page_status'] ?? null);
        $this->assertSame($sSiteTitle, $aData['title']);
        $this->assertSame($sSiteTitle, $aData['name']);
        $this->assertSame('', $aData['description']);
        $this->assertSame('', $aData['keywords']);
        $this->assertSame('', $aData['image']);
        $this->assertSame('', $aData['cover_block']);
        $this->assertSame([], $aData['elements']);
    }

    public function testUnlockedSiteShowsThePost(): void
    {
        $this->lock(false);
        $aData = $this->request('view-post', ['id' => $this->addPost()]);

        $this->assertArrayNotHasKey('page_status', $aData);
        $this->assertSame(self::MARK . ' post', $aData['title']);
        $this->assertNotEmpty($aData['elements']);
    }

    public function testLockedPostGivesGuestsNothing(): void
    {
        $this->lock(true);
        $aData = $this->request('view-post', ['id' => $this->addPost()]);

        $this->assertTrue(BxDolPage::isLockedFromUnauthenticated('view-post'), 'page.php sends a guest to the login form from this page.');
        $this->assertSiteLevelOnly($aData);
        $this->assertStringNotContainsString(self::MARK, json_encode($aData));
    }

    public function testLockedPendingPostIsNotFoundNeither(): void
    {
        $this->lock(true);
        $aData = $this->request('view-post', ['id' => $this->addPost(['status_admin' => 'pending'])]);

        // 403 whatever the page holds: a 404 would tell guests which entries exist.
        $this->assertSame(403, $aData['page_status'] ?? null);
        $this->assertStringNotContainsString(self::MARK, json_encode($aData));
    }

    public function testLockedContentApiGivesGuestsNothing(): void
    {
        $this->lock(true);
        $aData = $this->request('view-post', ['id' => $this->addPost()], 'page_content');

        $this->assertSame(403, $aData['page_status'] ?? null);
        $this->assertSame(getParam('site_title'), $aData['title']);
        $this->assertSame([], $aData['elements']);
        $this->assertStringNotContainsString(self::MARK, json_encode($aData));
    }

    public function testMembersOfLockedSiteSeeThePost(): void
    {
        $this->lock(true);
        $iId = $this->addPost();
        $this->bxLoginAsAdmin();

        $aData = $this->request('view-post', ['id' => $iId]);

        $this->assertArrayNotHasKey('page_status', $aData);
        $this->assertSame(self::MARK . ' post', $aData['title']);
        $this->assertNotEmpty($aData['elements']);
    }

    public function testLockedProfileShowsGuestsNoCover(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_persons'))
            $this->markTestSkipped('Persons are not installed.');

        $oProfile = BxDolProfile::getInstanceByAccount($this->bxAccount('admin')->id());
        if (!$oProfile || $oProfile->getModule() != 'bx_persons')
            $this->markTestSkipped('The test account has no person profile.');

        $this->lock(true);
        $aData = $this->request('view-persons-profile', ['id' => (int)$oProfile->getContentId()]);

        $this->assertSiteLevelOnly($aData);
    }

    public function testExceptionPagesStayOpen(): void
    {
        $this->lock(true);

        foreach (['login', 'create-account', 'home'] as $sUri) {
            $this->assertFalse(BxDolPage::isLockedFromUnauthenticated($sUri), $sUri . ' is open on the classic site.');

            $aData = $this->request($sUri);
            $this->assertArrayNotHasKey('page_status', $aData, $sUri);
            $this->assertSame($sUri, $aData['uri']);
        }

        $this->assertNotEmpty($this->request('login')['elements'], 'Guests get the login form.');
    }
}
