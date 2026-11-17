<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * A group's, an event's and a space's card in a gallery is the card people and organizations have
 * (modules/base/profile/template/unit_card.html; NEO: components/units/helpers.js UnitProfileCard): a square picture
 * (the cover or the letter where there is none), the name, the counts after one group of avatars, then two buttons at
 * most.
 *
 * Join on a card and in the apps is the membership's toggle (BxBaseModGroupsConnectionFans) with the card's short
 * words: "Join", then "Request sent" with Cancel in its menu, "Invited" with Accept and Decline, or "Joined" with
 * Leave; an event says "Attend" and "Going". Follow is the follow toggle. A plain Leave or Unfollow button is not
 * drawn beside them.
 *
 * The group is any active one the test admin's profile did not make; a site without one skips those cases.
 */
#[Group('integration')]
class GroupsCardTest extends BxDolIntegrationTestCase
{
    protected const MENU = 'bx_groups_snippet_meta';
    protected const PROFILE = 900002;
    protected const VIEWER = 900003;

    protected $_aGetBackup;
    protected $_aConnBackup = [];
    protected $_iProfileId = 0;
    protected $_mixedViewerBackup = null;

    protected function setUp(): void
    {
        parent::setUp();

        if(!BxDolModuleQuery::getInstance()->isEnabledByName('bx_groups'))
            $this->markTestSkipped('Groups is not installed.');

        $this->_iProfileId = (int)BxDolProfileQuery::getInstance()->getCurrentProfileByAccount($this->bxAccount('admin')->id());

        $this->_aGetBackup = $_GET;
        unset($_GET['api']);
        unset($GLOBALS['bxDolClasses']['BxDolMenu!' . self::MENU]);

        // make sure the real objects are there, then keep them
        foreach(['bx_groups_fans', 'sys_profiles_friends', 'sys_profiles_subscriptions'] as $sObject) {
            BxDolConnection::getObjectInstance($sObject);
            $this->_aConnBackup[$sObject] = $GLOBALS['bxDolClasses']['BxTemplConnection!' . $sObject] ?? null;
        }
    }

    protected function tearDown(): void
    {
        foreach($this->_aConnBackup as $sObject => $oConnection) {
            if($oConnection === null)
                unset($GLOBALS['bxDolClasses']['BxTemplConnection!' . $sObject]);
            else
                $GLOBALS['bxDolClasses']['BxTemplConnection!' . $sObject] = $oConnection;
        }

        if($this->_mixedViewerBackup !== null)
            $this->viewerProp()->setValue(BxDolModule::getInstance('bx_groups'), $this->_mixedViewerBackup[0]);

        $_GET = $this->_aGetBackup ?? [];
        unset($GLOBALS['bxDolClasses']['BxDolMenu!' . self::MENU]);

        parent::tearDown();
    }

    protected function viewerProp(): ReflectionProperty
    {
        return new ReflectionProperty(BxBaseModGeneralModule::class, '_iProfileId');
    }

    /** The module keeps the viewer it was made for: give it this test's (0 for a guest), as a request of its own would. */
    protected function viewAs(int $iProfileId): void
    {
        $oModule = BxDolModule::getInstance('bx_groups');
        if($this->_mixedViewerBackup === null)
            $this->_mixedViewerBackup = [$this->viewerProp()->getValue($oModule)];

        $this->viewerProp()->setValue($oModule, $iProfileId);
    }

    /** A module's template without its wrapper (BxDolModuleProxy adds its CSS and JS on the first call). */
    protected function template(string $sModule): BxBaseModProfileTemplate
    {
        $oTemplate = BxDolModule::getInstance($sModule)->_oTemplate;
        if($oTemplate instanceof BxDolModuleProxy)
            $oTemplate = (new ReflectionProperty(BxDolModuleProxy::class, '_oProxifiedObject'))->getValue($oTemplate);
        $this->assertInstanceOf(BxBaseModProfileTemplate::class, $oTemplate, $sModule);

        return $oTemplate;
    }

