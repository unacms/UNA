<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Studio > Designer > Settings saves the site template and the default page layouts (BxDolStudioDesigner::submitSettings),
 * taking only what the page offers: an enabled template, and a layout that isn't Default itself.
 */
#[Group('integration')]
class DesignerSettingsTest extends BxDolIntegrationTestCase
{
    private const OPTIONS = ['template', 'sys_pt_default_visitor', 'sys_pt_default_member', 'sys_form_label_style'];

    private array $_aOptionsBackup = [];
    private array $_aGetBackup = [];

    protected function setUp(): void
    {
        parent::setUp();

        require_once(BX_DIRECTORY_PATH_ROOT . 'studio/inc/utils.inc.php'); // bx_get_js_result, for the save's reply

        foreach (self::OPTIONS as $sName)
            $this->_aOptionsBackup[$sName] = getParam($sName);

        $this->_aGetBackup = $_GET;
    }

    protected function tearDown(): void
    {
        $_GET = $this->_aGetBackup;

        foreach ($this->_aOptionsBackup as $sName => $sValue)
            setParam($sName, $sValue);

        parent::tearDown();
    }

    public function testLayoutsAreEveryPageTypeButDefault(): void
    {
        $aLayouts = $this->call('getSettingsLayoutList');

        $this->assertArrayNotHasKey(BX_PAGE_TYPE_DEFAULT, $aLayouts);
        $this->assertSame('standard', $aLayouts[BX_PAGE_TYPE_STANDARD]['slug']);
        $this->assertSame('application', $aLayouts[BX_PAGE_TYPE_APPLICATION]['slug']);
        $this->assertSame('wo_hf', $aLayouts[BX_PAGE_TYPE_DEFAULT_WO_HF]['slug']);
    }

    public function testSavesAnEnabledTemplateAndRealLayouts(): void
    {
        $sTemplate = getParam('template');
        $this->assertArrayHasKey($sTemplate, $this->call('getSettingsTemplateList'), 'the template in use is enabled');

        setParam('sys_pt_default_visitor', BX_PAGE_TYPE_STANDARD);
        setParam('sys_pt_default_member', BX_PAGE_TYPE_STANDARD);
        $_GET = ['template' => $sTemplate, 'sys_pt_default_visitor' => BX_PAGE_TYPE_APPLICATION, 'sys_pt_default_member' => BX_PAGE_TYPE_DEFAULT_WO_HF];

        $this->designer()->submitSettings();

        $this->assertSame($sTemplate, getParam('template'));
        $this->assertSame((string)BX_PAGE_TYPE_APPLICATION, (string)getParam('sys_pt_default_visitor'));
        $this->assertSame((string)BX_PAGE_TYPE_DEFAULT_WO_HF, (string)getParam('sys_pt_default_member'));
    }

    public function testIgnoresWhatThePageDoesNotOffer(): void
    {
        $sTemplate = getParam('template');
        setParam('sys_pt_default_visitor', BX_PAGE_TYPE_STANDARD);
        setParam('sys_pt_default_member', BX_PAGE_TYPE_APPLICATION);
        $_GET = ['template' => 'no-such-template', 'sys_pt_default_visitor' => BX_PAGE_TYPE_DEFAULT, 'sys_pt_default_member' => 999];

        $this->designer()->submitSettings();

        $this->assertSame($sTemplate, getParam('template'), 'an unknown template is not saved');
        $this->assertSame((string)BX_PAGE_TYPE_STANDARD, (string)getParam('sys_pt_default_visitor'), 'Default is not a default');
        $this->assertSame((string)BX_PAGE_TYPE_APPLICATION, (string)getParam('sys_pt_default_member'), 'an unknown layout is not saved');
    }

    public function testSavesTheLabelStyleAndIgnoresAnUnknownOne(): void
    {
        setParam('sys_form_label_style', BxDolForm::LABEL_STYLE_REGULAR);

        $_GET = ['sys_form_label_style' => BxDolForm::LABEL_STYLE_ADAPTIVE];
        $this->designer()->submitSettings();
        $this->assertSame(BxDolForm::LABEL_STYLE_ADAPTIVE, getParam('sys_form_label_style'));

        $_GET = ['sys_form_label_style' => 'no-such-style'];
        $this->designer()->submitSettings();
        $this->assertSame(BxDolForm::LABEL_STYLE_ADAPTIVE, getParam('sys_form_label_style'), 'an unknown style is not saved');

        $_GET = ['sys_form_label_style' => BxDolForm::LABEL_STYLE_REGULAR];
        $this->designer()->submitSettings();
        $this->assertSame(BxDolForm::LABEL_STYLE_REGULAR, getParam('sys_form_label_style'));
    }

    private function designer(): BxDolStudioDesigner
    {
        return new BxTemplStudioDesigner(BX_DOL_STUDIO_DSG_TYPE_SETTINGS);
    }

    private function call(string $sMethod)
    {
        $oMethod = new ReflectionMethod('BxDolStudioDesigner', $sMethod);
        return $oMethod->invoke($this->designer());
    }
}
