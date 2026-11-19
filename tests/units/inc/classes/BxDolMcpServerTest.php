<?php

/**
 * The MCP server's JSON-RPC handling that needs no database: messages it refuses, ping, the
 * protocol version it speaks, notifications. And what a personal access token looks like.
 */
class BxDolMcpServerTest extends \PHPUnit\Framework\TestCase
{
    protected function server(): BxDolMcpServer
    {
        return new BxDolMcpServer(new BxDolApiV2Auth());
    }

    protected static function message(string $sMethod, array $aParams = [], $mId = 1, bool $bMeta = true)
    {
        if ($bMeta)
            $aParams['_meta'] = [
                'io.modelcontextprotocol/protocolVersion' => BxDolMcpServer::PROTOCOL_VERSION,
                'io.modelcontextprotocol/clientCapabilities' => new stdClass(),
            ];
        return json_decode(json_encode(['jsonrpc' => '2.0', 'id' => $mId, 'method' => $sMethod, 'params' => $aParams ?: new stdClass()]));
    }

    public function testNotAnObjectIsInvalidRequest()
    {
        $a = $this->server()->handle([1, 2]);
        $this->assertSame(BxDolMcpServer::JSONRPC_INVALID_REQUEST, $a['error']['code']);
        $this->assertNull($a['id']);
    }

    public function testNotificationGetsNoAnswer()
    {
        $this->assertNull($this->server()->handle(json_decode('{"jsonrpc":"2.0","method":"notifications/cancelled","params":{}}')));
    }

    public function testWrongJsonRpcVersionIsInvalidRequest()
    {
        $a = $this->server()->handle(json_decode('{"jsonrpc":"1.0","id":7,"method":"ping"}'));
        $this->assertSame(BxDolMcpServer::JSONRPC_INVALID_REQUEST, $a['error']['code']);
        $this->assertSame(7, $a['id']);
    }

    public function testPingAnswersEmpty()
    {
        $a = $this->server()->handle(json_decode('{"jsonrpc":"2.0","id":"p","method":"ping"}'));
        $this->assertSame('p', $a['id']);
        $this->assertEquals(new stdClass(), $a['result']);
    }

    public function testClientsOfEarlierVersionsOpenWithInitialize()
    {
        // the version asked for when the server speaks it, else the latest it speaks with initialize
        $a = $this->server()->handle(self::message('initialize', ['protocolVersion' => '2025-06-18', 'capabilities' => new stdClass(), 'clientInfo' => ['name' => 'x', 'version' => '1']], 3, false));
        $this->assertSame('2025-06-18', $a['result']['protocolVersion']);
        $this->assertArrayHasKey('tools', $a['result']['capabilities']);
        $this->assertSame(BxDolMcpServer::SERVER_NAME, $a['result']['serverInfo']['name']);
        // the site's address and icons, for the client to draw next to its name
        $this->assertSame(BX_DOL_URL_ROOT, $a['result']['serverInfo']['websiteUrl']);
        $this->assertNotEmpty($a['result']['serverInfo']['icons']);
        foreach ($a['result']['serverInfo']['icons'] as $aIcon)
            $this->assertNotSame('', $aIcon['src']);

        $a = $this->server()->handle(self::message('initialize', ['protocolVersion' => '2024-01-01'], 4, false));
        $this->assertSame(BxDolMcpServer::INITIALIZE_VERSIONS[0], $a['result']['protocolVersion']);
    }

    public function testARequestWithoutMetaNeedsAVersionTheServerSpeaks()
    {
        $a = $this->server()->handle(self::message('tools/list', [], 5, false), '2024-01-01');
        $this->assertSame(BxDolMcpServer::MCP_UNSUPPORTED_PROTOCOL_VERSION, $a['error']['code']);

        // with one it speaks, the request goes on: a call with no name is refused as a call
        $a = $this->server()->handle(self::message('tools/call', [], 6, false), '2025-11-25');
        $this->assertSame(BxDolMcpServer::JSONRPC_INVALID_PARAMS, $a['error']['code']);
    }

