<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Personal access tokens and the MCP server over real HTTP (PHP's built-in server in front of
 * api_mcp.php and api_v2.php): a token signs in to API v2 and to /api/mcp as its account, a
 * revoked or expired one does not, a member gets the API v2 operations as tools and an operator
 * also the agent tools switched on for operators.
 */
#[Group('integration')]
class ApiMcpTest extends ApiV2TestCase
{
    protected $_aPersonalTokens = [];

    protected function tearDown(): void
    {
        foreach ($this->_aPersonalTokens as list($iId, $iAccountId))
            BxDolApiTokens::revoke($iId, $iAccountId);
        parent::tearDown();
    }

    /**
     * @return array [profile id, token]
     */
    protected function personalToken(BxDolAccount $oAccount, int $iDays = 30): array
    {
        $oProfile = BxDolProfile::getInstanceByAccount($oAccount->id());
        if (!$oProfile)
            $this->markTestSkipped('The account has no profile.');

        $a = BxDolApiTokens::create($oAccount->id(), 'ApiMcpTest', $iDays);
        $this->assertIsArray($a, is_string($a) ? $a : '');
        $this->_aPersonalTokens[] = [$a['id'], $oAccount->id()];
        return [$oProfile->id(), $a['token']];
    }

    protected function mcpRequest(string $sMethod, array $aHeaders = [], string $sBody = ''): array
    {
        if (!self::$_oServer) {
            $aUrl = parse_url(BX_DOL_URL_ROOT);
            self::$_oServer = new BxDolTestPhpServer(BX_DIRECTORY_PATH_ROOT, null, $aUrl['host'] . (empty($aUrl['port']) ? '' : ':' . $aUrl['port']));
        }
        return $this->raw($sMethod, '/api_mcp.php', $aHeaders, $sBody);
    }

    protected function mcp(string $sToken, string $sMethod, array $aParams = []): array
    {
        $aParams['_meta'] = [
            'io.modelcontextprotocol/protocolVersion' => BxDolMcpServer::PROTOCOL_VERSION,
            'io.modelcontextprotocol/clientCapabilities' => new stdClass(),
        ];
        $a = $this->mcpRequest('POST', ['Authorization' => 'Bearer ' . $sToken, 'Content-Type' => 'application/json'], json_encode(['jsonrpc' => '2.0', 'id' => 1, 'method' => $sMethod, 'params' => $aParams]));
        $this->assertSame(200, $a['status'], $a['body']);
        return $a['json'];
    }

    protected function toolNames(string $sToken): array
    {
        $a = $this->mcp($sToken, 'tools/list');
        $this->assertArrayHasKey('result', $a, json_encode($a));
        return array_column($a['result']['tools'], 'name');
    }

    public function testWithoutTokenIs401()
    {
        $a = $this->mcpRequest('POST', ['Content-Type' => 'application/json'], '{"jsonrpc":"2.0","id":1,"method":"ping"}');
        $this->assertSame(401, $a['status']);
        // where a client finds how to sign in (RFC 9728)
        $this->assertStringContainsString('resource_metadata="' . BX_DOL_URL_ROOT . '.well-known/oauth-protected-resource"', (string)BxDolTestPhpServer::header($a, 'www-authenticate'));
    }

