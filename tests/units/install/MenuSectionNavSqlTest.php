<?php

/**
 * A fresh install's menus (`sys_objects_menu`.`section_nav`): the column, and the connections' menu (Friends, Requests,
 * Suggestions...) set to the sidebar. Read from the SQL itself; the database side is MenuSectionNavTest (integration).
 */
class MenuSectionNavSqlTest extends PHPUnit\Framework\TestCase
{
    public function testFreshInstallHasTheSetting(): void
    {
        $sSql = file_get_contents(__DIR__ . '/../../../install/sql/system.sql');
        if($sSql === false)
            self::fail('install/sql/system.sql is not readable.');

        $this->assertStringContainsString("`section_nav` varchar(16) NOT NULL DEFAULT ''", $sSql);
        $this->assertStringContainsString("UPDATE `sys_objects_menu` SET `section_nav`='sidebar' WHERE `object`='sys_con_submenu';", $sSql);
    }
}