    public function testDiscoveryDocuments()
    {
        $this->assertSame(BX_DOL_URL_ROOT . 'api/mcp', BxDolMcpServer::getResourceUrl());
        $this->assertStringContainsString('resource_metadata="' . BX_DOL_URL_ROOT . '.well-known/oauth-protected-resource"', BxDolMcpServer::wwwAuthenticate());
        $this->assertStringEndsWith(', error="invalid_token"', BxDolMcpServer::wwwAuthenticate('invalid_token'));

        $a = BxDolMcpServer::getProtectedResourceMetadata();
        $this->assertSame(BxDolMcpServer::getResourceUrl(), $a['resource']);
        $this->assertSame([BxDolApiV2Auth::SCOPE], $a['scopes_supported']);
        $this->assertSame(BxDolMcpServer::getIssuer() !== null ? [BxDolMcpServer::getIssuer()] : [], $a['authorization_servers']);
    }

    public function testOtherProtocolVersionIsRefused()
    {
        $o = self::message('tools/list');
        $o->params->_meta->{'io.modelcontextprotocol/protocolVersion'} = '2024-11-05';
        $a = $this->server()->handle($o);
        $this->assertSame(BxDolMcpServer::MCP_UNSUPPORTED_PROTOCOL_VERSION, $a['error']['code']);
        $this->assertSame([BxDolMcpServer::PROTOCOL_VERSION], $a['error']['data']['supported']);
        $this->assertSame('2024-11-05', $a['error']['data']['requested']);
    }

    public function testUnknownMethodIsNotFound()
    {
        $a = $this->server()->handle(self::message('resources/list'));
        $this->assertSame(BxDolMcpServer::JSONRPC_METHOD_NOT_FOUND, $a['error']['code']);
    }

    public function testToolCallNeedsAName()
    {
        $a = $this->server()->handle(self::message('tools/call', ['arguments' => new stdClass()]));
        $this->assertSame(BxDolMcpServer::JSONRPC_INVALID_PARAMS, $a['error']['code']);
    }

    public function testTheToolsCodeDecidesWhetherItIsForMcp()
    {
        // tools of the AI library, by type: MySQL Write never
        $this->assertFalse(BxDolAIToolFactory::isMcpAllowed(['type' => 'mysql_write', 'class_name' => '']));
        foreach (['mysql_select', 'mysql_schema', 'tavily_web_search'] as $sType)
            $this->assertTrue(BxDolAIToolFactory::isMcpAllowed(['type' => $sType, 'class_name' => '']), $sType);

        // UNA tools, by their class: those that work only in an agent's chat never
        foreach (['BxDolAIToolChatButtons', 'BxDolAIToolChatTitle', 'BxDolAIToolChatArtifactSave', 'BxDolAIToolChatGoalReached', 'BxDolAIToolPromptFeedback'] as $sClass)
            $this->assertFalse(BxDolAIToolFactory::isMcpAllowed(['type' => 'x', 'class_name' => $sClass]), $sClass);
        foreach (['BxDolAIToolContentGet', 'BxDolAIToolMysqlWrite', 'BxDolAIToolAgentCreate', 'BxDolAIToolSplash'] as $sClass)
            $this->assertTrue(BxDolAIToolFactory::isMcpAllowed(['type' => 'x', 'class_name' => $sClass]), $sClass);

        $this->assertFalse(BxDolAIToolFactory::isMcpAllowed(['type' => 'x', 'class_name' => 'NoSuchToolClass']));
    }

    public function testToolsGridHidesOnlyWhatEveryAgentHasInCode()
    {
        $sSource = BxDolAiAgentTools::excludeFromToolsGrid('SELECT * FROM `sys_agents_tools` WHERE 1 ');
        foreach (BxDolAiAgentTools::ALWAYS as $sType)
            $this->assertStringContainsString("'" . $sType . "'", $sSource);
        // the operator's own are listed, locked for agents
        foreach (BxDolAiAgentTools::OPERATOR as $sType)
            $this->assertStringNotContainsString("'" . $sType . "'", $sSource);
        $this->assertTrue(BxDolAiAgentTools::isOperatorOnly('agent_create'));
        $this->assertFalse(BxDolAiAgentTools::isOperatorOnly('content_get'));
    }

