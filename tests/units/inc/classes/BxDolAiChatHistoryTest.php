<?php
/**
 * The NeuronAI message store on top of `sys_agents_chat_history`.
 */
class BxDolAiChatHistoryTest extends BxDolTestCase
{
    protected const THREAD = 'test:chat_history_store:1';

    protected $_oDb;

    protected function setUp(): void
    {
        if (!BxDolDb::getInstance()->isTableExists('sys_agents_chat_history'))
            $this->markTestSkipped('Agents are not installed');

        $this->_oDb = new BxDolAiQuery();
        $this->_oDb->deleteChatHistoryByThreadId(self::THREAD);
    }

    protected function tearDown(): void
    {
        if ($this->_oDb)
            $this->_oDb->deleteChatHistoryByThreadId(self::THREAD);
    }

    public function testAppendKeepsOrderAndIsIdempotent()
    {
        $o = new BxDolAiChatHistory();
        $oUser = new NeuronAI\Chat\Messages\UserMessage('hello');
        $oBot = new NeuronAI\Chat\Messages\AssistantMessage('hi there');

        $o->append(self::THREAD, $oUser);
        $o->append(self::THREAD, $oBot);
        $o->append(self::THREAD, $oUser);

        $a = $o->loadActive(self::THREAD);
        $this->assertCount(2, $a);
        $this->assertSame($oUser->getId(), $a[0]->getId());
        $this->assertSame('hello', $a[0]->getContent());
        $this->assertSame('assistant', $a[1]->getRole());
        $this->assertSame('hi there', $a[1]->getContent());
    }

    public function testToolCallsSurviveStorage()
    {
        $o = new BxDolAiChatHistory();
        $oCall = new NeuronAI\Tools\ToolCall('content_search', 'call_1', ['keyword' => 'cats']);
        $o->append(self::THREAD, new NeuronAI\Chat\Messages\ToolCallMessage(tools: [$oCall]));
        $o->append(self::THREAD, new NeuronAI\Chat\Messages\ToolResultMessage([(clone $oCall)->setResult('found')]));

        $a = $o->loadActive(self::THREAD);
        $this->assertCount(2, $a);
        $this->assertInstanceOf(NeuronAI\Chat\Messages\ToolCallMessage::class, $a[0]);
        $this->assertSame(['keyword' => 'cats'], $a[0]->getToolCalls()[0]->getInputs());
        $this->assertInstanceOf(NeuronAI\Chat\Messages\ToolResultMessage::class, $a[1]);
        $this->assertSame('found', (string)$a[1]->getToolCalls()[0]->getResult());
    }

    public function testArchiveDropsTheOldestMessages()
    {
        $o = new BxDolAiChatHistory();
        foreach (['one', 'two', 'three'] as $s)
            $o->append(self::THREAD, new NeuronAI\Chat\Messages\UserMessage($s));

        $o->archive(self::THREAD, 2);

        $a = $o->loadActive(self::THREAD);
        $this->assertCount(1, $a);
        $this->assertSame('three', $a[0]->getContent());
    }

    public function testReplaceStoresChangedMessage()
    {
        $o = new BxDolAiChatHistory();
        $oBot = new NeuronAI\Chat\Messages\AssistantMessage('pick one');
        $o->append(self::THREAD, $oBot);

        $oBot->addMetadata('actions', [['label' => 'Yes']]);
        $this->assertTrue($o->replace(self::THREAD, $oBot));
        $this->assertFalse($o->replace(self::THREAD, new NeuronAI\Chat\Messages\AssistantMessage('unknown')));

        $a = $o->loadActive(self::THREAD);
        $this->assertCount(1, $a);
        $this->assertSame([['label' => 'Yes']], $a[0]->getMetadata('actions'));
    }

    public function testLoadAllWindow()
    {
        $o = new BxDolAiChatHistory();
        $aIds = [];
        foreach (['a', 'b', 'c', 'd'] as $s) {
            $oMessage = new NeuronAI\Chat\Messages\UserMessage($s);
            $aIds[] = $oMessage->getId();
            $o->append(self::THREAD, $oMessage);
        }

        $this->assertCount(4, $o->loadAll(self::THREAD));
        $this->assertSame(['c', 'd'], array_map(fn ($m) => $m->getContent(), $o->loadAll(self::THREAD, 2)));
        $this->assertSame(['b'], array_map(fn ($m) => $m->getContent(), $o->loadAll(self::THREAD, 1, $aIds[2])));
        $this->assertSame([], $o->loadAll(self::THREAD, 1, 'unknown'));
    }

    public function testMessagesStoredByNeuron3AreRead()
    {
        $sJson = json_encode([
            ['role' => 'user', 'content' => [['type' => 'text', 'content' => 'old question']]],
            ['role' => 'assistant', 'content' => [['type' => 'text', 'content' => 'old answer']], 'actions' => [['label' => 'Ok']]],
        ]);
        $this->_oDb->setChatHistoryMessagesByThreadId(self::THREAD, $sJson);

        $o = new BxDolAiChatHistory();
        $a = $o->loadActive(self::THREAD);
        $this->assertCount(2, $a);
        $this->assertSame('old question', $a[0]->getContent());
        $this->assertSame([['label' => 'Ok']], $a[1]->getMetadata('actions'));

        // the identity of a legacy message is stable, so it can be found again
        $this->assertSame($a[1]->getId(), $o->loadActive(self::THREAD)[1]->getId());
        $this->assertTrue($o->replace(self::THREAD, $a[1]));
    }

