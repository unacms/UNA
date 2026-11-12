<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The Messages item of the apps' menu (`sys_apps_menu`, the first section of the apps' sidebar,
 * API v2 GET /navigation) is Conversations' only while Messenger is not enabled; Messenger brings
 * its own. Neither module puts one in the site menu (`sys_site`), which the site and API v1 read.
 */
#[Group('integration')]
class ConvosMessagesMenuItemTest extends BxDolIntegrationTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_convos'))
            $this->markTestSkipped('Conversations is not installed.');
    }

    protected function item(string $sModule, string $sName, string $sSet = 'sys_apps_menu'): array|false
    {
        return BxDolDb::getInstance()->getRow("SELECT * FROM `sys_menu_items` WHERE `set_name` = :set AND `module` = :module AND `name` = :name", [
            'set' => $sSet,
            'module' => $sModule,
            'name' => $sName,
        ]);
    }

    public function testConversationsItemStepsAsideForMessenger(): void
    {
        $aItem = $this->item('bx_convos', 'convos-messages');
        $this->assertNotEmpty($aItem, 'The Messages item is installed.');
        $this->assertNotEmpty($aItem['visibility_custom'], 'It asks whether to show.');
        $this->assertSame(1, (int)$aItem['active_api'], 'On in the apps.');

        $bMessenger = BxDolModuleQuery::getInstance()->isEnabledByName('bx_messenger');
        $this->assertSame(!$bMessenger, (bool)BxDolService::callSerialized($aItem['visibility_custom']));
        $this->assertSame(!$bMessenger, BxDolService::call('bx_convos', 'is_messages_menu_item_shown'));
    }

    public function testMessengerBringsItsOwnItem(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_messenger'))
            $this->markTestSkipped('Messenger is not installed.');

        $aItem = $this->item('bx_messenger', 'messenger-messages');
        $this->assertNotEmpty($aItem);
        $this->assertSame(1, (int)$aItem['active_api'], 'On in the apps.');
    }

    public function testTheSiteMenuHasNoMessagesItem(): void
    {
        $this->assertEmpty($this->item('bx_convos', 'convos-messages', 'sys_site'), 'The site menu is the site\'s and API v1\'s.');
        $this->assertEmpty($this->item('bx_messenger', 'messenger-messages', 'sys_site'));
        $this->assertEmpty($this->item('bx_convos', 'profile-stats-messages', 'sys_profile_stats'));
    }
}
