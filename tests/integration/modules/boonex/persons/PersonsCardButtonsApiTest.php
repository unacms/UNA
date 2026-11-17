<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * A person's card in the apps has the buttons the site shows on it: the friend and follow toggles of the card's
 * snippet meta menu (obj-friends, obj-subscriptions), on for the apps (enable-app.sql and the migration). The API
 * gives each as a `connections_ext` element for a member looking at someone else, and gives no item, not an empty one,
 * on the member's own card and to a guest, as the site draws no button there.
 *
 * In Friend Suggestions the site shows Add friend and Remove instead, and so do the apps: both items are on for them
 * too, and the list answers when it is asked for on its own (the apps' request, with no page block being processed).
 *
 * The other person is any active one that isn't the test admin's (one the admin has no friend connection with, where
 * there is one); a site without one skips those cases.
 */
#[Group('integration')]
class PersonsCardButtonsApiTest extends BxDolIntegrationTestCase
{
    protected const MENU = 'bx_persons_snippet_meta';
    protected const TOGGLES = ['obj-friends' => 'sys_profiles_friends', 'obj-subscriptions' => 'sys_profiles_subscriptions'];
    /** The suggestion lists' buttons: Add friend, Follow and their Remove. */
    protected const SUGGESTIONS = ['befriend', 'subscribe', 'ignore-befriend', 'ignore-subscribe'];

    protected $_aGetBackup;
    protected $_iProfileId = 0;
    protected $_mixedViewerBackup = null;

    protected function setUp(): void
    {
        parent::setUp();

        if(!BxDolModuleQuery::getInstance()->isEnabledByName('bx_persons'))
            $this->markTestSkipped('Persons is not installed.');

        // Members act as their current profile (a person), not the account's own system profile.
        $this->_iProfileId = (int)BxDolProfileQuery::getInstance()->getCurrentProfileByAccount($this->bxAccount('admin')->id());

        // The meta menu and the connection read bx_is_api() when they are asked; menus are kept per request.
        $this->_aGetBackup = $_GET;
        $_GET['api'] = 1;
        unset($GLOBALS['bxDolClasses']['BxDolMenu!' . self::MENU]);
    }

    protected function tearDown(): void
    {
        if($this->_mixedViewerBackup !== null)
            $this->viewerProp()->setValue(BxDolModule::getInstance('bx_persons'), $this->_mixedViewerBackup[0]);

        $_GET = $this->_aGetBackup ?? [];
        unset($GLOBALS['bxDolClasses']['BxDolMenu!' . self::MENU]);

        parent::tearDown();
    }

    protected function viewerProp(): ReflectionProperty
    {
        return new ReflectionProperty(BxBaseModGeneralModule::class, '_iProfileId');
    }

    /**
     * The module keeps the viewer it was made for, and in a test run it was made by an earlier test: give it this
     * test's viewer (0 for a guest), as a request of its own would.
     */
    protected function viewAs(int $iProfileId): void
    {
        $oModule = BxDolModule::getInstance('bx_persons');
        if($this->_mixedViewerBackup === null)
            $this->_mixedViewerBackup = [$this->viewerProp()->getValue($oModule)];

        $this->viewerProp()->setValue($oModule, $iProfileId);
    }

    /** The card's meta items by name, as the API sends them for the person with that content id, in a list's context. */
    protected function cardItems(int $iContentId, string $sContext = ''): array
    {
        unset($GLOBALS['bxDolClasses']['BxDolMenu!' . self::MENU]);

        $oMenu = BxDolMenu::getObjectInstance(self::MENU);
        $this->assertInstanceOf(BxBaseModProfileMenuSnippetMeta::class, $oMenu);

        $oMenu->setContentId($iContentId);
        $oMenu->setContentPublic(true);
        if($sContext !== '')
            $oMenu->setContext($sContext);

        $aItems = [];
        foreach((array)($oMenu->getCodeAPI()['items'] ?? []) as $aItem)
            if(is_array($aItem) && isset($aItem['name']))
                $aItems[$aItem['name']] = $aItem;

        return $aItems;
    }

    /** An active person other than the given profile: [profile id, content id], or nulls. */
    protected function otherPerson(int $iProfileId): array
    {
        $aRow = BxDolDb::getInstance()->getRow("SELECT `p`.`id`, `p`.`content_id`
            FROM `sys_profiles` AS `p`
            WHERE `p`.`type` = 'bx_persons' AND `p`.`status` = 'active' AND `p`.`id` <> :id
            ORDER BY EXISTS (
                SELECT 1 FROM `sys_profiles_conn_friends` AS `c`
                WHERE (`c`.`initiator` = :id AND `c`.`content` = `p`.`id`) OR (`c`.`initiator` = `p`.`id` AND `c`.`content` = :id)
            ) ASC, `p`.`id` DESC
            LIMIT 1", ['id' => $iProfileId]);

        return $aRow ? [(int)$aRow['id'], (int)$aRow['content_id']] : [null, null];
    }

    public function testTogglesAreOnForTheApps(): void
    {
        $oDb = BxDolDb::getInstance();

        $aModules = ['bx_persons'];
        if(BxDolModuleQuery::getInstance()->isEnabledByName('bx_organizations'))
            $aModules[] = 'bx_organizations';

        foreach($aModules as $sModule)
            foreach(array_merge(array_keys(self::TOGGLES), self::SUGGESTIONS) as $sName)
                $this->assertSame(1, (int)$oDb->getOne("SELECT `active_api` FROM `sys_menu_items` WHERE `set_name` = :set AND `module` = :module AND `name` = :name", [
                    'set' => $sModule . '_snippet_meta',
                    'module' => $sModule,
                    'name' => $sName,
                ]), $sModule . ': ' . $sName);
    }

    public function testMemberGetsTheTogglesOnAnotherCard(): void
    {
        $this->assertGreaterThan(0, $this->_iProfileId, 'The test admin has no profile.');

        list($iOtherProfileId, $iOtherContentId) = $this->otherPerson($this->_iProfileId);
        if(!$iOtherProfileId)
            $this->markTestSkipped('The site has no other person.');

        $this->bxLoginAsAdmin();
        $this->viewAs($this->_iProfileId);

        $aItems = $this->cardItems($iOtherContentId);
        foreach(self::TOGGLES as $sName => $sConnection) {
            $this->assertArrayHasKey($sName, $aItems);
            $this->assertSame('element', $aItems[$sName]['display_type']);

            $aData = $aItems[$sName]['data'];
            $this->assertSame('connections_ext', $aData['type']);
            $this->assertSame($sConnection, $aData['o']);
            $this->assertSame($this->_iProfileId, (int)$aData['iid']);
            $this->assertSame($iOtherProfileId, (int)$aData['cid']);
            $this->assertNotSame('', (string)$aData['title'], 'The button has a label.');
        }
    }

    public function testOwnCardHasNoToggle(): void
    {
        $this->assertGreaterThan(0, $this->_iProfileId, 'The test admin has no profile.');

        $oProfile = BxDolProfile::getInstance($this->_iProfileId);
        if(!$oProfile || $oProfile->getModule() != 'bx_persons')
            $this->markTestSkipped('The test admin is not a person.');

        $this->bxLoginAsAdmin();
        $this->viewAs($this->_iProfileId);

        $aItems = $this->cardItems((int)$oProfile->getContentId());
        foreach(array_keys(self::TOGGLES) as $sName)
            $this->assertArrayNotHasKey($sName, $aItems, 'No item, not an item without an element.');
    }

    public function testGuestGetsNoToggle(): void
    {
        list($iOtherProfileId, $iOtherContentId) = $this->otherPerson($this->_iProfileId);
        if(!$iOtherProfileId)
            $this->markTestSkipped('The site has no other person.');

        $this->bxBecomeGuest();
        $this->viewAs(0);

        $aItems = $this->cardItems($iOtherContentId);
        foreach(array_keys(self::TOGGLES) as $sName)
            $this->assertArrayNotHasKey($sName, $aItems);
    }

    public function testFriendSuggestionGetsAddAndRemove(): void
    {
        $this->assertGreaterThan(0, $this->_iProfileId, 'The test admin has no profile.');

        list($iOtherProfileId, $iOtherContentId) = $this->otherPerson($this->_iProfileId);
        if(!$iOtherProfileId)
            $this->markTestSkipped('The site has no other person.');

        $oFriends = BxDolConnection::getObjectInstance('sys_profiles_friends');
        if(!$oFriends || $oFriends->isConnected($this->_iProfileId, $iOtherProfileId) || $oFriends->isConnected($iOtherProfileId, $this->_iProfileId))
            $this->markTestSkipped('The test admin has a friend connection with every other person.');

        $this->bxLoginAsAdmin();
        $this->viewAs($this->_iProfileId);

        $aItems = $this->cardItems($iOtherContentId, 'recom_friends');
        foreach(['befriend' => 'add', 'ignore-befriend' => 'ignore'] as $sName => $sAction) {
            $this->assertArrayHasKey($sName, $aItems);

            $aData = $aItems[$sName]['data'];
            $this->assertSame('recommendation', $aData['type']);
            $this->assertSame('sys_friends', $aData['o']);
            $this->assertSame($sAction, $aData['a']);
            $this->assertSame($iOtherProfileId, (int)$aData['cid']);
        }

        foreach(array_keys(self::TOGGLES) as $sName)
            $this->assertArrayNotHasKey($sName, $aItems, 'The toggles stay out of the suggestion lists, as on the site.');
    }

    public function testSuggestionsAnswerWithoutAPageBlock(): void
    {
        $this->assertGreaterThan(0, $this->_iProfileId, 'The test admin has no profile.');

        $this->bxLoginAsAdmin();
        $this->viewAs($this->_iProfileId);

        // the service reads bx_is_api() when it is made
        $oService = new BxTemplServiceProfiles();

        $aBlock = BxDolPage::getBlockProcessing();
        BxDolPage::setBlockProcessing([]);

        // PHPUnit lowers error_reporting() while a test runs, so the handler takes its own mask
        set_error_handler(function($iNo, $sMessage, $sFile, $iLine) {
            throw new ErrorException($sMessage, 0, $iNo, $sFile, $iLine);
        }, E_WARNING | E_NOTICE);
        try {
            $mixedFriends = $oService->serviceBrowseRecommendationsFriends();
            $mixedFollow = $oService->serviceBrowseRecommendationsSubscriptions();
        }
        finally {
            restore_error_handler();
            BxDolPage::setBlockProcessing($aBlock);
        }

        $this->assertIsArray($mixedFriends);
        $this->assertIsArray($mixedFollow);
    }
}
