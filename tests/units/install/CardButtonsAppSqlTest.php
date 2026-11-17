<?php

/**
 * A fresh install turns the buttons of a person's and an organization's card on for the apps (`active_api` of the
 * snippet meta menus' items): the friend and follow toggles (obj-friends, obj-subscriptions) and the suggestion lists'
 * Add friend, Follow and their Remove, in the modules' app SQL. Sites already installed get the ones that were off
 * from a migration of each module. The database and the API side are PersonsCardButtonsApiTest
 * (integration).
 */
class CardButtonsAppSqlTest extends PHPUnit\Framework\TestCase
{
    protected const MODULES = ['persons' => 'bx_persons', 'organizations' => 'bx_organizations'];
    /** On for the apps in both modules: the toggles, and the suggestion lists' Add, Follow and their Remove. */
    protected const ITEMS = ['obj-friends', 'obj-subscriptions', 'befriend', 'subscribe', 'ignore-befriend', 'ignore-subscribe'];
    /** What each module's migration turns on: the rest was on already. */
    protected const MIGRATED = [
        'bx_persons' => "('obj-friends', 'obj-subscriptions', 'befriend')",
        'bx_organizations' => "('obj-friends', 'obj-subscriptions', 'subscribe', 'ignore-befriend', 'ignore-subscribe')",
    ];

    public function testAppSqlTurnsTheTogglesOn(): void
    {
        foreach(self::MODULES as $sDir => $sModule) {
            $sSql = (string)file_get_contents(__DIR__ . '/../../../modules/boonex/' . $sDir . '/install/sql/enable-app.sql');

            foreach(self::ITEMS as $sName)
                $this->assertStringContainsString("UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='" . $sModule . "_snippet_meta' AND `module`='" . $sModule . "' AND `name`='" . $sName . "';", $sSql, $sModule . ': ' . $sName);
        }
    }

    public function testEachModuleHasItsMigration(): void
    {
        foreach(self::MODULES as $sDir => $sModule) {
            $sSql = (string)file_get_contents(__DIR__ . '/../../../modules/boonex/' . $sDir . '/migrations/2026111810_card_buttons_in_apps.sql');

            $this->assertStringContainsString('UNA-Migration-Min-System-Version:', $sSql, $sModule);
            $this->assertStringContainsString("`set_name`='" . $sModule . "_snippet_meta' AND `module`='" . $sModule . "' AND `name` IN " . self::MIGRATED[$sModule] . " AND `active_api`=0", $sSql, $sModule);
        }
    }
}
