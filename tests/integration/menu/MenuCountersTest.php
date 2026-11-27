<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * How a menu of actions shows their counts (`sys_objects_menu`.`counters`; Studio > Navigation > a menu > Counts):
 * labels, counts or button groups. Empty is automatic, the menu class's own choice: counts for a feed item's and a
 * comment's actions, button groups for a content page's, labels for every other menu. The apps get the resolved value
 * as the menu's `counters`.
 */
#[Group('integration')]
class MenuCountersTest extends BxDolIntegrationTestCase
{
    /** A copy of a menu object with the given fields, so the shared instance is left as it is. */
    protected function withFields(string $sObject, array $aFields): ?BxDolMenu
    {
        $oMenu = BxDolMenu::getObjectInstance($sObject);
        if(!$oMenu)
            return null;

        $oMenu = clone $oMenu;
        $oProp = new ReflectionProperty($oMenu, '_aObject');
        $oProp->setValue($oMenu, array_merge($oProp->getValue($oMenu), $aFields));

        return $oMenu;
    }

    public function testColumnExists(): void
    {
        $this->assertTrue(BxDolDb::getInstance()->isFieldExists('sys_objects_menu', 'counters'));
    }

    public function testModesListAutomaticFirst(): void
    {
        $this->assertSame(['', 'label', 'count', 'group'], BxDolMenu::getCountersModes());
    }

    public function testAutomaticIsTheClassDefault(): void
    {
        $oMenu = $this->withFields('sys_toolbar_member', ['counters' => '']);
        $this->assertNotNull($oMenu);
        $this->assertSame(BxDolMenu::COUNTERS_LABEL, $oMenu->getCounters(), 'A menu without actions shows labels.');

        $oMenu = $this->withFields('sys_cmts_item_actions', ['counters' => '']);
        $this->assertNotNull($oMenu);
        $this->assertSame(BxDolMenu::COUNTERS_COUNT, $oMenu->getCounters(), 'A comment\'s actions show counts.');

        if(BxDolModuleQuery::getInstance()->isEnabledByName('bx_timeline')) {
            $oMenu = $this->withFields('bx_timeline_menu_item_actions', ['counters' => '']);
            $this->assertNotNull($oMenu);
            $this->assertSame(BxDolMenu::COUNTERS_COUNT, $oMenu->getCounters(), 'A feed item\'s actions show counts.');
        }

        if(BxDolModuleQuery::getInstance()->isEnabledByName('bx_posts')) {
            $oMenu = $this->withFields('bx_posts_view_actions', ['counters' => '']);
            $this->assertNotNull($oMenu);
            $this->assertSame(BxDolMenu::COUNTERS_GROUP, $oMenu->getCounters(), 'A content page\'s actions are button groups.');
        }
    }

    public function testStoredValueWinsAndUnknownFallsBack(): void
    {
        $oMenu = $this->withFields('sys_cmts_item_actions', ['counters' => 'group']);
        $this->assertSame(BxDolMenu::COUNTERS_GROUP, $oMenu->getCounters());

        $oMenu = $this->withFields('sys_cmts_item_actions', ['counters' => 'label']);
        $this->assertSame(BxDolMenu::COUNTERS_LABEL, $oMenu->getCounters());

        $oMenu = $this->withFields('sys_cmts_item_actions', ['counters' => 'sideways']);
        $this->assertSame(BxDolMenu::COUNTERS_COUNT, $oMenu->getCounters(), 'Anything else stored is automatic.');
    }

    public function testApiCarriesTheResolvedValue(): void
    {
        $oMenu = $this->withFields('sys_toolbar_member', ['counters' => 'count']);
        $this->assertNotNull($oMenu);

        $aCode = $oMenu->getCodeAPI();
        $this->assertIsArray($aCode);
        $this->assertSame('count', $aCode['counters'] ?? null);
    }

    public function testStudioEditFormReadsTheSavedValues(): void
    {
        $oDb = BxDolDb::getInstance();
        $iId = (int)$oDb->getOne("SELECT `id` FROM `sys_objects_menu` WHERE `object`='sys_cmts_item_actions'");
        $this->assertGreaterThan(0, $iId);

        $aMenu = [];
        (new BxDolStudioNavigationQuery())->getMenus(['type' => 'by_id', 'value' => $iId], $aMenu, false);
        foreach(['button_style', 'button_size', 'counters'] as $sField)
            $this->assertArrayHasKey($sField, $aMenu, 'Studio\'s edit form shows the saved ' . $sField . ' and saves it back.');
    }
}
