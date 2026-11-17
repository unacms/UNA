<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The friend and follow toggles (BxBaseConnectionFriend, BxBaseConnectionSubscription: the buttons of a profile and of
 * a person's card) draw the same icons on the site and in the apps. The button shows its state: `add` before the
 * connection, `default` once it is made or asked for ("Request sent", "Friends", "Following"). A row of the button's
 * menu shows its action: `remove` for Cancel request, Unfriend, Reject and Unfollow.
 *
 * The site's names are Lucide's (kebab-case), the apps' the same icons in PascalCase
 * (neo/packages/app/settings/social-actions.js, `connection_ext`): a change to one side fails here until the other
 * follows.
 */
#[Group('integration')]
class ConnectionToggleIconsTest extends BxDolIntegrationTestCase
{
    protected const ICONS = [
        'sys_profiles_friends' => ['add' => 'user-round-plus', 'remove' => 'user-round-x', 'default' => 'user-round-check'],
        'sys_profiles_subscriptions' => ['add' => 'circle-plus', 'remove' => 'circle-minus', 'default' => 'circle-check'],
    ];

    protected function connection(string $sObject): BxDolConnection
    {
        $oConnection = BxDolConnection::getObjectInstance($sObject);
        $this->assertInstanceOf(BxBaseConnection::class, $oConnection);

        return $oConnection;
    }

    protected function icon(BxDolConnection $oConnection, string $sKind, string $sAction): string
    {
        return (string)(new ReflectionMethod($oConnection, '_getActionIconAs' . $sKind))->invoke($oConnection, $sAction);
    }

    /** Lucide's `user-round-x` as the apps name it: `UserRoundX`. */
    protected function pascal(string $sName): string
    {
        return implode('', array_map('ucfirst', explode('-', $sName)));
    }

    public function testSiteIcons(): void
    {
        foreach(self::ICONS as $sObject => $aIcons) {
            $oConnection = $this->connection($sObject);

            foreach($aIcons as $sAction => $sIcon) {
                $this->assertSame($sIcon, $this->icon($oConnection, 'Icon', $sAction), $sObject . ': ' . $sAction);
                $this->assertFileExists(BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'lucide/icons/' . $sIcon . '.svg', 'The iconset has the icon.');

                // the inline picture (`use_icon_as` => image) is the same icon
                $this->assertStringContainsString('lucide-' . $sIcon . '"', $this->icon($oConnection, 'Image', $sAction), $sObject . ': ' . $sAction);
            }
        }
    }

    public function testAppsDrawTheSameIcons(): void
    {
        $sFile = BX_DIRECTORY_PATH_ROOT . 'neo/packages/app/settings/social-actions.js';
        if(!file_exists($sFile))
            $this->markTestSkipped('NEO is not in this checkout.');

        $sSettings = (string)file_get_contents($sFile);
        $iToggles = bx_mb_strpos($sSettings, 'connection_ext: {');
        $this->assertNotFalse($iToggles);
        $sToggles = get_mb_substr($sSettings, $iToggles, 1200);

        foreach(self::ICONS as $sObject => $aIcons) {
            $sExpected = $sObject . ": {\n                icons: { add: '" . $this->pascal($aIcons['add']) . "', remove: '" . $this->pascal($aIcons['remove']) . "', default: '" . $this->pascal($aIcons['default']) . "' },";
            $this->assertStringContainsString($sExpected, $sToggles, $sObject);
        }
    }

    /**
     * Following is a state, as a sent friend request is: the button is named `default` and its menu holds the action,
     * so the button and the row can have their own icons.
     */
    public function testFollowingIsAStateWithUnfollowInItsMenu(): void
    {
        $oReal = $this->connection('sys_profiles_subscriptions');

        $oConnection = $this->getMockBuilder(get_class($oReal))
            ->disableOriginalConstructor()
            ->onlyMethods(['isConnected'])
            ->getMock();
        (new ReflectionProperty(BxBaseConnection::class, '_aT'))->setValue($oConnection, ['do_initiator' => '_sys_conn_subscriptions_do_initiator']);
        $oActions = new ReflectionMethod($oConnection, '_getActions');

        $oConnection->expects($this->atLeastOnce())->method('isConnected')->willReturn(true);
        $aFollowing = $oActions->invoke($oConnection, 1, 2);
        $this->assertSame('default', $aFollowing['name']);
        $this->assertSame('_sys_conn_subscriptions_do_initiator', $aFollowing['title']);
        $this->assertSame('remove', $aFollowing['items'][0]['name']);
        $this->assertCount(2, $aFollowing['items'], 'A second, empty item keeps the action in a menu.');
    }

    public function testFollowIsOneAction(): void
    {
        $oReal = $this->connection('sys_profiles_subscriptions');

        $oConnection = $this->getMockBuilder(get_class($oReal))
            ->disableOriginalConstructor()
            ->onlyMethods(['isConnected'])
            ->getMock();
        $oConnection->expects($this->atLeastOnce())->method('isConnected')->willReturn(false);

        $aFollow = (new ReflectionMethod($oConnection, '_getActions'))->invoke($oConnection, 1, 2);
        $this->assertSame('', $aFollow['name']);
        $this->assertSame(['add'], array_column($aFollow['items'], 'name'));
    }
}
