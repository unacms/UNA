<?php

/**
 * Locked tools are attached in code. The picker and a saved CSV cannot grant them.
 */
class BxDolAiAgentToolsTest extends \PHPUnit\Framework\TestCase
{
    /** @var callable|null */
    protected $handler;

    protected function setUp(): void
    {
        $this->handler = set_exception_handler(static function () {
        });
        restore_exception_handler();
    }

    protected function tearDown(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $current = set_exception_handler(static function () {
            });
            restore_exception_handler();
            if ($current === $this->handler)
                return;
            restore_exception_handler();
        }
    }

    public function testTypesForNormalAgentAreChatOnly()
    {
        $this->assertSame(
            ['chat_buttons', 'chat_title'],
            BxDolAiAgentTools::typesFor(['name' => 'site_helper'])
        );
    }

    public function testTypesForOperatorIncludeMockupAndWriteSafeButNotOtherMysql()
    {
        $this->assertSame([
            'chat_buttons',
            'chat_title',
            'agent_create',
            'mockup_upsert',
            'mysql_write_safe',
            'mysql_undo',
        ], BxDolAiAgentTools::typesFor(['name' => 'una_operator']));
    }

    public function testPickerOmitsLockedTypes()
    {
        $oDb = BxDolDb::getInstance();
        $aLocked = $oDb->getAll("SELECT `id`, `type` FROM `sys_agents_tools` WHERE `type` IN (" . $oDb->implode_escape(BxDolAiAgentTools::hiddenTypes()) . ")");
        $this->assertNotEmpty($aLocked);

        $aHidden = [];
        foreach ($aLocked as $aRow)
            $aHidden[(int)$aRow['id']] = $aRow['type'];

        $aTools = (new BxDolAiQuery())->getTools();
        foreach (array_keys($aTools) as $iId)
            $this->assertArrayNotHasKey((int)$iId, $aHidden);

        $iContent = (int)$oDb->getOne("SELECT `id` FROM `sys_agents_tools` WHERE `type` = 'content_get' AND `active` = 1 ORDER BY `id` LIMIT 1");
        $this->assertArrayHasKey($iContent, $aTools);

        foreach (['mysql_schema', 'mysql_select'] as $sType) {
            $iId = $this->toolId($sType);
            $this->assertGreaterThan(0, $iId);
            $this->assertArrayHasKey($iId, $aTools);
        }
    }

    public function testToolsGridSourceOmitsHiddenTypes()
    {
        $sSource = BxDolAiAgentTools::excludeHiddenFromSource('SELECT * FROM `sys_agents_tools` WHERE 1 ');

        $this->assertStringStartsWith('SELECT * FROM `sys_agents_tools` WHERE 1 ', $sSource);
        foreach (BxDolAiAgentTools::hiddenTypes() as $sType)
            $this->assertStringContainsString("'" . $sType . "'", $sSource);
        $this->assertStringNotContainsString("'mysql_schema'", $sSource);
        $this->assertStringNotContainsString("'mysql_select'", $sSource);
        $this->assertStringNotContainsString("'mysql_write'", $sSource);
    }

    public function testStripCsvDropsLockedIdAndKeepsContentGet()
    {
        $oDb = BxDolDb::getInstance();
        $iChat = (int)$oDb->getOne("SELECT `id` FROM `sys_agents_tools` WHERE `type` = 'chat_buttons' ORDER BY `id` LIMIT 1");
        $iContent = (int)$oDb->getOne("SELECT `id` FROM `sys_agents_tools` WHERE `type` = 'content_get' ORDER BY `id` LIMIT 1");
        $this->assertGreaterThan(0, $iChat);
        $this->assertGreaterThan(0, $iContent);

        $this->assertSame((string)$iContent, BxDolAiAgentTools::stripCsv($iChat . ',' . $iContent));
    }

    public function testResolveIdsIgnoresStoredLockedTools()
    {
        $oDb = BxDolDb::getInstance();
        $iMysql = (int)$oDb->getOne("SELECT `id` FROM `sys_agents_tools` WHERE `type` = 'mysql_select' AND `active` = 1 ORDER BY `id` LIMIT 1");
        $iContent = (int)$oDb->getOne("SELECT `id` FROM `sys_agents_tools` WHERE `type` = 'content_get' AND `active` = 1 ORDER BY `id` LIMIT 1");
        $iWrite = (int)$oDb->getOne("SELECT `id` FROM `sys_agents_tools` WHERE `type` = 'mysql_write' ORDER BY `id` LIMIT 1");
        $this->assertGreaterThan(0, $iMysql);
        $this->assertGreaterThan(0, $iContent);

        $iWriteSafe = $this->toolId('mysql_write_safe');
        $iUndo = $this->toolId('mysql_undo');
        $aNormal = BxDolAiAgentTools::resolveIds([
            'name' => 'site_helper',
            'tools' => $iMysql . ',' . $iContent . ',' . $iWriteSafe . ',' . $iUndo,
        ]);
        $this->assertContains($iContent, $aNormal);
        $this->assertContains($iMysql, $aNormal);
        $this->assertNotContains($iWriteSafe, $aNormal);
        $this->assertNotContains($iUndo, $aNormal);
        $this->assertContains($this->toolId('chat_buttons'), $aNormal);
        $this->assertContains($this->toolId('chat_title'), $aNormal);

        $aOperator = BxDolAiAgentTools::resolveIds(['name' => 'una_operator', 'tools' => (string)$iMysql]);
        foreach (['chat_buttons', 'chat_title', 'agent_create', 'mockup_upsert', 'mysql_write_safe', 'mysql_undo'] as $sType)
            $this->assertContains($this->toolId($sType), $aOperator);
        $this->assertContains($iMysql, $aOperator);
        if ($iWrite > 0)
            $this->assertNotContains($iWrite, $aOperator);
    }

    protected function toolId(string $sType): int
    {
        return (int)BxDolDb::getInstance()->getOne(
            "SELECT `id` FROM `sys_agents_tools` WHERE `type` = :type AND `active` = 1 ORDER BY `id` LIMIT 1",
            ['type' => $sType]
        );
    }
}
