<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * A profile's card in the apps follows a connection change without its list being asked for again:
 * - the reply to a friend or follow action (`system/perform/TemplServiceConnections`) carries the profile's new
 *   counts (`counts`: friends_count, followers_count), as the card shows them;
 * - `system/get_card_state/TemplServiceConnections` gives one profile's counts and the state of its friend and follow
 *   buttons, for a change made somewhere else (another tab or device, the other person);
 * - the sockets event of a removed connection names both profiles, as the one of an added connection does.
 * Nothing is sent to a guest, about the viewer's own profile, for another kind of connection, or when cards have no
 * counts (`sys_api_conn_in_prof_units`).
 *
 * The other person is any active one that isn't the test admin's; a site without one skips those cases. The follow
 * the test makes is undone (or the one it removes is made again).
 */
#[Group('integration')]
class ConnectionCardStateTest extends BxDolIntegrationTestCase
{
    protected const FOLLOW = 'sys_profiles_subscriptions';
    protected const OPTION = 'sys_api_conn_in_prof_units';

    protected $_aGetBackup;
    protected $_sOptionBackup;

    protected function setUp(): void
    {
        parent::setUp();

        // the connection's element is built for the apps only: it reads bx_is_api() when asked
        $this->_aGetBackup = $_GET;
        $_GET['api'] = 1;

        $this->_sOptionBackup = getParam(self::OPTION);
        setParam(self::OPTION, 'on');
    }

    protected function tearDown(): void
    {
        setParam(self::OPTION, $this->_sOptionBackup);
        $_GET = $this->_aGetBackup ?? [];

        parent::tearDown();
    }

    /** The logged in admin's profile and another active person: [viewer, other], other is null without one. */
    protected function viewerAndOther(): array
    {
        $this->bxLoginAsAdmin();

        $iViewer = (int)bx_get_logged_profile_id();
        $this->assertGreaterThan(0, $iViewer, 'The test admin has no profile.');

        $iOther = (int)BxDolDb::getInstance()->getOne("SELECT `id` FROM `sys_profiles` WHERE `type` = 'bx_persons' AND `status` = 'active' AND `id` <> :id ORDER BY `id` DESC LIMIT 1", ['id' => $iViewer]);

        return [$iViewer, $iOther ?: null];
    }

    protected function perform(string $sAction, int $iViewer, int $iOther, string $sReply = 'object')
    {
        return bx_srv('system', 'perform', [['o' => self::FOLLOW, 'a' => $sAction, 'iid' => $iViewer, 'cid' => $iOther, 'r' => $sReply]], 'TemplServiceConnections');
    }

    public function testFollowReplyCarriesTheNewCounts(): void
    {
        if(!BxDolModuleQuery::getInstance()->isEnabledByName('bx_persons'))
            $this->markTestSkipped('Persons is not installed.');

        list($iViewer, $iOther) = $this->viewerAndOther();
        if(!$iOther)
            $this->markTestSkipped('The site has no other person.');

        $oConnection = BxDolConnection::getObjectInstance(self::FOLLOW);
        $bFollows = (bool)$oConnection->isConnected($iViewer, $iOther);
        $iBefore = (int)$oConnection->getConnectedInitiatorsCount($iOther);

        // change it, then put it back
        $sFirst = $bFollows ? 'remove' : 'add';
        $sBack = $bFollows ? 'add' : 'remove';
        $iChanged = $iBefore + ($bFollows ? -1 : 1);

        try {
            $aReply = $this->perform($sFirst, $iViewer, $iOther);

            $this->assertIsArray($aReply);
            $this->assertSame('connections_ext', $aReply['type'] ?? null, 'The button\'s new state comes as before.');
            $this->assertArrayHasKey('counts', $aReply);
            $this->assertSame($iOther, $aReply['counts']['profile_id']);
            $this->assertSame($iChanged, $aReply['counts']['followers_count']);
            $this->assertIsInt($aReply['counts']['friends_count']);
        }
        finally {
            $aReply = $this->perform($sBack, $iViewer, $iOther, '');
        }

        // the plain reply (one action's button) carries them too
        $this->assertArrayHasKey('a', $aReply);
        $this->assertSame($iBefore, $aReply['counts']['followers_count']);
        $this->assertSame($bFollows, (bool)$oConnection->isConnected($iViewer, $iOther), 'The connection is as it was.');
    }

