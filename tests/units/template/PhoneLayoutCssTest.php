<?php

/**
 * Phone width: a cover picture fills the cover once instead of tiling under itself, and a grid that scrolls sideways
 * keeps everything inside it, so the page itself never scrolls sideways (People > Manage).
 */
class PhoneLayoutCssTest extends BxDolTestCase
{
    private static function read(string $sPath): string
    {
        return str_replace("\r\n", "\n", (string)file_get_contents(__DIR__ . '/../../../' . $sPath));
    }

    private static function rule(string $sCss, string $sSelector): string
    {
        if (!preg_match('/(^|\n)' . preg_quote($sSelector, '/') . '\s*\{([^}]*)\}/', $sCss, $aMatch))
            self::fail($sSelector . ' is not there');

        return $aMatch[2];
    }

    public function testCoverPicturesAreNotTiled(): void
    {
        foreach (['template/css/cover.css' => '.bg-cover', 'modules/boonex/artificer/data/template/system/css/cover.css' => '.bx-base-pofile-cover-image.bg-cover'] as $sFile => $sSelector) {
            $sRule = self::rule(self::read($sFile), $sSelector);
            $this->assertStringContainsString('background-size: cover !important;', $sRule, $sFile);
            $this->assertStringContainsString('background-repeat: no-repeat;', $sRule, $sFile);
        }
    }

    public function testRepositionCentresThePictureAcross(): void
    {
        $this->assertStringContainsString("'background-position: 50% ' . (float)\$aCoverData['y'] . '%'", self::read('modules/base/general/classes/BxBaseModGeneralTemplate.php'));
        $this->assertSame(2, substr_count(self::read('inc/js/classes/BxDolUploader.js'), "css('background-position', \"50% \" + "));
    }

    public function testGridScrollerClipsWhatIsPositionedInIt(): void
    {
        $this->assertStringContainsString('position:relative;', self::rule(self::read('template/css/grid.css'), '.bx-grid-table-wrapper'));
    }
}
