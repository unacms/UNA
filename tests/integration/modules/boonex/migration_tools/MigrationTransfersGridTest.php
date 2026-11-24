<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The Dolphin Migration and SE Migration transfer grids run imports and delete content,
 * so only admins get them.
 */
#[Group('integration')]
class MigrationTransfersGridTest extends BxDolIntegrationTestCase
{
    public static function grids(): array
    {
        return [
            'Dolphin Migration' => ['bx_dolphin_migration', 'bx_dolphin_migration_transfers'],
            'SE Migration' => ['bx_se_migration', 'bx_se_migration_transfers'],
        ];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('grids')]
    public function testOnlyAdminsGetTheGrid(string $sModule, string $sGrid)
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName($sModule))
            $this->markTestSkipped($sModule . ' is not installed.');

        $this->bxLoginAsUser();
        unset($GLOBALS['bxDolClasses']['BxDolGrid!' . $sGrid]);
        $this->assertFalse(BxDolGrid::getObjectInstance($sGrid), 'A member gets the transfers grid.');

        $this->bxBecomeGuest();
        unset($GLOBALS['bxDolClasses']['BxDolGrid!' . $sGrid]);
        $this->assertFalse(BxDolGrid::getObjectInstance($sGrid), 'A guest gets the transfers grid.');

        $this->bxLoginAsAdmin();
        unset($GLOBALS['bxDolClasses']['BxDolGrid!' . $sGrid]);
        $this->assertInstanceOf(BxDolGrid::class, BxDolGrid::getObjectInstance($sGrid));
        unset($GLOBALS['bxDolClasses']['BxDolGrid!' . $sGrid]);
    }
}
