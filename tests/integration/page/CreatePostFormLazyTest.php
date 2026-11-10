<?php

require_once(BX_DIRECTORY_PATH_ROOT . 'tests/integration/BxDolIntegrationTestCase.php');

/**
 * The "Create post" block (system get_create_post_form) sends the composer placeholder only.
 * The form of the default module, with its editor and uploaders, is loaded on demand.
 */
class CreatePostFormLazyTest extends BxDolIntegrationTestCase
{
    public function testBlockHasNoFormAndKnowsWhereToLoadIt()
    {
        $this->bxLoginAsAdmin();
        if (!BxDolProfile::getInstance())
            $this->markTestSkipped('The admin account has no profile');

        $mixedBlock = BxDolService::call('system', 'get_create_post_form', [0], 'TemplServices', true);
        if (empty($mixedBlock) || !is_array($mixedBlock))
            $this->markTestSkipped('No module to create posts with');

        $sContent = $mixedBlock['content'];
        $this->assertStringContainsString('sys-cpf-default', $sContent);
        $this->assertStringNotContainsString('<form', $sContent);
        $this->assertStringNotContainsString('bx-uploader', $sContent);
        $this->assertMatchesRegularExpression('/"sDefaultUri":"[a-z0-9_-]+"/', $sContent);
        $this->assertMatchesRegularExpression("/getForm\\('[a-z0-9_]+', '[a-z0-9_-]+', this\\)/", $sContent);
    }
}
