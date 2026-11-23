<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * A section's title on the site (cover.html) shows the site menu item's icon, else the section's module's icon, as the
 * apps take the menu's `icon` when the item has none (BxBaseCover::getSectionIconCode).
 */
#[Group('integration')]
class CoverSectionIconTest extends BxDolIntegrationTestCase
{
    public function testTheMenuItemsIconComesFirst(): void
    {
        $this->assertSame('house', BxDolCover::getInstance()->getSectionIconCode('house', 'bx_persons'));
        $this->assertSame('house', BxDolCover::getInstance()->getSectionIconCode('house', 'system'));
    }

    public function testWithoutAMenuIconTheModulesIconIsUsed(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_persons'))
            $this->markTestSkipped('bx_persons is not installed');

        $sIcon = BxDolModule::getInstance('bx_persons')->_oConfig->CNF['ICON'];
        $this->assertNotEmpty($sIcon);
        $this->assertSame($sIcon, BxDolCover::getInstance()->getSectionIconCode('', 'bx_persons'));
    }

    public function testNoIconForSystemPagesOrModulesThatAreNotInstalled(): void
    {
        $this->assertSame('', BxDolCover::getInstance()->getSectionIconCode('', 'system'));
        $this->assertSame('', BxDolCover::getInstance()->getSectionIconCode('', ''));
        $this->assertSame('', BxDolCover::getInstance()->getSectionIconCode('', 'bx_no_such_module'));
    }
}
