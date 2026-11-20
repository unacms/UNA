<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The sign-in form's captions are labels of their fields (BxBaseFormView::genRowStandard), so a screen reader names the
 * fields and a click on a caption focuses its field; the fields say what they hold for password managers.
 */
#[Group('integration')]
class LoginFormLabelsTest extends BxDolIntegrationTestCase
{
    public function testCaptionsAreLabels(): void
    {
        $this->bxBecomeGuest();

        $oForm = BxDolForm::getObjectInstance('sys_login', 'sys_login');
        $this->assertNotEmpty($oForm, 'The sys_login form is not installed.');
        $sHtml = $oForm->getCode();

        foreach (['ID' => 'username', 'Password' => 'current-password'] as $sName => $sAutocomplete) {
            $this->assertMatchesRegularExpression('/<input [^>]*autocomplete="' . $sAutocomplete . '"[^>]*id="([^"]+)"[^>]*name="' . $sName . '"/', $sHtml, $sName);
            preg_match('/<input [^>]*id="([^"]+)"[^>]*name="' . $sName . '"/', $sHtml, $m);
            $this->assertStringContainsString('<div class="bx-form-caption"><label for="' . $m[1] . '">', $sHtml, $sName . ' has no label.');
        }
    }

    public function testApiFormHasNoLabelMarkup(): void
    {
        $this->bxBecomeGuest();

        $oForm = BxDolForm::getObjectInstance('sys_login', 'sys_login');
        $aForm = $oForm->getCodeAPI();
        $this->assertStringNotContainsString('<label', json_encode($aForm));
    }
}