    public function testMemberSafeTools()
    {
        foreach (['BxDolAIToolContentStructure', 'BxDolAIToolContentSearch', 'BxDolAIToolContentGet', 'BxDolAIToolContentAdd', 'BxDolAIToolContentUpdate', 'BxDolAIToolContentDelete', 'BxDolAIToolCmtsGet', 'BxDolAIToolCmtsAdd', 'BxDolAIToolCmtsUpdate', 'BxDolAIToolCmtsDelete'] as $sClass)
            $this->assertTrue($sClass::isMemberSafe(), $sClass);
        foreach (['BxDolAIToolMysqlWrite', 'BxDolAIToolMysqlUndo', 'BxDolAIToolAgentCreate', 'BxDolAIToolSplash', 'BxDolAIToolMockup', 'BxDolAIToolEmailSend', 'BxDolAIToolCmtsGetSingle'] as $sClass)
            $this->assertFalse($sClass::isMemberSafe(), $sClass);

        // who acts is the member's, never an argument
        $this->assertSame(['profile_id'], BxDolAIToolContentAdd::memberScopedArgs());
        $this->assertSame(['profile_id'], BxDolAIToolContentUpdate::memberScopedArgs());
        $this->assertSame(['author_profile_id'], BxDolAIToolCmtsAdd::memberScopedArgs());
        $this->assertSame([], BxDolAIToolContentGet::memberScopedArgs());
    }

    public function testMemberScopeIsOffByDefault()
    {
        $this->assertSame(0, BxDolAITool::getMemberScope());
        BxDolAITool::setMemberScope(-5);
        $this->assertSame(0, BxDolAITool::getMemberScope());
    }

    public function testCommandsAndInstallLinksOfMcpClients()
    {
        // a command's name: Latin letters, digits and dashes, ending in the host
        $sName = BxDolApiTokens::getMcpServerName();
        $this->assertMatchesRegularExpression('/^[a-z0-9]+(-[a-z0-9]+)*$/', $sName);
        $this->assertStringEndsWith(BxDolApiTokens::getMcpHostName(), $sName);
        // an editor's name: the site's title and the host
        $sTitle = BxDolApiTokens::getMcpServerTitle();
        $this->assertStringEndsWith(getParam('site_title') !== '' ? '(' . BxDolApiTokens::getMcpHostName() . ')' : BxDolApiTokens::getMcpHostName(), $sTitle);

        $sUrl = BxDolApiTokens::getMcpUrl();
        $a = BxDolApiTokens::getMcpClients();
        $this->assertSame('claude mcp add --transport http ' . $sName . ' ' . $sUrl, $a['commands']['Claude Code']);
        $this->assertSame('codex mcp add ' . $sName . ' --url ' . $sUrl . ' && codex mcp login ' . $sName, $a['commands']['Codex']);

        parse_str((string)parse_url($a['links']['Cursor'], PHP_URL_QUERY), $aCursor);
        $this->assertStringStartsWith('cursor://anysphere.cursor-deeplink/mcp/install?', $a['links']['Cursor']);
        $this->assertSame($sTitle, $aCursor['name']);
        $this->assertSame(['url' => $sUrl], json_decode(base64_decode($aCursor['config']), true));

        $this->assertStringStartsWith('vscode:mcp/install?', $a['links']['VS Code']);
        $this->assertSame(['name' => $sTitle, 'type' => 'http', 'url' => $sUrl], json_decode(rawurldecode(substr($a['links']['VS Code'], strlen('vscode:mcp/install?'))), true));
    }

    public function testToolErrorShape()
    {
        $a = BxDolMcpServer::toolError('Nope', ['code' => 'forbidden']);
        $this->assertTrue($a['isError']);
        $this->assertSame('Nope', $a['content'][0]['text']);
        $this->assertSame(['code' => 'forbidden'], $a['structuredContent']);
        $this->assertArrayNotHasKey('structuredContent', BxDolMcpServer::toolError('Nope'));
    }

    public function testPersonalTokenFormat()
    {
        $this->assertTrue(BxDolApiTokens::isToken(BxDolApiTokens::PREFIX . str_repeat('a1', 20)));
        // OAuth access tokens are 40 hex characters with no prefix
        $this->assertFalse(BxDolApiTokens::isToken(str_repeat('a1', 20)));
        $this->assertFalse(BxDolApiTokens::isToken(BxDolApiTokens::PREFIX . str_repeat('a1', 19)));
        $this->assertFalse(BxDolApiTokens::isToken(BxDolApiTokens::PREFIX . str_repeat('A1', 20)));
        $this->assertFalse(BxDolApiTokens::isToken(BxDolApiTokens::PREFIX . str_repeat('a1', 20) . "\n"));
        $this->assertFalse(BxDolApiTokens::isToken(null));
        $this->assertSame(64, strlen(BxDolApiTokens::hash('x')));
    }
}
