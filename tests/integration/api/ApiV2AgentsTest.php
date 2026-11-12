<?php

use NeuronAI\Chat\Messages\AssistantMessage;
use NeuronAI\Testing\FakeAIProvider;
use PHPUnit\Framework\Attributes\Group;

/**
 * API v2 agents (BxBaseApiV2Agents): the agents a guest, a member and an administrator may chat
 * with, the viewer's chats, a chat of someone else's, the checks on a message, and a reply
 * streamed as Server-Sent Events. The agents and the model a test adds (a model on an address
 * nothing answers, so a turn over HTTP ends in RUN_ERROR) are deleted after it, with their
 * chats. A turn with a reply runs in-process on NeuronAI's FakeAIProvider (streamTo), since the
 * server process can't be given a fake model.
 */
#[Group('integration')]
class ApiV2AgentsTest extends ApiV2TestCase
{
    protected $_aAgents = [];
    protected $_iModel = 0;
    protected $_mOperator = null;

    protected function setUp(): void
    {
        parent::setUp();
        if (!BxDolDb::getInstance()->isTableExists('sys_agents_agents'))
            $this->markTestSkipped('No AI agents on this site.');
        $this->_mOperator = getParam('sys_agents_operator_agent');
    }

    protected function tearDown(): void
    {
        $oDb = BxDolDb::getInstance();
        foreach ($this->_aAgents as $iId) {
            $oDb->query("DELETE FROM `sys_agents_chat_history` WHERE `thread_id` LIKE :t", ['t' => 'manual:' . (int)$iId . ':%']);
            $oDb->query("DELETE FROM `sys_agents_agents` WHERE `id` = :id", ['id' => $iId]);
            unset($GLOBALS['bxDolClasses']['BxDolAi_Agent_' . $iId]);
        }
        if ($this->_iModel) {
            $oDb->query("DELETE FROM `sys_agents_models` WHERE `id` = :id", ['id' => $this->_iModel]);
            unset($GLOBALS['bxDolClasses']['BxDolAIModelFactory_Model_' . $this->_iModel]);
        }
        if (getParam('sys_agents_operator_agent') !== $this->_mOperator)
            setParam('sys_agents_operator_agent', (string)$this->_mOperator);
        parent::tearDown();
    }

    /** A chat model that answers nothing (port 9, discard): a turn fails at once. */
    protected function model(): int
    {
        if ($this->_iModel)
            return $this->_iModel;
        $oDb = BxDolDb::getInstance();
        $oDb->query("INSERT INTO `sys_agents_models` SET " . $oDb->arrayToSQL([
            'type' => 'openai-like', 'model' => 'apiv2-test', 'title' => 'ApiV2AgentsTest', 'icon' => '', 'docs' => '', 'key' => 'test',
            'params' => '{"baseUri": "http://127.0.0.1:9/v1", "parameters": {}}', 'params_user' => '', 'capabilities' => 'chatllm', 'duplicate' => 0, 'active' => 1, 'changed' => time(),
        ]));
        return $this->_iModel = (int)$oDb->lastId();
    }

    /** An agent the test adds, active, for these membership levels; its id. */
    protected function agent(array $aFields = []): int
    {
        $oDb = BxDolDb::getInstance();
        $oDb->query("INSERT INTO `sys_agents_agents` SET " . $oDb->arrayToSQL($aFields + [
            'name' => 'apiv2_test_' . bin2hex(random_bytes(3)), 'title' => 'ApiV2 test agent', 'description' => 'For tests', 'icon' => '',
            'model_id' => $this->model(), 'profile_id' => 0, 'acl_levels' => 2147483646,
            'prompt_system' => 'You are a test.', 'prompt_steps' => '', 'prompt_output' => '', 'prompt_tools' => '', 'tools' => '', 'tools_max_run' => 0,
            'max_turns' => 0, 'chat_ttl_min' => 0, 'limit_message' => '', 'max_input_chars' => 0, 'max_tokens' => 0, 'max_sessions_per_hour' => 0, 'max_sessions_per_day' => 0,
            'hidden_first_message' => '', 'chat_history_context' => 50000, 'vector_store_id' => 0, 'trigger' => 'manual', 'async' => 0, 'alert' => '', 'scheduler_cron' => '',
            'webhook_key' => 'apiv2-test-' . bin2hex(random_bytes(6)), 'webhook_sample' => '', 'form_object' => '', 'form_input' => '', 'agent_sample' => '', 'message_profile_id' => 0,
            'added' => time(), 'active' => 1,
        ]));
        $iId = (int)$oDb->lastId();
        $this->_aAgents[] = $iId;
        return $iId;
    }

