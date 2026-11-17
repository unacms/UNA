<?php

/**
 * A group's, an event's and a space's card on the site has the two buttons its card in the apps has: Join (an event's
 * Attend) and Follow. A fresh install turns them on in each module's enable.sql; sites already installed get the one
 * that was off from the module's migration. The card's strings come with their migrations, in English and Russian.
 */
class ContextCardButtonsSqlTest extends PHPUnit\Framework\TestCase
{
    /** module dir => [module, the item its migration turns on, its migration] */
    protected const MODULES = [
        'groups' => ['bx_groups', 'subscribe', '2026111840_card_follow_button.sql'],
        'events' => ['bx_events', 'subscribe', '2026111840_card_follow_button.sql'],
        'spaces' => ['bx_spaces', 'join', '2026111840_card_join_button.sql'],
    ];

    protected function root(): string
    {
        return __DIR__ . '/../../../';
    }

    /** The `active` flag of a snippet meta item in a module's enable.sql. */
    protected function active(string $sDir, string $sModule, string $sName): ?int
    {
        $sSql = (string)file_get_contents($this->root() . 'modules/boonex/' . $sDir . '/install/sql/enable.sql');
        if(!preg_match("/\\('" . $sModule . "_snippet_meta', '" . $sModule . "', '" . preg_quote($sName, '/') . "',[^\\n]*?, (\\d), 0, 1, \\d+\\)/", $sSql, $aMatch))
            return null;

        return (int)$aMatch[1];
    }

    public function testFreshInstallsShowJoinAndFollow(): void
    {
        foreach(self::MODULES as $sDir => list($sModule)) {
            $this->assertSame(1, $this->active($sDir, $sModule, 'join'), $sModule . ': join');
            $this->assertSame(1, $this->active($sDir, $sModule, 'subscribe'), $sModule . ': subscribe');
            // the toggles hold the way back
            $this->assertSame(0, $this->active($sDir, $sModule, 'leave'), $sModule . ': leave');
            $this->assertSame(0, $this->active($sDir, $sModule, 'unsubscribe'), $sModule . ': unsubscribe');
        }
    }

    public function testEachModuleHasItsMigration(): void
    {
        foreach(self::MODULES as $sDir => list($sModule, $sName, $sFile)) {
            $sSql = (string)file_get_contents($this->root() . 'modules/boonex/' . $sDir . '/migrations/' . $sFile);

            $this->assertStringContainsString('UNA-Migration-Min-System-Version:', $sSql, $sModule);
            $this->assertStringContainsString("UPDATE `sys_menu_items` SET `active`=1 WHERE `set_name`='" . $sModule . "_snippet_meta' AND `module`='" . $sModule . "' AND `name`='" . $sName . "' AND `active`=0;", $sSql, $sModule);
        }
    }

    public function testStringsHaveTheirMigrations(): void
    {
        $aFiles = [
            'migrations/2026111830_card_membership_en.xml' => ['_sys_menu_item_title_sm_join_short', '_sys_menu_item_title_sm_join_requested_short', '_sys_menu_item_title_sm_join_invited', '_sys_menu_item_title_sm_join_accept', '_sys_menu_item_title_sm_join_decline', '_sys_menu_item_title_sm_joined'],
            'modules/boonex/russian/migrations/2026111831_card_membership_ru.xml' => ['_sys_menu_item_title_sm_join_short', '_sys_menu_item_title_sm_joined'],
            'modules/boonex/events/migrations/2026111832_card_membership_en.xml' => ['_bx_events_menu_item_title_sm_join_short', '_bx_events_menu_item_title_sm_joined', '_bx_events_txt_unit_view'],
            'modules/boonex/russian/migrations/2026111833_events_card_membership_ru.xml' => ['_bx_events_txt_unit_view'],
            'modules/boonex/groups/migrations/2026111834_card_view_en.xml' => ['_bx_groups_txt_unit_view'],
            'modules/boonex/russian/migrations/2026111835_groups_card_view_ru.xml' => ['_bx_groups_txt_unit_view'],
            'modules/boonex/spaces/migrations/2026111836_card_view_en.xml' => ['_bx_spaces_txt_unit_view'],
            'modules/boonex/russian/migrations/2026111837_spaces_card_view_ru.xml' => ['_bx_spaces_txt_unit_view'],
        ];

        foreach($aFiles as $sFile => $aKeys) {
            $sXml = (string)file_get_contents($this->root() . $sFile);
            $this->assertStringContainsString('UNA-Migration-Min-System-Version:', $sXml, $sFile);
            foreach($aKeys as $sKey)
                $this->assertStringContainsString('<string_add name="' . $sKey . '">', $sXml, $sFile . ': ' . $sKey);
        }
    }
}
