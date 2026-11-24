<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Which services outside callers may run: api.php and the OAuth2 API (safe and public lists)
 * and macros in content (the macro list).
 *
 * - A list names the class a method is allowed in. The same method name in another class is not allowed.
 * - A method name allowed in several classes is allowed in each of them (no key is lost to a duplicate).
 * - A macro runs as the viewer, so it may call only services from the macro list,
 *   not safe services which change something (set_membership, update_settings, set_badges...).
 * - The OAuth2 api/service endpoint checks the lists as api.php does.
 */
#[Group('integration')]
class ServiceListsTest extends BxDolIntegrationTestCase
{
    protected $_aGetBackup;
    protected $_aOptionBackup = null;

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aGetBackup = $_GET;
        BxDolService::cleanMemoryCache();
    }

    protected function tearDown(): void
    {
        $_GET = $this->_aGetBackup;
        if ($this->_aOptionBackup !== null)
            $this->bxSetParamCache('sys_api_access_unsafe_services', $this->_aOptionBackup);
        BxDolService::cleanMemoryCache();
        parent::tearDown();
    }

    public function testSafeServiceInItsOwnClass()
    {
        $this->assertTrue(BxDolService::isSafeService('system', 'get_menu', 'TemplServices'));
        $this->assertTrue(BxDolService::isSafeService('system', 'GetMenu', 'TemplServices'));
        $this->assertTrue(BxDolService::isSafeService('system', 'get_page_block_data', 'TemplServicePages'));
        $this->assertTrue(BxDolService::isSafeService('system', 'touch_session', 'TemplServiceLogin'));
        $this->assertTrue(BxDolService::isPublicService('system', 'get_page_by_request', 'TemplServicePages'));
    }

    public function testSameNameInAnotherClassIsNotSafe()
    {
        // ProfileCover is safe in BxBaseServiceProfiles, BxBaseServices has a method with that name too
        $this->assertTrue(BxDolService::isSafeService('system', 'profile_cover', 'TemplServiceProfiles'));
        $this->assertFalse(BxDolService::isSafeService('system', 'profile_cover', 'TemplServices'));

        // Logout is safe in BxBaseServiceLogin only
        $this->assertTrue(BxDolService::isSafeService('system', 'logout', 'TemplServiceLogin'));
        $this->assertFalse(BxDolService::isSafeService('system', 'logout', 'TemplServiceContent'));

        // the old check by name alone said yes to both
        $this->assertTrue((bool)BxDolService::call('system', 'is_safe_service', ['profile_cover'], 'TemplServices'));
    }

    public function testNameAllowedInSeveralClasses()
    {
        foreach (['TemplReportServices', 'TemplVoteServices', 'TemplScoreServices'] as $sClass)
            $this->assertTrue(BxDolService::isSafeService('system', 'do', $sClass), $sClass);
        foreach (['TemplReportServices', 'TemplVoteServices', 'TemplScoreServices', 'TemplFavoriteServices'] as $sClass)
            $this->assertTrue(BxDolService::isSafeService('system', 'get_performed_by', $sClass), $sClass);
        foreach (['TemplFeatureServices', 'TemplFavoriteServices', 'TemplServiceConnections', 'TemplServiceRecommendations'] as $sClass)
            $this->assertTrue(BxDolService::isSafeService('system', 'perform', $sClass), $sClass);
        foreach (['TemplCmtsServices', 'TemplUploaderServices'] as $sClass)
            $this->assertTrue(BxDolService::isSafeService('system', 'get_data_api', $sClass), $sClass);
    }

    public function testUnlistedOrMissingIsNotSafe()
    {
        $this->assertFalse(BxDolService::isSafeService('system', 'module_uninstall', 'TemplServices'));
        $this->assertFalse(BxDolService::isSafeService('system', 'no_such_method', 'TemplServices'));
        $this->assertFalse(BxDolService::isSafeService('system', 'get_menu', 'NoSuchClass'));
        $this->assertFalse(BxDolService::isSafeService('system', 'get_menu', '../TemplServices'));
        $this->assertFalse(BxDolService::isSafeService('no_such_module', 'get_menu', 'Module'));
    }

    public function testModuleMainClass()
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_posts'))
            $this->markTestSkipped('bx_posts is not installed.');

        $this->assertTrue(BxDolService::isSafeService('bx_posts', 'get_info', 'Module'));
        $this->assertTrue(BxDolService::isSafeService('bx_posts', 'browse', 'Module'));
        $this->assertFalse(BxDolService::isSafeService('bx_posts', 'get_info', 'Config'));
    }

    public function testModuleOtherClass()
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_messenger'))
            $this->markTestSkipped('bx_messenger is not installed.');

        $this->assertTrue(BxDolService::isSafeService('bx_messenger', 'get_convos_list', 'Services'));
    }

    public function testMacroList()
    {
        $this->assertTrue(BxDolService::isMacroService('system', 'login_form', 'TemplServiceLogin'));
        $this->assertTrue(BxDolService::isMacroService('system', 'member_auth_code', 'TemplServiceLogin'));
        $this->assertTrue(BxDolService::isMacroService('system', 'keyword_search', 'TemplServicesSearch'));

        // safe for the API, which acts for the signed-in member, but a macro acts for whoever views the content
        $this->assertTrue(BxDolService::isSafeService('system', 'set_membership', 'TemplServiceProfiles'));
        foreach ([
            ['set_membership', 'TemplServiceProfiles'],
            ['reset_membership', 'TemplServiceProfiles'],
            ['update_settings', 'TemplServiceProfiles'],
            ['befriend', 'TemplServiceProfiles'],
            ['set_badges', 'TemplServices'],
            ['switch_profile', 'TemplServiceAccount'],
            ['logout', 'TemplServiceLogin'],
            ['perform', 'TemplServiceConnections'],
            ['do', 'TemplVoteServices'],
        ] as $a)
            $this->assertFalse(BxDolService::isMacroService('system', $a[0], $a[1]), $a[0]);

        if (BxDolModuleQuery::getInstance()->isEnabledByName('bx_posts')) {
            $this->assertTrue(BxDolService::isMacroService('bx_posts', 'get_search_result_unit', 'Module'));
            $this->assertTrue(BxDolService::isMacroService('bx_posts', 'browse_public', 'Module'));
            $this->assertFalse(BxDolService::isMacroService('bx_posts', 'entity_delete', 'Module'));
            $this->assertFalse(BxDolService::isMacroService('bx_posts', 'delete_poll', 'Module'));
        }
    }

    public function testMacroCallsOnlyMacroServices()
    {
        $sUnsafe = _t('_sys_macros_unsafe');

        $this->assertSame($sUnsafe, BxDolService::callMacro('system:set_membership:TemplServiceProfiles[1, 1]'));
        $this->assertSame($sUnsafe, BxDolService::callMacro('system:update_settings:TemplServiceProfiles'));
        $this->assertSame($sUnsafe, BxDolService::callMacro('system:set_badges:TemplServices'));
        $this->assertSame($sUnsafe, BxDolService::callMacro('system:profile_cover:TemplServices'));

        $this->assertNotSame($sUnsafe, BxDolService::callMacro('system:test:TemplServiceLogin[3]'));
        $this->assertNotSame($sUnsafe, BxDolService::callMacro('system:login_form:TemplServiceLogin["no_auth_buttons"]'));
    }

    public function testOAuthServiceChecksTheLists()
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_oauth'))
            $this->markTestSkipped('bx_oauth is not installed.');

        $this->_aOptionBackup = getParam('sys_api_access_unsafe_services');
        $this->bxSetParamCache('sys_api_access_unsafe_services', '');

        $oModule = BxDolModule::getInstance('bx_oauth');
        bx_import('API', $oModule->_aModule);
        $oApi = new BxOAuthAPI($oModule);

        $this->assertTrue($oApi->isSafeAPI('system', 'get_menu', 'TemplServices'));
        $this->assertFalse($oApi->isSafeAPI('system', 'profile_cover', 'TemplServices'));
        $this->assertFalse($oApi->isSafeAPI('system', 'module_uninstall', 'TemplServices'));
        $this->assertTrue($oApi->isPublicAPI('system', 'get_page_by_request', 'TemplServicePages'));

        $aAuth = $this->bxLoginAsUser();
        $iProfileId = bx_get_logged_profile_id();
        $this->bxBecomeGuest();

        // a service which is in no list: refused before it runs and before the token's member is signed in
        $_GET = ['module' => 'system', 'method' => 'is_module_installed', 'class' => 'TemplServices', 'params' => '["bx_oauth"]'];
        $aOut = $this->_callOAuthService($oApi, ['user_id' => $iProfileId]);
        $this->assertSame('access_denied', $aOut['error'] ?? null, json_encode($aOut));
        $this->assertFalse(isLogged());

        // a safe service in another class than its list names
        $_GET = ['module' => 'system', 'method' => 'profile_cover', 'class' => 'TemplServices'];
        $aOut = $this->_callOAuthService($oApi, ['user_id' => $iProfileId]);
        $this->assertSame('access_denied', $aOut['error'] ?? null, json_encode($aOut));

        // a safe service runs
        $_GET = ['module' => 'system', 'method' => 'test', 'class' => 'TemplServiceLogin', 'params' => '[5]'];
        $aOut = $this->_callOAuthService($oApi, ['user_id' => $iProfileId]);
        $this->assertArrayNotHasKey('error', $aOut, json_encode($aOut));
        $this->assertSame('test', $aOut['method'] ?? null);
    }

    public function testOAuthServiceRunsForTheMemberNotTheGuest()
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_oauth') || !BxDolModuleQuery::getInstance()->isEnabledByName('bx_posts'))
            $this->markTestSkipped('bx_oauth or bx_posts is not installed.');

        $oModule = BxDolModule::getInstance('bx_oauth');
        bx_import('API', $oModule->_aModule);
        $oApi = new BxOAuthAPI($oModule);

        $this->bxLoginAsUser();
        $iProfileId = bx_get_logged_profile_id();
        $this->bxBecomeGuest();

        // the list check builds the module before the token's member is signed in
        unset($GLOBALS['bxDolClasses']['BxPostsModule']);
        $this->assertTrue($oApi->isSafeAPI('bx_posts', 'module_icon', 'Module'));
        $this->assertSame(0, (int)BxDolModule::getInstance('bx_posts')->getProfileId());

        $_GET = ['module' => 'bx_posts', 'method' => 'module_icon', 'class' => 'Module'];
        $aOut = $this->_callOAuthService($oApi, ['user_id' => $iProfileId]);
        $this->assertArrayNotHasKey('error', $aOut, json_encode($aOut));
        $this->assertSame((int)$iProfileId, (int)BxDolModule::getInstance('bx_posts')->getProfileId());
    }

    protected function _callOAuthService($oApi, $aToken)
    {
        ob_start();
        try {
            $oApi->service($aToken);
        } finally {
            $s = ob_get_clean();
        }
        $a = json_decode($s, true);
        return is_array($a) ? $a : ['raw' => $s];
    }

    protected function bxSetParamCache(string $sKey, $mixedValue): void
    {
        $oProp = new ReflectionProperty(BxDolDb::class, '_aParams');
        $aParams = $oProp->getValue();
        $aParams[$sKey] = $mixedValue;
        $oProp->setValue(null, $aParams);
    }
}