    /** An active public group the given profile did not make: its content id, or 0. */
    protected function otherGroup(int $iProfileId): int
    {
        $oModule = BxDolModule::getInstance('bx_groups');
        $CNF = $oModule->_oConfig->CNF;

        $aIds = BxDolDb::getInstance()->getColumn("SELECT `content_id` FROM `sys_profiles` WHERE `type` = 'bx_groups' AND `status` = 'active' ORDER BY `id` ASC");
        foreach($aIds as $iId) {
            $aData = $oModule->_oDb->getContentInfoById((int)$iId);
            if($aData && (int)$aData[$CNF['FIELD_AUTHOR']] != $iProfileId && (int)$aData[$CNF['FIELD_ALLOW_VIEW_TO']] == BX_DOL_PG_ALL)
                return (int)$iId;
        }

        return 0;
    }

    /** The group's card, as the gallery draws it (the groups' gallery template is unit.html). */
    protected function card(int $iContentId): string
    {
        unset($GLOBALS['bxDolClasses']['BxDolMenu!' . self::MENU]);

        $oModule = BxDolModule::getInstance('bx_groups');
        $aData = $oModule->_oDb->getContentInfoById($iContentId);
        $this->assertIsArray($aData);

        return (string)$oModule->_oTemplate->unit($aData, true, 'unit.html');
    }

    /** The card's meta items by name, as the API sends them. */
    protected function cardItems(int $iContentId): array
    {
        unset($GLOBALS['bxDolClasses']['BxDolMenu!' . self::MENU]);

        $oMenu = BxDolMenu::getObjectInstance(self::MENU);
        $this->assertInstanceOf(BxBaseModGroupsMenuSnippetMeta::class, $oMenu);

        $oMenu->setContentId($iContentId);
        $oMenu->setContentPublic(true);

        $aItems = [];
        foreach((array)($oMenu->getCodeAPI()['items'] ?? []) as $aItem)
            if(is_array($aItem) && isset($aItem['name']))
                $aItems[$aItem['name']] = $aItem;

        return $aItems;
    }

    /**
     * A membership in a given state, without a database: `sent` (the viewer asked to join), `invited` (the group asked
     * the viewer), `member`, or none.
     */
    protected function membership(string $sObject, string $sModule, string $sState): BxBaseModGroupsConnectionFans
    {
        $oReal = BxDolConnection::getObjectInstance($sObject);
        $this->assertInstanceOf(BxBaseModGroupsConnectionFans::class, $oReal);

        $oConnection = $this->getMockBuilder(get_class($oReal))
            ->disableOriginalConstructor()
            ->onlyMethods(['isConnectedNotMutual', 'isConnected'])
            ->getMock();
        (new ReflectionProperty(BxBaseModGroupsConnectionFans::class, '_oModule'))->setValue($oConnection, BxDolModule::getInstance($sModule));
        (new ReflectionProperty(BxBaseConnection::class, '_aT'))->setValue($oConnection, ['do_initiator' => '_long_member', 'do_content' => '_long_invited']);

        $oConnection->expects($this->atLeastOnce())->method('isConnectedNotMutual')->willReturnCallback(function($iInitiator, $iContent) use ($sState) {
            return ($sState == 'sent' && $iInitiator == self::VIEWER) || ($sState == 'invited' && $iInitiator == self::PROFILE);
        });
        $oConnection->expects($this->any())->method('isConnected')->willReturn($sState == 'member');

        return $oConnection;
    }

    protected function actions(BxBaseModGroupsConnectionFans $oConnection, bool $bShort): array
    {
        return (new ReflectionMethod($oConnection, '_getActions'))->invoke($oConnection, self::VIEWER, self::PROFILE, $bShort ? ['show_do_label_short' => true] : []);
    }

    public function testTheCardSaysJoinThenJoinedWithLeaveInItsMenu(): void
    {
        $aJoin = $this->actions($this->membership('bx_groups_fans', 'bx_groups', ''), true);
        $this->assertSame('', $aJoin['name']);
        $this->assertSame([['name' => 'add', 'title' => '_sys_menu_item_title_sm_join_short']], $aJoin['items'], 'One action: the button itself.');

        $aJoined = $this->actions($this->membership('bx_groups_fans', 'bx_groups', 'member'), true);
        $this->assertSame('default', $aJoined['name'], 'A state, so the button shows the made icon.');
        $this->assertSame('_sys_menu_item_title_sm_joined', $aJoined['title']);
        $this->assertSame('remove', $aJoined['items'][0]['name']);
        $this->assertCount(2, $aJoined['items'], 'A second, empty item keeps the action in a menu.');
    }

