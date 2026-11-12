<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Form label style: regular unless the site (sys_form_label_style) or the form display says adaptive. An adaptive form
 * floats the labels of its one-line text fields only, and the form API always carries the resolved style for the apps.
 */
#[Group('integration')]
class FormLabelStyleTest extends BxDolIntegrationTestCase
{
    private string $_sStyleBackup = '';

    protected function setUp(): void
    {
        parent::setUp();

        $this->_sStyleBackup = (string)getParam('sys_form_label_style');
    }

    protected function tearDown(): void
    {
        setParam('sys_form_label_style', $this->_sStyleBackup);

        parent::tearDown();
    }

    private function form(array $aParams = [], string $sClass = 'BxTemplFormView')
    {
        return new $sClass([
            'form_attrs' => ['id' => 'phpunit_form_label_style', 'name' => 'phpunit_form_label_style', 'method' => 'post', 'action' => ''],
            'params' => $aParams + ['db' => ['submit_name' => 'do_submit'], 'csrf' => ['disable' => true]],
            'inputs' => [
                'name' => ['type' => 'text', 'name' => 'name', 'caption' => 'Name'],
                'hint' => ['type' => 'text', 'name' => 'hint', 'caption' => 'Hint', 'attrs' => ['placeholder' => 'Type here']],
                'secret' => ['type' => 'password', 'name' => 'secret', 'caption' => 'Secret'],
                'about' => ['type' => 'textarea', 'name' => 'about', 'caption' => 'About'],
                'kind' => ['type' => 'select', 'name' => 'kind', 'caption' => 'Kind', 'values' => ['a' => 'A', 'b' => 'B']],
                'do_submit' => ['type' => 'submit', 'name' => 'do_submit', 'value' => 'Submit'],
            ],
        ], false);
    }

    private function row(string $sHtml, string $sName): string
    {
        $this->assertSame(1, preg_match('/<div[^>]*id="bx-form-element-' . $sName . '"[^>]*>/', $sHtml, $aMatch), 'the row of ' . $sName);
        return $aMatch[0];
    }

    public function testRegularByDefaultAndForAnUnknownValue(): void
    {
        setParam('sys_form_label_style', BxDolForm::LABEL_STYLE_REGULAR);
        $this->assertSame(BxDolForm::LABEL_STYLE_REGULAR, $this->form()->getLabelStyle());

        setParam('sys_form_label_style', 'no-such-style');
        $this->assertSame(BxDolForm::LABEL_STYLE_REGULAR, $this->form()->getLabelStyle());

        $this->assertStringNotContainsString('bx-form-element-adaptive', $this->form()->getCode());
    }

    public function testTheFormDisplayWinsOverTheSite(): void
    {
        setParam('sys_form_label_style', BxDolForm::LABEL_STYLE_ADAPTIVE);
        $this->assertSame(BxDolForm::LABEL_STYLE_ADAPTIVE, $this->form()->getLabelStyle());
        $this->assertSame(BxDolForm::LABEL_STYLE_ADAPTIVE, $this->form(['label_style' => ''])->getLabelStyle(), "'' follows the site");
        $this->assertSame(BxDolForm::LABEL_STYLE_REGULAR, $this->form(['label_style' => BxDolForm::LABEL_STYLE_REGULAR])->getLabelStyle());

        setParam('sys_form_label_style', BxDolForm::LABEL_STYLE_REGULAR);
        $this->assertSame(BxDolForm::LABEL_STYLE_ADAPTIVE, $this->form(['label_style' => BxDolForm::LABEL_STYLE_ADAPTIVE])->getLabelStyle());
    }

    public function testAdaptiveFloatsOnlyOneLineTextFields(): void
    {
        setParam('sys_form_label_style', BxDolForm::LABEL_STYLE_ADAPTIVE);
        $sHtml = $this->form()->getCode();

        $this->assertStringContainsString('bx-form-element-adaptive', $this->row($sHtml, 'name'));
        $this->assertStringNotContainsString('bx-form-element-adaptive-floated', $this->row($sHtml, 'name'));
        $this->assertStringContainsString('bx-form-element-adaptive', $this->row($sHtml, 'secret'));
        $this->assertStringContainsString('bx-form-element-adaptive-floated', $this->row($sHtml, 'hint'), 'a placeholder of its own keeps the label small');
        $this->assertStringContainsString('placeholder="Type here"', $sHtml);

        $this->assertStringNotContainsString('bx-form-element-adaptive', $this->row($sHtml, 'about'));
        $this->assertStringNotContainsString('bx-form-element-adaptive', $this->row($sHtml, 'kind'));

        // The label names its field, and the empty placeholder is what :placeholder-shown reads.
        $this->assertSame(1, preg_match('/<label for="([^"]+)">Name<\/label>/', $sHtml, $aLabel));
        $this->assertMatchesRegularExpression('/<input[^>]*id="' . preg_quote($aLabel[1], '/') . '"[^>]*placeholder=" "|<input[^>]*placeholder=" "[^>]*id="' . preg_quote($aLabel[1], '/') . '"/', $sHtml);
    }

    public function testStudioFormsStayRegular(): void
    {
        setParam('sys_form_label_style', BxDolForm::LABEL_STYLE_ADAPTIVE);

        $oForm = $this->form(['label_style' => BxDolForm::LABEL_STYLE_ADAPTIVE], 'BxTemplStudioFormView');
        $this->assertSame(BxDolForm::LABEL_STYLE_REGULAR, $oForm->getLabelStyle());
        $this->assertStringNotContainsString('bx-form-element-adaptive', $oForm->getCode());
    }

    public function testTheApiCarriesTheResolvedStyle(): void
    {
        setParam('sys_form_label_style', BxDolForm::LABEL_STYLE_REGULAR);
        $this->assertSame(BxDolForm::LABEL_STYLE_REGULAR, $this->form()->getCodeAPI()['params']['label_style']);

        setParam('sys_form_label_style', BxDolForm::LABEL_STYLE_ADAPTIVE);
        $aApi = $this->form()->getCodeAPI();
        $this->assertSame(BxDolForm::LABEL_STYLE_ADAPTIVE, $aApi['params']['label_style']);
        $this->assertArrayNotHasKey('placeholder', $aApi['inputs']['name']['attrs'] ?? [], 'the site markup does not leak into the API');

        $this->assertSame(BxDolForm::LABEL_STYLE_REGULAR, $this->form(['label_style' => BxDolForm::LABEL_STYLE_REGULAR])->getCodeAPI()['params']['label_style']);
    }

    public function testAFormDisplayReadsItsOwnStyle(): void
    {
        $this->assertTrue(BxDolDb::getInstance()->isFieldExists('sys_form_displays', 'label_style'));

        $oForm = BxDolForm::getObjectInstance('sys_login', 'sys_login');
        $this->assertSame('', $oForm->aParams['label_style'], 'a display follows the site until it is given a style');
    }
}
