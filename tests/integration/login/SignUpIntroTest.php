<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The Sign up page shows a picture, a title and a line of text beside its form, as a block of the page (Studio >
 * Pages > Sign up): `system:create_account_intro`. The site and the apps draw it from the same block, the apps from
 * its `intro` item, whose picture comes as shapes. The sign-in and sign-up blocks have large padding, and the box of
 * the guest splash's form on the site follows the home page's block, which the apps' splash draws.
 */
#[Group('integration')]
class SignUpIntroTest extends BxDolIntegrationTestCase
{
    private array $_aGetBackup = [];
    private $_sJoinBackup;
    private array $_aRowsBackup = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->_aGetBackup = $_GET;
        $this->_sJoinBackup = getParam('sys_account_join');
        $this->_aRowsBackup = BxDolDb::getInstance()->getAll("SELECT `id`, `padding_size`, `title_size` FROM `sys_pages_blocks` WHERE `object` = 'sys_home' AND `title` IN ('_sys_page_block_title_login', '_sys_page_block_title_create_account')");

        setParam('sys_account_join', BxDolAccount::JOIN_OPEN);
        $this->bxBecomeGuest();
        $GLOBALS['glMemCache'] = [];
    }

    protected function tearDown(): void
    {
        $oDb = BxDolDb::getInstance();
        foreach ($this->_aRowsBackup as $aRow)
            $oDb->query("UPDATE `sys_pages_blocks` SET `padding_size` = :p, `title_size` = :t WHERE `id` = :id", ['p' => $aRow['padding_size'], 't' => $aRow['title_size'], 'id' => $aRow['id']]);

        setParam('sys_account_join', $this->_sJoinBackup);
        unset($GLOBALS['bxDolClasses']['BxInvModule']);
        $_GET = $this->_aGetBackup;

        BxDolCover::getInstance()->setPageHasHeading(false);
        $oDb->cleanMemoryAll();
        $GLOBALS['glMemCache'] = [];
        parent::tearDown();
    }

    /** The Sign up page as an app asks for it; page objects are kept per request, so drop the kept one. */
    private function requestSignUp(): array
    {
        if (($sObject = BxDolPageQuery::getPageObjectNameByURI('create-account')))
            unset($GLOBALS['bxDolClasses']['BxDolPage!' . $sObject]);
        foreach (array_keys($GLOBALS['bxDolClasses'] ?? []) as $sKey)
            if (strpos($sKey, 'BxDolMenu!') === 0)
                unset($GLOBALS['bxDolClasses'][$sKey]);
        BxDolMenu::setSelectedGlobal('', '');

        $_GET = ['api' => 1];
        // BxDolService::call keeps results per params within a process: each request here is a new one.
        $aData = BxDolService::call('system', 'get_page_by_request', ['page/create-account', '', '[]'], 'TemplServicePages', true);
        $this->assertIsArray($aData);

        return $aData;
    }

    private static function blockBySource(array $aData, string $sSource): array
    {
        foreach ($aData['elements'] ?? [] as $sCell => $aBlocks)
            foreach ($aBlocks as $aBlock)
                if (($aBlock['source'] ?? '') === $sSource)
                    return $aBlock + ['cell' => $sCell];

        return [];
    }

    private function intro(bool $bApi)
    {
        $_GET = $bApi ? ['api' => 1] : [];
        return BxDolService::call('system', 'create_account_intro', [], 'TemplServiceAccount', true);
    }

    public function testTheBlockIsOnThePageBesideTheForm(): void
    {
        $oDb = BxDolDb::getInstance();

        $aIntro = $oDb->getRow("SELECT * FROM `sys_pages_blocks` WHERE `object` = 'sys_create_account' AND `title` = '_sys_page_block_title_create_account_intro'");
        $this->assertNotEmpty($aIntro, 'The Sign up page has the block.');
        $this->assertSame([1, 1, 1, 0], [(int)$aIntro['cell_id'], (int)$aIntro['active'], (int)$aIntro['active_api'], (int)$aIntro['designbox_id']], 'In the first column, on for the site and the apps, in a box without a title, background or padding.');
        $this->assertSame('service', $aIntro['type']);
        $this->assertSame(['module' => 'system', 'method' => 'create_account_intro', 'class' => 'TemplServiceAccount'], unserialize($aIntro['content']));
        $this->assertSame(1, (int)$aIntro['deletable'] + (int)$aIntro['copyable'], 'A system block: an operator turns it off in Studio > Pages, and can copy it.');
        $this->assertNotSame('_sys_page_block_title_create_account_intro', _t('_sys_page_block_title_create_account_intro'), 'Its name in Studio is installed.');

        $aForm = $oDb->getRow("SELECT `cell_id`, `active`, `active_api` FROM `sys_pages_blocks` WHERE `object` = 'sys_create_account' AND `title` = '_sys_page_block_title_create_account'");
        $this->assertSame([2, 1, 1], array_map('intval', array_values($aForm)), 'The form is in the second column.');

        $aPage = $oDb->getRow("SELECT `p`.`config_api`, `l`.`name` FROM `sys_objects_page` AS `p` INNER JOIN `sys_pages_layouts` AS `l` ON `l`.`id` = `p`.`layout_id` WHERE `p`.`object` = 'sys_create_account'");
        $this->assertSame('2_columns', $aPage['name'], 'Two equal columns.');
        $this->assertStringNotContainsString('create-account', $aPage['config_api'], 'The apps draw the page from its blocks, not with a layout of their own.');
    }

    public function testTheAppsGetTheIntroWithItsPictureAsShapes(): void
    {
        $aData = $this->requestSignUp();
        $this->assertSame('layout_2_columns', $aData['layout']);

        $aBlock = self::blockBySource($aData, 'system:create_account_intro');
        $this->assertNotEmpty($aBlock, 'The page has the block for the apps.');
        $this->assertSame('cell_left', $aBlock['cell']);
        $this->assertSame(0, (int)$aBlock['designbox_id']);
        $this->assertArrayNotHasKey('splash_only', $aBlock);

        $this->assertCount(1, $aBlock['content']);
        $aItem = $aBlock['content'][0];
        $this->assertSame('intro', $aItem['type']);
        $this->assertSame(['name', 'title', 'text', 'picture'], array_keys($aItem['data']));
        $this->assertSame('create_account', $aItem['data']['name']);
        $this->assertSame(_t('_sys_txt_join_title'), $aItem['data']['title']);
        $this->assertSame(_t('_sys_txt_join_text'), $aItem['data']['text']);

        $aPicture = $aItem['data']['picture'];
        $this->assertSame(['name', 'view_box', 'shapes'], array_keys($aPicture));
        $this->assertSame('create_account', $aPicture['name']);
        $this->assertSame('0 0 200 200', $aPicture['view_box']);
        $this->assertCount(7, $aPicture['shapes']);
        foreach ($aPicture['shapes'] as $aShape) {
            $this->assertMatchesRegularExpression('/^[MmZzLlHhVvCcSsQqTtAa0-9eE\s,.+-]+$/', $aShape['d']);
            $this->assertContains($aShape['tone'], BxDolIllustration::TONES);
        }

        $aForm = self::blockBySource($aData, 'system:create_account_form');
        $this->assertSame('cell_right', $aForm['cell'] ?? null, 'The form is in the second column.');
        $this->assertSame('form', $aForm['content'][0]['type'] ?? null);
    }

    public function testTheAppsGetTheWordsAsPlainText(): void
    {
        $aItem = $this->intro(true)[0];

        $this->assertSame(strip_tags($aItem['data']['title']), $aItem['data']['title']);
        $this->assertSame(html_entity_decode($aItem['data']['text'], ENT_QUOTES | ENT_HTML5, 'UTF-8'), $aItem['data']['text']);
    }

    public function testTheSiteDrawsThePictureTheHeadingAndTheText(): void
    {
        $sHtml = $this->intro(false);

        $this->assertIsString($sHtml);
        $this->assertSame(1, preg_match_all('/<h1\b/', $sHtml), 'The title is the page\'s heading.');
        $this->assertStringContainsString(_t('_sys_txt_join_title') . '</h1>', $sHtml);
        $this->assertStringContainsString(_t('_sys_txt_join_text') . '</p>', $sHtml);
        $this->assertSame(1, substr_count($sHtml, '<svg '));
        $this->assertStringContainsString('aria-hidden="true"', $sHtml, 'The picture is decorative.');
        $this->assertSame(7, substr_count($sHtml, '<path '));
        $this->assertStringNotContainsString('__', $sHtml, 'No template key is left.');
    }

    public function testNothingWhereNobodyCanSignUp(): void
    {
        setParam('sys_account_join', BxDolAccount::JOIN_CLOSED);

        $this->assertSame('', $this->intro(false));
        $this->assertSame([], $this->intro(true));
    }

    public function testByInvitationTheWordsAskToRequestOne(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_invites'))
            $this->markTestSkipped('Invitations is not installed.');

        // Invitations reads the setting when it is made: make it again.
        setParam('sys_account_join', BxDolAccount::JOIN_INVITE);
        unset($GLOBALS['bxDolClasses']['BxInvModule']);
        $this->assertSame(BxDolAccount::JOIN_INVITE, BxDolAccount::getJoinMode());
        if (BxDolService::call('bx_invites', 'account_add_form_check', [], 'Module', true) == '')
            $this->markTestSkipped('This visitor has an invitation.');

        $aItem = $this->intro(true)[0];
        $this->assertSame('create_account_invite', $aItem['data']['name']);
        $this->assertSame(_t('_sys_txt_join_title_invite'), $aItem['data']['title']);
        $this->assertSame(_t('_sys_txt_join_text_invite'), $aItem['data']['text']);
        $this->assertStringContainsString(_t('_sys_txt_join_title_invite') . '</h1>', $this->intro(false));
    }

    public function testABlockWithItsOwnHeadingIsThePagesHeading(): void
    {
        $oPage = BxDolPage::getObjectInstance('sys_create_account');
        $this->assertInstanceOf(BxBasePage::class, $oPage);
        if ($oPage->isPageCover())
            $this->markTestSkipped('The page has a cover, which holds its heading.');

        $oProperty = new ReflectionProperty(BxBasePage::class, '_bHeadingBlock');
        $oProperty->setValue($oPage, false);
        $oMethod = new ReflectionMethod(BxBasePage::class, '_setBlockTitleAsHeading');

        // The intro comes first and has the heading; the form's block, titled as the page, keeps its <h2>.
        $sIntro = '<div><h1 class="sys-join-intro-title">Time to join!</h1></div>';
        $this->assertSame($sIntro, $oMethod->invoke($oPage, ['title' => '_sys_page_block_title_create_account_intro'], $sIntro));
        $this->assertTrue($oProperty->getValue($oPage));

        $sForm = '<div><h2 class="bx-dbt-ttl">' . _t('_sys_page_title_create_account') . '</h2></div>';
        $this->assertSame($sForm, $oMethod->invoke($oPage, ['title' => '_sys_page_title_create_account'], $sForm));

        $oProperty->setValue($oPage, false);
    }

    public function testAuthBlocksHaveLargePadding(): void
    {
        $aRows = BxDolDb::getInstance()->getAll("SELECT `object`, `title`, `padding_size` FROM `sys_pages_blocks` WHERE `object` IN ('sys_login', 'sys_create_account', 'sys_home') AND `module` = 'system' AND `title` IN ('_sys_page_block_title_login', '_sys_page_block_title_create_account')");
        $this->assertGreaterThanOrEqual(4, count($aRows));
        foreach ($aRows as $aRow)
            $this->assertSame('large', $aRow['padding_size'], $aRow['object'] . ' ' . $aRow['title']);

        $this->assertSame('large', self::blockBySource($this->requestSignUp(), 'system:create_account_form')['padding_size'] ?? null, 'The apps get the size.');
    }

    public function testTheSplashBoxIsSizedAsTheHomePagesBlock(): void
    {
        $oSplash = BxDolSplash::getInstance();
        $oDb = BxDolDb::getInstance();

        $aBlock = $oSplash->getAuthBlock('system:login_form');
        $this->assertNotEmpty($aBlock, 'The home page has the sign-in block.');
        $this->assertSame([], $oSplash->getAuthBlock('system:no_such_form'));

        foreach (['large' => 'bx-db-padding-large', 'compact' => 'bx-db-padding-compact', '' => ''] as $sSize => $sClass) {
            $oDb->query("UPDATE `sys_pages_blocks` SET `padding_size` = :p, `title_size` = '' WHERE `id` = :id", ['p' => $sSize, 'id' => $aBlock['id']]);
            $sBox = $oSplash->getFormInBox('system:login_form', ['Sign in', 'About it', 'user'], '<form></form>');

            $this->assertMatchesRegularExpression('/^<div class="bx-page-block-container' . ($sClass !== '' ? ' ' . $sClass : '') . ' " >/', $sBox, 'Padding: ' . ($sSize ?: 'regular'));
            $this->assertStringContainsString('<form></form>', $sBox);
            $this->assertStringContainsString('bx-db-container', $sBox, 'A regular design box.');
        }

        // A form whose block the home page lacks gets the regular box.
        $this->assertMatchesRegularExpression('/^<div class="bx-page-block-container " >/', $oSplash->getFormInBox('system:no_such_form', 'Title', 'content'));
    }
}