    /**
     * Tool calls and results exactly as NeuronAI 3.x serialized them: empty content,
     * a full tool record (schema `parameters`, `result` null for a call), no `__id`.
     */
    public function testToolMessagesStoredByNeuron3AreRead()
    {
        $aSchema = ['type' => 'object', 'properties' => ['keyword' => ['type' => 'string']]];
        $sJson = json_encode([
            ['role' => 'user', 'content' => [['type' => 'text', 'content' => 'find cats and dogs']]],
            [
                'role' => 'assistant',
                'content' => [['type' => 'text', 'content' => 'Let me look']],
                'type' => 'tool_call',
                'tools' => [
                    ['callId' => 'call_a', 'name' => 'content_search', 'description' => 'Search', 'parameters' => $aSchema, 'inputs' => ['keyword' => 'cats'], 'result' => null],
                    ['callId' => 'call_b', 'name' => 'profile_get', 'description' => null, 'parameters' => [], 'inputs' => new stdClass(), 'result' => null],
                ],
            ],
            [
                'role' => 'user',
                'content' => [],
                'type' => 'tool_call_result',
                'tools' => [
                    ['callId' => 'call_a', 'name' => 'content_search', 'description' => 'Search', 'parameters' => $aSchema, 'inputs' => ['keyword' => 'cats'], 'result' => '[{"id":1}]'],
                    ['callId' => 'call_b', 'name' => 'profile_get', 'description' => null, 'parameters' => [], 'inputs' => new stdClass(), 'result' => 'no profile'],
                ],
            ],
            ['role' => 'assistant', 'content' => [['type' => 'text', 'content' => 'Found one']]],
        ]);
        $this->_oDb->setChatHistoryMessagesByThreadId(self::THREAD, $sJson);

        $o = new BxDolAiChatHistory();
        $a = $o->loadActive(self::THREAD);

        // nothing is dropped and the order is kept
        $this->assertCount(4, $a);
        $this->assertSame('find cats and dogs', $a[0]->getContent());
        $this->assertInstanceOf(NeuronAI\Chat\Messages\ToolCallMessage::class, $a[1]);
        $this->assertInstanceOf(NeuronAI\Chat\Messages\ToolResultMessage::class, $a[2]);
        $this->assertSame('Found one', $a[3]->getContent());

        $aCalls = $a[1]->getToolCalls();
        $this->assertCount(2, $aCalls);
        $this->assertSame('Let me look', $a[1]->getContent());
        $this->assertSame(['content_search', 'profile_get'], array_map(fn ($c) => $c->getName(), $aCalls));
        $this->assertSame(['call_a', 'call_b'], array_map(fn ($c) => $c->getCallId(), $aCalls));
        $this->assertSame(['keyword' => 'cats'], $aCalls[0]->getInputs());
        $this->assertSame([], $aCalls[1]->getInputs());

        $aResults = $a[2]->getToolCalls();
        $this->assertCount(2, $aResults);
        $this->assertSame(['content_search', 'profile_get'], array_map(fn ($c) => $c->getName(), $aResults));
        $this->assertSame(['call_a', 'call_b'], array_map(fn ($c) => $c->getCallId(), $aResults));
        $this->assertSame(['keyword' => 'cats'], $aResults[0]->getInputs());
        $this->assertSame([], $aResults[1]->getInputs());
        $this->assertSame('[{"id":1}]', (string)$aResults[0]->getResult());
        $this->assertSame('no profile', (string)$aResults[1]->getResult());

        // appending to an old thread rewrites it: the old tool messages must come back unchanged
        $o->append(self::THREAD, new NeuronAI\Chat\Messages\UserMessage('thanks'));
        $aAfter = $o->loadActive(self::THREAD);
        $this->assertCount(5, $aAfter);
        $this->assertSame(array_map(fn ($m) => $m->getId(), $a), array_map(fn ($m) => $m->getId(), array_slice($aAfter, 0, 4)));
        $this->assertSame('call_b', $aAfter[2]->getToolCalls()[1]->getCallId());
        $this->assertSame('no profile', (string)$aAfter[2]->getToolCalls()[1]->getResult());
        $this->assertSame('thanks', $aAfter[4]->getContent());
    }

    public function testClearRemovesTheThread()
    {
        $o = new BxDolAiChatHistory();
        $o->append(self::THREAD, new NeuronAI\Chat\Messages\UserMessage('hello'));
        $o->clear(self::THREAD);

        $this->assertSame([], $o->loadActive(self::THREAD));
        $this->assertSame(0, $this->_oDb->getChatHistoryIdByThreadId(self::THREAD));
    }
}
