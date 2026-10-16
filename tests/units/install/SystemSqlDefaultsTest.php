<?php

/**
 * Defaults a fresh install gets from install/sql/system.sql. Read from the SQL itself, so a site whose admin
 * changed a setting in Studio does not fail the suite.
 */
class SystemSqlDefaultsTest extends \PHPUnit\Framework\TestCase
{
    private static function systemSql(): string
    {
        $sSql = file_get_contents(__DIR__ . '/../../../install/sql/system.sql');
        if ($sSql === false)
            self::fail('install/sql/system.sql is not readable.');

        return $sSql;
    }

    public function testHomeCreatePostBlockIsContentOnly(): void
    {
        // The home page's create-post block: designbox_id follows object, cell, module, title_system and title.
        $bFound = preg_match("/\\('sys_home', \\d+, 'system', '_sys_page_block_title_sys_create_post', '_sys_page_block_title_create_post', (\\d+),/", self::systemSql(), $aMatch);

        $this->assertSame(1, $bFound, 'system.sql adds the create-post block to the home page.');
        $this->assertSame(0, (int)$aMatch[1], 'It shows only its form: the content-only design box (BX_DB_CONTENT_ONLY).');
    }

    public function testPoweredByBadgeFollowsTheFooterColour(): void
    {
        $bFound = preg_match("/\\('sys_footer', 'system', 'powered_by', [^\\n]*?'_blank', '(<svg.*?<\\/svg>)'/", self::systemSql(), $aMatch);

        $this->assertSame(1, $bFound, 'system.sql adds the powered-by badge to the footer menu.');
        $this->assertStringContainsString('fill="currentColor"', $aMatch[1], 'The badge draws in the footer link colour, so it reads in light and dark.');
        $this->assertDoesNotMatchRegularExpression('/(fill|stroke)="#/', $aMatch[1], 'No fixed colour that would vanish on one of the two schemes.');
    }

    public function testHomeRecommendedFriendsShowsAnEmptyState(): void
    {
        $bFound = preg_match("/\\('sys_home', 4, 'system', '_sys_page_block_title_sys_recom_friends', [^\\n]*?'service', '([^\\n]*?)', /", self::systemSql(), $aMatch);

        $this->assertSame(1, $bFound, 'system.sql adds Recommended friends to the right column of the home page.');
        $aContent = unserialize(stripslashes($aMatch[1]));
        $this->assertSame('browse_recommendations_friends', $aContent['method']);
        $this->assertTrue($aContent['params'][1]['empty_state'] ?? false, 'With nothing to suggest, the block explains why instead of leaving the column blank.');
    }
}