    protected function ids(array $a): array
    {
        return array_column($a['json']['items'] ?? [], 'id');
    }

    public function testThePathsAreInTheSpec(): void
    {
        $oRouter = new BxDolApiV2Router();
        $aSpec = (new BxDolApiV2Spec($oRouter))->build();
        foreach (['/agents', '/agents/{id}/chats', '/agents/{id}/chats/{chat}', '/agents/{id}/chats/{chat}/messages'] as $sPath)
            $this->assertArrayHasKey($sPath, $aSpec['paths']);
        $this->assertArrayHasKey('text/event-stream', $aSpec['paths']['/agents/{id}/chats/{chat}/messages']['post']['responses']['200']['content']);
    }

    public function testWhoMayChatWithWhichAgent(): void
    {
        [$iViewer, $sToken] = $this->userToken();
        $aMember = ['Authorization' => 'Bearer ' . $sToken];
        $aAdmin = ['Authorization' => 'Bearer ' . $this->profileToken($this->adminProfileIdOtherThan([$iViewer]))];

        $iMembers = $this->agent();
        $iEveryone = $this->agent(['acl_levels' => 2147483647, 'max_input_chars' => 500]);
        $iAdmins = $this->agent(['acl_levels' => 0]);
        $iOff = $this->agent(['active' => 0]);
        $iAlert = $this->agent(['trigger' => 'alert']);

        $aGuest = $this->http('GET', 'agents');
        $this->assertSame(200, $aGuest['status'], $aGuest['body']);
        $this->assertSchema('AgentList', $aGuest['json']);
        $this->assertContains((string)$iEveryone, $this->ids($aGuest));
        $this->assertNotContains((string)$iMembers, $this->ids($aGuest));

        $a = $this->http('GET', 'agents', $aMember);
        $this->assertSchema('AgentList', $a['json']);
        $aIds = $this->ids($a);
        $this->assertContains((string)$iMembers, $aIds);
        $this->assertContains((string)$iEveryone, $aIds);
        foreach ([$iAdmins, $iOff, $iAlert] as $iId)
            $this->assertNotContains((string)$iId, $aIds);
        $aOne = array_column($a['json']['items'], null, 'id')[(string)$iEveryone];
        $this->assertSame(500, $aOne['max_input_chars']);
        $this->assertSame('ApiV2 test agent', $aOne['title']);

        // the operator agent is the default where the viewer may talk to it
        setParam('sys_agents_operator_agent', (string)$iEveryone);
        $a = $this->http('GET', 'agents', $aMember);
        $this->assertSame((string)$iEveryone, $a['json']['default_id']);
        $this->assertTrue(array_column($a['json']['items'], null, 'id')[(string)$iEveryone]['default']);
        setParam('sys_agents_operator_agent', (string)$iAdmins);
        $a = $this->http('GET', 'agents', $aMember);
        $this->assertNotSame((string)$iAdmins, $a['json']['default_id'], 'not one the viewer may not talk to');
        $this->assertNotNull($a['json']['default_id']);

        // administrators may talk to every one meant for people
        $aIds = $this->ids($this->http('GET', 'agents', $aAdmin));
        $this->assertContains((string)$iAdmins, $aIds);
        $this->assertNotContains((string)$iAlert, $aIds);

        // and the chats follow: 403 for an agent the viewer may not talk to, 404 for none
        $this->assertSame(403, $this->http('GET', 'agents/' . $iAdmins . '/chats', $aMember)['status']);
        $this->assertSame(200, $this->http('GET', 'agents/' . $iAdmins . '/chats', $aAdmin)['status']);
        foreach ([$iOff, $iAlert, 999999999] as $iId)
            $this->assertSame(404, $this->http('GET', 'agents/' . $iId . '/chats', $aMember)['status']);
        $this->assertSame(401, $this->http('GET', 'agents/' . $iEveryone . '/chats')['status'], 'a guest\'s chats need a sign-in');
    }

