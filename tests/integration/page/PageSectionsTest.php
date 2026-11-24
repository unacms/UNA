<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Section cover and title settings, end to end: People's tabs (bx_persons_submenu, the submenu of the main menu's People
 * item) take the section's cover where they are "Same as section", a page set apart keeps its own, and the apps get the
 * final values. The pages of a profile's items show the profile's cover, except the owner's own list (owner=1), which
 * has the page's own band for the apps too. Rows changed for a test are put back.
 */
#[Group('integration')]
class PageSectionsTest extends BxDolIntegrationTestCase
{
    protected $_aGetBackup;
    protected $_aSectionBackup;
    protected $_aPagesBackup = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aGetBackup = $_GET;
        $this->bxBecomeGuest();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_persons'))
            $this->markTestSkipped('People is not installed.');

        if (!BxDolCover::getInstance()->isEnabled())
            $this->markTestSkipped('Covers are off in Studio > Designer > Cover.');

        $this->_aSectionBackup = BxDolPageQuery::getSection('bx_persons_submenu');
    }

    protected function tearDown(): void
    {
        $oDb = BxDolDb::getInstance();
        if ($this->_aSectionBackup !== null) {
            if ($this->_aSectionBackup)
                BxDolPageQuery::setSection('bx_persons_submenu', 'bx_persons', array_intersect_key($this->_aSectionBackup, BxDolPage::SECTION_DEFAULTS));
            else
                $oDb->query("DELETE FROM `sys_pages_sections` WHERE `object` = 'bx_persons_submenu'");
        }

        foreach ($this->_aPagesBackup as $sObject => $aRow)
            $this->setPage($sObject, $aRow);

        $this->reset();
        $_GET = $this->_aGetBackup ?? [];
        parent::tearDown();
    }

    protected function reset(): void
    {
        $oDb = BxDolDb::getInstance();
        $oDb->cleanCache('sys_pages_objects_data');
        $oDb->cleanMemoryAll();
        foreach (array_keys($GLOBALS['bxDolClasses']) as $sKey)
            if (strpos($sKey, 'BxDolPage!') === 0 || $sKey === 'BxDolCover' || strpos($sKey, 'BxDolMenu!') === 0)
                unset($GLOBALS['bxDolClasses'][$sKey]);
    }

    protected function setPage(string $sObject, array $aFields): void
    {
        $oDb = BxDolDb::getInstance();
        if (!isset($this->_aPagesBackup[$sObject]))
            $this->_aPagesBackup[$sObject] = $oDb->getRow("SELECT `cover`, `cover_image`, `cover_hidden_on`, `title_show`, `title_hidden_on` FROM `sys_objects_page` WHERE `object` = :object", ['object' => $sObject]);

        $aSet = [];
        foreach ($aFields as $sField => $mixedValue)
            $aSet[] = '`' . $sField . '` = ' . ($mixedValue === null ? 'NULL' : $oDb->escape((string)$mixedValue));

        $oDb->query("UPDATE `sys_objects_page` SET " . implode(', ', $aSet) . " WHERE `object` = :object", ['object' => $sObject]);
        $this->reset();
    }

    protected function api(string $sRequest, array $aGet = []): array
    {
        $_GET = $_REQUEST = ['api' => 1] + $aGet;
        $aData = BxDolService::call('system', 'get_page_by_request', [$sRequest, '', json_encode((object)$aGet)], 'TemplServicePages', true);
        $this->assertIsArray($aData);

        return $aData;
    }

    public function testSectionsFromTheMainMenu(): void
    {
        $this->assertSame('bx_persons_submenu', BxDolPageQuery::getPageSection('persons-active', 'bx_persons'));
        $this->assertSame('bx_persons_submenu', BxDolPageQuery::getPageSection('persons-home', 'bx_persons'));
        $this->assertSame('', BxDolPageQuery::getPageSection('view-persons-profile', 'bx_persons'), 'A profile\'s page is in no section.');
        $this->assertSame('', BxDolPageQuery::getPageSection('about', 'system'), 'Nor is a system page.');

        $aSections = BxDolPageQuery::getSectionsWithPages();
        $this->assertArrayHasKey('bx_persons_submenu', $aSections);
        $this->assertSame('persons-home', $aSections['bx_persons_submenu']['home']);
        $this->assertContains('persons-active', $aSections['bx_persons_submenu']['pages']);
        $this->assertNotContains('view-persons-profile', $aSections['bx_persons_submenu']['pages']);
    }

    public function testPagesTakeTheSectionsCover(): void
    {
        $this->setPage('bx_persons_active', ['cover' => null, 'cover_image' => null, 'cover_hidden_on' => null, 'title_show' => null, 'title_hidden_on' => null]);
        $this->setPage('bx_persons_online', ['cover' => 1, 'cover_image' => 0, 'cover_hidden_on' => '', 'title_show' => null, 'title_hidden_on' => null]);

        BxDolPageQuery::setSection('bx_persons_submenu', 'bx_persons', ['cover' => 0, 'cover_image' => 0, 'cover_hidden_on' => '1', 'title_show' => null, 'title_hidden_on' => null]);
        $this->reset();

        $oPage = BxDolPage::getObjectInstance('bx_persons_active');
        $this->assertSame('bx_persons_submenu', $oPage->getSection());
        $this->assertNull($oPage->getOwnSetting('cover'), 'Same as section.');
        $this->assertFalse($oPage->isPageCover(), 'The section\'s cover is off.');
        $this->assertFalse($oPage->isPageTitle(), 'So is its title, as the cover.');

        $aData = $this->api('page/persons-active');
        $this->assertSame(0, (int)$aData['cover'], 'The apps get the final value.');
        $this->assertSame(['phone'], $aData['cover_hidden_on']);
        $this->assertSame(0, (int)$aData['title_show']);
        $this->assertArrayNotHasKey('cover_band', $aData);

        // A page set apart keeps its own.
        $aData = $this->api('page/persons-online');
        $this->assertSame(1, (int)$aData['cover'], 'An override.');
        $this->assertSame([], $aData['cover_hidden_on']);
        $this->assertSame(1, (int)$aData['title_show']);
        $this->assertArrayHasKey('cover_band', $aData);

        // The section's cover on for members only.
        BxDolPageQuery::setSection('bx_persons_submenu', 'bx_persons', ['cover' => 3, 'cover_hidden_on' => '']);
        $this->reset();
        $aData = $this->api('page/persons-active');
        $this->assertSame(3, (int)$aData['cover']);
        $this->assertSame(3, (int)$aData['title_show']);
        $this->assertArrayNotHasKey('cover_band', $aData, 'Not for a guest.');
    }

    public function testOwnersOwnListHasThePagesBand(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_posts'))
            $this->markTestSkipped('Posts is not installed.');

        $iProfileId = (int)BxDolDb::getInstance()->getOne("SELECT `id` FROM `sys_profiles` WHERE `type` = 'bx_persons' AND `status` = 'active' ORDER BY `id` LIMIT 1");
        $oProfile = $iProfileId ? BxDolProfile::getInstance($iProfileId) : false;
        if (!$oProfile)
            $this->markTestSkipped('No active person profile.');

        $this->setPage('bx_posts_author', ['cover' => 1, 'title_show' => null]);

        // Someone's posts: the profile's cover, no band of the page's.
        $aData = $this->api('page/posts-author', ['profile_id' => $oProfile->id()]);
        $this->assertNotEmpty($aData['cover_block'], 'The owner\'s cover.');
        $this->assertArrayNotHasKey('cover_band', $aData);

        // Their own list: the page's band, as the site draws it.
        $this->reset();
        $aData = $this->api('page/posts-author', ['profile_id' => $oProfile->id(), 'owner' => 1]);
        $this->assertEmpty($aData['cover_block']);
        $this->assertArrayHasKey('cover_band', $aData, 'The page\'s own band for the apps.');
        $this->assertArrayHasKey('image_default', $aData['cover_band']);
    }
}
