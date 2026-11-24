<?php

/**
 * Section cover and title settings (BxDolPage): a page's field left to its section (NULL, "Same as section") takes the
 * section's value, a section without settings and a page outside any section the defaults; the title's fields may stay
 * NULL and then follow the page's cover (BxBasePage). The migration that made sections seeds a section from its pages
 * (getSectionSeed) and sets the pages that match it to take it (getSectionPagesMatching).
 */
class BxDolPageSectionsTest extends BxDolTestCase
{
    private const NULLS = ['cover' => null, 'cover_image' => null, 'cover_hidden_on' => null, 'title_show' => null, 'title_hidden_on' => null];

    /** A page object with these resolved fields, without running the page's constructor. */
    private static function page(array $aObject): BxBasePage
    {
        $oPage = (new ReflectionClass('BxTemplPage'))->newInstanceWithoutConstructor();
        (new ReflectionProperty('BxDolPage', '_aObject'))->setValue($oPage, array_merge(['cover_title' => ''], $aObject));

        return $oPage;
    }

    private static function bits(array $aSizes): int
    {
        return BxBaseCover::getHiddenOnBits($aSizes);
    }

    public function testPageTakesItsSectionsValues(): void
    {
        $aSection = ['cover' => '0', 'cover_image' => '15', 'cover_hidden_on' => '1', 'title_show' => '2', 'title_hidden_on' => '4'];
        $aPage = BxDolPage::resolveSectionSettings(self::NULLS + ['object' => 'p'], $aSection);

        $this->assertSame('0', $aPage['cover']);
        $this->assertSame('15', $aPage['cover_image']);
        $this->assertSame('1', $aPage['cover_hidden_on']);
        $this->assertSame('2', $aPage['title_show']);
        $this->assertSame('4', $aPage['title_hidden_on']);
        $this->assertSame('p', $aPage['object'], 'Other fields stay.');
    }

    public function testPageOverridesItsSection(): void
    {
        $aSection = ['cover' => '0', 'cover_image' => '15', 'cover_hidden_on' => '1', 'title_show' => '0', 'title_hidden_on' => '4'];
        $aPage = BxDolPage::resolveSectionSettings(['cover' => '3', 'cover_image' => '0', 'cover_hidden_on' => '', 'title_show' => '1', 'title_hidden_on' => ''], $aSection);

        $this->assertSame('3', $aPage['cover'], 'Its own audience.');
        $this->assertSame('0', $aPage['cover_image'], 'Its own "no picture": the site\'s.');
        $this->assertSame('', $aPage['cover_hidden_on'], 'Hidden nowhere is a value, not "as the section".');
        $this->assertSame('1', $aPage['title_show']);
        $this->assertSame('', $aPage['title_hidden_on']);

        // One field its own, the others the section's.
        $aPage = BxDolPage::resolveSectionSettings(['cover' => '1'] + self::NULLS, $aSection);
        $this->assertSame('1', $aPage['cover']);
        $this->assertSame('15', $aPage['cover_image']);
        $this->assertSame('1', $aPage['cover_hidden_on']);
    }

    public function testDefaultsOutsideAnySectionAndForASectionWithoutSettings(): void
    {
        foreach ([false, [], ['cover' => null, 'title_show' => null]] as $mixedSection) {
            $aPage = BxDolPage::resolveSectionSettings(self::NULLS, $mixedSection);
            $this->assertSame(1, $aPage['cover'], 'Cover on for everyone, as before.');
            $this->assertSame(0, $aPage['cover_image'], 'The site\'s picture.');
            $this->assertSame('', $aPage['cover_hidden_on']);
            $this->assertNull($aPage['title_show'], 'The title as the cover.');
            $this->assertNull($aPage['title_hidden_on']);
        }
    }

    public function testTitleFollowsTheResolvedCover(): void
    {
        if (!BxDolCover::getInstance()->isEnabled())
            $this->markTestSkipped('Covers are off in Studio > Designer > Cover.');

        // The section leaves the title to the cover; the page overrides the cover only.
        $aSection = ['cover' => '1', 'cover_image' => '0', 'cover_hidden_on' => '', 'title_show' => null, 'title_hidden_on' => null];
        $oPage = self::page(BxDolPage::resolveSectionSettings(['cover' => '3', 'cover_hidden_on' => (string)self::bits([BX_DB_HIDDEN_PHONE])] + self::NULLS, $aSection));
        $this->assertSame(3, (int)$oPage->getPageTitleMode(), 'The page\'s own cover audience.');
        $this->assertSame(self::bits([BX_DB_HIDDEN_PHONE]), $oPage->getPageTitleHiddenOn());

        // The section's cover off: the page's title, as the cover, is off too.
        $oPage = self::page(BxDolPage::resolveSectionSettings(self::NULLS, ['cover' => '0'] + $aSection));
        $this->assertFalse($oPage->isPageCover());
        $this->assertSame(0, (int)$oPage->getPageTitleMode());
        $this->assertFalse($oPage->isPageTitle());

        // The section's own title setting wins over the cover.
        $oPage = self::page(BxDolPage::resolveSectionSettings(self::NULLS, ['cover' => '0', 'title_show' => '1', 'title_hidden_on' => ''] + $aSection));
        $this->assertSame(1, $oPage->getPageTitleMode());
        $this->assertSame(0, $oPage->getPageTitleHiddenOn());
    }

