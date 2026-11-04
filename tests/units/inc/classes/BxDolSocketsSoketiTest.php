<?php

/**
 * Socket events of one request share one client, which waits BX_DOL_SOCKETS_TIMEOUT at most
 * for the sockets server instead of the library's 30 s. No event is sent here. Without a
 * sockets server pages get no client script.
 */
class BxDolSocketsSoketiTest extends BxDolTestCase
{
    private function sockets(): BxDolSocketsSoketi
    {
        $o = (new ReflectionClass(BxDolSocketsSoketi::class))->newInstanceWithoutConstructor();
        $this->bxSetProtected($o, '_sKey', 'key', BxDolSocketsSoketi::class);
        $this->bxSetProtected($o, '_sHost', 'sockets.example.com', BxDolSockets::class);
        $this->bxSetProtected($o, '_sPort', '443', BxDolSockets::class);
        $this->bxSetProtected($o, '_sScheme', 'https', BxDolSockets::class);

        return $o;
    }

    public function testOneClientWithAShortTimeout(): void
    {
        $o = $this->sockets();

        $oPusher = $this->bxCallProtected($o, 'getPusher');
        $this->assertSame($oPusher, $this->bxCallProtected($o, 'getPusher'), 'The client is made once.');

        $aSettings = $oPusher->getSettings();
        $this->assertSame(BX_DOL_SOCKETS_TIMEOUT, $aSettings['timeout']);
        $this->assertLessThan(30, $aSettings['timeout']);
        $this->assertSame('sockets.example.com', $aSettings['host']);
    }

    public function testNoClientScriptWithoutASocketsServer(): void
    {
        $o = $this->sockets();

        $this->bxSetProtected($o, '_sIsEnabled', false, BxDolSockets::class);
        $this->assertSame('', $o->getJsCode(), 'A fresh install (no sockets URL) would connect to Pusher\'s own hosts on every page.');

        $this->bxSetProtected($o, '_sIsEnabled', true, BxDolSockets::class);
        $this->bxSetProtected($o, '_sJsClass', 'BxDolSockets', BxDolSocketsSoketi::class);
        $this->bxSetProtected($o, '_sJsObject', 'oBxDolSockets', BxDolSocketsSoketi::class);
        $this->assertStringContainsString('var oBxDolSockets = new BxDolSockets(', $o->getJsCode());
    }
}
