<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Messenger's video calls need a Jitsi server the operator chose: with calls off, or on without a server, nobody
 * gets the call button in a conversation, the video call action on profiles, or the call windows.
 */
#[Group('integration')]
class MessengerVideoCallsTest extends BxDolTestCase
{
    private $aPrior = [];

    private $bEnabledPrior;

    protected function setUp(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_messenger'))
            $this->markTestSkipped('Messenger is not installed.');

        foreach (['bx_messenger_jitsi_enable', 'bx_messenger_jitsi_server'] as $sName)
            $this->aPrior[$sName] = getParam($sName);

        $this->bEnabledPrior = BxDolModule::getInstance('bx_messenger')->_oConfig->CNF['ENABLE-JITSI'];
    }

    protected function tearDown(): void
    {
        foreach ($this->aPrior as $sName => $sValue)
            setParam($sName, $sValue);

        if ($this->bEnabledPrior !== null)
            BxDolModule::getInstance('bx_messenger')->_oConfig->CNF['ENABLE-JITSI'] = $this->bEnabledPrior;
    }

    /** Whether a config read from these options lets video calls start. */
    private function callsAllowed(string $sEnable, string $sServer): bool
    {
        setParam('bx_messenger_jitsi_enable', $sEnable);
        setParam('bx_messenger_jitsi_server', $sServer);

        $oConfig = new BxMessengerConfig(BxDolModuleQuery::getInstance()->getModuleByName('bx_messenger'));
        return (bool)$oConfig->CNF['ENABLE-JITSI'];
    }

    public function testCallsNeedTheSwitchAndAServer(): void
    {
        $this->assertFalse($this->callsAllowed('', 'meet.example.com'), 'Off.');
        $this->assertFalse($this->callsAllowed('on', ''), 'On without a server.');
        $this->assertFalse($this->callsAllowed('on', '  '), 'A blank server is no server.');
        $this->assertTrue($this->callsAllowed('on', 'meet.example.com'));
    }

    public function testCallEntryPointsStayClosedWhileOff(): void
    {
        $oModule = BxDolModule::getInstance('bx_messenger');
        $oModule->_oConfig->CNF['ENABLE-JITSI'] = false;

        $this->assertFalse($oModule->serviceIsVideoConferenceAllowed(1), 'No video call action on profiles.');
        $this->assertFalse($oModule->_oConfig->isJitsiAllowed(BX_IM_TYPE_PRIVATE), 'No call in a conversation.');

        $oMenu = BxDolMenu::getObjectInstance('bx_messenger_lot_menu');
        if ($oMenu) {
            $oMethod = new ReflectionMethod($oMenu, '_isVisible');
            $this->assertFalse($oMethod->invoke($oMenu, ['name' => 'video_call', 'module' => 'bx_messenger', 'visible_for_levels' => 2147483647, 'active' => 1]), 'No call button in the conversation menu.');
        }
    }
}
