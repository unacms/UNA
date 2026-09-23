<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Who may write blocks' data (bento grid) through the system/set_page_block_data service.
 * The blocks are added to the About page, a system page, where only admins may edit.
 */
#[Group('integration')]
class PageBlockDataTest extends BxDolIntegrationTestCase
{
    protected $_aBlockIds = [];

    protected function tearDown(): void
    {
        $oDb = BxDolDb::getInstance();
        foreach ($this->_aBlockIds as $iBlockId) {
            $oDb->query("DELETE FROM `sys_pages_blocks` WHERE `id` = :id", ['id' => $iBlockId]);
            $oDb->query("DELETE FROM `sys_pages_blocks_data` WHERE `block_id` = :id", ['id' => $iBlockId]);
        }

        parent::tearDown();
    }

    public function testGuestIsRefused(): void
    {
        $this->bxBecomeGuest();
        $this->bxAssertErrorCode(403, $this->bxSetData($this->bxAddBlock('bento_grid')));
    }

    public function testMemberIsRefused(): void
    {
        $this->bxLoginAsUser();
        $this->bxAssertErrorCode(403, $this->bxSetData($this->bxAddBlock('bento_grid')));
    }

    public function testAdminIsAllowed(): void
    {
        $this->bxLoginAsAdmin();

        // there is no request body under the CLI, so an allowed call stops at the JSON check
        $this->assertFalse($this->bxSetData($this->bxAddBlock('bento_grid')));
    }

    public function testContentModuleMustMatchThePage(): void
    {
        $this->bxLoginAsAdmin();
        $this->bxAssertErrorCode(403, $this->bxSetData($this->bxAddBlock('bento_grid'), 1, 'bx_posts'));
    }

    public function testOtherBlockTypesAreNotFound(): void
    {
        $this->bxLoginAsAdmin();
        $this->bxAssertErrorCode(404, $this->bxSetData($this->bxAddBlock('raw')));
    }

    public function testMissingBlockIsNotFound(): void
    {
        $this->bxLoginAsAdmin();

        $iBlockId = $this->bxAddBlock('bento_grid');
        BxDolDb::getInstance()->query("DELETE FROM `sys_pages_blocks` WHERE `id` = :id", ['id' => $iBlockId]);

        $this->bxAssertErrorCode(404, $this->bxSetData($iBlockId));
    }

    protected function bxAddBlock(string $sType): int
    {
        $oDb = BxDolDb::getInstance();
        $oDb->query("INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `icon`, `type`, `content`, `text`, `text_updated`, `help`, `config_api`, `active`, `active_api`, `order`) VALUES ('sys_about', 1, 'system', '', 'PageBlockDataTest', '', :type, '', '', 0, '', '', 0, 0, 0)", [
            'type' => $sType
        ]);

        $iBlockId = (int)$oDb->lastId();
        $this->_aBlockIds[] = $iBlockId;

        return $iBlockId;
    }

    protected function bxSetData(int $iBlockId, int $iContentId = 0, string $sContentModule = '')
    {
        return BxDolService::call('system', 'set_page_block_data', [$iBlockId, $iContentId, $sContentModule], 'TemplServicePages');
    }

    protected function bxAssertErrorCode(int $iCode, $mixedResult): void
    {
        $this->assertIsArray($mixedResult);
        $this->assertSame($iCode, $mixedResult['code'] ?? null);
        $this->assertNotEmpty($mixedResult['error'] ?? '');
    }
}
