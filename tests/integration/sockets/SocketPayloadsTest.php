<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Connection object whose permission check and counters are left out, so a test can
 * call onAdded and onRemoved without writing anything.
 */
class SocketPayloadsTestConnection extends BxTemplConnection
{
    public function checkAllowedConnect ($iInitiator, $iContent, $isPerformAction = false, $isMutual = false, $isInvertResult = false, $isSwap = false, $isCheckExists = true)
    {
        return CHECK_ACTION_RESULT_ALLOWED;
    }

    protected function _updateTriggerValue($iInitiator, $iContent, $iValue)
    {
    }
}

/**
 * Socket channels are public: anyone who knows a profile or object id can subscribe.
 * Events sent there name what changed and carry no profile, account or moderation data.
 */
#[Group('integration')]
class SocketPayloadsTest extends BxDolIntegrationTestCase
{
    protected $_oSocketsBackup;
    protected $_aSent;
    protected $_aGetBackup;

    protected function setUp(): void
    {
        parent::setUp();

        $this->_aGetBackup = $_GET;
        $this->_aSent = [];

        // Record what would be sent instead of sending it.
        $oSockets = $this->createStub(BxDolSockets::class);
        $oSockets->method('isEnabled')->willReturn(true);
        $oSockets->method('sendEvent')->willReturnCallback(function ($sSocket, $iContentId, $sEvent, $sMessage) {
            $this->_aSent[] = [$sSocket . '_' . $iContentId, $sEvent, $sMessage];
        });

        $this->_oSocketsBackup = $GLOBALS['bxDolClasses']['BxDolSockets'] ?? null;
        $GLOBALS['bxDolClasses']['BxDolSockets'] = $oSockets;
    }

    protected function tearDown(): void
    {
        if ($this->_oSocketsBackup)
            $GLOBALS['bxDolClasses']['BxDolSockets'] = $this->_oSocketsBackup;
        else
            unset($GLOBALS['bxDolClasses']['BxDolSockets']);

        $_GET = $this->_aGetBackup;

        parent::tearDown();
    }

    public function testConnectionEventsCarryIdsOnly(): void
    {
        list($iInitiator, $iContent) = $this->_getTwoProfiles();
        $oConnection = $this->_getConnection('sys_profiles_friends');

        // API mode: it used to add the profile data the API returns to its owner, email included.
        $_GET['api'] = 1;

        $oConnection->onAdded($iInitiator, $iContent, 0);
        $aAdded = [
            'object' => 'sys_profiles_friends',
            'action' => 'added',
            'initiator' => $iInitiator,
            'content' => $iContent,
        ];
        $this->assertSame([
            ['sys_connections_' . $iInitiator, 'changed', $aAdded],
            ['sys_connections_' . $iContent, 'changed', $aAdded],
        ], $this->_getSentDecoded());

        $this->_aSent = [];
        $oConnection->onRemoved($iInitiator, $iContent, 0);
        $aDeleted = [
            'object' => 'sys_profiles_friends',
            'action' => 'deleted',
        ];
        $this->assertSame([
            ['sys_connections_' . $iInitiator, 'changed', $aDeleted],
            ['sys_connections_' . $iContent, 'changed', $aDeleted],
        ], $this->_getSentDecoded());
    }

    public function testProfileEditEventNamesTheProfileOnly(): void
    {
        list($iProfileId) = $this->_getTwoProfiles();

        $oHelper = (new ReflectionClass('BxBaseModProfileFormsEntryHelper'))->newInstanceWithoutConstructor();
        $this->bxCallProtected($oHelper, '_sendProfileChangedEvent', $iProfileId);

        $this->assertSame([
            ['profile_' . $iProfileId, 'changed', ['id' => $iProfileId]],
        ], $this->_getSentDecoded());
    }

    public function testReportEventsShowNoReporterOrCounters(): void
    {
        $oReport = (new ReflectionClass('BxTemplReport'))->newInstanceWithoutConstructor();

        // The shape BxBaseReport::_returnReportData returns to the reporter.
        $aResult = [
            'code' => 0,
            'count' => 3,
            'countf' => '3',
            'label_icon' => 'exclamation-circle',
            'label_title' => 'Reported',
            'reported' => true,
            'disabled' => false,
            'api' => [
                'ts' => 1.5,
                'performer_id' => 12,
                'is_reported' => true,
                'is_disabled' => false,
                'counter' => ['object_id' => 5, 'count' => 3],
            ],
        ];

        $this->assertSame(['code' => 0], $this->bxCallProtected($oReport, '_returnReportDataForSocket', $aResult));
    }

    protected function _getConnection($sObject): BxDolConnection
    {
        $aObject = BxDolConnectionQuery::getConnectionObject($sObject);
        if (empty($aObject))
            $this->markTestSkipped('Connection ' . $sObject . ' is not installed.');

        return new SocketPayloadsTestConnection($aObject);
    }

    /**
     * The admin's profile and any other one.
     */
    protected function _getTwoProfiles(): array
    {
        $oProfile = BxDolProfile::getInstanceByAccount($this->bxAccount('admin')->id());
        if (!$oProfile)
            $this->markTestSkipped('The admin account has no profile.');

        $iProfileId = (int)$oProfile->id();
        $iOtherId = (int)BxDolDb::getInstance()->getOne("SELECT `id` FROM `sys_profiles` WHERE `id` <> :id AND `type` <> 'system' ORDER BY `id` LIMIT 1", ['id' => $iProfileId]);
        if (!$iOtherId)
            $this->markTestSkipped('There is no second profile.');

        return [$iProfileId, $iOtherId];
    }

    protected function _getSentDecoded(): array
    {
        return array_map(function ($aEvent) {
            $aEvent[2] = json_decode($aEvent[2], true);
            return $aEvent;
        }, $this->_aSent);
    }
}
