<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Menus read sys_menu_items by set through the `set_name` key instead of scanning the table,
 * and items that share an `order` still come in the order they came in before the key.
 */
#[Group('integration')]
class MenuItemsSetKeyTest extends BxDolIntegrationTestCase
{
    public function testMenuItemsQueryUsesTheSetKey(): void
    {
        $oDb = BxDolDb::getInstance();
        $this->assertTrue($oDb->isIndexExists('sys_menu_items', 'set_name'), 'The sys_menu_items migration is applied (KEY `set_name`).');

        $sSet = $oDb->getOne("SELECT `set_name` FROM `sys_menu_items` ORDER BY `id` ASC LIMIT 1");
        if (!$sSet)
            $this->markTestSkipped('There are no menu items.');

        // The query BxDolMenuQuery::getMenuItemsBy runs for a menu.
        $aPlan = $oDb->getRow("EXPLAIN SELECT * FROM `sys_menu_items` WHERE 1 AND `set_name` = :set_name ORDER BY `order` ASC", ['set_name' => $sSet]);
        $this->assertSame('set_name', $aPlan['key'], 'A menu reads its own items, not the whole table.');
    }

    public function testItemsWithTheSameOrderKeepTheirOrder(): void
    {
        $oDb = BxDolDb::getInstance();
        if (!$oDb->isIndexExists('sys_menu_items', 'set_name'))
            $this->markTestSkipped('The sys_menu_items migration is not applied.');

        $aSets = $oDb->getColumn("SELECT DISTINCT `set_name` FROM `sys_menu_items` GROUP BY `set_name`, `order` HAVING COUNT(*) > 1");
        if (empty($aSets))
            $this->markTestSkipped('No menu has items that share an order.');

        // Without the key the table is scanned and sorted; the key must not change the result.
        $sQuery = "SELECT `id` FROM `sys_menu_items` %s WHERE `set_name` = :set_name ORDER BY `order` ASC";
        foreach ($aSets as $sSet)
            $this->assertSame(
                $oDb->getColumn(sprintf($sQuery, 'IGNORE INDEX (`set_name`)'), ['set_name' => $sSet]),
                $oDb->getColumn(sprintf($sQuery, 'FORCE INDEX (`set_name`)'), ['set_name' => $sSet]),
                $sSet . ': items that share an order come in the same order as before.'
            );
    }
}
