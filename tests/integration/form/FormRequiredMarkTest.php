<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Required marks follow "mark the fewer": nothing when every labelled field is required or none is, "(optional)" on the
 * optional fields when they are the fewer or as many, an asterisk on the required ones otherwise. Checkboxes, switches
 * and buttons don't count. Studio's own forms keep the asterisk. The form API carries the mode for the apps.
 */
#[Group('integration')]
class FormRequiredMarkTest extends BxDolIntegrationTestCase
{
    private function form(array $aFields, string $sClass = 'BxTemplFormView')
    {
        $aInputs = [];
        foreach ($aFields as $sName => $mixed) {
            $aInput = is_array($mixed) ? $mixed : ['type' => 'text', 'required' => $mixed];
            $aInputs[$sName] = $aInput + ['name' => $sName, 'caption' => ucfirst($sName)];
        }
        $aInputs['do_submit'] = ['type' => 'submit', 'name' => 'do_submit', 'value' => 'Submit'];

        return new $sClass([
            'form_attrs' => ['id' => 'phpunit_form_required_mark', 'name' => 'phpunit_form_required_mark', 'method' => 'post', 'action' => ''],
            'params' => ['db' => ['submit_name' => 'do_submit'], 'csrf' => ['disable' => true]],
            'inputs' => $aInputs,
        ], false);
    }

    public function testNoMarksWhenEveryFieldIsRequiredOrNoneIs(): void
    {
        // A login form: two required fields and a "remember me" checkbox, which doesn't count.
        $oForm = $this->form(['email' => true, 'password' => ['type' => 'password', 'required' => true], 'remember' => ['type' => 'checkbox', 'value' => 1]]);
        $this->assertSame(BxDolForm::REQUIRED_MARK_NONE, $oForm->getRequiredMark());

        $sHtml = $oForm->getCode();
        $this->assertStringNotContainsString('bx-form-required', $sHtml);
        $this->assertStringNotContainsString('bx-form-optional', $sHtml);
        $this->assertStringContainsString('aria-required="true"', $sHtml, 'the field itself still says it is required');

        $this->assertSame(BxDolForm::REQUIRED_MARK_NONE, $this->form(['a' => false, 'b' => false])->getRequiredMark());
    }

    public function testOptionalFieldsAreMarkedWhenTheyAreTheFewerOrAsMany(): void
    {
        $oForm = $this->form(['name' => true, 'email' => true, 'phone' => false, 'news' => ['type' => 'switcher', 'value' => 1]]);
        $this->assertSame(BxDolForm::REQUIRED_MARK_OPTIONAL, $oForm->getRequiredMark());

        $sHtml = $oForm->getCode();
        $this->assertStringNotContainsString('bx-form-required', $sHtml);
        $this->assertSame(1, substr_count($sHtml, 'bx-form-optional'), 'only the optional text field, not the switch');
        $this->assertMatchesRegularExpression('/Phone(<\/label>)?\s*<span class="bx-form-optional">' . preg_quote(_t('_sys_form_txt_optional'), '/') . '<\/span>/', $sHtml);

        $this->assertSame(BxDolForm::REQUIRED_MARK_OPTIONAL, $this->form(['a' => true, 'b' => false])->getRequiredMark());
    }

    public function testRequiredFieldsAreMarkedWhenTheyAreTheFewer(): void
    {
        $oForm = $this->form(['name' => true, 'city' => false, 'phone' => false]);
        $this->assertSame(BxDolForm::REQUIRED_MARK_REQUIRED, $oForm->getRequiredMark());

        $sHtml = $oForm->getCode();
        $this->assertSame(1, substr_count($sHtml, 'bx-form-required'));
        $this->assertStringNotContainsString('bx-form-optional', $sHtml);
    }

    public function testStudioFormsKeepTheAsterisk(): void
    {
        $oForm = $this->form(['email' => true, 'password' => true], 'BxTemplStudioFormView');
        $this->assertSame(BxDolForm::REQUIRED_MARK_REQUIRED, $oForm->getRequiredMark());
        $this->assertSame(2, substr_count($oForm->getCode(), 'bx-form-required'));
    }

    public function testTheApiCarriesTheMode(): void
    {
        $this->assertSame(BxDolForm::REQUIRED_MARK_NONE, $this->form(['email' => true])->getCodeAPI()['params']['required_mark']);
        $this->assertSame(BxDolForm::REQUIRED_MARK_OPTIONAL, $this->form(['a' => true, 'b' => false])->getCodeAPI()['params']['required_mark']);
        $this->assertSame(BxDolForm::REQUIRED_MARK_REQUIRED, $this->form(['a' => true, 'b' => false, 'c' => false])->getCodeAPI()['params']['required_mark']);
    }
}
