<?php

/**
 * Defaults the Timeline module's enable.sql gives a fresh install. Read from the SQL itself, so a site whose admin
 * changed a block in Studio does not fail the suite.
 */
class TimelineEnableSqlTest extends \PHPUnit\Framework\TestCase
{
    private static function enableSql(): string
    {
        $sSql = file_get_contents(__DIR__ . '/../../../../../../modules/boonex/timeline/install/sql/enable.sql');
        if ($sSql === false)
            self::fail('modules/boonex/timeline/install/sql/enable.sql is not readable.');

        return $sSql;
    }

    public function testHomeOutlineIsInactive(): void
    {
        // The guests' home page outline: deletable, copyable, active and order end the row.
        $bFound = preg_match("/\\('sys_home', @iPBCellHome, 'bx_timeline', '_bx_timeline_page_block_title_system_view_home_outline', [^\\n]*?get_block_view_home_outline[^']*', (\\d+), (\\d+), (\\d+), @iPBOrderHome \\+ 1\\);/", self::enableSql(), $aMatch);

        $this->assertSame(1, $bFound, 'enable.sql adds the outline block to the home page.');
        $this->assertSame(0, (int)$aMatch[3], 'It comes inactive: a new site has no posts to show; Studio can turn it on.');
    }

    public function testMembersHomeFeedStaysActive(): void
    {
        $bFound = preg_match("/\\('sys_home', @iPBCellHome, 'bx_timeline', '_bx_timeline_page_block_title_system_views_timeline', [^\\n]*?, (\\d+), @iPBOrderHome \\+ 2\\);/", self::enableSql(), $aMatch);

        $this->assertSame(1, $bFound, 'enable.sql adds the members\' feed to the home page.');
        $this->assertSame(1, (int)$aMatch[1], 'Members keep their feed on the home page.');
    }
}
