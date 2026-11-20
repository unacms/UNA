<?php

/**
 * The web installer's choices: the starter apps it preselects, how the module list is grouped and what it hides,
 * and the checks of the site configuration form.
 */
class BxDolInstallSiteConfigTest extends \PHPUnit\Framework\TestCase
{
    /**
     * Never preselected: they need keys, a licence or a server of their own, change how members sign in or up,
     * replace the default icon set, or are for developers and migrations.
     */
    private const NEVER_PRESELECTED = array(
        'invites', 'fontawesome', 'intercom', 'markerio', 'google_tagmanager', 'shopify', 'snipcart', 'xero',
        'opencv', 'elasticsearch', 'profiler', 'developer', 'dolphin_migration', 'se_migration',
        'drupal', 'azrb2c', 'azrcon', 'cidaascon', 'oktacon', 'cas', 'dolcon', 'facebook_connect', 'googlecon',
        'twitter', 'linkedin', 'github', 'unacon', 'chat_plus', 'datafox', 'froala',
    );

    private static function load(): void
    {
        if (!defined('BX_DOL_INSTALL'))
            define('BX_DOL_INSTALL', true);
        if (!defined('BX_INSTALL_DIR'))
            define('BX_INSTALL_DIR', dirname(__DIR__, 3) . '/install/');
        if (!defined('BX_INSTALL_DIR_MODULES'))
            define('BX_INSTALL_DIR_MODULES', dirname(__DIR__, 3) . '/modules/');
        if (!defined('BX_DOL_MODULE_TYPE_MODULE')) {
            define('BX_DOL_MODULE_TYPE_MODULE', 'module');
            define('BX_DOL_MODULE_TYPE_LANGUAGE', 'language');
            define('BX_DOL_MODULE_TYPE_TEMPLATE', 'template');
        }

        require_once dirname(__DIR__, 3) . '/install/classes/BxDolInstallModulesTools.php';
        require_once dirname(__DIR__, 3) . '/install/classes/BxDolInstallSiteConfig.php';
    }

    private static function config(): BxDolInstallSiteConfig
    {
        self::load();
        return (new ReflectionClass(BxDolInstallSiteConfig::class))->newInstanceWithoutConstructor();
    }

    private static function call(object $o, string $sMethod, ...$aArgs)
    {
        return (new ReflectionMethod($o, $sMethod))->invoke($o, ...$aArgs);
    }

    private static function moduleUris(string $sType = 'module'): array
    {
        self::load();
        return array_column((new BxDolInstallModulesTools())->getModules($sType), 'home_uri');
    }

    public function testStarterAppsAreShippedModules(): void
    {
        self::load();
        $aUris = self::moduleUris();
        foreach (BxDolInstallSiteConfig::$aStarterModules as $sUri)
            $this->assertContains($sUri, $aUris, "starter app $sUri is not in modules/");
    }

    public function testStarterAppsLeaveOutKeysLicencesAndDeveloperTools(): void
    {
        self::load();
        $this->assertSame(array(), array_values(array_intersect(BxDolInstallSiteConfig::$aStarterModules, self::NEVER_PRESELECTED)));
        $this->assertSame(array(), array_values(array_intersect(BxDolInstallSiteConfig::$aStarterModules, BxDolInstallSiteConfig::$aHiddenModules)));
    }

    public function testStarterAppsAndTheirDependenciesInstallWithTheProfilesFirst(): void
    {
        self::load();
        $oTools = new BxDolInstallModulesTools();
        $aOrder = array_column($oTools->getInstallOrder($oTools->getModules('module'), BxDolInstallSiteConfig::$aStarterModules, BX_INSTALL_FIRST_MODULE), 'home_uri');

        $this->assertSame('persons', $aOrder[0]);
        foreach (BxDolInstallSiteConfig::$aStarterModules as $sUri)
            $this->assertContains($sUri, $aOrder);
        $this->assertSame(array(), array_values(array_intersect($aOrder, self::NEVER_PRESELECTED)), 'a starter app depends on a module that must not be preselected');
    }

