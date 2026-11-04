<?php

use PHPUnit\Framework\Attributes\Group;

// The Db double below extends a module class, which the autoloader doesn't find.
require_once(BX_DIRECTORY_PATH_MODULES . 'boonex/reputation/classes/BxReputationDb.php');
require_once(BX_DIRECTORY_PATH_MODULES . 'boonex/reputation/classes/BxReputationTemplate.php');

/**
 * Reputation get_leaderboard called by an API client (a guest here): params sent as an array go
 * through the same filter as a JSON string or the query string, so the client can't set the
 * number of profiles (limit); the leaderboard setting does. Server code calling the service keeps
 * the params it passes.
 *
 * The module's Db is a double that records the limit the leaderboard asks for.
 */
#[Group('integration')]
class ReputationLeaderboardApiPagingTest extends BxDolIntegrationTestCase
{
    protected $_aGetBackup;
    protected $_oModule;
    protected $_aInstancesBackup;
    protected $_bIsApiBackup;
    protected $_oDb;
    protected $_iDefault;

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aGetBackup = $_GET;

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_reputation'))
            $this->markTestSkipped('Reputation is not installed.');

        $_GET['api'] = 1;
        $this->bxBecomeGuest();

        $this->_oModule = BxDolModule::getInstance('bx_reputation');
        $this->_aInstancesBackup = $this->bxModuleInstances($this->_oModule);
        $this->_bIsApiBackup = $this->bxGetProtected($this->_oModule, '_bIsApi', BxBaseModGeneralModule::class);

        $oConfig = $this->_oModule->_oConfig;
        $this->_oDb = new ReputationLeaderboardApiPagingTestDb($oConfig);
        $oTemplate = new BxReputationTemplate($oConfig, $this->_oDb);
        $oTemplate->init();
        $this->bxModuleInstances($this->_oModule, array_merge($this->_aInstancesBackup, [
            '_oDb' => $this->_oDb,
            '_oTemplate' => new BxDolModuleProxy('module_template', $oTemplate),
        ]));
        $this->bxSetProtected($this->_oModule, '_bIsApi', true, BxBaseModGeneralModule::class);

        $this->_iDefault = (int)getParam($oConfig->CNF['PARAM_LEADERBOARD_LIMIT']);
        $this->assertGreaterThan(0, $this->_iDefault);
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
     * Number of profiles the leaderboard asks the Db for.
     */
    protected function limit($mixedParams): int
    {
        $this->_oDb->aLimits = [];

        // true: skip the memory cache of results, every call is a new request
        BxDolService::call('bx_reputation', 'get_leaderboard', [$mixedParams], 'Module', true);

        $this->assertCount(1, $this->_oDb->aLimits, 'The leaderboard was not read.');
        return $this->_oDb->aLimits[0];
    }

    public function testArrayParamsCantSetLimit(): void
    {
        //--- all time, and the growth over some days
        foreach ([['limit' => 100000], ['limit' => 100000, 'days' => 7], ['limit' => -1, 'days' => 'd-30']] as $aParams)
            $this->assertSame($this->_iDefault, $this->limit($aParams), var_export($aParams, true));
    }

    public function testJsonParamsCantSetLimit(): void
    {
        $this->assertSame($this->_iDefault, $this->limit(json_encode(['params' => ['limit' => 100000]])));
        $this->assertSame($this->_iDefault, $this->limit(json_encode(['params' => ['limit' => 100000, 'days' => 7]])));
    }

    public function testServerCallsKeepTheirParams(): void
    {
        $this->bxSetProtected($this->_oModule, '_bIsApi', false, BxBaseModGeneralModule::class);

        $this->assertSame(20, $this->limit(['limit' => 20]));
    }
}

/**
 * Reputation Db that records the limit of the leaderboard queries and finds no profiles.
 */
class ReputationLeaderboardApiPagingTestDb extends BxReputationDb
{
    public $aLimits = [];

    public function getEventsStats($aParams)
    {
        $this->aLimits[] = (int)$aParams['limit'];
        return [];
    }

    public function getProfiles($aParams = [])
    {
        if (($aParams['sample'] ?? '') != 'stats')
            return parent::getProfiles($aParams);

        $this->aLimits[] = (int)$aParams['limit'];
        return [];
    }
}
