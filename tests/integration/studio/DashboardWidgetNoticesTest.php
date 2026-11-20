<?php

use PHPUnit\Framework\Attributes\Group;

class DashboardWidgetNoticesTestProxy extends BxTemplStudioDashboard
{
    public function __construct()
    {
        // serviceGetWidgetNotices needs no page or blocks
    }
}

/**
 * An upgrader that fails the test when it is asked to call the version server.
 */
class DashboardWidgetNoticesTestUpgrader extends BxDolUpgrader
{
    public int $iRemoteCalls = 0;

    public function getVersionUpdateInfo($sChannel = '', $iTimeout = 10)
    {
        $this->iRemoteCalls++;
        return null;
    }
}

/**
 * Studio's launcher counts the Dashboard tile's notices on every Studio page (launcher.php?action=launcher-update-cache).
 * The count comes from the version server's last answer and the last server audit, and no other server is asked: asking
 * v.unacms.com and php.net there took over 5 s on a fresh install.
 */
#[Group('integration')]
class DashboardWidgetNoticesTest extends BxDolIntegrationTestCase
{
    private $mixedUpgrader;
    private $aCache = [];
    private string $sAuditReport = '';

    protected function setUp(): void
    {
        parent::setUp();

        $this->mixedUpgrader = $GLOBALS['bxDolClasses']['BxDolUpgrader'] ?? null;

        $oDb = BxDolDb::getInstance();
        foreach (['stable', 'beta'] as $sChannel)
            $this->aCache[$sChannel] = $oDb->getDbCacheObject()->getData($this->cacheKey($sChannel));
        $this->sAuditReport = (string)getParam('sys_audit_report');
    }

    protected function tearDown(): void
    {
        if ($this->mixedUpgrader === null)
            unset($GLOBALS['bxDolClasses']['BxDolUpgrader']);
        else
            $GLOBALS['bxDolClasses']['BxDolUpgrader'] = $this->mixedUpgrader;

        $oDb = BxDolDb::getInstance();
        foreach ($this->aCache as $sChannel => $mixedData) {
            if ($mixedData === null)
                $oDb->getDbCacheObject()->setData($this->cacheKey($sChannel), null);
            else
                $oDb->getDbCacheObject()->setData($this->cacheKey($sChannel), $mixedData);
        }
        $this->setAuditReport($this->sAuditReport);

        parent::tearDown();
    }

    private function cacheKey(string $sChannel): string
    {
        return BxDolDb::getInstance()->genDbCacheKey('sys_version_update_info_' . $sChannel);
    }

    private function channel(): string
    {
        return getParam('sys_upgrade_channel') == 'beta' ? 'beta' : 'stable';
    }

    private function keepAnswer(string $sChannel, string $sLatest, int $iAge = 0): void
    {
        BxDolDb::getInstance()->getDbCacheObject()->setData($this->cacheKey($sChannel), ['time' => time() - $iAge, 'info' => ['latest_version' => $sLatest]]);
    }

    private function setAuditReport(string $s): void
    {
        $oDb = BxDolDb::getInstance();
        $oDb->setParam('sys_audit_report', $s);
        $oDb->cacheParams(true);
    }

    private function report(string $sSection, string $sType): string
    {
        return json_encode(['time' => time(), 'sections' => [
            ['name' => 'php', 'rows' => [['name' => 'memory_limit', 'value' => '256M', 'type' => 'ok', 'msg' => '']]],
            ['name' => $sSection, 'rows' => [['name' => 'a row', 'value' => '', 'type' => $sType, 'msg' => '']]],
        ]]);
    }

    private function notices(): int
    {
        $oUpgrader = new DashboardWidgetNoticesTestUpgrader();
        $GLOBALS['bxDolClasses']['BxDolUpgrader'] = $oUpgrader;

        $iNotices = (new DashboardWidgetNoticesTestProxy())->serviceGetWidgetNotices();

        $this->assertSame(0, $oUpgrader->iRemoteCalls, 'The launcher must not ask the version server.');
        return $iNotices;
    }

    public function testKeptAnswerIsRead(): void
    {
        $this->keepAnswer('beta', '99.0.0-RC1');
        $this->assertSame(['latest_version' => '99.0.0-RC1'], (new BxDolUpgrader())->getVersionUpdateInfoCached('beta'));

        $this->keepAnswer('beta', '99.0.0-RC1', 3 * 86400);
        $this->assertNull((new BxDolUpgrader())->getVersionUpdateInfoCached('beta'), 'An answer older than two days is not used.');

        BxDolDb::getInstance()->getDbCacheObject()->setData($this->cacheKey('beta'), null);
        $this->assertNull((new BxDolUpgrader())->getVersionUpdateInfoCached('beta'));
    }

    public function testDevChannelReadsStable(): void
    {
        $this->keepAnswer('stable', '99.0.0');
        $this->assertSame(['latest_version' => '99.0.0'], (new BxDolUpgrader())->getVersionUpdateInfoCached('dev'));
    }

    public function testNewerReleaseIsANotice(): void
    {
        $this->setAuditReport($this->report('database', 'ok'));

        $this->keepAnswer($this->channel(), '99.0.0');
        $this->assertSame(1, $this->notices());

        $this->keepAnswer($this->channel(), bx_get_ver());
        $this->assertSame(0, $this->notices());
    }

    public function testNoAnswerIsNoNotice(): void
    {
        $this->setAuditReport('');
        BxDolDb::getInstance()->getDbCacheObject()->setData($this->cacheKey($this->channel()), null);

        $fStart = microtime(true);
        $this->assertSame(0, $this->notices());
        $this->assertLessThan(1.0, microtime(true) - $fStart);
    }

    public function testFailedHostRowIsANotice(): void
    {
        $this->keepAnswer($this->channel(), bx_get_ver());

        foreach (['php', 'database', 'webserver'] as $sSection) {
            $this->setAuditReport($this->report($sSection, 'fail'));
            $this->assertSame(1, $this->notices(), $sSection);
        }

        // other sections and other statuses are not host requirements
        $this->setAuditReport($this->report('security', 'fail'));
        $this->assertSame(0, $this->notices());
        $this->setAuditReport($this->report('webserver', 'warn'));
        $this->assertSame(0, $this->notices());
        $this->setAuditReport('not json');
        $this->assertSame(0, $this->notices());

        $this->keepAnswer($this->channel(), '99.0.0');
        $this->setAuditReport($this->report('php', 'fail'));
        $this->assertSame(2, $this->notices());
    }
}
