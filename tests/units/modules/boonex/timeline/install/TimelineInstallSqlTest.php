<?php

/**
 * Keys the Timeline module's install.sql gives a fresh install, read from the SQL itself.
 */
class TimelineInstallSqlTest extends \PHPUnit\Framework\TestCase
{
    private static function installSql(): string
    {
        $sSql = file_get_contents(__DIR__ . '/../../../../../../modules/boonex/timeline/install/sql/install.sql');
        if ($sSql === false)
            self::fail('modules/boonex/timeline/install/sql/install.sql is not readable.');

        return $sSql;
    }

    public static function tables(): array
    {
        return [['bx_timeline_events'], ['bx_timeline_events_slice']];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('tables')]
    public function testFeedKeys(string $sTable): void
    {
        $bFound = preg_match('/CREATE TABLE IF NOT EXISTS `' . $sTable . '` \((.*?)\n\);/s', self::installSql(), $aMatch);
        $this->assertSame(1, $bFound, "install.sql creates $sTable.");

        // Feeds sort by (sticked, date, id) or (date, id) with a LIMIT, the feeds' promoted parts look up
        // promoted events, and content edits find their events by source. All four go in together:
        // the sort keys without `promoted` make the promoted parts slower.
        foreach ([
            'KEY `sticked_date_id` (`sticked`, `date`, `id`)',
            'KEY `date_id` (`date`, `id`)',
            'KEY `promoted` (`promoted`)',
            'KEY `source` (`source`)',
        ] as $sKey)
            $this->assertStringContainsString($sKey, $aMatch[1], $sTable);
    }
}
