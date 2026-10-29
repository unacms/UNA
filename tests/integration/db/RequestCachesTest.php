<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Lookups that run on every request: the table check behind BxDolAi::getInstance,
 * the modules list that every service call reads and the agents list that every alert reads.
 * The lists are kept in memory for the request, so a change has to reach that copy too.
 */
#[Group('integration')]
class RequestCachesTest extends BxDolIntegrationTestCase
{
    private const MODULE_NAME = 'bx_test_modules_list';
    private const MODULE_URI = 'bx_test_modules_list';
    private const MODULE_PATH = 'boonex/bx_test_modules_list/';

    private const MEMORY_MODULES = 'BxDolModuleQuery::getModuleByName';
    private const MEMORY_AGENTS = 'sys_agents_with_alert';

    private const AGENT_NAME = 'bx_test_alert_agent';

    private int $_iAgentId = 0;

    protected function setUp(): void
    {
        parent::setUp();

        $this->cleanup(); // after a run that was cut short
    }

    protected function tearDown(): void
    {
        $this->cleanup();

        parent::tearDown();
    }

    private function cleanup(): void
    {
        $oDb = BxDolDb::getInstance();
        if ($oDb->isTableExists('sys_agents_agents') && $oDb->query("DELETE FROM `sys_agents_agents` WHERE `name` = :name", ['name' => self::AGENT_NAME]))
            $oDb->cleanCache('sys_agents_with_alert');
        $this->_iAgentId = 0;

        (new BxDolStudioInstallerQuery())->deleteModule($this->moduleConfig());
        $oDb->cleanMemoryAll();
    }

    private function moduleConfig(): array
    {
        return [
            'type' => BX_DOL_MODULE_TYPE_MODULE,
            'name' => self::MODULE_NAME,
            'title' => 'Modules list fixture',
            'vendor' => 'UNA INC',
            'version' => '1.0.0',
            'home_dir' => self::MODULE_PATH,
            'home_uri' => self::MODULE_URI,
            'class_prefix' => 'BxTestModulesList',
            'db_prefix' => 'bx_test_modules_list_',
            'language_category' => 'Modules list fixture',
        ];
    }

    private function memory(): array
    {
        return (new ReflectionProperty(BxDolDb::class, '_aDbCacheData'))->getValue();
    }

    public function testTableExistsKeepsItsAnswers(): void
    {
        $oDb = BxDolDb::getInstance();

        $this->assertTrue($oDb->isTableExists('sys_accounts'));
        $this->assertTrue($oDb->isTableExists('SYS_ACCOUNTS'), 'A name in another case is still found.');

        foreach (['sys_accounts_nonexistent', 'sys_accounts%', 'sys_account_', '`sys_accounts`', BX_DATABASE_NAME . '.sys_accounts', ''] as $sName)
            $this->assertFalse($oDb->isTableExists($sName), '"' . $sName . '" is not a table.');
    }

    public function testModulesListIsKeptForTheRequest(): void
    {
        $oModules = BxDolModuleQuery::getInstance();

        $this->assertSame('system', $oModules->getModuleByName('system')['name']);
        $this->assertArrayHasKey(self::MEMORY_MODULES, $this->memory(), 'The list stays in memory after the first read.');
        $this->assertFalse($oModules->getModuleByName('bx_no_such_module'));
    }

    /**
     * getModuleByUri keeps rows in memory as 'sys_modules_<uri>', and ?skin=<code> asks it for any uri.
     */
    public function testModuleUriListDoesNotTakeTheListSlot(): void
    {
        $oModules = BxDolModuleQuery::getInstance();

        $this->assertEmpty($oModules->getModuleByUri('list'));
        $this->assertSame('system', $oModules->getModuleByName('system')['name']);

        BxDolDb::getInstance()->cleanMemoryAll();

        $this->assertSame('system', $oModules->getModuleByName('system')['name']);
        $this->assertEmpty($oModules->getModuleByUri('list'));
    }

    public function testInstalledModuleIsFoundInTheSameRequest(): void
    {
        $oModules = BxDolModuleQuery::getInstance();
        $oInstaller = new BxDolStudioInstallerQuery();

        $this->assertFalse($oModules->getModuleByName(self::MODULE_NAME));

        $aConfig = $this->moduleConfig();
        $this->assertGreaterThan(0, $oInstaller->insertModule($aConfig), 'The fixture module was not inserted.');
        $aModule = $oModules->getModuleByName(self::MODULE_NAME);
        $this->assertIsArray($aModule, 'An installed module is found by name at once.');
        $this->assertSame(self::MODULE_URI, $aModule['uri']);

        $oModules->setModulePendingUninstall(self::MODULE_URI, true);
        $this->assertSame(1, (int)$oModules->getModuleByName(self::MODULE_NAME)['pending_uninstall']);

        $oInstaller->deleteModule($this->moduleConfig());
        $this->assertFalse($oModules->getModuleByName(self::MODULE_NAME), 'An uninstalled module is gone at once.');
    }

    public function testAgentsListIsKeptAndRefreshedForTheRequest(): void
    {
        if (!BxDolAi::getInstance())
            $this->markTestSkipped('AI agents are not installed.');

        $oDb = BxDolDb::getInstance();
        $oDb->query("INSERT INTO `sys_agents_agents` SET `name` = :name, `title` = 'Alert agent fixture', `trigger` = 'alert', `alert` = 'bx_test_unit:bx_test_action', `active` = 0, `added` = :added", [
            'name' => self::AGENT_NAME,
            'added' => time(),
        ]);
        $this->_iAgentId = (int)$oDb->lastId();
        $oDb->cleanCache('sys_agents_with_alert');

        $oTrigger = BxDolAiTrigger::getInstance('alert');
        $this->assertSame([], $oTrigger->getAgentsByUnitAndAction('bx_test_unit', 'bx_test_action'), 'An inactive agent is not run.');
        $this->assertArrayHasKey(self::MEMORY_AGENTS, $this->memory(), 'The list stays in memory after the first read.');

        //--- Turning the agent on reaches the alerts of the same request.
        $this->bxLoginAsAdmin();
        $aResult = BxDolService::call('system', 'set_ai_agent_active', [$this->_iAgentId, 1], 'TemplServices');
        $this->assertSame(1, $aResult['active'] ?? null);

        $aAgents = $oTrigger->getAgentsByUnitAndAction('bx_test_unit', 'bx_test_action');
        $this->assertSame([$this->_iAgentId], array_map('intval', array_column($aAgents, 'id')));
        $this->assertSame([], $oTrigger->getAgentsByUnitAndAction('bx_test_unit', 'bx_other_action'));
    }
}
