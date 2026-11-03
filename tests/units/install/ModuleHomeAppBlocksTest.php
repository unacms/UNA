<?php

/**
 * App blocks of the modules' home pages, read from each module's install SQL. NEO lists only the first browse
 * block of a page's center column, so a home page that sends its Featured block to the app shows that list
 * (empty until an admin features something) in place of the latest entries.
 */
class ModuleHomeAppBlocksTest extends \PHPUnit\Framework\TestCase
{
    public static function featuredHomeBlocks(): array
    {
        $aResult = [];
        foreach (glob(__DIR__ . '/../../../modules/boonex/*/install/sql/enable.sql') as $sFile) {
            $sModule = basename(dirname($sFile, 3));
            $sSql = (string)file_get_contents($sFile);

            // A block row: object, cell, module, [title_system,] title, designbox, levels, 'service', content calling
            // browse_featured. Some modules leave title_system out of the column list.
            preg_match_all("/^\\('(bx_[a-z_]+_home)', \\d+, '[a-z_]+', (?:'[^']*', )?'([^']+)', \\d+, \\d+, 'service', [^\\n]*\"browse_featured\"/m", $sSql, $aMatches, PREG_SET_ORDER);
            foreach ($aMatches as $aMatch)
                $aResult[$aMatch[1] . ' ' . $aMatch[2]] = [$sModule, $aMatch[1], $aMatch[2]];
        }

        return $aResult;
    }

    public function testHomePagesHaveFeaturedBlocks(): void
    {
        // Guards the data provider: if the pattern stops matching, the test below would pass on nothing.
        $this->assertArrayHasKey('bx_persons_home _bx_persons_page_block_title_featured_profiles', self::featuredHomeBlocks());
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('featuredHomeBlocks')]
    public function testFeaturedHomeBlockIsNotInApp(string $sModule, string $sObject, string $sTitle): void
    {
        $sFile = __DIR__ . '/../../../modules/boonex/' . $sModule . '/install/sql/enable-app.sql';
        $sSql = is_file($sFile) ? (string)file_get_contents($sFile) : '';
        $sPattern = "/SET `active_api`=1[^;]* WHERE `object`='" . preg_quote($sObject, '/') . "'[^;]* AND `title`='" . preg_quote($sTitle, '/') . "';/";

        $this->assertDoesNotMatchRegularExpression($sPattern, $sSql, "{$sObject}: the app lists the latest entries, so Featured stays on the site only.");
    }
}
