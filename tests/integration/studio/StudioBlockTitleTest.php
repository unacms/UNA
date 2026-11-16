<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Studio > Pages > a page > a block: the block's name in the page's block list and in its Edit popup ("Edit "{0}"
 * Block"). Most blocks have no system title, only a title (the Terms block), and the popup used to show `Edit "" Block`.
 */
#[Group('integration')]
class StudioBlockTitleTest extends BxDolIntegrationTestCase
{
    protected function title(array $aBlock): string
    {
        $oBuilder = new BxTemplStudioBuilderPage('system', 'sys_terms');
        $oMethod = new ReflectionMethod($oBuilder, 'getBlockTitleForStudio');
        return $oMethod->invoke($oBuilder, $aBlock);
    }

    public function testSystemTitleFirst(): void
    {
        $this->assertSame(_t('_sys_page_block_title_terms'), $this->title(['title_system' => '_sys_page_block_title_terms', 'title' => '_sys_page_block_title_about', 'type' => 'lang']));
    }

    public function testTitleWithoutASystemTitle(): void
    {
        $aBlock = BxDolDb::getInstance()->getRow("SELECT * FROM `sys_pages_blocks` WHERE `object` = 'sys_terms' AND `title_system` = '' AND `title` != '' ORDER BY `order` LIMIT 1");
        if (empty($aBlock))
            $this->markTestSkipped('The Terms page has no block with only a title.');

        $sTitle = $this->title($aBlock);
        $this->assertNotSame('', $sTitle);
        $this->assertSame(trim(strip_tags(_t($aBlock['title']))), $sTitle);
    }

    public function testTypeWithoutAnyTitle(): void
    {
        $this->assertSame(_t('_sys_block_type_html'), $this->title(['title_system' => '', 'title' => '', 'type' => 'html']));
        $this->assertSame('', $this->title(['title_system' => '', 'title' => '']));
    }

    public function testTheEditPopupNamesTheBlock(): void
    {
        $aBlock = BxDolDb::getInstance()->getRow("SELECT * FROM `sys_pages_blocks` WHERE `object` = 'sys_terms' AND `title_system` = '' AND `title` != '' ORDER BY `order` LIMIT 1");
        if (empty($aBlock))
            $this->markTestSkipped('The Terms page has no block with only a title.');

        $_GET['id'] = $_REQUEST['id'] = $aBlock['id'];
        try {
            $oBuilder = new BxTemplStudioBuilderPage('system', 'sys_terms');
            $aResult = (new ReflectionMethod($oBuilder, 'actionBlockEdit'))->invoke($oBuilder);
        } finally {
            unset($_GET['id'], $_REQUEST['id']);
        }

        $this->assertIsArray($aResult);
        $sHtml = $aResult['popup']['html'] ?? '';
        $this->assertStringNotContainsString('>' . _t('_adm_bp_txt_edit_block_popup', '') . '<', $sHtml);
        $this->assertStringContainsString('>' . _t('_adm_bp_txt_edit_block_popup', trim(strip_tags(_t($aBlock['title'])))) . '</h2>', $sHtml);
    }
}
