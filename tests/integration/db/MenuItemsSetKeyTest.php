<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Menus read sys_menu_items by set through the `set_name` key instead of scanning the table,
 * and items that share an `order` still come in the order they came in before the key.
 */
#[Group('integration')]
class MenuItemsSetKeyTest extends BxDolIntegrationTestCase
{
    protected $_sSet = '';

    protected function tearDown(): void
    {
        if ($this->_sSet)
            BxDolDb::getInstance()->query("DELETE FROM `sys_menu_items` WHERE `set_name` = :set_name", ['set_name' => $this->_sSet]);

        parent::tearDown();
    }

    public function testMenuItemsQueryUsesTheSetKey(): void
    {
        $oDb = BxDolDb::getInstance();
        $this->assertTrue($oDb->isIndexExists('sys_menu_items', 'set_name'), 'The sys_menu_items migration is applied (KEY `set_name`).');

        // A set of its own, a small share of the table (core alone installs hundreds of items), so the plan
        // doesn't depend on how big the site's own menus are.
        $this->_sSet = 'phpunit_set_key_' . genRndPwd(8, false);
        for ($i = 1; $i <= 3; $i++)
            $oDb->query("INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `markers`, `submenu_object`, `visibility_custom`, `config_api`, `order`) VALUES (:set_name, 'system', :name, '', '', '', '', '', '', '', '', '', '', '', :order)", [
                'set_name' => $this->_sSet,
                'name' => 'item' . $i,
                'order' => $i,
            ]);
        $this->assertGreaterThan(60, (int)$oDb->getOne("SELECT COUNT(*) FROM `sys_menu_items`"), 'The test set is a small share of the table.');

        // The query BxDolMenuQuery::getMenuItemsBy runs for a menu.
        $aPlan = $oDb->getRow("EXPLAIN SELECT * FROM `sys_menu_items` WHERE 1 AND `set_name` = :set_name ORDER BY `order` ASC", ['set_name' => $this->_sSet]);
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

        // Without the key the table is scanned and sorted; the key must not change the result. Whole rows,
        // as the menu queries read them: the sort can treat ties differently when it carries the full row.
        $sQuery = "SELECT * FROM `sys_menu_items` %s WHERE `set_name` = :set_name ORDER BY `order` ASC";
        foreach ($aSets as $sSet)
            $this->assertSame(
                array_column($oDb->getAll(sprintf($sQuery, 'IGNORE INDEX (`set_name`)'), ['set_name' => $sSet]), 'id'),
                array_column($oDb->getAll(sprintf($sQuery, 'FORCE INDEX (`set_name`)'), ['set_name' => $sSet]), 'id'),
                $sSet . ': items that share an order come in the same order as before.'
            );
    }
}