    public function testEveryModuleIsInOneGroupAndUnknownOnesGoToOther(): void
    {
        $o = self::config();
        $aUris = array_values(array_diff(self::moduleUris(), BxDolInstallSiteConfig::$aHiddenModules));

        $aGroups = $o->getModuleGroups(array_merge($aUris, array('brand_new_app')));

        $aAll = array_merge(...array_values($aGroups));
        sort($aAll);
        $aExpected = array_merge($aUris, array('brand_new_app'));
        sort($aExpected);
        $this->assertSame($aExpected, $aAll);
        $this->assertContains('brand_new_app', $aGroups['other']);
        $this->assertSame(array('profiles'), array_keys($o->getModuleGroups(array('persons'))), 'empty groups are left out');
    }

    public function testDiscontinuedModulesAndTemplatesAreNotOffered(): void
    {
        $o = self::config();

        $aModules = self::call($o, 'getSelectValues', 'module');
        $aTemplates = self::call($o, 'getSelectValues', 'template');

        foreach (array('chat_plus', 'datafox', 'unacon', 'froala') as $sUri)
            $this->assertArrayNotHasKey($sUri, $aModules);
        $this->assertArrayNotHasKey('decorous', $aTemplates);
        $this->assertArrayNotHasKey('ocean', $aTemplates);
        $this->assertArrayHasKey('artificer', $aTemplates);
        $this->assertArrayHasKey('timeline', $aModules);
    }

    public function testFieldChecks(): void
    {
        $o = self::config();

        $this->assertTrue(self::call($o, 'checkPassword', 'longenough', 8));
        $this->assertIsString(self::call($o, 'checkPassword', 'short', 8));

        $this->assertTrue(self::call($o, 'checkEmail', 'admin@example.com', 3));
        $this->assertIsString(self::call($o, 'checkEmail', 'admin@', 3));
        $this->assertIsString(self::call($o, 'checkEmail', 'not-an-email', 3));

        $this->assertTrue(self::call($o, 'checkUrl', 'https://example.com/', 10));
        $this->assertTrue(self::call($o, 'checkUrl', 'http://localhost:8080/una/', 10));
        $this->assertIsString(self::call($o, 'checkUrl', 'example.com/path/', 10));
        $this->assertIsString(self::call($o, 'checkUrl', 'ftp://example.com/', 10));
        $this->assertIsString(self::call($o, 'checkUrl', 'https://example.com', 10), 'the trailing slash is required');

        $this->assertTrue(self::call($o, 'checkInList', 'innodb', array('MYISAM', 'INNODB')));
        $this->assertFalse(self::call($o, 'checkInList', 'MEMORY', array('MYISAM', 'INNODB')));

        $this->assertTrue(self::call($o, 'checkLengthExactOrEmpty', '', 10));
        $this->assertIsString(self::call($o, 'checkLengthExactOrEmpty', 'abc', 10));
    }

    public function testEmptyOptionalFieldPassesAndEmptyRequiredOneSaysSo(): void
    {
        $o = self::config();

        $this->assertTrue(self::call($o, 'check', 'oauth_key', '', array('check' => array('checkLengthExactOrEmpty', 10), 'optional' => true)));
        $this->assertIsString(self::call($o, 'check', 'site_title', '  ', array('check' => array('checkLength', 1))));
        $this->assertTrue(self::call($o, 'check', 'db_port', '', array()));
    }

    public function testDbEngineComesFromTheFormUnlessTheEnvironmentSetsIt(): void
    {
        $o = self::config();
        $sEnv = getenv('UNA_DB_ENGINE');
        putenv('UNA_DB_ENGINE');
        try {
            $this->assertSame('INNODB', self::call($o, 'getDbEngine', array('db_engine' => 'InnoDB')));
            $this->assertSame('MYISAM', self::call($o, 'getDbEngine', array('db_engine' => 'MYISAM')));
            $this->assertSame('', self::call($o, 'getDbEngine', array('db_engine' => 'MEMORY')));

            putenv('UNA_DB_ENGINE=INNODB');
            $this->assertSame('INNODB', self::call($o, 'getDbEngine', array('db_engine' => 'MYISAM')));
        }
        finally {
            putenv(false === $sEnv ? 'UNA_DB_ENGINE' : 'UNA_DB_ENGINE=' . $sEnv);
        }
    }

