<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * An API client asks for a browse list's next page (and refetches it) through `browse` with the
 * params the list came with. Those params keep what the page block decided: the level of a
 * Channels level list, and whether an empty list shows its "nothing here" message.
 */
#[Group('integration')]
class ChannelsBrowseApiTest extends BxDolIntegrationTestCase
{
    protected $_aIsApiBackup = [];

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_channels'))
            $this->markTestSkipped('Channels is not installed.');

        $this->bxBecomeGuest();
        $o = $this->module();
        $this->_aIsApiBackup = [$o, $this->bxGetProtected($o, '_bIsApi', BxBaseModGeneralModule::class)];
        $this->bxSetProtected($o, '_bIsApi', true, BxBaseModGeneralModule::class);
    }

    protected function tearDown(): void
    {
        try {
            if ($this->_aIsApiBackup)
                $this->bxSetProtected($this->_aIsApiBackup[0], '_bIsApi', $this->_aIsApiBackup[1], BxBaseModGeneralModule::class);
        }
        finally {
            parent::tearDown();
        }
    }

    protected function module(): BxCnlModule
    {
        return BxDolModule::getInstance('bx_channels');
    }

    /**
     * `browse` as an API client calls it, with the list's params.
     */
    protected function browse(array $aParams): array
    {
        $aResult = $this->module()->serviceBrowse(json_encode(['params' => $aParams]));
        $this->assertIsArray($aResult);
        $this->assertNotEmpty($aResult);

        return $aResult[0]['data'];
    }

    public function testLevelListEchoesItsLevelAndEmptyMessage(): void
    {
        $aBlock = $this->module()->serviceBrowseByLevel(0, true)[0]['data'];
        $this->assertSame(0, $aBlock['params']['level'], 'The level goes back with the next request.');
        $this->assertTrue($aBlock['params']['empty_message'], 'So does the empty message.');
        $this->assertFalse($aBlock['hide_empty_msg']);

        $aNext = $this->browse($aBlock['params']);
        $this->assertFalse($aNext['hide_empty_msg'], 'The next request keeps the message the block asked for.');
        $this->assertSame(0, $aNext['params']['level']);
    }

    public function testLevelListWithoutALevelIsTheTopLevel(): void
    {
        // As a client sent it before the level was echoed: no "Undefined array key" warning.
        $aWarnings = [];
        set_error_handler(function ($iErrno, $sError) use (&$aWarnings) {
            $aWarnings[] = $sError;
            return true;
        }, E_WARNING);
        try {
            $aList = $this->browse(['type' => 'level', 'start' => 0, 'per_page' => 24]);
        }
        finally {
            restore_error_handler();
        }

        $this->assertSame([], array_values(array_filter($aWarnings, fn($s) => str_contains($s, 'level'))));
        $this->assertIsArray($aList['data']);
    }

    /**
     * What the level list filters by: the level asked for, the top level when none is.
     */
    public function testLevelListFiltersByItsLevel(): void
    {
        $fLevel = function ($aParams) {
            $o = new BxCnlSearchResult('level', $aParams);
            return $o->aCurrent['restriction']['level'];
        };

        $this->assertSame(['value' => 0, 'field' => 'level', 'operator' => '=', 'table' => 'sys_labels'], $fLevel([]), 'No level is the top level, not null.');
        $this->assertSame(2, $fLevel(['level' => 2])['value']);
        $this->assertSame(1, $fLevel(['level' => '1'])['value'], 'A level from the request is an integer.');
    }

    public function testBrowseWithoutTheChoiceStillHidesTheMessage(): void
    {
        $this->assertTrue($this->browse(['type' => 'recent', 'start' => 0, 'per_page' => 24])['hide_empty_msg'], 'Unchanged for a client that does not send it.');
        $this->assertFalse($this->browse(['type' => 'recent', 'start' => 0, 'per_page' => 24, 'empty_message' => true])['hide_empty_msg']);
    }
}
