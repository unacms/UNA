<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The forgot-password block in the API: on the page it carries the hint the site shows above
 * the form as its description; the form's own request url gets the blocks alone.
 */
#[Group('integration')]
class ForgotPasswordApiTest extends BxDolIntegrationTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $_GET['api'] = 1;
    }

    protected function tearDown(): void
    {
        BxDolPage::unsetBlockProcessing();
        unset($_GET['api']);

        parent::tearDown();
    }

    public function testPageBlockCarriesTheHintAsDescription(): void
    {
        BxDolPage::setBlockProcessing(['id' => 1, 'object' => 'sys_forgot_password']);

        $aResult = (new BxTemplServiceAccount())->serviceForgotPassword();

        $this->assertIsArray($aResult);
        $this->assertSame(_t($this->bxHintKey()), $aResult['description'] ?? null);
        $this->assertSame('form', $aResult['content'][0]['type'] ?? null);
    }

    public function testRequestUrlGetsTheBlocksAlone(): void
    {
        $aResult = (new BxTemplServiceAccount())->serviceForgotPassword();

        $this->assertIsArray($aResult);
        $this->assertArrayNotHasKey('description', $aResult);
        $this->assertSame('form', $aResult[0]['type'] ?? null, 'A form posted to its request url reads the blocks as before.');
    }

    /**
     * The same choice the service makes from the email and phone confirmation settings.
     */
    private function bxHintKey(): string
    {
        if (!BxDolAccount::isNeedConfirmPhone())
            return '_sys_txt_forgot_pasword_desc';

        return BxDolAccount::isNeedConfirmEmail() ? '_sys_txt_forgot_pasword_by_both_desc' : '_sys_txt_forgot_pasword_by_phone_desc';
    }
}
