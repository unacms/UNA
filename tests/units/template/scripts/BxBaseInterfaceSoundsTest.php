<?php

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Interface sounds (Cuelume, plugins_public/cuelume): the site and Studio options load it, form controls and tab
 * menus carry the data-cuelume-* attributes its bind() plays, and the visitor's Sounds switch follows the option.
 */
class BxBaseInterfaceSoundsTest extends BxDolTestCase
{
    private function withOption(string $sName, string $sValue, callable $fTest)
    {
        $sPrior = getParam($sName);
        setParam($sName, $sValue);
        try {
            return $fTest();
        }
        finally {
            setParam($sName, $sPrior);
        }
    }

    private function callProtected($oObject, string $sMethod, array $aArgs = [])
    {
        $oMethod = new ReflectionMethod($oObject, $sMethod);
        return $oMethod->invokeArgs($oObject, $aArgs);
    }

    public static function providerForInjections(): array
    {
        return [
            'site' => [BxTemplFunctions::class, 'sys_ui_sounds'],
            'studio' => [BxTemplStudioFunctions::class, 'sys_std_ui_sounds'],
        ];
    }

    #[DataProvider('providerForInjections')]
    public function testHeadInjectionFollowsItsOwnOption(string $sClass, string $sOption): void
    {
        $oFunctions = $sClass::getInstance();
        $this->assertSame($sOption, $this->callProtected($oFunctions, 'getSoundsOption'));

        $sOn = $this->withOption($sOption, 'on', fn() => $this->callProtected($oFunctions, 'getInjHeadSounds'));
        $this->assertStringContainsString("bx_sound_init('" . BX_DOL_URL_PLUGINS_PUBLIC . "cuelume/index.js')", $sOn);

        $sOff = $this->withOption($sOption, '', fn() => $this->callProtected($oFunctions, 'getInjHeadSounds'));
        $this->assertSame('', $sOff);
    }

    private function genInput(array $aInput): string
    {
        $oForm = new BxTemplFormView(['form_attrs' => ['id' => 'bx-sounds-test-form', 'method' => 'post'], 'inputs' => []]);
        return $oForm->genInput($aInput);
    }

    public function testSubmitTapsAndOtherButtonsTapSubtly(): void
    {
        $sSubmit = $this->genInput(['type' => 'submit', 'name' => 'save', 'value' => 'Save']);
        $this->assertStringContainsString('data-cuelume-tap=""', $sSubmit);
        $this->assertStringNotContainsString('data-cuelume-emphasis', $sSubmit);

        $sButton = $this->genInput(['type' => 'button', 'name' => 'more', 'value' => 'More']);
        $this->assertStringContainsString('data-cuelume-tap=""', $sButton);
        $this->assertStringContainsString('data-cuelume-emphasis="subtle"', $sButton);
    }

    public function testCheckboxTogglesAndRadioSelects(): void
    {
        $this->assertStringContainsString('data-cuelume-toggle=""', $this->genInput(['type' => 'checkbox', 'name' => 'agree', 'value' => '1']));
        $this->assertStringContainsString('data-cuelume-select=""', $this->genInput(['type' => 'radio', 'name' => 'pick', 'value' => '1']));
    }

    public function testSwitcherTogglesFromItsButtonOnly(): void
    {
        $sSwitcher = $this->genInput(['type' => 'switcher', 'name' => 'active', 'value' => '1', 'checked' => true]);

        // The visible button toggles; the hidden checkbox behind it must not sound a second time.
        $this->assertSame(1, substr_count($sSwitcher, 'data-cuelume-toggle'));
        $this->assertMatchesRegularExpression('/<button[^>]*role="switch"[^>]*data-cuelume-toggle/', $sSwitcher);
    }

    public function testFieldKeepsTheCueItPicked(): void
    {
        $sButton = $this->genInput(['type' => 'submit', 'name' => 'delete', 'value' => 'Delete', 'attrs' => ['data-cuelume-close' => '', 'data-cuelume-emphasis' => 'strong']]);

        $this->assertStringContainsString('data-cuelume-close=""', $sButton);
        $this->assertStringContainsString('data-cuelume-emphasis="strong"', $sButton);
        $this->assertStringNotContainsString('data-cuelume-tap', $sButton);
    }

