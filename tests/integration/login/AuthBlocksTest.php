<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The sign-in and join blocks end with a block footer (designbox_footer.html) holding the terms notice, and their form
 * goes to the apps with the parts around it: the other sign-in methods flag, the link to the other form and the footer.
 */
#[Group('integration')]
class AuthBlocksTest extends BxDolIntegrationTestCase
{
    private array $_aGetBackup = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aGetBackup = $_GET;
    }

    protected function tearDown(): void
    {
        $_GET = $this->_aGetBackup;
        parent::tearDown();
    }

    public function testFooterHelperWrapsContentAndSkipsAnEmptyOne(): void
    {
        $oFunctions = BxTemplFunctions::getInstance();

        $this->assertSame('', $oFunctions->designBoxFooter(''));
        $this->assertSame('', $oFunctions->designBoxFooter("  \n"));
        $this->assertMatchesRegularExpression('/^<div class="bx-db-footer [^"]*">Note<\/div>$/', $oFunctions->designBoxFooter('Note'));
    }

    public function testDesignBoxDrawsTheHeaderIconAndTheTitleIcon(): void
    {
        $oFunctions = BxTemplFunctions::getInstance();

        $sBoth = $oFunctions->designBoxContent(['Title', 'About it', 'user', 'log-in'], 'content', BX_DB_PADDING_DEF);
        $this->assertSame(1, substr_count($sBoth, 'class="bx-dbt-hic'), 'the header icon, a tile before the title and description');
        $this->assertSame(1, substr_count($sBoth, 'class="bx-dbt-ic'), 'the title icon, on the title line');
        $this->assertLessThan(strpos($sBoth, 'bx-dbt-cnt'), strpos($sBoth, 'bx-dbt-hic'));
        $this->assertGreaterThan(strpos($sBoth, 'bx-dbt-row'), strpos($sBoth, 'bx-dbt-ic '));

        $sTitleIcon = $oFunctions->designBoxContent(['Title', '', 'user'], 'content', BX_DB_PADDING_DEF);
        $this->assertStringNotContainsString('bx-dbt-hic', $sTitleIcon);
        $this->assertSame(1, substr_count($sTitleIcon, 'class="bx-dbt-ic'));

        $this->assertStringNotContainsString('bx-dbt-ic', $oFunctions->designBoxContent('Title', 'content', BX_DB_PADDING_DEF));
    }

    public function testAgreementLinksToTermsAndPrivacy(): void
    {
        $oService = new BxTemplServiceLogin();

        foreach (['_sys_txt_login_agreement', '_sys_form_account_input_agreement_value'] as $sKey) {
            $sText = $oService->serviceGetAgreement($sKey);
            $this->assertStringContainsString('terms', $sText, $sKey);
            $this->assertStringContainsString('privacy', $sText, $sKey);
            $this->assertStringContainsString(BX_DOL_URL_ROOT, $sText, 'absolute links on the site');

            $sApi = $oService->serviceGetAgreement($sKey, true);
            $this->assertStringNotContainsString(BX_DOL_URL_ROOT, $sApi, 'links relative to the site for the apps');
        }

        $this->assertSame('', $oService->serviceGetAgreement('_sys_no_such_agreement_key'), 'a missing string gives no footer');
    }

    public function testLoginBlockEndsWithTheFooter(): void
    {
        $sHtml = (new BxTemplServiceLogin())->serviceLoginForm();

        $this->assertSame(1, substr_count($sHtml, 'class="bx-db-footer '));
        $this->assertGreaterThan(strpos($sHtml, 'sys-lf-join'), strpos($sHtml, 'bx-db-footer'), 'after the link to the join form');
    }

    public function testJoinBlockEndsWithTheFooter(): void
    {
        $sHtml = (new BxTemplServiceAccount())->serviceCreateAccountForm();

        $this->assertSame(1, substr_count($sHtml, 'class="bx-db-footer '));
        $this->assertStringNotContainsString('sys-jf-agreement', $sHtml);
    }

    public function testApiFormsCarryThePartsAroundTheForm(): void
    {
        $_GET['api'] = 1;

        $aLogin = (new BxTemplServiceLogin())->serviceLoginForm();
        $this->assertIsArray($aLogin);
        $aForm = $aLogin[0];
        $this->assertSame('form', $aForm['type']);
        $this->assertTrue($aForm['auth']['methods']);
        $this->assertSame(_t('_sys_txt_login_description_action'), $aForm['auth']['switch']['action']);
        $this->assertStringContainsString('create-account', $aForm['auth']['switch']['url']);
        $this->assertStringContainsString('forgot-password', $aForm['auth']['forgot']['url']);
        $this->assertStringContainsString('<a href="', $aForm['footer']);
        $this->assertStringNotContainsString(BX_DOL_URL_ROOT, $aForm['footer']);

        $aLoginOnly = (new BxTemplServiceLogin())->serviceLoginForm('no_join_text no_auth_buttons');
        $this->assertFalse($aLoginOnly[0]['auth']['methods']);
        $this->assertNull($aLoginOnly[0]['auth']['switch']);

        $aJoin = (new BxTemplServiceAccount())->serviceCreateAccountForm();
        $this->assertIsArray($aJoin);
        $this->assertSame(_t('_sys_txt_join_description_action'), $aJoin[0]['auth']['switch']['action']);
        $this->assertStringContainsString('login', $aJoin[0]['auth']['switch']['url']);
        $this->assertArrayNotHasKey('forgot', $aJoin[0]['auth'], 'only the sign-in form has a password to forget');
        $this->assertNotSame('', $aJoin[0]['footer']);
    }

    public function testBlocksHaveAHeaderIconAndADescription(): void
    {
        $oDb = BxDolDb::getInstance();
        foreach (['sys_login' => '_sys_page_block_title_login', 'sys_create_account' => '_sys_page_block_title_create_account'] as $sObject => $sTitle) {
            $aBlocks = $oDb->getAll("SELECT `header_icon`, `description` FROM `sys_pages_blocks` WHERE `object` IN (:object, 'sys_home') AND `title` = :title", ['object' => $sObject, 'title' => $sTitle]);
            $this->assertNotEmpty($aBlocks, $sObject);
            foreach ($aBlocks as $aBlock) {
                $this->assertNotSame('', $aBlock['header_icon'], $sObject);
                $this->assertNotSame('', $aBlock['description'], $sObject);
            }
        }
    }
}
