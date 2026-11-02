<?php

/**
 * The page manage menu (sys_site_manage) wraps a module's view-entry menu. That menu's items check access against
 * the content, so it must get the content id before it is asked whether it is visible: asked first, its checks ran
 * on an empty entry, and on a page whose URL carries no id (the profile feed, timeline-view) PHP printed an
 * "Undefined array key" warning into the API reply, which broke the page's JSON.
 */
class BxBaseMenuManageTest extends BxDolTestCase
{
    private static function menuManage(object $oManaged, int $iContentId): BxTemplMenuManage
    {
        $oReflection = new ReflectionClass(BxTemplMenuManage::class);
        $oMenu = $oReflection->newInstanceWithoutConstructor();
        foreach (['_aObject' => ['active' => 1], '_oObjectManage' => $oManaged, '_sObjectManage' => 'test_manage', '_bAsButton' => false, '_iContentId' => 0] as $sProperty => $mValue) {
            $oProperty = new ReflectionProperty(BxBaseMenuManage::class, $sProperty);
            $oProperty->setValue($oMenu, $mValue);
        }
        $oMenu->setContentId($iContentId);

        return $oMenu;
    }

    private static function managedMenu(): object
    {
        return new class {
            public array $aCalls = [];
            public function setContentId($iContentId) { $this->aCalls[] = 'setContentId:' . $iContentId; }
            public function isVisible() { $this->aCalls[] = 'isVisible'; return true; }
            public function getCodeAPI() { $this->aCalls[] = 'getCodeAPI'; return ['items' => []]; }
        };
    }

    public function testManagedMenuGetsTheContentIdBeforeItIsAskedIfVisible(): void
    {
        $oManaged = self::managedMenu();
        $this->assertTrue(self::menuManage($oManaged, 7)->isVisible());
        $this->assertSame(['setContentId:7', 'isVisible'], $oManaged->aCalls);
    }

    public function testApiCodeComesFromTheManagedMenuWithItsContentId(): void
    {
        $oManaged = self::managedMenu();
        $this->assertSame(['items' => []], self::menuManage($oManaged, 7)->getCodeAPI());
        $this->assertSame('setContentId:7', $oManaged->aCalls[0]);
        $this->assertSame('getCodeAPI', end($oManaged->aCalls));
    }

    public function testNoContentIdLeavesTheManagedMenuAlone(): void
    {
        $oManaged = self::managedMenu();
        $this->assertTrue(self::menuManage($oManaged, 0)->isVisible());
        $this->assertSame(['isVisible'], $oManaged->aCalls);
    }
}
