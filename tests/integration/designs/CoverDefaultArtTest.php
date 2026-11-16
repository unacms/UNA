<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The art page covers show without a picture (BxDolCover::getDefaultArt): Studio > Designer > Cover previews it as the
 * default, and the apps' home cover (`cover_home.image_default`) gets the same.
 */
#[Group('integration')]
class CoverDefaultArtTest extends BxDolIntegrationTestCase
{
    public function testTheBaseTemplateHasCoverSvg(): void
    {
        $this->assertSame([BX_DOL_URL_ROOT . 'template/images/cover.svg', ''], BxDolCover::getDefaultArt([]));
        $this->assertSame([BX_DOL_URL_ROOT . 'template/images/cover.svg', ''], BxDolCover::getDefaultArt(['path' => 'boonex/no-such-template/']), 'a template without art of its own');
    }

    public function testATemplatesOwnArtWinsWithItsDarkVersion(): void
    {
        $aModule = BxDolModuleQuery::getInstance()->getModuleByName('bx_artificer');
        if (empty($aModule))
            $this->markTestSkipped('Artificer is not installed');

        $sImages = BX_DOL_URL_MODULES . $aModule['path'] . 'data/template/system/images/';
        $this->assertSame([$sImages . 'cover-default.svg', $sImages . 'cover-default-dark.svg'], BxDolCover::getDefaultArt($aModule));
    }
}