    public function testDiscoveryDocuments()
    {
        // the rewrite of /.well-known/... ends here (.htaccess)
        $this->mcpRequest('GET');
        $a = $this->raw('GET', '/api_mcp.php?_wk=protected-resource');
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame(BxDolMcpServer::getResourceUrl(), $a['json']['resource']);

        $a = $this->raw('GET', '/api_mcp.php?_wk=authorization-server');
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_oauth')) {
            $this->assertSame(404, $a['status']);
            return;
        }
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame(rtrim(BX_DOL_URL_ROOT, '/'), $a['json']['issuer']);
        $this->assertStringEndsWith('/register', $a['json']['registration_endpoint']);
        $this->assertSame(['S256'], $a['json']['code_challenge_methods_supported']);
    }

    public function testAClientOfAnEarlierVersionOpensWithInitialize()
    {
        list(, $sToken) = $this->personalToken($this->bxAccount('user'));

        $a = $this->mcpRequest('POST', ['Authorization' => 'Bearer ' . $sToken, 'Content-Type' => 'application/json', 'Accept' => 'application/json, text/event-stream'], json_encode(['jsonrpc' => '2.0', 'id' => 1, 'method' => 'initialize', 'params' => ['protocolVersion' => '2025-06-18', 'capabilities' => new stdClass(), 'clientInfo' => ['name' => 'test', 'version' => '1']]]));
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame('2025-06-18', $a['json']['result']['protocolVersion']);

        $a = $this->mcpRequest('POST', ['Authorization' => 'Bearer ' . $sToken, 'Content-Type' => 'application/json', 'MCP-Protocol-Version' => '2025-06-18'], json_encode(['jsonrpc' => '2.0', 'method' => 'notifications/initialized']));
        $this->assertSame(202, $a['status']);

        $a = $this->mcpRequest('POST', ['Authorization' => 'Bearer ' . $sToken, 'Content-Type' => 'application/json', 'MCP-Protocol-Version' => '2025-06-18'], json_encode(['jsonrpc' => '2.0', 'id' => 2, 'method' => 'tools/list']));
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertContains('getMe', array_column($a['json']['result']['tools'], 'name'));
        $this->assertArrayNotHasKey('ttlMs', $a['json']['result']);
    }

    public function testGetIs405()
    {
        $a = $this->mcpRequest('GET');
        $this->assertSame(405, $a['status']);
    }

    public function testPersonalTokenSignsInToApiV2()
    {
        list($iProfileId, $sToken) = $this->personalToken($this->bxAccount('user'));

        $a = $this->http('GET', 'me', ['Authorization' => 'Bearer ' . $sToken]);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame((string)$iProfileId, (string)($a['json']['active_profile_id'] ?? ''));
    }

    public function testRevokedTokenIs401()
    {
        $oAccount = $this->bxAccount('user');
        list(, $sToken) = $this->personalToken($oAccount);
        list($iId) = end($this->_aPersonalTokens);
        $this->assertTrue(BxDolApiTokens::revoke($iId, $oAccount->id()));

        $this->assertSame(401, $this->http('GET', 'me', ['Authorization' => 'Bearer ' . $sToken])['status']);
        $this->assertSame(401, $this->mcpRequest('POST', ['Authorization' => 'Bearer ' . $sToken, 'Content-Type' => 'application/json'], '{}')['status']);
    }

    public function testExpiredTokenIs401()
    {
        list(, $sToken) = $this->personalToken($this->bxAccount('user'));
        list($iId) = end($this->_aPersonalTokens);
        BxDolDb::getInstance()->query("UPDATE `sys_api_tokens` SET `expires` = :t WHERE `id` = :id", ['t' => time() - 1, 'id' => $iId]);

        $this->assertSame(401, $this->http('GET', 'me', ['Authorization' => 'Bearer ' . $sToken])['status']);
    }

    public function testAnotherAccountCannotRevoke()
    {
        $oAccount = $this->bxAccount('user');
        $this->personalToken($oAccount);
        list($iId) = end($this->_aPersonalTokens);

        $this->assertFalse(BxDolApiTokens::revoke($iId, $oAccount->id() + 1000000));
        $this->assertNotEmpty(BxDolApiQuery::getInstance()->getTokenById($iId));
    }

    public function testDiscover()
    {
        list(, $sToken) = $this->personalToken($this->bxAccount('user'));

        $a = $this->mcp($sToken, 'server/discover');
        $this->assertSame([BxDolMcpServer::PROTOCOL_VERSION], $a['result']['supportedVersions']);
        $this->assertArrayHasKey('tools', $a['result']['capabilities']);
    }

    public function testMemberGetsApiToolsOnly()
    {
        list($iProfileId, $sToken) = $this->personalToken($this->bxAccount('user'));
        if (isAdmin((int)BxDolProfile::getInstance($iProfileId)->getAccountId()))
            $this->markTestSkipped('The test user is an administrator.');

        $aNames = $this->toolNames($sToken);
        $this->assertContains('getMe', $aNames);
        $this->assertNotContains('mysql_select_query', $aNames);
        $this->assertNotContains('content_update', $aNames);

        $a = $this->mcp($sToken, 'tools/call', ['name' => 'mysql_select_query', 'arguments' => ['query' => 'SELECT 1']]);
        $this->assertSame(BxDolMcpServer::JSONRPC_INVALID_PARAMS, $a['error']['code']);
    }

    public function testMemberCallsApiTool()
    {
        list($iProfileId, $sToken) = $this->personalToken($this->bxAccount('user'));

        $a = $this->mcp($sToken, 'tools/call', ['name' => 'getMe', 'arguments' => new stdClass()]);
        $this->assertFalse($a['result']['isError'], json_encode($a));
        $this->assertSame((string)$iProfileId, (string)($a['result']['structuredContent']['active_profile_id'] ?? ''));
    }

    public function testApiToolErrorIsAToolError()
    {
        list(, $sToken) = $this->personalToken($this->bxAccount('user'));

        // a profile id that is no one's
        $a = $this->mcp($sToken, 'tools/call', ['name' => 'getProfile', 'arguments' => ['id' => '999999999']]);
        if (isset($a['error']))
            $this->markTestSkipped('This site has no getProfile operation.');
        $this->assertTrue($a['result']['isError'], json_encode($a));
    }

    public function testOperatorGetsOperatorTools()
    {
        $aSelect = BxDolDb::getInstance()->getRow("SELECT `mcp` FROM `sys_agents_tools` WHERE `type` = 'mysql_select' ORDER BY `id` LIMIT 1");
        if (empty($aSelect['mcp']))
            $this->markTestSkipped('mysql_select is not given to operators on this site.');

        $oAccount = BxDolProfile::getInstance($this->adminProfileIdOtherThan([]))->getAccountObject();
        if (!BxDolStudioRolesUtils::getInstance()->isActionAllowed(BxDolMcpServer::ROLE_ACTION, $oAccount->id()))
            $this->markTestSkipped('The Studio role of the administrator does not use MCP.');
        list(, $sToken) = $this->personalToken($oAccount);

        $aNames = $this->toolNames($sToken);
        $this->assertContains('getMe', $aNames);
        $this->assertContains('mysql_select_query', $aNames);
        $this->assertNotContains('chat_buttons', $aNames);
        $this->assertNotContains('chat_title', $aNames);

        $a = $this->mcp($sToken, 'tools/call', ['name' => 'mysql_select_query', 'arguments' => ['query' => 'SELECT 1 AS `one`']]);
        $this->assertFalse($a['result']['isError'], json_encode($a));
    }
}
