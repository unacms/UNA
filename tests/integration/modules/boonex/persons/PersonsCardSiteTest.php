<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * A person's card on the site (the gallery unit, unit_with_cover.html) is drawn as the apps draw it
 * (modules/base/profile/template/unit_card.html, css/unit_card.css; NEO: components/units/content-list/bx-persons.js):
 * a square picture, the name, the friends and followers, then two buttons at most, the first one the main one. A card
 * with no action to offer opens the profile ("View profile"), and the viewer's own card says "You" in a slot of a
 * button's size.
 *
 * The other person is any active one that isn't the test admin's; a site without one skips those cases.
 */
#[Group('integration')]
class PersonsCardSiteTest extends BxDolIntegrationTestCase
{
    protected const MENU = 'bx_persons_snippet_meta';

    protected $_aGetBackup;
    protected $_iProfileId = 0;
    protected $_mixedViewerBackup = null;

    protected function setUp(): void
    {
        parent::setUp();

        if(!BxDolModuleQuery::getInstance()->isEnabledByName('bx_persons'))
            $this->markTestSkipped('Persons is not installed.');

        $this->_iProfileId = (int)BxDolProfileQuery::getInstance()->getCurrentProfileByAccount($this->bxAccount('admin')->id());

        // the site's card, not the API's: the menu reads bx_is_api() when it is made, and menus are kept per request
        $this->_aGetBackup = $_GET;
        unset($_GET['api']);
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

    /** The module keeps the viewer it was made for: give it this test's (0 for a guest), as a request of its own would. */
    protected function viewAs(int $iProfileId): void
    {
        $oModule = BxDolModule::getInstance('bx_persons');
        if($this->_mixedViewerBackup === null)
            $this->_mixedViewerBackup = [$this->viewerProp()->getValue($oModule)];

        $this->viewerProp()->setValue($oModule, $iProfileId);
    }

    /** The card of the person with that content id, as the gallery draws it. */
    protected function card(int $iContentId): string
    {
        unset($GLOBALS['bxDolClasses']['BxDolMenu!' . self::MENU]);

        $oModule = BxDolModule::getInstance('bx_persons');
        $aData = $oModule->_oDb->getContentInfoById($iContentId);
        $this->assertIsArray($aData);

        return (string)$oModule->_oTemplate->unit($aData, true, 'unit_with_cover.html');
    }

    /** Whether the module's gallery card is the apps' card. */
    protected function isCard(string $sModule): bool
    {
        // a module's template comes wrapped (BxDolModuleProxy adds its CSS and JS on the first call)
        $oTemplate = BxDolModule::getInstance($sModule)->_oTemplate;
        if($oTemplate instanceof BxDolModuleProxy)
            $oTemplate = (new ReflectionProperty(BxDolModuleProxy::class, '_oProxifiedObject'))->getValue($oTemplate);
        $this->assertInstanceOf(BxBaseModProfileTemplate::class, $oTemplate, $sModule . ': ' . (is_object($oTemplate) ? get_class($oTemplate) : gettype($oTemplate)));

        return (bool)(new ReflectionProperty(BxBaseModProfileTemplate::class, '_bUnitCard'))->getValue($oTemplate);
    }

    /** An active person other than the given profile: [profile id, content id], or nulls. */
    protected function otherPerson(int $iProfileId): array
    {
        $aRow = BxDolDb::getInstance()->getRow("SELECT `id`, `content_id` FROM `sys_profiles` WHERE `type` = 'bx_persons' AND `status` = 'active' AND `id` <> :id ORDER BY `id` DESC LIMIT 1", ['id' => $iProfileId]);

        return $aRow ? [(int)$aRow['id'], (int)$aRow['content_id']] : [null, null];
    }

    public function testMemberSeesTwoButtonsTheFirstOneMain(): void
    {
        $this->assertGreaterThan(0, $this->_iProfileId, 'The test admin has no profile.');

        list($iOtherProfileId, $iOtherContentId) = $this->otherPerson($this->_iProfileId);
        if(!$iOtherProfileId)
            $this->markTestSkipped('The site has no other person.');

        $this->bxLoginAsAdmin();
        $this->viewAs($this->_iProfileId);

        $sCard = $this->card($iOtherContentId);

        $this->assertStringContainsString('bx-base-pofile-unit-with-cover bx-base-pofile-card', $sCard, 'The gallery card is the apps\' card.');
        $this->assertStringContainsString('bx-base-pofile-card-picture', $sCard);
        $this->assertStringNotContainsString('bx-base-pofile-unit-cover', $sCard, 'No cover on the card.');

        // the friend and follow toggles: two buttons, the first one the main one
        $this->assertSame(2, substr_count($sCard, 'bx-menu-item-button '), 'Two buttons.');
        $this->assertSame(1, substr_count($sCard, 'bx-menu-item-button-first'));
        $this->assertSame(1, preg_match_all('/class="bx-conn-do bx-btn bx-btn-primary/', $sCard), 'One main button.');
        $this->assertLessThan(strpos($sCard, 'bx-menu-item-obj-subscriptions'), strpos($sCard, 'bx-btn-primary'), 'The first button is the main one.');

        $this->assertStringNotContainsString('bx-base-pofile-card-view', $sCard, 'A card with buttons has no "View profile".');
    }

    /** The friends' and followers' counts share one group of avatars: neither count has avatars of its own. */
    public function testCountsShareOneGroupOfAvatars(): void
    {
        list($iOtherProfileId, $iOtherContentId) = $this->otherPerson($this->_iProfileId);
        if(!$iOtherProfileId)
            $this->markTestSkipped('The site has no other person.');

        $this->bxLoginAsAdmin();
        $this->viewAs($this->_iProfileId);

        $sCard = $this->card($iOtherContentId);

        $this->assertLessThanOrEqual(1, substr_count($sCard, 'bx-base-pofile-connections-preview'));
        $this->assertStringNotContainsString('bx-conn-counter-profiles', $sCard);
    }

    public function testOwnCardOpensTheProfileAndSaysYou(): void
    {
        $this->assertGreaterThan(0, $this->_iProfileId, 'The test admin has no profile.');

        $oProfile = BxDolProfile::getInstance($this->_iProfileId);
        if(!$oProfile || $oProfile->getModule() != 'bx_persons')
            $this->markTestSkipped('The test admin is not a person.');

        $this->bxLoginAsAdmin();
        $this->viewAs($this->_iProfileId);

        $sCard = $this->card((int)$oProfile->getContentId());

        $this->assertStringContainsString('bx-base-pofile-card-view', $sCard);
        $this->assertStringContainsString('<u>' . _t('_sys_profile_unit_view') . '</u>', $sCard);
        $this->assertStringContainsString('sys-icon user-circle', $sCard, 'The apps\' icon: circle-user-round.');
        $this->assertStringContainsString('bx-base-pofile-card-you', $sCard);
        $this->assertStringContainsString(_t('_sys_profile_unit_you'), $sCard);
        $this->assertStringNotContainsString('bx-menu-item-button', $sCard, 'No action on the viewer\'s own card.');
    }

    public function testGuestCardOpensTheProfile(): void
    {
        list($iOtherProfileId, $iOtherContentId) = $this->otherPerson($this->_iProfileId);
        if(!$iOtherProfileId)
            $this->markTestSkipped('The site has no other person.');

        $this->bxBecomeGuest();
        $this->viewAs(0);

        $sCard = $this->card($iOtherContentId);

        $this->assertStringContainsString('bx-base-pofile-card-view', $sCard);
        $this->assertStringNotContainsString('bx-base-pofile-card-you', $sCard);
        $this->assertStringNotContainsString('bx-menu-item-button', $sCard);
    }

    /** Groups, events and spaces have the card too (GroupsCardTest); a module that does not ask for it keeps its own. */
    public function testProfilesTurnTheCardOn(): void
    {
        $this->assertTrue($this->isCard('bx_persons'));

        $oQuery = BxDolModuleQuery::getInstance();
        if($oQuery->isEnabledByName('bx_organizations'))
            $this->assertTrue($this->isCard('bx_organizations'));
        if($oQuery->isEnabledByName('bx_channels'))
            $this->assertFalse($this->isCard('bx_channels'));
    }

    public function testStringsAndIconAreThere(): void
    {
        $this->assertNotSame('_sys_profile_unit_view', _t('_sys_profile_unit_view'));
        $this->assertNotSame('_sys_profile_unit_you', _t('_sys_profile_unit_you'));
        $this->assertSame('circle-user-round', BxDolIconset::getObjectInstance('sys_lucide')->getLucideName('user-circle'));
    }
}