    public function testChatsAreTheViewersOwn(): void
    {
        [$iViewer, $sToken] = $this->userToken();
        $aMember = ['Authorization' => 'Bearer ' . $sToken];
        $aOther = ['Authorization' => 'Bearer ' . $this->profileToken($this->ordinaryProfileIdOtherThan([$iViewer]))];
        $iAgent = $this->agent();

        $a = $this->http('POST', 'agents/' . $iAgent . '/chats', $aMember + ['Content-Type' => 'application/json'], '{}');
        $this->assertSame(201, $a['status'], $a['body']);
        $this->assertSchema('AgentChat', $a['json']);
        $sChat = $a['json']['id'];
        $this->assertMatchesRegularExpression('/^[a-f0-9]{16}$/', $sChat);
        $this->assertSame('open', $a['json']['status']);
        $this->assertStringEndsWith('/agents/' . $iAgent . '/chats/' . $sChat, (string)BxDolTestPhpServer::header($a, 'location'));

        $aList = $this->http('GET', 'agents/' . $iAgent . '/chats', $aMember);
        $this->assertSchema('AgentChatList', $aList['json']);
        $this->assertContains($sChat, $this->ids($aList));
        $a = $this->http('GET', 'agents/' . $iAgent . '/chats/' . $sChat, $aMember);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('AgentChatThread', $a['json']);
        $this->assertSame([], $a['json']['messages']);
        // the default chat is there before its first message
        $this->assertSame(200, $this->http('GET', 'agents/' . $iAgent . '/chats/default', $aMember)['status']);

        // someone else: not in their list, and not theirs to read
        $this->assertNotContains($sChat, $this->ids($this->http('GET', 'agents/' . $iAgent . '/chats', $aOther)));
        $this->assertSame(404, $this->http('GET', 'agents/' . $iAgent . '/chats/' . $sChat, $aOther)['status']);
        // no chat of that form (the path's pattern), or none of this viewer's
        $this->assertSame(404, $this->http('GET', 'agents/' . $iAgent . '/chats/short', $aMember)['status']);
        $this->assertSame(404, $this->http('GET', 'agents/' . $iAgent . '/chats/nochatnochat', $aMember)['status']);
    }

    public function testAMessageIsCheckedAndTheReplyStreams(): void
    {
        [, $sToken] = $this->userToken();
        $aMember = ['Authorization' => 'Bearer ' . $sToken, 'Content-Type' => 'application/json'];
        $iAgent = $this->agent(['max_input_chars' => 10]);
        $iAdmins = $this->agent(['acl_levels' => 0]);
        $sPath = 'agents/' . $iAgent . '/chats/default/messages';

        $this->assertSame(422, $this->http('POST', $sPath, $aMember, '{"text":"   "}')['status']);
        $this->assertSame(422, $this->http('POST', $sPath, $aMember, '{"text":"far more than ten"}')['status']);
        $this->assertSame(422, $this->http('POST', $sPath, $aMember, '{}')['status']);
        $this->assertSame(403, $this->http('POST', 'agents/' . $iAdmins . '/chats/default/messages', $aMember, '{"text":"Hi"}')['status']);
        $this->assertSame(401, $this->http('POST', $sPath, ['Content-Type' => 'application/json'], '{"text":"Hi"}')['status']);

        // the model answers nothing here: the run starts and ends in an error, as events
        $a = $this->http('POST', $sPath, $aMember, '{"text":"Hi"}');
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertStringStartsWith('text/event-stream', (string)BxDolTestPhpServer::header($a, 'content-type'));
        $this->assertEmpty(BxDolTestPhpServer::header($a, 'etag'), 'a stream has no ETag');
        $aTypes = [];
        foreach (preg_split('/\n\n+/', trim($a['body'])) as $sFrame) {
            $this->assertStringStartsWith('data: ', $sFrame);
            $aEvent = json_decode(substr($sFrame, 6), true);
            $this->assertIsArray($aEvent);
            $this->assertSchema('AgentEvent', $aEvent);
            $aTypes[] = $aEvent['type'];
        }
        $this->assertSame('RUN_STARTED', $aTypes[0]);
        $this->assertSame('RUN_ERROR', end($aTypes));
    }

