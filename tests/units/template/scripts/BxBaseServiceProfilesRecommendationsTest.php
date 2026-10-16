<?php

/**
 * "Recommended friends" on the members' home page: with nothing to suggest (a new or small site) the block shows an
 * empty state with a link to find people, instead of rendering nothing and leaving its page column blank.
 */
class BxBaseServiceProfilesRecommendationsTest extends BxDolTestCase
{
    // No profile has this id, so there is nothing to recommend to it.
    private const NO_RECOMMENDATIONS_PROFILE = 2147483000;

    private function browse(array $aParams)
    {
        return BxDolService::call('system', 'browse_recommendations_friends', [self::NO_RECOMMENDATIONS_PROFILE, $aParams], 'TemplServiceProfiles');
    }

    private function callProtected($oObject, string $sMethod, array $aArgs = [])
    {
        return (new ReflectionMethod($oObject, $sMethod))->invokeArgs($oObject, $aArgs);
    }

    private function withDefaultProfileType(string $sValue, callable $fTest)
    {
        $sPrior = getParam('sys_account_default_profile_type');
        setParam('sys_account_default_profile_type', $sValue);
        try {
            return $fTest();
        }
        finally {
            setParam('sys_account_default_profile_type', $sPrior);
        }
    }

    /**
     * Active profile modules that have a home page, each with the URL the link should point to.
     */
    private function profileHomes(): array
    {
        $aResult = [];
        foreach (array_keys(bx_srv('system', 'get_modules_by_type', ['profile', ['name_as_key' => true]]) ?: []) as $sModule) {
            $oModule = BxDolModule::getInstance($sModule);
            if ($oModule && !empty($oModule->_oConfig->CNF['URL_HOME']))
                $aResult[$sModule] = BX_DOL_URL_ROOT . BxDolPermalinks::getInstance()->permalink($oModule->_oConfig->CNF['URL_HOME']);
        }

        return $aResult;
    }

    public function testNothingToRecommendRendersNothingByDefault(): void
    {
        $this->assertEmpty($this->browse(['per_page' => 3]), 'Blocks without empty_state keep hiding themselves.');
    }

    public function testEmptyStateExplainsWhy(): void
    {
        $sHtml = $this->browse(['per_page' => 3, 'empty_state' => true]);

        $this->assertStringContainsString('bx-recommendations-empty', $sHtml);
        $this->assertStringContainsString(_t('_sys_recom_friends_empty_title'), $sHtml);
        $this->assertStringContainsString(_t('_sys_recom_friends_empty_text'), $sHtml);
    }

    public function testEmptyStateWinsOverTheGenericEmptyMessage(): void
    {
        $sHtml = $this->browse(['empty_state' => true, 'empty_message' => true]);

        $this->assertStringContainsString('bx-recommendations-empty', $sHtml);
        $this->assertStringNotContainsString('bx-msg-box', $sHtml);
    }

    public function testFindPeopleGoesToTheDefaultProfileType(): void
    {
        $aHomes = $this->profileHomes();
        if (!$aHomes)
            $this->markTestSkipped('No active profile module with a home page is installed.');

        // The last module, so the default has to beat the module order to be picked.
        $sDefault = array_key_last($aHomes);

        $sHtml = $this->withDefaultProfileType($sDefault, fn() => $this->browse(['empty_state' => true]));

        $this->assertStringContainsString('href="' . $aHomes[$sDefault] . '"', $sHtml);
        $this->assertStringContainsString(_t('_sys_recom_friends_empty_action'), $sHtml);
    }

    public function testWithoutAUsableDefaultTheFirstProfileModuleIsUsed(): void
    {
        $aHomes = $this->profileHomes();
        if (!$aHomes)
            $this->markTestSkipped('No active profile module with a home page is installed.');

        $sFirst = $aHomes[array_key_first($aHomes)];
        foreach (['', 'bx_no_such_module'] as $sDefault) {
            $sUrl = $this->withDefaultProfileType($sDefault, fn() => $this->callProtected(new BxTemplServiceProfiles(), '_getRecommendationsEmptyStateUrl'));
            $this->assertSame($sFirst, $sUrl, "Default profile type '$sDefault'");
        }
    }

    public function testNoProfileModulesMeansNoButton(): void
    {
        $oService = new class extends BxTemplServiceProfiles {
            protected function _getRecommendationsEmptyStateModules()
            {
                return [];
            }
        };

        $this->assertSame('', $this->callProtected($oService, '_getRecommendationsEmptyStateUrl'));

        $sHtml = $this->callProtected($oService, '_getRecommendationsEmptyState');
        $this->assertStringContainsString(_t('_sys_recom_friends_empty_title'), $sHtml);
        $this->assertStringNotContainsString('bx-btn', $sHtml, 'With nowhere to send people, there is no button.');
    }
}
