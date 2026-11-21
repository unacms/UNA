<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Studio > Settings switches groups in place (studio/js/settings.js): a side menu item's click asks settings.php for
 * stg_action=get-page-by-type and swaps in the group's block, the same block the full page shows. The links stay
 * settings.php?page=<type>. A type the menu doesn't list (unknown, a template's) is refused, and so is an operator
 * whose role may not use Settings.
 */
#[Group('integration')]
class StudioSettingsSwitchTest extends BxDolIntegrationTestCase
{
    private array $_aGetBackup = [];

    protected function setUp(): void
    {
        parent::setUp();

        require_once(BX_DIRECTORY_PATH_ROOT . 'studio/inc/utils.inc.php');

        $this->_aGetBackup = $_GET;
    }

    protected function tearDown(): void
    {
        $_GET = $this->_aGetBackup;

        parent::tearDown();
    }

    private function typeInGroup(string $sGroup): string
    {
        return (string)BxDolDb::getInstance()->getOne("SELECT `name` FROM `sys_options_types` WHERE `group` = :group ORDER BY `order` LIMIT 1", ['group' => $sGroup]);
    }

    public function testAnswersTheGroupsBlockAsTheFullPageShowsIt(): void
    {
        $this->bxLoginAsAdmin();

        $aResult = (new BxTemplStudioSettings('system'))->getPageByType('system');

        $this->assertSame(0, $aResult['code']);
        $this->assertSame('system', $aResult['type']);
        $this->assertStringContainsString('name="adm-settings-form"', $aResult['content']);
        $this->assertStringContainsString('new BxDolStudioOptions(', $aResult['content'], 'The group brings its own options object.');
        $this->assertStringNotContainsString('<html', $aResult['content']);

        $sPage = (new BxTemplStudioSettings('system'))->getPageCode();
        $this->assertStringContainsString($this->caption($aResult['content']), $sPage, 'The switch shows the block the full page shows.');
    }

    public function testAnswersAModulesGroup(): void
    {
        $sType = $this->typeInGroup(BX_DOL_STUDIO_STG_GROUP_MODULES);
        if ($sType === '')
            $this->markTestSkipped('No module has settings.');

        $this->bxLoginAsAdmin();

        $aResult = (new BxTemplStudioSettings('system'))->getPageByType($sType);

        $this->assertSame(0, $aResult['code']);
        $this->assertSame($sType, $aResult['type']);
        $this->assertStringContainsString("sType: '" . $sType . "'", $aResult['content']);
    }

    public function testRefusesWhatTheMenuDoesNotList(): void
    {
        $this->bxLoginAsAdmin();

        $oSettings = new BxTemplStudioSettings('system');
        foreach (['', 'no_such_settings_type', '<script>'] as $sType) {
            $aResult = $oSettings->getPageByType($sType);
            $this->assertSame(1, $aResult['code'], var_export($sType, true));
            $this->assertArrayNotHasKey('content', $aResult);
        }

        $sTemplate = $this->typeInGroup(BX_DOL_STUDIO_STG_GROUP_TEMPLATES);
        if ($sTemplate !== '')
            $this->assertSame(1, $oSettings->getPageByType($sTemplate)['code'], 'A template\'s settings are in Designer.');
    }

    public function testRefusesARoleThatMayNotUseSettings(): void
    {
        $this->bxLoginAsUser();

        if (BxDolStudioRolesUtils::getInstance()->isActionAllowed('use settings'))
            $this->markTestSkipped('Every role may use Settings on this site.');

        $aResult = (new BxTemplStudioSettings('system'))->getPageByType('system');
        $this->assertSame(2, $aResult['code']);
        $this->assertArrayNotHasKey('content', $aResult);
    }

    public function testTheActionComesThroughCheckAction(): void
    {
        $this->bxLoginAsAdmin();

        $_GET = ['stg_action' => 'get-page-by-type', 'stg_value' => 'system'];
        $aResult = (new BxTemplStudioSettings(''))->checkAction();

        $this->assertIsArray($aResult);
        $this->assertSame(0, $aResult['code']);
        $this->assertSame('system', $aResult['type']);
    }

    public function testMenuItemsSwitchInPlaceAndKeepTheirLinks(): void
    {
        $this->bxLoginAsAdmin();

        $sMenu = (new BxTemplStudioSettings('system'))->getPageMenu();

        $this->assertStringContainsString('href="' . BX_DOL_URL_STUDIO . 'settings.php?page=system"', $sMenu);
        $this->assertStringContainsString('onclick="return oBxDolStudioSettings.changePage(\'system\', event)"', $sMenu);
    }

    public function testThePageMakesTheSwitcher(): void
    {
        $this->bxLoginAsAdmin();

        $oSettings = new BxTemplStudioSettings('system');
        $this->assertContains('settings.js', $oSettings->getPageJs());

        $sCaption = $oSettings->getPageCaption();
        $this->assertStringContainsString('var oBxDolStudioSettings = new BxDolStudioSettings(', $sCaption);
        $this->assertStringContainsString('"sType":"system"', $sCaption);
        $this->assertStringContainsString('"sTextUnsaved":' . json_encode(_t('_adm_stg_txt_unsaved_changes')), $sCaption);
        $this->assertNotSame('_adm_stg_txt_unsaved_changes', _t('_adm_stg_txt_unsaved_changes'), 'The question is worded.');
    }

    private function caption(string $sHtml): string
    {
        $this->assertSame(1, preg_match('/<div class="bx-std-block[^"]*"[^>]*>/', $sHtml, $a), 'The answer is a Studio block.');
        return $a[0];
    }
}
