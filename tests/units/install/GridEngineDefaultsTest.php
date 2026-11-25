<?php

/**
 * Which grids AG Grid draws. A new site: every grid (the default of sys_objects_grid.engine). An updated site: its
 * grids keep the classic grid (the column the migration adds is '' by default), and the migrations move Studio's own
 * grids, every one of them.
 */
class GridEngineDefaultsTest extends \PHPUnit\Framework\TestCase
{
    /**
     * The files that install grids: the core and the modules whose grids once stayed classic.
     */
    private const INSTALL = [
        'install/sql/system.sql',
        'modules/boonex/dolphin_migration/install/sql/enable.sql',
        'modules/boonex/se_migration/install/sql/enable.sql',
        'modules/boonex/editor/install/sql/enable.sql',
        'modules/boonex/help_tours/install/sql/enable.sql',
    ];

    /**
     * Studio's grids that are not named sys_studio_*.
     */
    private const STUDIO_TOO = ['sys_badges_administration'];

    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    public function testANewSiteDrawsEveryGridWithAgGrid(): void
    {
        $sSql = self::read('install/sql/system.sql');

        $this->assertMatchesRegularExpression("/CREATE TABLE IF NOT EXISTS `sys_objects_grid` \\([^;]*\\n  `engine` varchar\\(16\\) NOT NULL DEFAULT 'ag',/", $sSql);

        // No grid is set one by one, to AG Grid or back to the classic grid.
        foreach (self::INSTALL as $sPath)
            $this->assertDoesNotMatchRegularExpression("/SET `engine` = /", self::read($sPath), $sPath . ' sets a grid\'s engine.');
    }

    public function testAnUpdatedSiteMovesEveryStudioGridAndNoOther(): void
    {
        // The column an updated site gets is '' by default: its grids keep the classic grid.
        $this->assertStringContainsString("'engine', \"varchar(16) NOT NULL DEFAULT ''", self::read('migrations/2026112000_grid_engine.php'));

        $aMoved = [];
        foreach (glob(__DIR__ . '/../../../migrations/*.sql') as $sFile) {
            $sSql = str_replace("\r\n", "\n", file_get_contents($sFile));
            if (!preg_match_all("/UPDATE `sys_objects_grid` SET `engine` = 'ag' WHERE `object` (?:= '([a-z_]+)'|IN \\(([^)]*)\\))/", $sSql, $aMatches, PREG_SET_ORDER))
                continue;

            foreach ($aMatches as $aMatch) {
                $aObjects = !empty($aMatch[1]) ? [$aMatch[1]] : array_map(fn($s) => trim($s, " '"), explode(',', $aMatch[2]));
                foreach ($aObjects as $sObject)
                    $aMoved[$sObject] = basename($sFile);
            }
        }

        foreach ($aMoved as $sObject => $sFile)
            $this->assertTrue(str_starts_with($sObject, 'sys_studio_') || in_array($sObject, self::STUDIO_TOO), $sFile . ' moves ' . $sObject . ', which is not a Studio grid.');

        preg_match_all("/^\\('(sys_studio_[a-z_]+)', '(?:Sql|Array)'/m", self::read('install/sql/system.sql'), $aGrids);
        $this->assertNotEmpty($aGrids[1]);
        foreach (array_unique($aGrids[1]) as $sObject)
            $this->assertArrayHasKey($sObject, $aMoved, $sObject . ' is a Studio grid no migration moves.');
    }
}
