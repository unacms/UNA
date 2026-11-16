<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Studio's per-screen-size switches reach the apps: a page's "Cover hidden on" as `cover_hidden_on`, a block's
 * "Title / Background / Padding hidden on" as `title_hidden_on`, `bg_hidden_on` and `padding_hidden_on` (screen size
 * names: phone, tablet, desktop, mobile-app), and its "Padding" as `padding_size`. The rows are changed for the test
 * and put back.
 */
#[Group('integration')]
class PageScreenSizesTest extends BxDolIntegrationTestCase
{
    protected $_aGetBackup;
    protected $_aPageBackup;
    protected $_aBlockBackup;

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aGetBackup = $_GET;
        $this->bxBecomeGuest();

        $oDb = BxDolDb::getInstance();
        $this->_aPageBackup = $oDb->getRow("SELECT `id`, `cover`, `cover_hidden_on` FROM `sys_objects_page` WHERE `uri` = 'about'");
        $this->_aBlockBackup = $oDb->getRow("SELECT `id`, `designbox_id`, `title_hidden_on`, `bg_hidden_on`, `padding_hidden_on`, `padding_size` FROM `sys_pages_blocks` WHERE `object` = 'sys_about' AND `active_api` = 1 ORDER BY `order` LIMIT 1");
        if (empty($this->_aPageBackup) || empty($this->_aBlockBackup))
            $this->markTestSkipped('The About page has no block for the apps.');
    }

    protected function tearDown(): void
    {
        $oDb = BxDolDb::getInstance();
        if (!empty($this->_aPageBackup))
            $oDb->query("UPDATE `sys_objects_page` SET `cover` = :cover, `cover_hidden_on` = :hidden WHERE `id` = :id", ['cover' => $this->_aPageBackup['cover'], 'hidden' => $this->_aPageBackup['cover_hidden_on'], 'id' => $this->_aPageBackup['id']]);
        if (!empty($this->_aBlockBackup))
            $oDb->query("UPDATE `sys_pages_blocks` SET `designbox_id` = :d, `title_hidden_on` = :t, `bg_hidden_on` = :b, `padding_hidden_on` = :p, `padding_size` = :s WHERE `id` = :id", ['d' => $this->_aBlockBackup['designbox_id'], 't' => $this->_aBlockBackup['title_hidden_on'], 'b' => $this->_aBlockBackup['bg_hidden_on'], 'p' => $this->_aBlockBackup['padding_hidden_on'], 's' => $this->_aBlockBackup['padding_size'], 'id' => $this->_aBlockBackup['id']]);
        $oDb->cleanCache('sys_pages_objects_data');
        $oDb->cleanMemoryAll();
        $_GET = $this->_aGetBackup ?? [];
        parent::tearDown();
    }

    protected function request(string $sUri): array
    {
        // Page objects are kept in the db cache (BxDolPageQuery): drop it, as Studio does when a page is saved.
        BxDolDb::getInstance()->cleanCache('sys_pages_objects_data');
        BxDolDb::getInstance()->cleanMemoryAll();
        if (($sObject = BxDolPageQuery::getPageObjectNameByURI($sUri)))
            unset($GLOBALS['bxDolClasses']['BxDolPage!' . $sObject]);

        $_GET = ['api' => 1];
        // BxDolService::call keeps results for the whole run; each request here must run.
        $aData = BxDolService::call('system', 'get_page_by_request', ['page/' . $sUri, '', '[]'], 'TemplServicePages', true);
        $this->assertIsArray($aData);

        return $aData;
    }

    protected function block(array $aData): array
    {
        foreach ($aData['elements'] as $aCell)
            foreach ($aCell as $aBlock)
                if ((int)$aBlock['id'] == (int)$this->_aBlockBackup['id'])
                    return $aBlock;

        $this->fail('The About block is in the page.');
    }

    public function testNothingHiddenByDefault(): void
    {
        $oDb = BxDolDb::getInstance();
        $oDb->query("UPDATE `sys_objects_page` SET `cover_hidden_on` = '' WHERE `id` = :id", ['id' => $this->_aPageBackup['id']]);
        $oDb->query("UPDATE `sys_pages_blocks` SET `title_hidden_on` = '', `bg_hidden_on` = '', `padding_hidden_on` = '' WHERE `id` = :id", ['id' => $this->_aBlockBackup['id']]);

        $aData = $this->request('about');
        $this->assertSame([], $aData['cover_hidden_on']);
        $aBlock = $this->block($aData);
        foreach (['title_hidden_on', 'bg_hidden_on', 'padding_hidden_on'] as $sKey)
            $this->assertFalse($aBlock[$sKey], $sKey);
    }

    public function testHiddenScreenSizesReachTheApps(): void
    {
        $oDb = BxDolDb::getInstance();
        $oDb->query("UPDATE `sys_objects_page` SET `cover_hidden_on` = '9' WHERE `id` = :id", ['id' => $this->_aPageBackup['id']]); // phone + mobile app
        $oDb->query("UPDATE `sys_pages_blocks` SET `title_hidden_on` = '3', `bg_hidden_on` = '4', `padding_hidden_on` = '' WHERE `id` = :id", ['id' => $this->_aBlockBackup['id']]);

        $aData = $this->request('about');
        $this->assertSame(['phone', 'mobile-app'], $aData['cover_hidden_on']);
        $aBlock = $this->block($aData);
        $this->assertSame(['phone', 'tablet'], $aBlock['title_hidden_on']);
        $this->assertSame(['desktop'], $aBlock['bg_hidden_on']);
        $this->assertFalse($aBlock['padding_hidden_on']);
    }

    public function testPaddingSizeReachesTheAppsAndTheSite(): void
    {
        $oDb = BxDolDb::getInstance();
        $iId = (int)$this->_aBlockBackup['id'];

        $oDb->query("UPDATE `sys_pages_blocks` SET `designbox_id` = :d, `padding_size` = '' WHERE `id` = :id", ['d' => BX_DB_PADDING_DEF, 'id' => $iId]);
        $this->assertSame('', $this->block($this->request('about'))['padding_size'], 'Regular by default.');

        $oDb->query("UPDATE `sys_pages_blocks` SET `padding_size` = 'compact' WHERE `id` = :id", ['id' => $iId]);
        $this->assertSame('compact', $this->block($this->request('about'))['padding_size']);
        $this->assertStringContainsString('bx-db-padding-compact', $this->siteBlockContainer($iId));

        $oDb->query("UPDATE `sys_pages_blocks` SET `padding_size` = 'huge' WHERE `id` = :id", ['id' => $iId]);
        $this->assertSame('', $this->block($this->request('about'))['padding_size'], 'Only the sizes UNA knows.');

        // A design box without padding has no size for it.
        $oDb->query("UPDATE `sys_pages_blocks` SET `designbox_id` = 1, `padding_size` = 'relaxed' WHERE `id` = :id", ['id' => $iId]);
        $this->assertSame('', $this->block($this->request('about'))['padding_size']);
        $this->assertStringNotContainsString('bx-db-padding-relaxed', $this->siteBlockContainer($iId));
    }

    /** The opening tag of the block's container on the site's About page. */
    protected function siteBlockContainer(int $iBlockId): string
    {
        BxDolDb::getInstance()->cleanCache('sys_pages_objects_data');
        BxDolDb::getInstance()->cleanMemoryAll();
        unset($GLOBALS['bxDolClasses']['BxDolPage!sys_about']);
        $_GET = [];

        $oPage = BxDolPage::getObjectInstance('sys_about');
        $this->assertNotEmpty($oPage);
        $oMethod = new ReflectionMethod($oPage, '_getPageCodeVars');
        $sHtml = implode('', array_filter($oMethod->invoke($oPage), 'is_string'));

        $this->assertSame(1, preg_match('/<div class="bx-page-block-container[^"]*"\\s*id="bx-page-block-' . $iBlockId . '"/', $sHtml, $aMatch), 'The block is on the site page.');
        return $aMatch[0];
    }
}
