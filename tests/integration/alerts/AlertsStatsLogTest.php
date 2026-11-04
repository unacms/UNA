<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * What the alerts log writes to sys_alerts_log: the shape of each alert's data, without
 * secret or personal values. The test logs an alert of its own unit and deletes its row.
 */
#[Group('integration')]
class AlertsStatsLogTest extends BxDolIntegrationTestCase
{
    protected const UNIT = 'phpunit_alerts_stats';

    protected $_aLogsBackup = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->_aLogsBackup = $this->logs()->getValue();
        $this->logs()->setValue(null, []);
        $this->deleteRows();
    }

    protected function tearDown(): void
    {
        try {
            $this->deleteRows();
        }
        finally {
            $this->logs()->setValue(null, $this->_aLogsBackup);
            parent::tearDown();
        }
    }

    protected function logs(): ReflectionProperty
    {
        return new ReflectionProperty(BxDolAlertsStats::class, 'logs');
    }

    protected function deleteRows(): void
    {
        BxDolDb::getInstance()->query("DELETE FROM `sys_alerts_log` WHERE `unit` = :unit", ['unit' => self::UNIT]);
    }

    public function testLoggedExtrasAreRedacted(): void
    {
        $sPassword = 'plain text';
        BxDolAlertsStats::log((object)[
            'sUnit' => self::UNIT,
            'sAction' => 'join',
            'iObject' => 1,
            'iSender' => 2,
            'aExtras' => [
                'pwd' => &$sPassword,
                'info' => ['email' => 'a@example.com', 'name' => 'Ann'],
                'form' => new ArrayObject(['password' => 'secret']),
            ],
        ]);
        BxDolAlertsStats::flushLogs();

        $sExtra = BxDolDb::getInstance()->getOne("SELECT `extra` FROM `sys_alerts_log` WHERE `unit` = :unit AND `action` = 'join'", ['unit' => self::UNIT]);
        $this->assertSame([
            'pwd' => '[redacted]',
            'info' => ['email' => '[redacted]', 'name' => 'Ann'],
            'form' => '[object ArrayObject]',
        ], json_decode($sExtra, true));
        $this->assertSame('plain text', $sPassword, 'The caller keeps its value.');
    }
}