    public function testAReplyIsStreamedAndKept(): void
    {
        [$iViewer] = $this->userToken();
        $iAgent = $this->agent();
        $iModel = $this->model();
        // the agent's model, as the factory keeps it for the request: a fake that says this
        $GLOBALS['bxDolClasses']['BxDolAIModelFactory_Model_' . $iModel] = new FakeAIProvider(new AssistantMessage('Hello **there**, how can I help?'));

        $mBefore = $GLOBALS['glForceCurrentProfileId'] ?? null;
        $GLOBALS['glForceCurrentProfileId'] = $iViewer;
        $_GET['chat'] = 'apiv2testchat01';
        try {
            $aAgent = BxDolAiQuery::getAgentObject($iAgent);
            $aParams = BxDolAiChat::getInstance()->resolveChatHistoryParams($iAgent);
            $aParams['chat_history_context_pid'] = 0;
            $sThread = BxDolAiChat::threadId($aAgent, $aParams);
            $this->assertSame('manual:' . $iAgent . ':' . $iViewer . '#apiv2testchat01', $sThread);

            $aFrames = [];
            (new BxDolAiTriggerChat())->streamTo($iAgent, 'Hi agent', $aParams, $sThread, function ($s) use (&$aFrames) {
                $aFrames[] = $s;
            });
            $sAll = implode('', $aFrames);
            $aEvents = [];
            foreach (preg_split('/\n\n+/', trim($sAll)) as $sFrame)
                if (str_starts_with($sFrame, 'data: '))
                    $aEvents[] = json_decode(substr($sFrame, 6), true);
            $aTypes = array_column($aEvents, 'type');
            $this->assertSame('RUN_STARTED', $aTypes[0]);
            $this->assertContains('TEXT_MESSAGE_CONTENT', $aTypes);
            $this->assertSame('RUN_FINISHED', end($aTypes));
            $sReply = implode('', array_column(array_filter($aEvents, fn ($e) => $e['type'] === 'TEXT_MESSAGE_CONTENT'), 'delta'));
            $this->assertSame('Hello **there**, how can I help?', $sReply);

            // the chat keeps both, and the API reads them back, the reply as HTML too
            $aUi = BxDolAiChat::getInstance()->getChatHistoryUiMessagesByThread($aAgent, $sThread);
            $this->assertSame(['user', 'assistant'], array_column($aUi, 'role'));
        }
        finally {
            unset($_GET['chat']);
            $GLOBALS['glForceCurrentProfileId'] = $mBefore;
        }

        [, $sToken] = $this->userToken();
        $a = $this->http('GET', 'agents/' . $iAgent . '/chats/apiv2testchat01', ['Authorization' => 'Bearer ' . $sToken]);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('AgentChatThread', $a['json']);
        $this->assertSame(['user', 'assistant'], array_column($a['json']['messages'], 'role'));
        $this->assertSame('Hi agent', $a['json']['messages'][0]['text']);
        $this->assertSame('<p>Hello <strong>there</strong>, how can I help?</p>', $a['json']['messages'][1]['html']);
        $this->assertSame('Hi agent', $a['json']['chat']['title']);
        $this->assertSame(2, $a['json']['chat']['messages_count']);
    }

    public function testQueriesAreBounded(): void
    {
        for ($i = 0; $i < 4; $i++)
            $this->agent();

        // the listing reads the agents once, whatever their number
        $oDb = BxDolDb::getInstance();
        $fQueries = fn() => (int)$oDb->getRow("SHOW SESSION STATUS LIKE 'Questions'")['Value'];
        $oEndpoint = new BxBaseApiV2Agents();
        $oRequest = new BxDolApiV2Request('GET', [], [], null, [], new BxDolApiV2Auth());
        $oEndpoint->listAgents($oRequest);
        $iBefore = $fQueries();
        $oEndpoint->listAgents($oRequest);
        // the count's own SHOW STATUS is one
        $this->assertLessThanOrEqual(3, $fQueries() - $iBefore - 1);
    }
}
