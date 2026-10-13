<?php

/**
 * Interface sounds (Cuelume, plugins_public/cuelume): Settings > Sounds (BxDolSounds) decides where they play and how,
 * form controls and tab menus carry the data-cuelume-* attributes its bind() plays, and the visitor's Sounds control
 * follows the settings.
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

    private function withOptions(array $aOptions, callable $fTest)
    {
        if (!$aOptions)
            return $fTest();

        $sName = array_key_first($aOptions);
        $sValue = $aOptions[$sName];
        unset($aOptions[$sName]);

        return $this->withOption($sName, $sValue, fn() => $this->withOptions($aOptions, $fTest));
    }

    public function testHeadInjectionFollowsTheSitePlatform(): void
    {
        $oFunctions = BxTemplFunctions::getInstance();

        $sOn = $this->withOption('sys_sounds_platforms', 'site,ios', fn() => $this->callProtected($oFunctions, 'getInjHeadSounds'));
        $this->assertStringContainsString("bx_sound_init('" . BX_DOL_URL_PLUGINS_PUBLIC . "cuelume/cuelume.min.js', {", $sOn);
        $this->assertStringContainsString('"on":true', $sOn);
        $this->assertStringNotContainsString('"platforms"', $sOn);

        $sOff = $this->withOption('sys_sounds_platforms', 'studio,neo_web', fn() => $this->callProtected($oFunctions, 'getInjHeadSounds'));
        $this->assertSame('', $sOff);
    }

    public function testStudioKeepsItsPreviewsWhileSilent(): void
    {
        $oFunctions = BxTemplStudioFunctions::getInstance();

        $sOff = $this->withOption('sys_sounds_platforms', 'site', fn() => $this->callProtected($oFunctions, 'getInjHeadSounds'));
        $this->assertStringContainsString('bx_sound_init(', $sOff);
        $this->assertStringContainsString('"on":false', $sOff);

        $sOn = $this->withOption('sys_sounds_platforms', 'studio', fn() => $this->callProtected($oFunctions, 'getInjHeadSounds'));
        $this->assertStringContainsString('"on":true', $sOn);
    }

    public function testConfigListsOnlyWhatDiffersFromTheMainSet(): void
    {
        $aConfig = $this->withOptions([
            'sys_sounds_platforms' => 'ios,site,nowhere',
            'sys_sounds_level' => 'loud',
            'sys_sounds_set' => 'mech',
            'sys_sounds_volume' => '50',
            'sys_sounds_buttons' => 'off',
            'sys_sounds_choices' => 'mech',
            'sys_sounds_reactions' => 'bubble',
            'sys_sounds_menus' => 'nonsense',
            'sys_sounds_navigation' => '',
        ], fn() => BxDolSounds::getInstance()->getConfig());

        $this->assertSame(['site', 'ios'], $aConfig['platforms']);
        $this->assertSame('full', $aConfig['level'], 'An unknown level starts people at full.');
        $this->assertSame('mech', $aConfig['set']);
        $this->assertSame(0.5, $aConfig['volume']);
        $this->assertSame(['buttons' => 'off', 'reactions' => 'bubble'], (array)$aConfig['groups']);
        $this->assertSame('{}', json_encode($this->withOptions(['sys_sounds_buttons' => '', 'sys_sounds_reactions' => ''], fn() => BxDolSounds::getInstance()->getConfig()['groups'])), 'Apps get an object, not a list.');
    }

    public function testEachKindOfActionOffersTheMainSetEverySetAndSilence(): void
    {
        $aValues = BxDolService::call('system', 'get_options_sounds_group', [], 'TemplServices');

        $this->assertSame(array_merge([''], BxDolSounds::SETS, ['off']), array_map('strval', array_keys($aValues)));
        $this->assertSame([100, 75, 50, 25], array_keys(BxDolService::call('system', 'get_options_sounds_volume', [], 'TemplServices')));
    }

    public function testSoundsSelectsPreviewInStudio(): void
    {
        $oOptions = new BxTemplStudioOptions('system', 'sounds');
        $aSelect = ['name' => 'sys_sounds_reactions', 'type' => 'select', 'caption' => '', 'info' => '', 'value' => '', 'extra' => 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:24:"get_options_sounds_group";s:5:"class";s:13:"TemplServices";}'];

        $aField = $this->callProtected($oOptions, 'field', [$aSelect, []]);
        $this->assertSame('bx_sound_preview(this)', $aField['attrs']['onchange']);
        $this->assertSame('reactions', $aField['attrs']['data-bx-sound-option']);

        $aOther = $this->callProtected($oOptions, 'field', [array_merge($aSelect, ['name' => 'sys_vote_reactions_mode', 'extra' => 'a,b']), []]);
        $this->assertArrayNotHasKey('onchange', $aOther['attrs']);
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

    public function testSoundsItemFollowsTheSitePlatform(): void
    {
        $oMenu = BxDolMenu::getObjectInstance('sys_account_notifications');
        if(!$oMenu)
            $this->markTestSkipped('sys_account_notifications is not installed.');

        $aItem = ['id' => 0, 'name' => 'sounds', 'module' => 'system', 'title' => '_sys_menu_item_title_sounds', 'link' => 'javascript:void(0);', 'onclick' => 'bx_sound_toggle(this);', 'target' => '', 'icon' => 'volume-up', 'addon' => '', 'submenu_object' => '', 'visible_for_levels' => 2147483647, 'active' => 1];

        $this->assertTrue($this->withOption('sys_sounds_platforms', 'site', fn() => $this->callProtected($oMenu, '_isVisible', [$aItem])));
        $this->assertFalse($this->withOption('sys_sounds_platforms', 'studio,ios', fn() => $this->callProtected($oMenu, '_isVisible', [$aItem])));

        $aRendered = $this->withOption('sys_sounds_platforms', 'site', fn() => $this->callProtected($oMenu, '_getMenuItem', [$aItem]));
        $this->assertIsArray($aRendered);
        $this->assertStringContainsString('role="button"', $aRendered['attrs'], 'Three levels: a button that steps through them, not a switch.');
        $this->assertStringContainsString('data-bx-sounds-switch="1"', $aRendered['attrs']);
    }

    public function testStudioSoundsItemIsALevelRadioGroup(): void
    {
        $oMenu = BxDolMenu::getObjectInstance('sys_studio_account_popup');
        if(!$oMenu)
            $this->markTestSkipped('sys_studio_account_popup is not installed.');

        $aItem = ['id' => 0, 'name' => 'sounds', 'module' => 'system', 'title' => '_sys_menu_item_title_sa_sounds', 'link' => 'javascript:void(0)', 'onclick' => 'bx_sound_toggle(this);', 'target' => '', 'icon' => 'ami-sounds.svg', 'addon' => '', 'submenu_object' => '', 'visible_for_levels' => 2147483647, 'active' => 1];

        $this->assertFalse($this->withOption('sys_sounds_platforms', 'site', fn() => $this->callProtected($oMenu, '_getMenuItem', [$aItem])));

        $aRendered = $this->withOption('sys_sounds_platforms', 'studio', fn() => $this->callProtected($oMenu, '_getMenuItem', [$aItem]));
        $this->assertTrue($aRendered['bx_if:show_sounds']['condition']);
        $this->assertFalse($aRendered['bx_if:show_button']['condition']);
        $this->assertSame(_t('_sys_txt_sounds_level_quiet'), $aRendered['bx_if:show_sounds']['content']['title_quiet']);
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

    public function testFreshInstallDeclaresTheSoundsSection(): void
    {
        $sSql = file_get_contents(__DIR__ . '/../../../../install/sql/system.sql');
        $this->assertNotFalse($sSql);

        $this->assertStringContainsString("(@iTypeId, 'sounds', '_adm_stg_cpt_category_sounds', 0, 24)", $sSql);
        $this->assertStringContainsString("'sys_sounds_platforms', '_adm_stg_cpt_option_sys_sounds_platforms', '_adm_stg_inf_option_sys_sounds_platforms', 'site,studio,neo_web,ios,android', 'list',", $sSql);
        foreach (BxDolSounds::GROUPS as $sGroup)
            $this->assertMatchesRegularExpression("/\\(@iCategoryId, 'sys_sounds_" . $sGroup . "', '_adm_stg_cpt_option_sys_sounds_" . $sGroup . "', '_adm_stg_inf_option_sys_sounds_" . $sGroup . "', '', 'select',/", $sSql);

        $this->assertStringNotContainsString('sys_ui_sounds', $sSql);
        $this->assertStringContainsString("('sys_account_notifications', 'system', 'sounds',", $sSql);
        $this->assertStringContainsString("('sys_studio_account_popup', 'system', 'sounds',", $sSql);
    }
}
