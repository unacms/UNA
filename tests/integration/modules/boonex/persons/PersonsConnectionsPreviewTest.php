<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * A profile's friends and followers share one group of avatars (BxBaseModProfileModule::getConnectionsPreviewIds),
 * drawn before their counts on a card and on the profile's page: a friend is usually a follower too, so a group per
 * count showed the same faces twice. The friends the viewer shares with the profile come first, then its friends,
 * then its followers, each once; the viewer and the profile itself are left out. A site with friends or followers
 * off takes the other alone. The apps merge the lists they get the same way (NEO: lib/profile-connections.ts).
 *
 * The connections are stand-ins, so the test needs no particular members.
 */
#[Group('integration')]
class PersonsConnectionsPreviewTest extends BxDolIntegrationTestCase
{
    protected const PROFILE = 900001;

    protected $_aBackup = [];
    protected $_mixedViewerBackup = null;
    protected $_iViewerId = 0;

    protected function setUp(): void
    {
        parent::setUp();

        if(!BxDolModuleQuery::getInstance()->isEnabledByName('bx_persons'))
            $this->markTestSkipped('Persons is not installed.');

        $this->_iViewerId = (int)BxDolProfileQuery::getInstance()->getCurrentProfileByAccount($this->bxAccount('admin')->id());

        // make sure the real objects are there, then keep them
        foreach(['sys_profiles_friends', 'sys_profiles_subscriptions'] as $sObject) {
            BxDolConnection::getObjectInstance($sObject);
            $this->_aBackup[$sObject] = $GLOBALS['bxDolClasses']['BxTemplConnection!' . $sObject] ?? null;
        }
    }

    protected function tearDown(): void
    {
        foreach($this->_aBackup as $sObject => $oConnection) {
            if($oConnection === null)
                unset($GLOBALS['bxDolClasses']['BxTemplConnection!' . $sObject]);
            else
                $GLOBALS['bxDolClasses']['BxTemplConnection!' . $sObject] = $oConnection;
        }

        parent::tearDown();
    }

    /** Stand-ins for the two connections: the profile's mutual friends with the viewer, its friends, its followers. */
    protected function connections(array $aMutual, array $aFriends, array $aFollowers): void
    {
        $GLOBALS['bxDolClasses']['BxTemplConnection!sys_profiles_friends'] = new class($aMutual, $aFriends) {
            public function __construct(public array $aMutual, public array $aFriends) {}
            public function getCommonContent($iInitiator1, $iInitiator2, $isMutual = false, $iStart = 0, $iLimit = 0) { return array_slice($this->aMutual, $iStart, $iLimit); }
            public function getConnectedContent($iInitiator, $isMutual = false, $iStart = 0, $iLimit = 0) { return array_slice($this->aFriends, $iStart, $iLimit); }
        };
        $GLOBALS['bxDolClasses']['BxTemplConnection!sys_profiles_subscriptions'] = new class($aFollowers) {
            public function __construct(public array $aFollowers) {}
            public function getConnectedInitiators($iContent, $isMutual = false, $iStart = 0, $iLimit = 0) { return array_slice($this->aFollowers, $iStart, $iLimit); }
        };
    }

    protected function ids(bool $bFriends = true, bool $bFollowers = true, int $iMax = 3): array
    {
        return BxDolModule::getInstance('bx_persons')->getConnectionsPreviewIds(self::PROFILE, $bFriends, $bFollowers, $iMax);
    }

    public function testFriendsAndFollowersMakeOneGroupEachPersonOnce(): void
    {
        $this->bxBecomeGuest();
        $this->connections([], [11, 12], [11, 12, 13]);

        $this->assertSame([11, 12, 13], $this->ids());
    }

    public function testMutualFriendsComeFirstThenFriendsThenFollowers(): void
    {
        $this->bxLoginAsAdmin();
        $this->connections([14], [11, 14], [12, 13]);

        $this->assertSame([14, 11, 12], $this->ids());
    }

    public function testViewerAndTheProfileItselfAreLeftOut(): void
    {
        $this->assertGreaterThan(0, $this->_iViewerId, 'The test admin has no profile.');

        $this->bxLoginAsAdmin();
        $this->connections([], [$this->_iViewerId, 11], [self::PROFILE, $this->_iViewerId, 12, 13]);

        $this->assertSame([11, 12, 13], $this->ids());
    }

    public function testGuestHasNoMutualFriends(): void
    {
        $this->bxBecomeGuest();
        $this->connections([99], [11], [12]);

        $this->assertSame([11, 12], $this->ids());
    }

    public function testOneOfTheTwoAlone(): void
    {
        $this->bxBecomeGuest();
        $this->connections([], [11, 12], [13, 14]);

        $this->assertSame([13, 14], $this->ids(false, true), 'Friends off: the followers.');
        $this->assertSame([11, 12], $this->ids(true, false), 'Followers off: the friends.');
        $this->assertSame([], $this->ids(false, false));
    }

    public function testAsManyAsAsked(): void
    {
        $this->bxBecomeGuest();
        $this->connections([], [11, 12, 13, 14, 15], [16]);

        $this->assertSame([11, 12, 13], $this->ids());
        $this->assertSame([11], $this->ids(true, true, 1));
    }
}
