<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

require_once __DIR__ . '/ApiV2TestCase.php';

/**
 * GET /realtime: where an app listens for the site's live events (a Pusher-protocol sockets
 * server, Soketi), and Item.live, the channel of an item's comments.
 *
 * The sockets options are set for each test and put back after it. The server they name
 * refuses connections at once (127.0.0.1:9), so the events the site sends while a test posts
 * fail fast, as on a site whose sockets server is down.
 */
class ApiV2RealtimeTest extends ApiV2TestCase
{
    const OPTIONS = ['sys_sockets_type', 'sys_sockets_url', 'sys_sockets_app_id', 'sys_sockets_key', 'sys_sockets_secret'];

    protected $_aSockets = [];
    protected $_aEvents = [];

    protected function setUp(): void
    {
        parent::setUp();
        foreach (self::OPTIONS as $sName)
            $this->_aSockets[$sName] = (string)getParam($sName);
    }

    protected function tearDown(): void
    {
        if ($this->_aEvents && BxDolModuleQuery::getInstance()->isEnabledByName('bx_timeline')) {
            $oTimeline = BxDolModule::getInstance('bx_timeline');
            foreach ($this->_aEvents as $iId)
                if (($aEvent = $oTimeline->_oDb->getEvents(['browse' => 'id', 'value' => $iId])))
                    $oTimeline->deleteEvent($aEvent);
        }
        foreach ($this->_aSockets as $sName => $sValue)
            if ((string)getParam($sName) !== $sValue)
                setParam($sName, $sValue);
        unset($GLOBALS['bxDolClasses']['BxDolSockets']);
        parent::tearDown();
    }

    protected function sockets(string $sType, string $sUrl = 'http://127.0.0.1:9', string $sKey = 'desktop-key'): void
    {
        setParam('sys_sockets_type', $sType);
        setParam('sys_sockets_url', $sUrl);
        setParam('sys_sockets_app_id', '1');
        setParam('sys_sockets_key', $sKey);
        setParam('sys_sockets_secret', 'not-for-clients');
        unset($GLOBALS['bxDolClasses']['BxDolSockets']);
    }

    public function testASiteWithoutASocketsServerSaysSo(): void
    {
        $this->sockets('sys_sockets_disabled');
        $a = $this->http('GET', 'realtime');
        $this->assertSame(200, $a['status']);
        $this->assertSame(['enabled' => false, 'url' => null, 'key' => null, 'channels' => []], $a['json']);
        $this->assertSchema('Realtime', $a['json']);

        // Soketi chosen but no server named: the same
        $this->sockets('sys_sockets_soketi', '');
        $this->assertFalse($this->http('GET', 'realtime')['json']['enabled']);
    }

    public function testTheServerAndChannelsComeWithoutTheSecret(): void
    {
        $this->requireModule('bx_timeline');
        $this->sockets('sys_sockets_soketi', 'http://sockets.example:6001', 'k/ey');

        $a = $this->http('GET', 'realtime');
        $this->assertSame(200, $a['status']);
        $this->assertSchema('Realtime', $a['json']);
        $this->assertTrue($a['json']['enabled']);
        $this->assertSame('ws://sockets.example:6001/app/k%2Fey?protocol=7&client=una-api-v2&version=1', $a['json']['url']);
        $this->assertSame('k/ey', $a['json']['key']);
        $this->assertSame('bx_timeline_0', $a['json']['channels']['activities'] ?? null, "the Timeline's channel, as BxTimelineModule sends to");
        $this->assertArrayNotHasKey('connections', $a['json']['channels'], 'a guest has no connections');
        $this->assertStringNotContainsString('not-for-clients', $a['body'], 'the secret never leaves the site');

        list($iProfileId, $sToken) = $this->userToken();
        $a = $this->http('GET', 'realtime', ['Authorization' => 'Bearer ' . $sToken]);
        $this->assertSame('sys_connections_' . $iProfileId, $a['json']['channels']['connections'] ?? null, 'the channel BxDolConnection sends the viewer\'s changes to');

        $this->sockets('sys_sockets_soketi', 'https://sockets.example', 'key');
        $this->assertSame('wss://sockets.example/app/key?protocol=7&client=una-api-v2&version=1', $this->http('GET', 'realtime')['json']['url'], 'https is wss, on its own port');
    }

    public function testAnItemNamesItsCommentsChannelWhileThereIsASocketsServer(): void
    {
        $this->requireModule('bx_timeline');
        list(, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken, 'Content-Type' => 'application/json'];

        $this->sockets('sys_sockets_soketi');
        $a = $this->http('POST', 'feed-posts', $aAuth, json_encode(['body_html' => '<p>ApiV2RealtimeTest</p>', 'audience' => 'public']));
        $this->assertSame(201, $a['status'], $a['body']);
        $sId = $a['json']['id'];
        $this->_aEvents[] = (int)$sId;

        $aItem = $this->http('GET', 'activities/' . $sId, $aAuth)['json']['object'] ?? null;
        $this->assertSame(['comments' => 'cmts_bx_timeline_' . $sId], $aItem['live'] ?? null, 'the channel BxDolCmts sends this item\'s comments to');
        $this->assertSchema('Item', $aItem);

        $this->sockets('sys_sockets_disabled');
        $aItem = $this->http('GET', 'activities/' . $sId, $aAuth)['json']['object'] ?? null;
        $this->assertArrayHasKey('live', $aItem);
        $this->assertNull($aItem['live'], 'no channel without a sockets server');
    }
}