    private function menuCode(string $sTemplate): string
    {
        $aItem = ['active' => 1, 'visible_for_levels' => 2147483647, 'target' => '', 'onclick' => '', 'icon' => '', 'addon' => '', 'submenu_object' => ''];
        $oMenu = new BxTemplMenu([
            'object' => 'bx_sounds_test_menu',
            'template' => $sTemplate,
            'menu_items' => [
                array_merge($aItem, ['id' => 'latest', 'name' => 'latest', 'title' => 'Latest', 'link' => 'page.php?i=latest']),
                array_merge($aItem, ['id' => 'more-auto', 'name' => 'more-auto', 'title' => 'More', 'link' => 'javascript:void(0)']),
            ],
        ], BxDolTemplate::getInstance());

        return $oMenu->getCode();
    }

    public function testTabMenusSelectButNotTheirMoreItem(): void
    {
        $sTabs = $this->menuCode('menu_main_submenu.html');
        $this->assertSame(1, substr_count($sTabs, 'data-cuelume-select'), 'Only the tab selects; More opens a popup, which sounds itself.');

        $this->assertStringNotContainsString('data-cuelume-select', $this->menuCode('menu_vertical.html'));
    }

    public function testSoundsSwitchFollowsTheSiteOption(): void
    {
        $oMenu = BxDolMenu::getObjectInstance('sys_account_notifications');
        if (!$oMenu)
            $this->markTestSkipped('sys_account_notifications is not installed.');

        $aItem = ['id' => 0, 'name' => 'sounds', 'module' => 'system', 'title' => '_sys_menu_item_title_sounds', 'link' => 'javascript:void(0);', 'onclick' => 'bx_sound_toggle(this);', 'target' => '', 'icon' => 'volume-up', 'addon' => '', 'submenu_object' => '', 'visible_for_levels' => 2147483647, 'active' => 1];

        $this->assertTrue($this->withOption('sys_ui_sounds', 'on', fn() => $this->callProtected($oMenu, '_isVisible', [$aItem])));
        $this->assertFalse($this->withOption('sys_ui_sounds', '', fn() => $this->callProtected($oMenu, '_isVisible', [$aItem])));

        $aRendered = $this->withOption('sys_ui_sounds', 'on', fn() => $this->callProtected($oMenu, '_getMenuItem', [$aItem]));
        $this->assertIsArray($aRendered);
        $this->assertStringContainsString('role="switch"', $aRendered['attrs']);
        $this->assertStringContainsString('data-bx-sounds-switch="1"', $aRendered['attrs']);
    }

    public function testStudioReplyCarriesItsCue(): void
    {
        if (!function_exists('bx_get_js_result'))
            require_once(BX_DIRECTORY_PATH_ROOT . 'studio/inc/utils.inc.php');

        $sReply = bx_get_js_result(['code' => 1, 'cue' => 'error', 'message' => 'x', 'translate' => false]);
        $this->assertStringContainsString('"cue":"error"', $sReply);

        $sReply = bx_get_js_result(['code' => 0, 'cue' => ['cue' => 'success', 'emphasis' => 'subtle']]);
        $this->assertStringContainsString('"cue":{"cue":"success","emphasis":"subtle"}', $sReply);
    }

    public function testFreshInstallDeclaresOptionsAndSwitches(): void
    {
        $sSql = file_get_contents(__DIR__ . '/../../../../install/sql/system.sql');
        $this->assertNotFalse($sSql);

        foreach (['sys_ui_sounds', 'sys_std_ui_sounds'] as $sOption)
            $this->assertMatchesRegularExpression("/\\(@iCategoryId, '" . $sOption . "', '_adm_stg_cpt_option_" . $sOption . "', '_adm_stg_inf_option_" . $sOption . "', 'on', 'checkbox',/", $sSql);

        $this->assertStringContainsString("('sys_account_notifications', 'system', 'sounds',", $sSql);
        $this->assertStringContainsString("('sys_studio_account_popup', 'system', 'sounds',", $sSql);
    }
}
