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
}
