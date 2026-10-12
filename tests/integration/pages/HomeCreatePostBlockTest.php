<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The home page's create-post block shows only its form: no title, background or padding of its own,
 * so the form sits in the feed like a post does (web and the NEO apps).
 */
#[Group('integration')]
class HomeCreatePostBlockTest extends BxDolIntegrationTestCase
{
    public function testHomeCreatePostBlockIsContentOnly(): void
    {
        $aBlock = BxDolDb::getInstance()->getRow("SELECT `designbox_id` FROM `sys_pages_blocks` WHERE `object` = 'sys_home' AND `module` = 'system' AND `title_system` = '_sys_page_block_title_sys_create_post'");

        $this->assertNotEmpty($aBlock, 'The home page has the create-post block.');
        $this->assertSame(BX_DB_CONTENT_ONLY, (int)$aBlock['designbox_id']);
    }
}
