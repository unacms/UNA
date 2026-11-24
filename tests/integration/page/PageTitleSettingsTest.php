<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * A page's title apart from its cover (Studio > Pages > page > Title): the apps get `title_show` and `title_hidden_on`
 * next to `cover` and `cover_hidden_on`, and the site draws the cover's band and the title row each by its own settings.
 * A page whose title was never set (NULL) follows its cover. The About page's row is changed for the test and put back.
 */
#[Group('integration')]
class PageTitleSettingsTest extends BxDolIntegrationTestCase
{
    protected $_aGetBackup;
    protected $_aPageBackup;

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aGetBackup = $_GET;
        $this->bxBecomeGuest();

        if (!BxDolCover::getInstance()->isEnabled())
            $this->markTestSkipped('Covers are off in Studio > Designer > Cover.');

        $this->_aPageBackup = BxDolDb::getInstance()->getRow("SELECT `id`, `cover`, `cover_hidden_on`, `cover_title`, `title_show`, `title_hidden_on` FROM `sys_objects_page` WHERE `uri` = 'about'");
        if (empty($this->_aPageBackup))
            $this->markTestSkipped('No About page.');
    }

    protected function tearDown(): void
    {
        if (!empty($this->_aPageBackup))
            $this->set($this->_aPageBackup);

        unset($GLOBALS['bxDolClasses']['BxDolCover']);
        $_GET = $this->_aGetBackup ?? [];
        parent::tearDown();
    }

    protected function set(array $aFields): void
    {
        $oDb = BxDolDb::getInstance();
        $aSet = [];
        foreach (['cover', 'cover_hidden_on', 'cover_title', 'title_show', 'title_hidden_on'] as $sField)
            if (array_key_exists($sField, $aFields))
                $aSet[] = '`' . $sField . '` = ' . ($aFields[$sField] === null && $sField !== 'cover_title' ? 'NULL' : $oDb->escape((string)$aFields[$sField]));

        $oDb->query("UPDATE `sys_objects_page` SET " . implode(', ', $aSet) . " WHERE `id` = :id", ['id' => $this->_aPageBackup['id']]);
        $oDb->cleanCache('sys_pages_objects_data');
        $oDb->cleanMemoryAll();
        unset($GLOBALS['bxDolClasses']['BxDolPage!sys_about']);
    }

    protected function api(): array
    {
        $_GET = ['api' => 1];
        $aData = BxDolService::call('system', 'get_page_by_request', ['page/about', '', '[]'], 'TemplServicePages', true);
        $this->assertIsArray($aData);

        return $aData;
    }

    /** The cover the site draws above the About page: its band and its title row. */
    protected function site(): string
    {
        $_GET = ['i' => 'about'];
        $oPage = BxDolPage::getObjectInstance('sys_about');
        $this->assertNotEmpty($oPage);

        // A fresh cover: an earlier test may have set the singleton's options (a home or entry cover).
        unset($GLOBALS['bxDolClasses']['BxDolCover']);
        $oCover = BxDolCover::getInstance();

        return $oCover->displayPageCover($oPage);
    }

    public function testTitleNeverSetFollowsTheCover(): void
    {
        $this->set(['cover' => 2, 'cover_hidden_on' => '9', 'title_show' => null, 'title_hidden_on' => null]); // phone + mobile app

        $aData = $this->api();
        $this->assertSame(2, (int)$aData['title_show'], 'The cover\'s audience.');
        $this->assertSame(['phone', 'mobile-app'], $aData['title_hidden_on'], 'The cover\'s screen sizes.');
        $this->assertSame(['phone', 'mobile-app'], $aData['cover_hidden_on']);

        $sHtml = $this->site();
        $this->assertMatchesRegularExpression('/class="bx-cover-gap[^"]*bx-def-media-phone-hide/', $sHtml, 'The band where it was.');
        $this->assertMatchesRegularExpression('/class="bx-cover-title[^"]*bx-def-media-phone-hide/', $sHtml, 'The title where it was.');
    }

    public function testCoverWithoutTitle(): void
    {
        $this->set(['cover' => 1, 'cover_hidden_on' => '', 'title_show' => 0, 'title_hidden_on' => '']);

        $aData = $this->api();
        $this->assertSame(1, (int)$aData['cover']);
        $this->assertSame(0, (int)$aData['title_show']);
        $this->assertSame([], $aData['title_hidden_on']);

        $sHtml = $this->site();
        $this->assertStringContainsString('bx-cover-gap', $sHtml, 'The band.');
        $this->assertStringNotContainsString('bx-cover-title', $sHtml, 'No title row.');
        $this->assertMatchesRegularExpression('/<h1 class="sr-only\s*">/', $sHtml, 'The page\'s heading for screen readers.');
    }

    public function testTitleWithoutCover(): void
    {
        $this->set(['cover' => 0, 'title_show' => 1, 'title_hidden_on' => '']);

        $aData = $this->api();
        $this->assertSame(0, (int)$aData['cover']);
        $this->assertSame(1, (int)$aData['title_show']);
        $this->assertArrayNotHasKey('cover_band', $aData, 'No band for the apps.');

        $sHtml = $this->site();
        $this->assertStringNotContainsString('bx-cover-gap', $sHtml, 'No band.');
        $this->assertMatchesRegularExpression('/class="bx-cover-title[^"]*"[^>]*>.*<h1 /s', $sHtml, 'The title row with its heading.');
        $this->assertStringNotContainsString('sr-only', $sHtml, 'One heading.');
    }

    public function testNeither(): void
    {
        $this->set(['cover' => 0, 'title_show' => 0]);

        $this->assertSame(0, (int)$this->api()['title_show']);
        $sHtml = $this->site();
        $this->assertStringNotContainsString('bx-cover-gap', $sHtml);
        $this->assertStringNotContainsString('bx-cover-title', $sHtml);
    }

    public function testTitleHiddenOnDesktopOnly(): void
    {
        $this->set(['cover' => 1, 'cover_hidden_on' => '', 'title_show' => 1, 'title_hidden_on' => (string)BxBaseCover::getHiddenOnBits([BX_DB_HIDDEN_DESKTOP])]);

        $aData = $this->api();
        $this->assertSame(['desktop'], $aData['title_hidden_on']);
        $this->assertSame([], $aData['cover_hidden_on'], 'The cover shows everywhere.');

        $sHtml = $this->site();
        $this->assertMatchesRegularExpression('/class="bx-cover-gap[^"]*"/', $sHtml);
        $this->assertDoesNotMatchRegularExpression('/class="bx-cover-gap[^"]*media-desktop-hide/', $sHtml, 'The band shows on desktop.');
        $this->assertMatchesRegularExpression('/class="bx-cover-title[^"]*bx-def-media-desktop-hide"/', $sHtml, 'The title row is hidden on desktop.');
        $this->assertStringContainsString('<h1 class="sr-only bx-def-media-phone-hide bx-def-media-tablet-hide">', $sHtml, 'On desktop the heading is for screen readers only.');
    }

    public function testAudience(): void
    {
        $this->set(['cover' => 1, 'title_show' => 3, 'title_hidden_on' => '']); // members only

        $this->assertSame(3, (int)$this->api()['title_show'], 'The apps get the audience.');
        $this->assertStringNotContainsString('bx-cover-title', $this->site(), 'A guest gets no title row.');
    }

    /**
     * A section whose title is off has its add action at the end of its tab row, also when its cover has a picture: the
     * picture the page's own cover sets while it is drawn doesn't make it a cover set in code.
     */
    public function testAddMovesToTheTabRowWithACoverPicture(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_posts'))
            $this->markTestSkipped('bx_posts is not installed.');

        $oDb = BxDolDb::getInstance();
        $aBackup = $oDb->getRow("SELECT `id`, `cover`, `title_show`, `title_hidden_on` FROM `sys_objects_page` WHERE `uri` = 'posts-home'");
        $this->bxLoginAsAdmin();
        try {
            $oDb->query("UPDATE `sys_objects_page` SET `cover` = 1, `title_show` = 0, `title_hidden_on` = '' WHERE `id` = :id", ['id' => $aBackup['id']]);
            $oDb->cleanCache('sys_pages_objects_data');
            $oDb->cleanMemoryAll();
            unset($GLOBALS['bxDolClasses']['BxDolPage!bx_posts_home'], $GLOBALS['bxDolClasses']['BxDolCover']);

            $_GET = ['i' => 'posts-home'];
            $oPage = BxDolPage::getObjectInstanceByURI('posts-home');
            if (!$oPage || !$oPage->getAddEntryAction())
                $this->markTestSkipped('The viewer may not add posts.');

            $oCover = BxDolCover::getInstance();
            $sHtml = $oCover->displayPageCover($oPage);
            $this->assertStringNotContainsString('bx-cover-add', $sHtml, 'No title row, so no Add in it.');

            // The page's cover picture (or the site's common one), as displayPageCover sets it.
            (new ReflectionProperty('BxDolCover', '_sCoverImageUrl'))->setValue($oCover, 'http://example.com/cover.jpg');
            $this->assertTrue($oCover->isCover());
            $this->assertStringContainsString('bx-cover-add', $oCover->getSubmenuAddAction(), 'Add at the end of the tab row.');
        }
        finally {
            $oDb->query("UPDATE `sys_objects_page` SET `cover` = :c, `title_show` = :t, `title_hidden_on` = :h WHERE `id` = :id", ['c' => $aBackup['cover'], 't' => $aBackup['title_show'], 'h' => $aBackup['title_hidden_on'], 'id' => $aBackup['id']]);
            $oDb->cleanCache('sys_pages_objects_data');
            $this->bxBecomeGuest();
        }
    }

    public function testCustomTitle(): void
    {
        $this->set(['cover' => 0, 'title_show' => 1, 'title_hidden_on' => '', 'cover_title' => '_adm_bp_txt_page_title_show']);

        $this->assertSame(_t('_adm_bp_txt_page_title_show'), $this->api()['cover_title'], 'The custom title, for the apps.');
        $this->assertStringContainsString('>' . _t('_adm_bp_txt_page_title_show') . '</h1>', $this->site(), 'And on the site.');
    }
}