    public function testNoCountsWhenCardsHaveNone(): void
    {
        list($iViewer, $iOther) = $this->viewerAndOther();
        if(!$iOther)
            $this->markTestSkipped('The site has no other person.');

        $oService = new BxBaseServiceConnections();
        $oMethod = new ReflectionMethod(BxBaseServiceConnections::class, '_getCardCounts');

        $this->assertArrayHasKey('followers_count', $oMethod->invoke($oService, self::FOLLOW, $iOther));
        $this->assertSame([], $oMethod->invoke($oService, 'sys_profiles_relations', $iOther), 'Another kind of connection changes no count of the card.');
        $this->assertSame([], $oMethod->invoke($oService, self::FOLLOW, 0));

        setParam(self::OPTION, '');
        $this->assertSame([], $oMethod->invoke($oService, self::FOLLOW, $iOther), 'Cards without counts: nothing to update.');
    }

    public function testCardStateOfAnotherProfile(): void
    {
        if(!BxDolModuleQuery::getInstance()->isEnabledByName('bx_persons'))
            $this->markTestSkipped('Persons is not installed.');

        list($iViewer, $iOther) = $this->viewerAndOther();
        if(!$iOther)
            $this->markTestSkipped('The site has no other person.');

        $aState = bx_srv('system', 'get_card_state', [['cid' => $iOther]], 'TemplServiceConnections');

        $this->assertSame($iOther, $aState['profile_id']);
        $this->assertSame($iOther, $aState['counts']['profile_id']);
        $this->assertIsInt($aState['counts']['friends_count']);
        $this->assertIsInt($aState['counts']['followers_count']);

        $this->assertArrayHasKey(self::FOLLOW, $aState['elements']);
        $aElement = $aState['elements'][self::FOLLOW];
        $this->assertSame('connections_ext', $aElement['type']);
        $this->assertSame($iViewer, (int)$aElement['iid']);
        $this->assertSame($iOther, (int)$aElement['cid']);
        $this->assertNotSame('', (string)$aElement['title']);

        // as a JSON string, the way api.php passes params[]
        $this->assertSame($iOther, bx_srv('system', 'get_card_state', [json_encode(['cid' => $iOther])], 'TemplServiceConnections')['profile_id']);
    }

    public function testCardStateIsForMembersAndOtherProfilesOnly(): void
    {
        list($iViewer, $iOther) = $this->viewerAndOther();

        $this->assertSame(['code' => 1], bx_srv('system', 'get_card_state', [['cid' => $iViewer]], 'TemplServiceConnections'), 'The viewer\'s own card has no buttons.');
        $this->assertSame(['code' => 1], bx_srv('system', 'get_card_state', [[]], 'TemplServiceConnections'));
        $this->assertSame(['code' => 2], bx_srv('system', 'get_card_state', [['cid' => 2147483000]], 'TemplServiceConnections'), 'No such profile.');

        $this->bxBecomeGuest();
        $this->assertSame(['code' => 1], bx_srv('system', 'get_card_state', [['cid' => $iOther ?: $iViewer]], 'TemplServiceConnections'), 'Nothing for a guest.');
    }

    public function testTheAppsMayCallIt(): void
    {
        $this->assertTrue((bool)bx_srv('system', 'is_safe_service', ['get_card_state'], 'TemplServices'));
        $this->assertTrue((bool)bx_srv('system', 'is_safe_service', ['perform'], 'TemplServices'));
    }

    public function testRemovedConnectionEventNamesBothProfiles(): void
    {
        $sSource = file_get_contents(BX_DIRECTORY_PATH_INC . 'classes/BxDolConnection.php');

        $iRemoved = strpos($sSource, 'public function onRemoved(');
        $this->assertNotFalse($iRemoved);

        $sRemoved = substr($sSource, $iRemoved, 900);
        $this->assertStringContainsString("'action' => 'deleted'", $sRemoved);
        $this->assertStringContainsString("'initiator' => \$iInitiator", $sRemoved);
        $this->assertStringContainsString("'content' => \$iContent", $sRemoved);
    }
}
