<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Agent tools given to members through MCP (Studio > Agents > Connectors): only tools made for it, run in the member's
 * scope, where accounts and profiles are refused, a missing item is not touched, the member's identity survives the
 * call, and the arguments that name who acts are left out of the schema. Outside that scope the tools run as before.
 */
#[Group('integration')]
class McpMemberToolsTest extends BxDolIntegrationTestCase
{
    protected $_aFlags = [];
    protected $_mForced = null;

    protected function setUp(): void
    {
        parent::setUp();
        $this->_mForced = $GLOBALS['glForceCurrentProfileId'] ?? null;
    }

    protected function tearDown(): void
    {
        BxDolAITool::setMemberScope(0);
        $GLOBALS['glForceCurrentProfileId'] = $this->_mForced;
        $oQuery = new BxDolAiQuery();
        foreach ($this->_aFlags as $iId => list($iMcp, $iMembers)) {
            $oQuery->setToolMcpFlag($iId, 'mcp', (bool)$iMcp);
            $oQuery->setToolMcpFlag($iId, 'mcp_members', (bool)$iMembers);
        }
        parent::tearDown();
    }

    protected function toolRow(string $sType): array
    {
        $aRow = BxDolDb::getInstance()->getRow("SELECT * FROM `sys_agents_tools` WHERE `type` = :t ORDER BY `id` LIMIT 1", ['t' => $sType]);
        if (empty($aRow))
            $this->markTestSkipped($sType . ' is not installed.');
        return $aRow;
    }

    /** Switch a tool's flags for the test; put back after it. */
    protected function flags(array $aRow, int $iMcp, int $iMembers): void
    {
        if (!isset($this->_aFlags[(int)$aRow['id']]))
            $this->_aFlags[(int)$aRow['id']] = [(int)$aRow['mcp'], (int)$aRow['mcp_members']];
        $oQuery = new BxDolAiQuery();
        $oQuery->setToolMcpFlag((int)$aRow['id'], 'mcp', (bool)$iMcp);
        $oQuery->setToolMcpFlag((int)$aRow['id'], 'mcp_members', (bool)$iMembers);
    }

    protected function memberProfileId(): int
    {
        $oProfile = BxDolProfile::getInstanceByAccount($this->bxAccount('user')->id());
        if (!$oProfile)
            $this->markTestSkipped('The test user has no profile.');
        return (int)$oProfile->id();
    }

    public function testOnlyToolsMadeForMembersAreMemberSafe()
    {
        foreach (['content_structure', 'content_search', 'content_get', 'content_add', 'content_update', 'content_delete', 'comments_get', 'comments_add', 'comments_update', 'comments_delete'] as $sType)
            $this->assertTrue(BxDolMcpServer::isMemberSafeTool($this->toolRow($sType)), $sType);

        foreach (['mysql_select', 'mysql_schema', 'mysql_write_safe', 'agent_create', 'splash_update'] as $sType)
            $this->assertFalse(BxDolMcpServer::isMemberSafeTool($this->toolRow($sType)), $sType);
    }

    public function testMemberScopeRefusesAccountsAndProfiles()
    {
        $iProfile = $this->memberProfileId();
        BxDolAITool::setMemberScope($iProfile);
        $GLOBALS['glForceCurrentProfileId'] = $iProfile;

        $a = (new BxDolAIToolContentDelete())('sys_account', $this->bxAccount('user')->id());
        $this->assertSame(404, $a['code'] ?? null, json_encode($a));
        $this->assertNotEmpty(BxDolAccount::getInstance($this->bxAccount('user')->id()), 'The account is still there.');

        $a = (new BxDolAIToolContentUpdate())('sys_account', $this->bxAccount('user')->id(), [['name' => 'email', 'value' => 'x@example.com']], 1);
        $this->assertSame(404, $a['code'] ?? null, json_encode($a));

        if (BxDolModuleQuery::getInstance()->isEnabledByName('bx_persons')) {
            $a = (new BxDolAIToolContentDelete())('bx_persons', 1);
            $this->assertContains($a['code'] ?? null, [403, 404], json_encode($a));
        }
    }

    public function testMemberScopeKeepsTheMemberAndIgnoresTheProfileAsked()
    {
        $iProfile = $this->memberProfileId();
        BxDolAITool::setMemberScope($iProfile);
        $GLOBALS['glForceCurrentProfileId'] = $iProfile;

        // a missing item: refused before anything runs, the member still the one acting
        $a = (new BxDolAIToolContentUpdate())('no_such_module', 1, [], $iProfile + 1);
        $this->assertSame(404, $a['code'] ?? null);
        $this->assertSame($iProfile, (int)$GLOBALS['glForceCurrentProfileId']);

        $a = (new BxDolAIToolContentAdd())('no_such_module', [], $iProfile + 1);
        $this->assertSame(404, $a['code'] ?? null);
        $this->assertSame($iProfile, (int)$GLOBALS['glForceCurrentProfileId']);
    }

    public function testOutsideTheMemberScopeToolsRunAsBefore()
    {
        BxDolAITool::setMemberScope(0);
        $GLOBALS['glForceCurrentProfileId'] = 0;

        // agents name who acts, and are left with no one forced after the call, as always
        $a = (new BxDolAIToolContentAdd())('no_such_module', [], 1);
        $this->assertSame(404, $a['code'] ?? null, json_encode($a));
        $this->assertSame(0, (int)$GLOBALS['glForceCurrentProfileId']);
    }

    public function testMembersGetTheToolsSwitchedOnForThemWithoutWhoActs()
    {
        $iProfile = $this->memberProfileId();
        if (isAdmin($this->bxAccount('user')->id()))
            $this->markTestSkipped('The test user is an administrator.');

        $aAdd = $this->toolRow('content_add');
        $aSelect = $this->toolRow('mysql_select');
        if (empty($aAdd['active']) || empty($aSelect['active']))
            $this->markTestSkipped('The tools are off on this site.');
        $this->flags($aAdd, 0, 1);
        $this->flags($aSelect, 1, 1); // not made for members: never given to them, whatever the flag says

        // a member's request: not an operator, whoever runs the tests
        $mLogged = $GLOBALS['logged'] ?? null;
        $GLOBALS['logged'] = ['admin' => false, 'member' => true];

        $oAuth = new class($iProfile) extends BxDolApiV2Auth {
            public function __construct($iProfileId)
            {
                $this->_sMode = self::MODE_TOKEN;
                $this->_iProfileId = $iProfileId;
            }
        };
        try {
            $aTools = (new BxDolMcpServer($oAuth))->getTools();
        }
        finally {
            $GLOBALS['logged'] = $mLogged;
        }

        $this->assertArrayHasKey('content_add', $aTools);
        $this->assertSame('member', $aTools['content_add']['kind']);
        $aProperties = (array)$aTools['content_add']['tool']['inputSchema']['properties'];
        $this->assertArrayNotHasKey('profile_id', $aProperties);
        $this->assertNotContains('profile_id', $aTools['content_add']['tool']['inputSchema']['required']);
        $this->assertArrayNotHasKey('mysql_select_query', $aTools);
    }
}
