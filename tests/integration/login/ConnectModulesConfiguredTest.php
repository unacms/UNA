<?php

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

/**
 * A connect module that is installed but not configured stays out of the way: its "Continue with" button is not on
 * the login and sign-up forms (it led to "Please configure the module"), and Drupal Connect leaves the site's own
 * login form until its login URL is set (every login failed with "URL rejected: Malformed input to a URL function").
 * Options are set in the options cache only, the database is not changed.
 */
#[Group('integration')]
class ConnectModulesConfiguredTest extends BxDolIntegrationTestCase
{
    protected $_aParamsBackup;

    protected function setUp(): void
    {
        parent::setUp();

        $oProp = new ReflectionProperty(BxDolDb::class, '_aParams');
        $this->_aParamsBackup = $oProp->getValue();

        $this->bxBecomeGuest();
    }

    protected function tearDown(): void
    {
        (new ReflectionProperty(BxDolDb::class, '_aParams'))->setValue(null, $this->_aParamsBackup);
        $this->bxResetModules();

        parent::tearDown();
    }

    protected function bxSetParamCache(string $sKey, $mixedValue): void
    {
        getParam($sKey); // the options cache is filled before it is changed
        $oProp = new ReflectionProperty(BxDolDb::class, '_aParams');
        $aParams = $oProp->getValue();
        $aParams[$sKey] = $mixedValue;
        $oProp->setValue(null, $aParams);
    }

    /**
     * Module objects read their options when made: they are made again after the options change.
     */
    protected function bxResetModules(): void
    {
        foreach (array_keys(self::modules()) as $sModule)
            if (($aModule = BxDolModuleQuery::getInstance()->getModuleByName($sModule)))
                unset($GLOBALS['bxDolClasses'][$aModule['class_prefix'] . 'Module']);
    }

    protected function bxModule(string $sModule): BxDolModule
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName($sModule))
            $this->markTestSkipped($sModule . ' is not installed.');

        $this->bxResetModules();
        (new ReflectionProperty(BxDolService::class, '_aMemoryCache'))->setValue(null, []); // the forms list sign-in methods through it
        return BxDolModule::getInstance($sModule);
    }

    /**
     * Each connect module with a "Continue with" button and the options it needs to sign people in.
     */
    public static function modules(): array
    {
        return [
            'bx_azrb2c' => ['bx_azrb2c_client_id', 'bx_azrb2c_secret'],
            'bx_azrcon' => ['bx_azrcon_client_id', 'bx_azrcon_secret'],
            'bx_cas' => ['bx_cas_path_simplesamlphp'],
            'bx_cidaascon' => ['bx_cidaascon_base_url', 'bx_cidaascon_client_id', 'bx_cidaascon_secret'],
            'bx_dolcon' => ['bx_dolcon_api_key', 'bx_dolcon_secret', 'bx_dolcon_url'],
            'bx_facebook' => ['bx_facebook_connect_api_key', 'bx_facebook_connect_secret'],
            'bx_googlecon' => ['bx_googlecon_api_key', 'bx_googlecon_secret'],
            'bx_linkedin' => ['bx_linkedin_api_key', 'bx_linkedin_secret'],
            'bx_oktacon' => ['bx_oktacon_client_id', 'bx_oktacon_secret', 'bx_oktacon_domain'],
            'bx_twitter' => ['bx_twitter_api_key', 'bx_twitter_secret'],
            'bx_unacon' => ['bx_unacon_api_key', 'bx_unacon_secret', 'bx_unacon_url'],
        ];
    }

    public static function modulesProvider(): array
    {
        $a = [];
        foreach (self::modules() as $sModule => $aOptions)
            $a[$sModule] = [$sModule, $aOptions];
        return $a;
    }

    #[DataProvider('modulesProvider')]
    public function testButtonIsShownOnceTheModuleIsConfigured(string $sModule, array $aOptions): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName($sModule))
            $this->markTestSkipped($sModule . ' is not installed.');

        foreach ($aOptions as $sOption)
            $this->assertNotNull(BxDolDb::getInstance()->getOne('SELECT `id` FROM `sys_options` WHERE `name` = ?', [$sOption]) ?: null, $sOption . ' is an option of ' . $sModule . '.');

        foreach ($aOptions as $sOption)
            $this->bxSetParamCache($sOption, '');
        $oModule = $this->bxModule($sModule);
        $this->assertFalse($oModule->isConfigured(), 'Not configured without its options.');
        $this->assertDoesNotMatchRegularExpression('/sys-auth-' . $sModule . '[\s"]/', (string)(new BxTemplServiceLogin())->serviceMemberAuthCode(), 'No button before the module is configured.');

        foreach ($aOptions as $sOption)
            $this->bxSetParamCache($sOption, 'https://example.com/phpunit');
        $oModule = $this->bxModule($sModule);
        $this->assertTrue($oModule->isConfigured(), 'Configured once its options are set.');
        $this->assertMatchesRegularExpression('/sys-auth-' . $sModule . '[\s"]/', (string)(new BxTemplServiceLogin())->serviceMemberAuthCode(), 'The button is there once the module is configured.');
    }

    public function testEveryButtonOfAConnectModuleIsCovered(): void
    {
        $aCovered = array_merge(array_keys(self::modules()), ['bx_drupal']);
        foreach (BxDolDb::getInstance()->getColumn('SELECT `Name` FROM `sys_objects_auths`') as $sName) {
            if (!BxDolModuleQuery::getInstance()->isEnabledByName($sName))
                continue;

            $oModule = BxDolModule::getInstance($sName);
            if ($oModule instanceof BxBaseModConnectModule)
                $this->assertContains($sName, $aCovered, $sName . ' is checked above.');
        }
    }

    public function testDrupalLeavesTheLoginFormUntilItsUrlIsSet(): void
    {
        $this->bxSetParamCache('bx_drupal_login_url', '');
        $oModule = $this->bxModule('bx_drupal');
        $this->assertFalse($oModule->isConfigured());

        $sHtml = (string)(new BxTemplServiceLogin())->serviceLoginForm();
        $this->assertStringNotContainsString('bx_drupal_login', $sHtml, 'The site\'s own login form.');
        $this->assertStringContainsString('sys_login', $sHtml);

        $this->bxSetParamCache('bx_drupal_login_url', 'https://drupal.example.com/user/login');
        $oModule = $this->bxModule('bx_drupal');
        $this->assertTrue($oModule->isConfigured());

        BxDolForm::unSetObjectInstance('sys_login', 'sys_login');
        $sHtml = (string)(new BxTemplServiceLogin())->serviceLoginForm();
        $this->assertStringContainsString('bx_drupal_login', $sHtml, 'Drupal\'s login form once its URL is set.');
    }

    public function testDrupalHasNoContinueWithButton(): void
    {
        $this->bxSetParamCache('bx_drupal_login_url', 'https://drupal.example.com/user/login');
        $this->bxModule('bx_drupal');

        $this->assertDoesNotMatchRegularExpression('/sys-auth-bx_drupal[\s"]/', (string)(new BxTemplServiceLogin())->serviceMemberAuthCode(), 'Drupal accounts sign in through the login form; the module has no start page.');
    }
}