    public function testARequestAndAnInvitationAreStatesToo(): void
    {
        $aSent = $this->actions($this->membership('bx_groups_fans', 'bx_groups', 'sent'), true);
        $this->assertSame('default', $aSent['name']);
        $this->assertSame('_sys_menu_item_title_sm_join_requested_short', $aSent['title']);
        $this->assertSame('remove', $aSent['items'][0]['name'], 'Cancel request.');
        $this->assertCount(2, $aSent['items']);

        $aInvited = $this->actions($this->membership('bx_groups_fans', 'bx_groups', 'invited'), true);
        $this->assertSame('add', $aInvited['name']);
        $this->assertSame('_sys_menu_item_title_sm_join_invited', $aInvited['title']);
        $this->assertSame(['add' => '_sys_menu_item_title_sm_join_accept', 'remove' => '_sys_menu_item_title_sm_join_decline'], array_column($aInvited['items'], 'title', 'name'));
    }

    /** Away from a card (a profile's page) the toggle keeps the words it had. */
    public function testTheLongWordsStayWhereTheCardDoesNotAskForShortOnes(): void
    {
        $CNF = BxDolModule::getInstance('bx_groups')->_oConfig->CNF;

        $aJoin = $this->actions($this->membership('bx_groups_fans', 'bx_groups', ''), false);
        $this->assertSame($CNF['T']['menu_item_title_sm_join'], $aJoin['items'][0]['title']);

        $aSent = $this->actions($this->membership('bx_groups_fans', 'bx_groups', 'sent'), false);
        $this->assertSame('', $aSent['name']);
        $this->assertCount(1, $aSent['items'], 'One action, as before: Cancel request.');

        $this->assertSame('_long_member', $this->actions($this->membership('bx_groups_fans', 'bx_groups', 'member'), false)['title']);
        $this->assertSame('_long_invited', $this->actions($this->membership('bx_groups_fans', 'bx_groups', 'invited'), false)['title']);
    }

    /**
     * The apps' toggle says it is a card's (`short`) and sends that back with an action (system/perform, `short`), so
     * the answer keeps the card's words: an event left from its card says "Attend" again, not the long "Going".
     */
    public function testTheAppsKeepTheCardsWordingAfterAnAction(): void
    {
        $_GET['api'] = 1;

        $oConnection = $this->membership('bx_groups_fans', 'bx_groups', 'member');
        $aShort = $oConnection->getElementAPI(self::PROFILE, self::VIEWER, ['show_do_label_short' => true]);
        $this->assertTrue($aShort['short'] ?? false);
        $this->assertSame(_t('_sys_menu_item_title_sm_joined'), $aShort['title']);

        $aLong = $this->membership('bx_groups_fans', 'bx_groups', 'member')->getElementAPI(self::PROFILE, self::VIEWER);
        $this->assertArrayNotHasKey('short', $aLong, 'Away from a card nothing changes.');

        $sService = (string)file_get_contents(BX_DIRECTORY_PATH_ROOT . 'template/scripts/BxBaseServiceConnections.php');
        $this->assertStringContainsString("getElementAPI(\$aParams['cid'], \$aParams['iid'], !empty(\$aParams['short']) ? ['show_do_label_short' => true] : [])", $sService);
    }

    public function testAnEventSaysAttendThenGoing(): void
    {
        if(!BxDolModuleQuery::getInstance()->isEnabledByName('bx_events'))
            $this->markTestSkipped('Events is not installed.');

        $aAttend = $this->actions($this->membership('bx_events_fans', 'bx_events', ''), true);
        $this->assertSame('_bx_events_menu_item_title_sm_join_short', $aAttend['items'][0]['title']);

        $aGoing = $this->actions($this->membership('bx_events_fans', 'bx_events', 'member'), true);
        $this->assertSame('_bx_events_menu_item_title_sm_joined', $aGoing['title']);
    }