    public function testDbErrorsAreEscapedAndAllShown(): void
    {
        $o = self::config();

        $a = self::call($o, 'dbErrors2ErrorFields', array(
            array('error' => 'first <b>bad</b>', 'query' => "SELECT '<script>'"),
            array('error' => 'second', 'query' => 'SELECT 2'),
        ));

        $s = $a[BX_INSTALL_ERR_GENERAL];
        $this->assertStringContainsString('first &lt;b&gt;bad&lt;/b&gt;', $s);
        $this->assertStringContainsString('&lt;script&gt;', $s);
        $this->assertStringNotContainsString('<script>', $s);
        $this->assertStringContainsString('second', $s);
    }

    public function testFailedConnectionPointsAtTheRightFields(): void
    {
        $o = self::config();

        $oDenied = new PDOException('SQLSTATE[HY000] [1045] Access denied for user');
        $oUnknown = new PDOException('SQLSTATE[HY000] [1049] Unknown database');
        $oNoHost = new PDOException('SQLSTATE[HY000] [2002] No such host');

        $this->assertSame('Database connect failed', self::call($o, 'dbConnectError', $oDenied));
        $this->assertSame('Database select failed', self::call($o, 'dbConnectError', $oUnknown));
        $this->assertSame('Database connect failed', self::call($o, 'dbConnectError', $oNoHost));
    }

    public function testQueueNeedsItsToken(): void
    {
        self::load();
        $this->assertFalse(BxDolInstallSiteConfig::getModulesQueue(''));
        $this->assertFalse(BxDolInstallSiteConfig::getModulesQueue(array('x')));
        if (!file_exists(BX_INSTALL_PATH_QUEUE))
            $this->assertFalse(BxDolInstallSiteConfig::getModulesQueue('anything'));
        if (!file_exists(BX_INSTALL_PATH_QUEUE) && !file_exists(BX_INSTALL_PATH_HEADER_STAGED))
            $this->assertFalse(BxDolInstallSiteConfig::isModulesBatchInProgress());
    }

    public function testInnoDbFallsBackToMyIsamOnlyWhereTheServerHasNoInnoDb(): void
    {
        $o = self::config();

        $oDb = new class {
            public $sSupport = 'DEFAULT';
            public function prepare($sQuery, ...$aArgs) { return $sQuery; }
            public function getOne($s) { return $this->sSupport; }
        };

        $this->assertTrue(self::call($o, 'isEngineSupported', $oDb, 'InnoDB'));
        $oDb->sSupport = 'YES';
        $this->assertTrue(self::call($o, 'isEngineSupported', $oDb, 'InnoDB'));
        $oDb->sSupport = 'DISABLED';
        $this->assertFalse(self::call($o, 'isEngineSupported', $oDb, 'InnoDB'));

        (new ReflectionProperty($o, '_sDbEngineFallback'))->setValue($o, 'MYISAM');
        $this->assertSame('MYISAM', self::call($o, 'getDbEngine', array('db_engine' => 'INNODB')));
    }

    public function testWelcomeListsEveryStepOfTheStepBar(): void
    {
        self::load();
        if (!defined('BX_INSTALL_DIR_PLUGINS'))
            define('BX_INSTALL_DIR_PLUGINS', dirname(__DIR__, 3) . '/plugins/');
        if (!defined('BX_INSTALL_DIR_TEMPLATES'))
            define('BX_INSTALL_DIR_TEMPLATES', dirname(__DIR__, 3) . '/install/templates/');
        require_once dirname(__DIR__, 3) . '/install/classes/BxDolInstallView.php';
        $oView = (new ReflectionClass(BxDolInstallView::class))->newInstanceWithoutConstructor();
        $aSteps = (new ReflectionProperty($oView, '_aSteps'))->getValue($oView);

        $sEn = file_get_contents(dirname(__DIR__, 3) . '/modules/boonex/english/data/langs/system/en.xml');
        foreach ($aSteps as $sStep) {
            $this->assertStringContainsString('name="_sys_inst_step_' . $sStep . '"', $sEn);
            $this->assertStringContainsString('name="_sys_inst_welcome_step_' . $sStep . '"', $sEn);
        }
    }
}
