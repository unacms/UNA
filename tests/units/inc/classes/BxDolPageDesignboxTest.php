<?php

/**
 * A block's design box per screen size (Studio: "Title / Background / Padding hidden on"): the site hides those parts
 * with classes, only where the block's design box has them.
 */
class BxDolPageDesignboxTest extends BxDolTestCase
{
    private function bits(int ...$aHidden): int
    {
        $i = 0;
        foreach ($aHidden as $iHidden)
            $i |= pow(2, $iHidden - 1);
        return $i;
    }

    public function testPartsFollowTheDesignBoxTemplates(): void
    {
        $this->assertTrue(BxDolPageDesignbox::hasPart(BX_DB_PADDING_DEF, 'title'));
        $this->assertTrue(BxDolPageDesignbox::hasPart(BX_DB_PADDING_DEF, 'bg'));
        $this->assertTrue(BxDolPageDesignbox::hasPart(BX_DB_PADDING_DEF, 'padding'));
        $this->assertFalse(BxDolPageDesignbox::hasPart(BX_DB_PADDING_NO_CAPTION, 'title'), 'Design box 13 draws no title.');
        $this->assertFalse(BxDolPageDesignbox::hasPart(0, 'bg'));
        $this->assertFalse(BxDolPageDesignbox::hasPart(BX_DB_PADDING_DEF, 'icon'), 'Only title, bg and padding.');

        // The templates agree: each design box without a part says so in its container's classes.
        foreach ([3 => 'bx-dbc-notitle', 4 => 'bx-dbc-nobg', 1 => 'bx-dbc-nopadding'] as $iBox => $sClass)
            $this->assertStringContainsString($sClass, (string)file_get_contents(BX_DIRECTORY_PATH_ROOT . 'template/designbox_' . $iBox . '.html'));
    }

    public function testHiddenPartsGetSiteClasses(): void
    {
        $aBlock = ['designbox_id' => BX_DB_PADDING_DEF, 'title_hidden_on' => $this->bits(BX_DB_HIDDEN_PHONE, BX_DB_HIDDEN_MOBILE), 'bg_hidden_on' => $this->bits(BX_DB_HIDDEN_DESKTOP), 'padding_hidden_on' => ''];
        $this->assertSame('bx-db-hide-title-phone bx-db-hide-bg-desktop', BxDolPageDesignbox::getHiddenOnClasses($aBlock), 'The mobile app has no class on the site.');

        $aBlock['designbox_id'] = BX_DB_PADDING_NO_CAPTION;
        $this->assertSame('bx-db-hide-bg-desktop', BxDolPageDesignbox::getHiddenOnClasses($aBlock), 'No title to hide.');

        $this->assertSame('', BxDolPageDesignbox::getHiddenOnClasses(['designbox_id' => BX_DB_PADDING_DEF]));
    }

    public function testScreenSizeNamesForTheApps(): void
    {
        $this->assertSame(['phone', 'mobile-app'], BxBasePage::getHiddenOnNamesAPI($this->bits(BX_DB_HIDDEN_PHONE, BX_DB_HIDDEN_MOBILE)));
        $this->assertSame(['tablet', 'desktop'], BxBasePage::getHiddenOnNamesAPI((string)$this->bits(BX_DB_HIDDEN_TABLET, BX_DB_HIDDEN_DESKTOP)));
        $this->assertSame([], BxBasePage::getHiddenOnNamesAPI(''));
    }

    public function testSiteRulesForEachPart(): void
    {
        $sCss = (string)file_get_contents(BX_DIRECTORY_PATH_ROOT . 'template/css/page_layouts.css');
        foreach (BxDolPageDesignbox::PARTS as $sPart)
            foreach (['phone', 'tablet', 'desktop'] as $sSize)
                $this->assertStringContainsString('.bx-media-' . $sSize . ' .bx-db-hide-' . $sPart . '-' . $sSize, $sCss);
    }
}