    public function testStringsAndIconsAreThere(): void
    {
        $aKeys = ['_sys_menu_item_title_sm_join_short', '_sys_menu_item_title_sm_join_requested_short', '_sys_menu_item_title_sm_join_invited', '_sys_menu_item_title_sm_join_accept', '_sys_menu_item_title_sm_join_decline', '_sys_menu_item_title_sm_joined', '_bx_groups_txt_unit_view'];
        if(BxDolModuleQuery::getInstance()->isEnabledByName('bx_events'))
            $aKeys = array_merge($aKeys, ['_bx_events_menu_item_title_sm_join_short', '_bx_events_menu_item_title_sm_joined', '_bx_events_txt_unit_view']);
        if(BxDolModuleQuery::getInstance()->isEnabledByName('bx_spaces'))
            $aKeys[] = '_bx_spaces_txt_unit_view';

        foreach($aKeys as $sKey)
            $this->assertNotSame($sKey, _t($sKey), $sKey);

        $oLucide = BxDolIconset::getObjectInstance('sys_lucide');
        $this->assertSame('circle-arrow-right', $oLucide->getLucideName('arrow-circle-right'));
        $this->assertSame('calendar-x', $oLucide->getLucideName('calendar-times'));
    }

    public function testGroupsEventsAndSpacesTurnTheCardOn(): void
    {
        $oCard = new ReflectionMethod(BxBaseModProfileTemplate::class, '_isUnitCard');

        foreach(['bx_groups', 'bx_events', 'bx_spaces'] as $sModule) {
            if(!BxDolModuleQuery::getInstance()->isEnabledByName($sModule))
                continue;

            $oTemplate = $this->template($sModule);
            $this->assertTrue($oCard->invoke($oTemplate, 'unit.html'), $sModule . ': the gallery card');
            $this->assertTrue($oCard->invoke($oTemplate, 'unit_with_cover.html'), $sModule);
            $this->assertFalse($oCard->invoke($oTemplate, 'unit_wo_cover.html'), $sModule . ': a small unit stays as it is');
        }

        // an organization's unit.html is its small unit, not a card
        if(BxDolModuleQuery::getInstance()->isEnabledByName('bx_organizations')) {
            $oTemplate = $this->template('bx_organizations');
            $this->assertTrue($oCard->invoke($oTemplate, 'unit_with_cover.html'));
            $this->assertFalse($oCard->invoke($oTemplate, 'unit.html'));
        }
    }

    public function testMemberSeesTheCardWithTheJoinToggle(): void
    {
        $this->assertGreaterThan(0, $this->_iProfileId, 'The test admin has no profile.');

        $iContentId = $this->otherGroup($this->_iProfileId);
        if(!$iContentId)
            $this->markTestSkipped('The site has no group of another member.');

        $this->bxLoginAsAdmin();
        $this->viewAs($this->_iProfileId);

        $sCard = $this->card($iContentId);

        $this->assertStringContainsString('bx-base-pofile-card', $sCard, 'The gallery card is the apps\' card.');
        $this->assertStringContainsString('bx-base-pofile-card-picture', $sCard);
        $this->assertMatchesRegularExpression('/bx-base-pofile-card-(img|letter)/', $sCard, 'The picture, the cover or the letter fills the picture\'s place.');
        $this->assertStringNotContainsString('bx-base-pofile-unit-cover', $sCard, 'No cover band on the card.');

        // Join is the membership's toggle, whatever the viewer's state is; a plain Leave is not drawn
        $this->assertStringContainsString('bx-menu-item-join bx-menu-item-button', $sCard);
        $this->assertStringContainsString('id="bx-conn-bx-groups-fans-', $sCard);
        $this->assertStringNotContainsString('bx-menu-item-leave', $sCard);
        $this->assertStringNotContainsString('bx-menu-item-unsubscribe', $sCard);
        $this->assertLessThanOrEqual(2, substr_count($sCard, 'bx-menu-item-button '), 'Two buttons at most.');
        $this->assertSame(1, substr_count($sCard, 'bx-menu-item-button-first'));

        $this->assertLessThanOrEqual(1, substr_count($sCard, 'bx-base-pofile-connections-preview'), 'One group of avatars.');
        $this->assertStringNotContainsString('bx-conn-counter-profiles', $sCard);
        $this->assertStringNotContainsString('bx-base-pofile-card-view', $sCard, 'A card with buttons has no "View group".');
    }

