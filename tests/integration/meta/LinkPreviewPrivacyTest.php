<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Link previews (Slack, X, Facebook...) are made from what a guest gets: the page head on the
 * site and the page API data on NEO. A page the guest can't open gives none of its content there:
 * no title, text or image of a pending or private entry, and em.php (oEmbed) gives nothing.
 *
 * The test makes its own posts and deletes them, so it runs on any site with Posts installed.
 */
#[Group('integration')]
class LinkPreviewPrivacyTest extends BxDolIntegrationTestCase
{
    protected $_aGetBackup;
    protected $_aIds = [];
    protected $_aPersonBackup = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aGetBackup = $_GET;

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_posts'))
            $this->markTestSkipped('Posts are not installed.');

        $this->bxBecomeGuest();
    }

    protected function tearDown(): void
    {
        $oDb = BxDolDb::getInstance();
        foreach ($this->_aIds as $iId) {
            BxDolPage::deleteSeoLink('bx_posts', 'bx_posts', $iId);
            $oDb->query("DELETE FROM `bx_posts_posts` WHERE `id` = :id", ['id' => $iId]);
        }
        if ($this->_aPersonBackup)
            $oDb->query("UPDATE `bx_persons_data` SET `allow_view_to` = :value WHERE `id` = :id", $this->_aPersonBackup);
        $oDb->cleanMemoryAll();
        $GLOBALS['glMemCache'] = [];

        BxDolTemplate::getInstance()->resetPageMeta();
        $_GET = $this->_aGetBackup ?? [];
        parent::tearDown();
    }

    protected function addPost(array $aFields = []): int
    {
        $iAuthor = (int)BxDolProfile::getInstanceAccountProfile($this->bxAccount('admin')->id())->id();
        $iNow = time();

        $aFields = array_merge([
            'author' => $iAuthor,
            'added' => $iNow,
            'changed' => $iNow,
            'published' => $iNow,
            'thumb' => 0,
            'thumb_data' => '',
            'title' => 'LinkPreviewPrivacyTest post',
            'cat' => 0,
            'multicat' => '',
            'abstract' => '',
            'text' => '<p>LinkPreviewPrivacyTest secret text.</p>',
            'labels' => '',
            'location' => '',
            'allow_view_to' => BX_DOL_PG_ALL,
            'status' => 'active',
            'status_admin' => 'active',
        ], $aFields);

        $oDb = BxDolDb::getInstance();
        $oDb->query("INSERT INTO `bx_posts_posts` SET " . $oDb->arrayToSQL($aFields));
        $iId = (int)$oDb->lastId();
        $this->_aIds[] = $iId;
        $oDb->cleanMemoryAll();

        return $iId;
    }

    /**
     * The view page of a post as the API builds it for NEO; page objects are cached per request, so drop the cached one.
     */
    protected function getPage(int $iId)
    {
        $sObject = BxDolPageQuery::getPageObjectNameByURI('view-post');
        unset($GLOBALS['bxDolClasses']['BxDolPage!' . $sObject]);

        $_GET['i'] = 'view-post';
        $_GET['id'] = $iId;
        $_GET['api'] = 1;

        $oPage = BxDolPage::getObjectInstanceByURI('view-post');
        $this->assertInstanceOf(BxDolPage::class, $oPage);

        return $oPage;
    }

    protected function assertSiteLevelOnly(array $aData): void
    {
        $sSiteTitle = getParam('site_title');
        $this->assertSame($sSiteTitle, $aData['title']);
        $this->assertSame($sSiteTitle, $aData['name']);
        $this->assertSame('', $aData['description']);
        $this->assertSame('', $aData['image']);
        $this->assertSame('', $aData['keywords']);
        $this->assertSame([], $aData['elements'], 'No blocks: the blocks of a pending entry show it.');
        $this->assertStringNotContainsString('LinkPreviewPrivacyTest', json_encode($aData));
    }

    public function testPublicPostDescribesItself(): void
    {
        $aData = $this->getPage($this->addPost())->getPageAPI();

        $this->assertArrayNotHasKey('page_status', $aData);
        $this->assertSame('LinkPreviewPrivacyTest post', $aData['title']);
        $this->assertStringContainsString('LinkPreviewPrivacyTest secret text.', $aData['description']);
    }

    public function testPendingPostGivesNothing(): void
    {
        $aData = $this->getPage($this->addPost(['status_admin' => 'pending']))->getPageAPI();

        $this->assertSame(404, $aData['page_status']);
        $this->assertSiteLevelOnly($aData);
    }

    public function testMeOnlyPostGivesNothing(): void
    {
        $aData = $this->getPage($this->addPost(['allow_view_to' => BX_DOL_PG_MEONLY]))->getPageAPI();

        $this->assertSame(403, $aData['page_status']);
        $this->assertSiteLevelOnly($aData);
    }

    public function testContentApiHidesTitleOfPendingPost(): void
    {
        $aData = $this->getPage($this->addPost(['status' => 'awaiting']))->getPageContentAPI();

        $this->assertSame(getParam('site_title'), $aData['title']);
    }

    public function testEmbedDataOnlyForViewablePost(): void
    {
        $iPublic = $this->addPost();
        $iMeOnly = $this->addPost(['allow_view_to' => BX_DOL_PG_MEONLY]);
        $sObject = BxDolPageQuery::getPageObjectNameByURI('view-post');

        unset($GLOBALS['bxDolClasses']['BxDolPage!' . $sObject]);
        $aEmbed = BxDolPage::getEmbedData('page.php?i=view-post&id=' . $iPublic);
        $this->assertSame('LinkPreviewPrivacyTest post', $aEmbed['title'] ?? null);

        unset($GLOBALS['bxDolClasses']['BxDolPage!' . $sObject]);
        $this->assertSame([], BxDolPage::getEmbedData('page.php?i=view-post&id=' . $iMeOnly));

        $this->assertSame([], BxDolPage::getEmbedData('page.php?i=no-such-page-uri'));
    }

    public function testEmbedDataChecksTheEntryOwnPage(): void
    {
        $iMeOnly = $this->addPost(['allow_view_to' => BX_DOL_PG_MEONLY]);
        $iProfile = (int)BxDolProfile::getInstanceByAccount($this->bxAccount('admin')->id())->id();

        // Another page of the module ignores the id, so it can't vouch for the entry.
        foreach (['posts-home', 'posts-popular'] as $sUri)
            $this->assertSame([], BxDolPage::getEmbedData('page.php?i=' . $sUri . '&id=' . $iMeOnly), $sUri);

        // Params of the url other than the id don't reach the page.
        $this->assertSame([], BxDolPage::getEmbedData('page.php?i=view-post&id=' . $iMeOnly . '&profile_id=' . $iProfile));
        $_GET['profile_id'] = $iProfile;
        $this->assertSame([], BxDolPage::getEmbedData('page.php?i=view-post&id=' . $iMeOnly));
    }

    public function testSharePopupPageKeepsItsEmbed(): void
    {
        $iPublic = $this->addPost();

        // page.php creates the page object before the share popup asks for the embed, without the entry id.
        $sObject = BxDolPageQuery::getPageObjectNameByURI('view-post');
        unset($GLOBALS['bxDolClasses']['BxDolPage!' . $sObject], $_GET['id']);
        $oPage = BxDolPage::getObjectInstance($sObject);

        $aEmbed = BxDolPage::getEmbedData('page.php?i=view-post&id=' . $iPublic);

        $this->assertSame('LinkPreviewPrivacyTest post', $aEmbed['title'] ?? null);
        $this->assertSame($oPage, BxDolPage::getObjectInstance($sObject), 'The page keeps its own object.');
        $this->assertArrayNotHasKey('id', $_GET, 'The request is put back.');
    }

    public function testClosedProfileShowsNoInfo(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_persons'))
            $this->markTestSkipped('Persons are not installed.');

        $oProfile = BxDolProfile::getInstanceByAccount($this->bxAccount('admin')->id());
        if (!$oProfile || $oProfile->getModule() != 'bx_persons')
            $this->markTestSkipped('The test account has no person profile.');

        // Friends only: the closed page is shown, with the name, picture and cover, but no info.
        $iContentId = (int)$oProfile->getContentId();
        $oDb = BxDolDb::getInstance();
        $this->_aPersonBackup = ['id' => $iContentId, 'value' => $oDb->getOne("SELECT `allow_view_to` FROM `bx_persons_data` WHERE `id` = :id", ['id' => $iContentId])];
        $oDb->query("UPDATE `bx_persons_data` SET `allow_view_to` = '5' WHERE `id` = :id", ['id' => $iContentId]);
        $oDb->cleanMemoryAll();
        $GLOBALS['glMemCache'] = []; // view checks are remembered for a page load

        $sObject = BxDolPageQuery::getPageObjectNameByURI('view-persons-profile');
        unset($GLOBALS['bxDolClasses']['BxDolPage!' . $sObject]);
        $_GET = ['i' => 'view-persons-profile', 'id' => $iContentId, 'api' => 1];
        $aData = BxDolPage::getObjectInstanceByURI('view-persons-profile')->getPageAPI();

        $this->assertArrayNotHasKey('page_status', $aData);
        $this->assertSame('', $aData['description'], 'No About text.');
        if (!empty($aData['cover_block']['profile']))
            $this->assertArrayNotHasKey('info', $aData['cover_block']['profile'], 'No about, birthday or location in the cover.');
    }

    public function testResetPageMetaClearsTheHead(): void
    {
        unset($_GET['i']);

        $oTemplate = BxDolTemplate::getInstance();
        $oTemplate->setPageDescription('LinkPreviewPrivacyTest secret text');
        $oTemplate->addPageMetaImage('https://example.com/LinkPreviewPrivacyTest.jpg');
        $oTemplate->setPageUrl('page.php?i=view-post&id=1');
        $oTemplate->addPageKeywords('LinkPreviewPrivacyTest');

        $oTemplate->resetPageMeta();
        $sHead = $oTemplate->getMetaInfo();

        $this->assertStringNotContainsString('LinkPreviewPrivacyTest', $sHead);
        $this->assertStringNotContainsString('rel="canonical"', $sHead);
    }
}
