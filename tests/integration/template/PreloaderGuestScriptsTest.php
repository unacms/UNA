<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Scripts every page loads only where they are used (BxBaseServices::serviceGetPreloaderContent): Pusher's client
 * where a sockets server is set up, at.js (mentions while typing) for members.
 */
#[Group('integration')]
class PreloaderGuestScriptsTest extends BxDolIntegrationTestCase
{
    protected function content(string $sName)
    {
        return (new BxBaseServices())->serviceGetPreloaderContent($sName);
    }

    public function testThePreloaderAsksTheServices(): void
    {
        $aContents = BxDolDb::getInstance()->getColumn("SELECT `content` FROM `sys_preloader` WHERE `module` = 'system' AND `active` = 1");

        foreach (['pusher_js', 'atwho_js', 'atwho_css'] as $sName)
            $this->assertContains(serialize(['module' => 'system', 'method' => 'get_preloader_content', 'params' => [$sName], 'class' => 'BaseServices']), $aContents, $sName);

        foreach (['pusher/pusher.min.js', 'at.js/js/jquery.atwho.min.js', '{dir_plugins_public}at.js/css/|jquery.atwho.min.css'] as $sFile)
            $this->assertNotContains($sFile, $aContents, $sFile . ' is no longer loaded on every page.');
    }

    public function testPusherOnlyWithASocketsServer(): void
    {
        $oSockets = BxDolSockets::getInstance();
        $this->assertSame($oSockets && $oSockets->isEnabled() ? 'pusher/pusher.min.js' : '', $this->content('pusher_js'));
    }

    public function testAtJsOnlyForMembers(): void
    {
        $this->bxBecomeGuest();
        $this->assertSame('', $this->content('atwho_js'));
        $this->assertSame('', $this->content('atwho_css'));

        $this->bxLoginAsAdmin();
        $this->assertSame('at.js/js/jquery.atwho.min.js', $this->content('atwho_js'));
        $this->assertSame('{dir_plugins_public}at.js/css/|jquery.atwho.min.css', $this->content('atwho_css'));
    }
}
