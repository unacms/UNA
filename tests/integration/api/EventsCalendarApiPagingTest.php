<?php

use PHPUnit\Framework\Attributes\Group;

// The Db double below extends a module class, which the autoloader doesn't find.
require_once(BX_DIRECTORY_PATH_MODULES . 'boonex/events/classes/BxEventsDb.php');

/**
 * Events calendar_data called by an API client (a guest here): the client picks the date range,
 * and every day in it takes two queries, so at most 62 days are read. The calendar views (day,
 * week, a month grid of six weeks) and the 30 days the API reads by default are unchanged.
 *
 * The module's Db is a double that records the days it is asked for instead of reading them.
 */
#[Group('integration')]
class EventsCalendarApiPagingTest extends BxDolIntegrationTestCase
{
    protected $_aGetBackup;
    protected $_oModule;
    protected $_aInstancesBackup;
    protected $_bIsApiBackup;
    protected $_oDb;

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aGetBackup = $_GET;

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_events'))
            $this->markTestSkipped('Events are not installed.');

        $this->_oModule = BxDolModule::getInstance('bx_events');
        $this->_aInstancesBackup = $this->bxModuleInstances($this->_oModule);
        $this->_bIsApiBackup = $this->bxGetProtected($this->_oModule, '_bIsApi', BxBaseModGeneralModule::class);

        $oConfig = $this->_oModule->_oConfig;
        $this->_oDb = new EventsCalendarApiPagingTestDb($oConfig);
        $this->bxModuleInstances($this->_oModule, array_merge($this->_aInstancesBackup, ['_oDb' => $this->_oDb]));
        $this->bxSetProtected($this->_oModule, '_bIsApi', true, BxBaseModGeneralModule::class);

        $_GET['api'] = 1;
        $this->bxBecomeGuest();
    }

    protected function tearDown(): void
    {
        try {
            if ($this->_oModule) {
                $this->bxModuleInstances($this->_oModule, $this->_aInstancesBackup);
                $this->bxSetProtected($this->_oModule, '_bIsApi', $this->_bIsApiBackup, BxBaseModGeneralModule::class);
            }
        }
        finally {
            $_GET = $this->_aGetBackup ?? [];
            parent::tearDown();
        }
    }

    /**
     * Days calendar_data reads for the range a client asks for, the params sent as JSON as the
     * calendar block's request_url does.
     */
    protected function days(array $aParams): array
    {
        $this->_oDb->aDays = [];

        // true: skip the memory cache of results, every call is a new request
        $aResult = BxDolService::call('bx_events', 'calendar_data', [json_encode(['params' => array_merge(['type' => 'browse'], $aParams)])], 'Module', true);
        $this->assertIsArray($aResult);
        $this->assertArrayHasKey('data', $aResult);

        return array_keys($this->_oDb->aDays);
    }

    public function testRangeIsBounded(): void
    {
        $iStart = gmmktime(0, 0, 0, 1, 1, 2000);

        foreach ([['01.01.2000', '01.01.2030'], [$iStart, gmmktime(0, 0, 0, 1, 1, 2100)], ['01.01.2000', '01.01.2001']] as list($mixedStart, $mixedEnd)) {
            $aDays = $this->days(['start' => $mixedStart, 'end' => $mixedEnd]);

            //--- 62 days and one more on each side for time zones
            $this->assertCount(64, $aDays, var_export([$mixedStart, $mixedEnd], true));
            $this->assertSame($iStart - 86400, min($aDays));
            $this->assertSame($iStart + 62 * 86400, max($aDays));
        }
    }

    public function testCalendarViewsAreUnchanged(): void
    {
        //--- the API default: 30 days from today
        $this->assertCount(32, $this->days([]));

        //--- a month grid shows six weeks, a week view seven days
        $this->assertCount(44, $this->days(['start' => '28.09.2026', 'end' => '09.11.2026']));
        $this->assertCount(9, $this->days(['start' => '05.10.2026', 'end' => '12.10.2026']));
        $this->assertCount(64, $this->days(['start' => '01.10.2026', 'end' => '02.12.2026']));
    }
}

/**
 * Events Db that records the days the calendar reads (two queries each) and finds no events.
 */
class EventsCalendarApiPagingTestDb extends BxEventsDb
{
    public $aDays = [];

    public function getAllWithKey($oStatement, $sFieldKey, $aBindings = array(), $iFetchType = PDO::FETCH_ASSOC)
    {
        if (is_string($oStatement) && strpos($oStatement, '`bx_events_data`') !== false && isset($aBindings['timestamp_min'])) {
            $this->aDays[$aBindings['timestamp_min']] = true;
            return [];
        }

        return parent::getAllWithKey($oStatement, $sFieldKey, $aBindings, $iFetchType);
    }
}