    public function testGuestCardOpensTheGroup(): void
    {
        $iContentId = $this->otherGroup($this->_iProfileId);
        if(!$iContentId)
            $this->markTestSkipped('The site has no group of another member.');

        $this->bxBecomeGuest();
        $this->viewAs(0);

        $sCard = $this->card($iContentId);

        $this->assertStringContainsString('bx-base-pofile-card-view', $sCard);
        $this->assertStringContainsString('<u>' . _t('_bx_groups_txt_unit_view') . '</u>', $sCard);
        $this->assertStringContainsString('sys-icon arrow-circle-right', $sCard);
        $this->assertStringNotContainsString('bx-base-pofile-card-you', $sCard);
        $this->assertStringNotContainsString('bx-menu-item-button', $sCard);
    }

    public function testAppsGetTheTogglesAndNoPlainLeave(): void
    {
        $iContentId = $this->otherGroup($this->_iProfileId);
        if(!$iContentId)
            $this->markTestSkipped('The site has no group of another member.');

        $_GET['api'] = 1;
        $this->bxLoginAsAdmin();
        $this->viewAs($this->_iProfileId);

        $aItems = $this->cardItems($iContentId);

        $this->assertArrayHasKey('join', $aItems);
        $this->assertSame('element', $aItems['join']['display_type']);
        $this->assertSame('connections_ext', $aItems['join']['data']['type']);
        $this->assertSame('bx_groups_fans', $aItems['join']['data']['o']);
        $this->assertContains($aItems['join']['data']['name'], ['add', 'default', ''], 'Its state: to join, or joined (asked for).');

        $this->assertArrayNotHasKey('leave', $aItems, 'The toggle holds it.');
        $this->assertArrayNotHasKey('unsubscribe', $aItems);
        if(isset($aItems['subscribe'])) {
            $this->assertSame('connections_ext', $aItems['subscribe']['data']['type']);
            $this->assertSame('sys_profiles_subscriptions', $aItems['subscribe']['data']['o']);
        }
    }

    public function testAGuestGetsNoButtonInTheApps(): void
    {
        $iContentId = $this->otherGroup($this->_iProfileId);
        if(!$iContentId)
            $this->markTestSkipped('The site has no group of another member.');

        $_GET['api'] = 1;
        $this->bxBecomeGuest();
        $this->viewAs(0);

        $aItems = $this->cardItems($iContentId);
        foreach(['join', 'leave', 'subscribe', 'unsubscribe'] as $sName)
            $this->assertArrayNotHasKey($sName, $aItems, $sName);
    }

    /** A group's members come first in the group of avatars, then its followers, each person once. */
    public function testMembersComeFirstInTheGroupOfAvatars(): void
    {
        $GLOBALS['bxDolClasses']['BxTemplConnection!bx_groups_fans'] = new class([21, 22]) {
            public function __construct(public array $aMembers) {}
            public function getConnectedInitiators($iContent, $isMutual = false, $iStart = 0, $iLimit = 0) { return array_slice($this->aMembers, $iStart, $iLimit); }
        };
        $GLOBALS['bxDolClasses']['BxTemplConnection!sys_profiles_friends'] = new class {
            public function getCommonContent($iInitiator1, $iInitiator2, $isMutual = false, $iStart = 0, $iLimit = 0) { return []; }
            public function getConnectedContent($iInitiator, $isMutual = false, $iStart = 0, $iLimit = 0) { return []; }
        };
        $GLOBALS['bxDolClasses']['BxTemplConnection!sys_profiles_subscriptions'] = new class([22, 23, 24]) {
            public function __construct(public array $aFollowers) {}
            public function getConnectedInitiators($iContent, $isMutual = false, $iStart = 0, $iLimit = 0) { return array_slice($this->aFollowers, $iStart, $iLimit); }
        };

        $this->bxBecomeGuest();
        $oModule = BxDolModule::getInstance('bx_groups');

        $this->assertSame([21, 22, 23], $oModule->getConnectionsPreviewIds(self::PROFILE));
        $this->assertSame([22, 23, 24], $oModule->getConnectionsPreviewIds(self::PROFILE, ['members' => false]), 'The members\' count is off: the followers alone.');
        $this->assertSame([21, 22], $oModule->getConnectionsPreviewIds(self::PROFILE, ['followers' => false]));
        $this->assertSame([21, 22, 23, 24], $oModule->getConnectionsPreviewIds(self::PROFILE, [], 4));
    }
}