    public function testAudiencesFromTheSection(): void
    {
        foreach ([[1, true, true], [1, false, true], [2, false, true], [2, true, false], [3, false, false], [3, true, true], [0, true, false]] as [$iMode, $bMember, $bShown]) {
            $aPage = BxDolPage::resolveSectionSettings(self::NULLS, ['cover' => (string)$iMode]);
            $this->assertSame($bShown, BxBasePage::isShownToViewer($aPage['cover'], $bMember), $iMode . ($bMember ? ' member' : ' guest'));
        }
    }

    public function testHiddenOnFromTheSection(): void
    {
        $iBits = self::bits([BX_DB_HIDDEN_PHONE, BX_DB_HIDDEN_MOBILE]);
        $oPage = self::page(BxDolPage::resolveSectionSettings(self::NULLS, ['cover_hidden_on' => (string)$iBits]));
        $this->assertSame($iBits, $oPage->getPageCoverHiddenOn());
        $this->assertSame(['phone', 'mobile-app'], BxBasePage::getHiddenOnNamesAPI($oPage->getPageCoverHiddenOn()));
        $this->assertSame($iBits, $oPage->getPageTitleHiddenOn(), 'The title as the cover.');
    }

    public function testSeedTakesTheMostCommonValue(): void
    {
        $aPages = [
            'home' => ['cover' => '0', 'cover_image' => '0', 'cover_hidden_on' => '', 'title_show' => '0', 'title_hidden_on' => null],
            'active' => ['cover' => '1', 'cover_image' => '0', 'cover_hidden_on' => '', 'title_show' => null, 'title_hidden_on' => null],
            'online' => ['cover' => '1', 'cover_image' => '0', 'cover_hidden_on' => '0', 'title_show' => null, 'title_hidden_on' => null],
            'search' => ['cover' => '1', 'cover_image' => '0', 'cover_hidden_on' => '1', 'title_show' => null, 'title_hidden_on' => null],
        ];

        $aSection = BxDolPage::getSectionSeed($aPages, 'home');
        $this->assertSame(['cover' => 1, 'cover_image' => 0, 'cover_hidden_on' => 0, 'title_show' => null, 'title_hidden_on' => null], $aSection);

        // Home keeps its cover off and its title off as overrides; the others take the section's.
        $aMatching = BxDolPage::getSectionPagesMatching($aPages, $aSection);
        $this->assertSame(['cover_image', 'cover_hidden_on'], $aMatching['home']);
        $this->assertSame(['cover', 'cover_image', 'cover_hidden_on'], $aMatching['active']);
        $this->assertSame(['cover', 'cover_image', 'cover_hidden_on'], $aMatching['online'], '"0" hidden-on is "".');
        $this->assertSame(['cover', 'cover_image'], $aMatching['search'], 'Its own hidden-on stays.');
    }

    public function testSeedTieGoesToTheHomePage(): void
    {
        $aPages = [
            'a' => ['cover' => '3'] + self::NULLS,
            'home' => ['cover' => '2'] + self::NULLS,
            'b' => ['cover' => '2'] + self::NULLS,
            'c' => ['cover' => '3'] + self::NULLS,
        ];
        $this->assertSame(2, BxDolPage::getSectionSeed($aPages, 'home')['cover']);
        $this->assertSame(3, BxDolPage::getSectionSeed($aPages, '')['cover'], 'Without a home page, the first.');
        $this->assertSame(1, BxDolPage::getSectionSeed(['x' => self::NULLS], '')['cover'], 'No values: the default.');
    }

    public function testSeedTitleOnlyWhereNoPageFollowsTheCover(): void
    {
        $aPages = [
            'a' => ['title_show' => '1', 'title_hidden_on' => '2'] + self::NULLS,
            'b' => ['title_show' => '1', 'title_hidden_on' => '2'] + self::NULLS,
        ];
        $aSection = BxDolPage::getSectionSeed($aPages);
        $this->assertSame(1, $aSection['title_show']);
        $this->assertSame(2, $aSection['title_hidden_on']);
        $this->assertSame(['title_show', 'title_hidden_on'], BxDolPage::getSectionPagesMatching($aPages, $aSection)['a']);

        $aPages['c'] = self::NULLS;
        $aSection = BxDolPage::getSectionSeed($aPages);
        $this->assertNull($aSection['title_show'], 'A page follows its cover: so does the section.');
        $this->assertArrayNotHasKey('a', BxDolPage::getSectionPagesMatching($aPages, ['cover' => null] + $aSection), 'Nothing matches NULL.');
    }

    public function testOwnerCoverModeOfAPageClass(): void
    {
        $this->assertSame(0, BxDolPage::getOwnerCoverModeOf([]));
        $this->assertSame(0, BxDolPage::getOwnerCoverModeOf(['override_class_name' => 'BxTemplPageHome']));
        $this->assertSame(0, BxDolPage::getOwnerCoverModeOf(['override_class_name' => 'BxNoSuchPageClassForTest']));
        $this->assertSame(BX_PAGE_OWNER_COVER_ALWAYS, BxDolPage::getOwnerCoverModeOf(['override_class_name' => 'BxBaseModProfilePageEntry']));
        $this->assertSame(BX_PAGE_OWNER_COVER_OTHERS, BxDolPage::getOwnerCoverModeOf(['override_class_name' => 'BxBaseModTextPageAuthor']));
        $this->assertSame(BX_PAGE_OWNER_COVER_OTHERS, BxDolPage::getOwnerCoverModeOf(['override_class_name' => 'BxBaseModGroupsPageJoinedEntries']), 'A context\'s lists.');
    }
}
