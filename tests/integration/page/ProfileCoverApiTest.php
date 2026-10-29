<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * A profile page in the API doesn't build the HTML cover: BxBasePage makes the cover block from
 * the profile and the entry's menus. The cover is still set, and those menus get the entry just
 * as the HTML cover gives it to them.
 */
#[Group('integration')]
class ProfileCoverApiTest extends BxDolIntegrationTestCase
{
    protected $_aGetBackup = [];
    protected $_aClassesBackup = [];

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_persons'))
            $this->markTestSkipped('Persons are not installed.');

        $this->_aGetBackup = $_GET;
        $this->_aClassesBackup = $GLOBALS['bxDolClasses'] ?? [];
    }

    protected function tearDown(): void
    {
        $_GET = $this->_aGetBackup;

        // The cover and the menus keep the entry they were given: put the shared objects back.
        foreach (array_keys($GLOBALS['bxDolClasses'] ?? []) as $sKey)
            if (!array_key_exists($sKey, $this->_aClassesBackup))
                unset($GLOBALS['bxDolClasses'][$sKey]);
        foreach ($this->_aClassesBackup as $sKey => $o)
            $GLOBALS['bxDolClasses'][$sKey] = $o;

        parent::tearDown();
    }

    protected function module(): BxPersonsModule
    {
        return BxDolModule::getInstance('bx_persons');
    }

    /**
     * The first active person's row.
     */
    protected function person(): array
    {
        $iContentId = (int)BxDolDb::getInstance()->getOne("SELECT `content_id` FROM `sys_profiles` WHERE `type` = 'bx_persons' AND `status` = 'active' ORDER BY `id` ASC LIMIT 1");
        $aData = $iContentId ? $this->module()->_oDb->getContentInfoById($iContentId) : [];
        if (empty($aData))
            $this->markTestSkipped('There are no active persons.');

        return $aData;
    }

    /**
     * The persons template, counting the HTML covers it prepares.
     */
    protected function spyTemplate()
    {
        $oModule = $this->module();
        bx_import('Template', $oModule->_aModule);

        return new class($oModule->_oConfig, $oModule->_oDb) extends BxPersonsTemplate {
            public int $iHtmlCovers = 0;

            function prepareCover($aData, $aParams = [])
            {
                $this->iHtmlCovers++;
                return parent::prepareCover($aData, $aParams);
            }
        };
    }

    /**
     * What the API cover block reads after $fSet sets the cover, starting from fresh objects.
     */
    protected function coverBlockParts(callable $fSet): array
    {
        $CNF = &$this->module()->_oConfig->CNF;
        $aMenus = ['meta' => $CNF['OBJECT_MENU_VIEW_ENTRY_META'], 'actions' => $CNF['OBJECT_MENU_ACTIONS_VIEW_ENTRY_ALL']];

        unset($GLOBALS['bxDolClasses']['BxDolCover']);
        foreach ($aMenus as $sMenu)
            unset($GLOBALS['bxDolClasses']['BxDolMenu!' . $sMenu]);

        $fSet();

        $aParts = ['cover' => BxDolCover::getInstance()->isCover()];
        foreach ($aMenus as $sKey => $sMenu)
            $aParts[$sKey] = $this->withoutTs(BxTemplMenu::getObjectInstance($sMenu)->getCodeAPI());

        return $aParts;
    }

    /**
     * Elements carry the time they were built.
     */
    protected function withoutTs($mixed)
    {
        if (!is_array($mixed))
            return $mixed;

        unset($mixed['ts']);
        return array_map([$this, 'withoutTs'], $mixed);
    }

    public function testApiCoverGivesTheMenusTheEntryWithoutTheHtmlCover(): void
    {
        $this->bxLoginAsAdmin();
        $_GET['api'] = 1;
        $aData = $this->person();
        $oTemplate = $this->spyTemplate();

        $aHtmlCover = $this->coverBlockParts(function () use ($oTemplate, $aData) {
            BxDolCover::getInstance($oTemplate)->set($oTemplate->prepareCover($aData, ['page' => false]));
        });
        $aApiCover = $this->coverBlockParts(function () use ($oTemplate, $aData) {
            $oTemplate->setCover(false, $aData);
        });

        $this->assertSame(1, $oTemplate->iHtmlCovers, 'setCover in the API prepares no HTML cover.');
        $this->assertTrue($aApiCover['cover'], 'The page still has a cover.');
        $this->assertNotEmpty($aApiCover['actions']);
        $this->assertEquals($aHtmlCover, $aApiCover, 'The cover block reads the same menus.');
    }

    public function testPageCoverIsStillHtml(): void
    {
        unset($_GET['api']);
        $aData = $this->person();
        $oTemplate = $this->spyTemplate();

        $this->coverBlockParts(function () use ($oTemplate, $aData) {
            $oTemplate->setCover(false, $aData);
        });

        $this->assertSame(1, $oTemplate->iHtmlCovers);
        $this->assertTrue(BxDolCover::getInstance()->isCover());
    }
}
