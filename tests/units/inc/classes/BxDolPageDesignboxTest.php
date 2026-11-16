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

    public function testSizesOnlyWhereTheDesignBoxHasThePart(): void
    {
        $this->assertSame(['title', 'padding'], BxDolPageDesignbox::SIZED_PARTS);
        $this->assertSame(['compact', 'large'], BxDolPageDesignbox::SIZES);

        $this->assertSame('compact', BxDolPageDesignbox::getSize(['designbox_id' => BX_DB_PADDING_DEF, 'padding_size' => 'compact'], 'padding'));
        $this->assertSame('large', BxDolPageDesignbox::getSize(['designbox_id' => (string)BX_DB_PADDING_NO_CAPTION, 'padding_size' => 'large'], 'padding'));
        $this->assertSame('large', BxDolPageDesignbox::getSize(['designbox_id' => BX_DB_PADDING_DEF, 'title_size' => 'large'], 'title'));
        $this->assertSame('', BxDolPageDesignbox::getSize(['designbox_id' => BX_DB_PADDING_DEF], 'padding'), 'Regular when unset.');
        $this->assertSame('', BxDolPageDesignbox::getSize(['designbox_id' => BX_DB_PADDING_DEF, 'padding_size' => 'relaxed'], 'padding'), 'Relaxed is now Large.');
        $this->assertSame('', BxDolPageDesignbox::getSize(['designbox_id' => BX_DB_PADDING_DEF, 'padding_size' => 'huge'], 'padding'), 'Only the sizes it knows.');
        $this->assertSame('', BxDolPageDesignbox::getSize(['designbox_id' => 1, 'padding_size' => 'compact'], 'padding'), 'Design box 1 has no padding.');
        $this->assertSame('', BxDolPageDesignbox::getSize(['designbox_id' => BX_DB_PADDING_NO_CAPTION, 'title_size' => 'compact'], 'title'), 'Design box 13 has no title.');
        $this->assertSame('', BxDolPageDesignbox::getSize(['padding_size' => 'compact'], 'padding'), 'No design box, no padding.');
        $this->assertSame('', BxDolPageDesignbox::getSize(['designbox_id' => BX_DB_PADDING_DEF, 'bg_size' => 'large'], 'bg'), 'Only title and padding have sizes.');

        $this->assertSame('bx-db-title-large bx-db-padding-compact', BxDolPageDesignbox::getSizeClasses(['designbox_id' => BX_DB_PADDING_DEF, 'padding_size' => 'compact', 'title_size' => 'large']));
        $this->assertSame('bx-db-padding-compact', BxDolPageDesignbox::getSizeClasses(['designbox_id' => BX_DB_PADDING_NO_CAPTION, 'padding_size' => 'compact', 'title_size' => 'large']));
        $this->assertSame('', BxDolPageDesignbox::getSizeClasses(['designbox_id' => BX_DB_PADDING_DEF, 'padding_size' => '', 'title_size' => '']));

        $this->assertSame('', BxDolPageDesignbox::normalizeSize(null));
        $this->assertSame('', BxDolPageDesignbox::normalizeSize('Compact'));
    }

    public function testSiteRulesForEachSize(): void
    {
        $sCss = (string)file_get_contents(BX_DIRECTORY_PATH_ROOT . 'template/css/page_layouts.css');
        foreach (BxDolPageDesignbox::SIZES as $sSize) {
            $this->assertStringContainsString('.bx-db-padding-' . $sSize . ' > .bx-db-container > .bx-db-header {', $sCss, $sSize);
            $this->assertStringContainsString('.bx-db-padding-' . $sSize . ' > .bx-db-container > .bx-content-padding-block {', $sCss, $sSize);
            $this->assertStringContainsString('.bx-db-title-' . $sSize . ' > .bx-db-container > .bx-db-header .bx-db-title {', $sCss, $sSize);
        }

        // "Padding hidden on" takes the title's side padding off with a selector of the same weight, so it comes later.
        $this->assertLessThan(strpos($sCss, '.bx-db-hide-padding-phone .bx-db-header'), strpos($sCss, '.bx-db-padding-large > .bx-db-container > .bx-db-header'));

        // The design boxes with padding inset the title by 16px (px-4 pt-4) and the content with bx-content-padding-block.
        foreach ([10, 11, 13, 14] as $iBox) {
            $this->assertTrue(BxDolPageDesignbox::hasPart($iBox, 'padding'), (string)$iBox);
            $sHtml = (string)file_get_contents(BX_DIRECTORY_PATH_ROOT . 'template/designbox_' . $iBox . '.html');
            $this->assertStringContainsString('<div class="bx-db-header px-4 pt-4', $sHtml, (string)$iBox);
            $this->assertStringContainsString('<div class="bx-db-content bx-content-padding-block', $sHtml, (string)$iBox);
        }

        // The design boxes with a title draw it in .bx-db-title inside .bx-db-header, where the title size reaches it.
        foreach ([1, 4, 11, 14] as $iBox) {
            $this->assertTrue(BxDolPageDesignbox::hasPart($iBox, 'title'), (string)$iBox);
            $this->assertMatchesRegularExpression('/<div class="bx-db-header[^"]*">\\s*<div class="bx-db-title/', (string)file_get_contents(BX_DIRECTORY_PATH_ROOT . 'template/designbox_' . $iBox . '.html'), (string)$iBox);
        }
    }
}
