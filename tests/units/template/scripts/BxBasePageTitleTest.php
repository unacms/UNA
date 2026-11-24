<?php

/**
 * The page title has settings of its own, apart from the cover (Studio > Pages > page > Title): who sees it, the screen
 * sizes it is hidden on and its custom text. A page whose title was never set (NULL) follows its cover, as every page did
 * before. BxBasePage resolves them, BxBaseCover turns them into the parts of the page's cover.
 */
class BxBasePageTitleTest extends BxDolTestCase
{
    /** A page object with these fields, without running the page's constructor. */
    private static function page(array $aObject): BxBasePage
    {
        $oPage = (new ReflectionClass('BxTemplPage'))->newInstanceWithoutConstructor();
        $oProp = new ReflectionProperty('BxDolPage', '_aObject');
        $oProp->setValue($oPage, array_merge(['cover' => 1, 'cover_hidden_on' => '', 'cover_title' => ''], $aObject));

        return $oPage;
    }

    private static function bits(array $aSizes): int
    {
        return BxBaseCover::getHiddenOnBits($aSizes);
    }

    public function testAudience(): void
    {
        foreach ([[0, false, false], [0, true, false], [1, false, true], [1, true, true], [2, false, true], [2, true, false], [3, false, false], [3, true, true], ['1', true, true], [true, false, true], [false, true, false]] as [$mixedMode, $bMember, $bShown])
            $this->assertSame($bShown, BxBasePage::isShownToViewer($mixedMode, $bMember), var_export($mixedMode, true) . ($bMember ? ' member' : ' guest'));
    }

    public function testTitleNeverSetFollowsTheCover(): void
    {
        if (!BxDolCover::getInstance()->isEnabled())
            $this->markTestSkipped('Covers are off in Studio > Designer > Cover.');

        $oPage = self::page(['cover' => 3, 'cover_hidden_on' => (string)self::bits([BX_DB_HIDDEN_PHONE]), 'title_show' => null, 'title_hidden_on' => null]);
        $this->assertSame(3, (int)$oPage->getPageTitleMode(), 'The cover\'s audience.');
        $this->assertSame(self::bits([BX_DB_HIDDEN_PHONE]), $oPage->getPageTitleHiddenOn(), 'The cover\'s screen sizes.');

        $oPage = self::page(['cover' => 0]);
        $this->assertSame(0, (int)$oPage->getPageTitleMode(), 'No cover, no title, as before.');

        // A page that sets its cover in code (setPageCover) takes its title along.
        $oPage = self::page(['cover' => 1]);
        $oPage->setPageCover(false);
        $this->assertFalse($oPage->isPageTitle());
    }

    public function testTitleApartFromTheCover(): void
    {
        $oPage = self::page(['cover' => 0, 'cover_hidden_on' => (string)self::bits([BX_DB_HIDDEN_DESKTOP]), 'title_show' => '2', 'title_hidden_on' => (string)self::bits([BX_DB_HIDDEN_TABLET])]);
        $this->assertSame(2, $oPage->getPageTitleMode(), 'Guests only, with the cover off.');
        $this->assertSame(self::bits([BX_DB_HIDDEN_TABLET]), $oPage->getPageTitleHiddenOn(), 'Its own screen sizes.');
        $this->assertSame(self::bits([BX_DB_HIDDEN_DESKTOP]), $oPage->getPageCoverHiddenOn(), 'The cover keeps its own.');

        $oPage = self::page(['cover' => 1, 'title_show' => '0', 'title_hidden_on' => '']);
        $this->assertSame(0, $oPage->getPageTitleMode(), 'The cover without the title.');
        $this->assertSame(0, $oPage->getPageTitleHiddenOn(), 'Hidden nowhere, not the cover\'s.');
        $this->assertFalse($oPage->isPageTitle());
    }

    public function testCustomTitleFallsBackToThePageTitle(): void
    {
        $this->assertSame('Posts', BxBasePage::getCustomTitle('Posts', ''), 'No custom title.');
        $this->assertSame('Posts', BxBasePage::getCustomTitle('Posts', '_bx_no_such_key_for_a_title_test'), 'A key with no translation.');

        $sKey = '_adm_bp_txt_page_title_show';
        $this->assertNotSame($sKey, _t($sKey), 'The key is translated.');
        $this->assertSame(_t($sKey), BxBasePage::getCustomTitle('Posts', $sKey), 'A translated custom title wins.');
    }

    public function testHiddenOnClasses(): void
    {
        $this->assertSame('', BxBaseCover::getHiddenOnClasses(0));
        $this->assertSame('bx-def-media-phone-hide bx-def-media-tablet-hide bx-def-media-desktop-hide', BxBaseCover::getHiddenOnClasses(0, true));
        $this->assertSame('bx-def-media-desktop-hide', BxBaseCover::getHiddenOnClasses(self::bits([BX_DB_HIDDEN_DESKTOP, BX_DB_HIDDEN_MOBILE])), 'The mobile app is not a screen size of the site.');
        $this->assertSame('bx-def-media-phone-hide bx-def-media-tablet-hide', BxBaseCover::getHiddenOnClasses(self::bits([BX_DB_HIDDEN_DESKTOP]), true));
    }

    public function testCoverParts(): void
    {
        if (!BxDolCover::getInstance()->isEnabled())
            $this->markTestSkipped('Covers are off in Studio > Designer > Cover.');

        $oCover = BxDolCover::getInstance();
        $oCover->setPageCoverOff(false);
        $bMember = isLogged();
        $iMemberMode = $bMember ? 3 : 2;
        $iOtherMode = $bMember ? 2 : 3;

        $a = $oCover->getPageParts(self::page(['cover' => 1, 'title_show' => '1', 'title_hidden_on' => '']));
        $this->assertTrue($a['band'] && $a['title'], 'Both.');

        $a = $oCover->getPageParts(self::page(['cover' => 1, 'title_show' => '0']));
        $this->assertTrue($a['band'] && !$a['title'], 'The cover without the title.');

        $a = $oCover->getPageParts(self::page(['cover' => 0, 'title_show' => (string)$iMemberMode]));
        $this->assertTrue(!$a['band'] && $a['title'], 'The title without the cover, for this viewer.');

        $a = $oCover->getPageParts(self::page(['cover' => $iOtherMode, 'title_show' => (string)$iOtherMode]));
        $this->assertTrue(!$a['band'] && !$a['title'], 'Neither, for the other audience only.');

        $iDesktop = self::bits([BX_DB_HIDDEN_DESKTOP]);
        $a = $oCover->getPageParts(self::page(['cover' => 1, 'title_show' => '1', 'title_hidden_on' => (string)$iDesktop]));
        $this->assertTrue($a['title'], 'Hidden on desktop only: still on.');
        $this->assertSame($iDesktop, $a['title_hidden_on']);

        $iSite = self::bits([BX_DB_HIDDEN_PHONE, BX_DB_HIDDEN_TABLET, BX_DB_HIDDEN_DESKTOP]);
        $a = $oCover->getPageParts(self::page(['cover' => 1, 'cover_hidden_on' => (string)$iSite, 'title_show' => '1', 'title_hidden_on' => '']));
        $this->assertTrue(!$a['band'] && $a['title'], 'A cover hidden on every screen size of the site is off there.');

        $oCover->setPageCoverOff(true);
        $a = $oCover->getPageParts(self::page(['cover' => 1, 'title_show' => '1']));
        $this->assertTrue(!$a['band'] && !$a['title'], 'A page showing a message has neither.');
        $oCover->setPageCoverOff(false);
    }
}
