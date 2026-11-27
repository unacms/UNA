<?php

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * BxDolMigrationsHelper without a database: the spellings of a version that moduleUpdated() accepts.
 */
class BxDolMigrationsHelperTest extends BxDolTestCase
{
    public static function providerVersionVariants(): array
    {
        return [
            'plain' => ['15.0.3', ['15.0.3']],
            'dash before a tag' => ['15.0.0-RC3', ['15.0.0-RC3', '15.0.0.RC3']],
            'dot before a tag' => ['15.0.0.RC3', ['15.0.0.RC3', '15.0.0-RC3']],
            'dev suffix' => ['15.0.4.DEV', ['15.0.4.DEV', '15.0.4-DEV']],
        ];
    }

    #[DataProvider('providerVersionVariants')]
    public function testGetVersionVariants(string $sVersion, array $aExpected): void
    {
        $this->assertSame($aExpected, BxDolMigrationsHelper::getVersionVariants($sVersion));
    }

    /**
     * A system update pack runs migrations in the request that copied the new files, where the classes it
     * loaded before the copy are still the previous version (RC5 trial: BxDolModuleQuery::getConfigDeprecation
     * was undefined there and the whole system update stopped). Migration code calls only the migration classes
     * and functions that every supported version has.
     */
    public function testMigrationCodeCallsNoClassThatAPackRequestLoadedEarlier(): void
    {
        foreach (['BxDolMigrations.php', 'BxDolMigrationsQuery.php', 'BxDolMigrationsHelper.php'] as $sFile) {
            $sCode = (string)file_get_contents(BX_DIRECTORY_PATH_ROOT . 'inc/classes/' . $sFile);
            $this->assertDoesNotMatchRegularExpression('/BxDolModuleQuery\s*::/', $sCode, $sFile . ' calls BxDolModuleQuery, which a pack request has in its previous version.');
        }

        $this->assertSame(['deprecated' => 1, 'replaced_by' => 'system'], BxDolMigrationsQuery::getConfigDeprecation(['deprecated' => ['replaced_by' => 'system']]));
        $this->assertSame(BxDolMigrationsQuery::getConfigDeprecation(['deprecated' => true]), BxDolModuleQuery::getConfigDeprecation(['deprecated' => true]));
        $this->assertNull(BxDolMigrationsQuery::getConfigDeprecation(['name' => 'bx_x']));
    }
}
