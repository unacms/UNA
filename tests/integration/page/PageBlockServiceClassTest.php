<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * A page draws all its blocks before it puts them in their containers (the page's heading is chosen in between, see
 * BxBasePage::_setHeadingBlockByContent). Drawing a block may change it: a service can return a `class` for the
 * block's container. The container gets what the block is after it was drawn.
 */
#[Group('integration')]
class PageBlockServiceClassTest extends BxDolIntegrationTestCase
{
    public function testAClassSetWhileABlockIsDrawnReachesItsContainer(): void
    {
        $aObject = BxDolPageQuery::getPageObject('sys_about');
        $this->assertNotEmpty($aObject);

        $oPage = new class($aObject, false) extends BxTemplPage {
            public array $aDrawn = [];

            protected function _getBlockCodeWithCache(&$aBlock, $iAsync = 0)
            {
                $this->aDrawn[] = (int)$aBlock['id'];
                $aBlock['class'] = 'phpunit-service-class-' . $aBlock['id'];

                return '<div class="phpunit-block">block ' . $aBlock['id'] . '</div>';
            }

            public function vars(): array
            {
                return $this->_getPageCodeVars();
            }
        };

        $aVars = $oPage->vars();
        $this->assertNotEmpty($oPage->aDrawn, 'The page has blocks.');
        $this->assertSame(array_unique($oPage->aDrawn), $oPage->aDrawn, 'Each block is drawn once.');

        $sCells = implode('', array_filter($aVars, 'is_string'));
        foreach ($oPage->aDrawn as $iId) {
            $this->assertMatchesRegularExpression('/<div class="bx-page-block-container[^"]* phpunit-service-class-' . $iId . '[^"]*" id="bx-page-block-' . $iId . '">/', $sCells, 'Block ' . $iId);
            $this->assertStringContainsString('block ' . $iId . '</div>', $sCells);
        }
    }
}
