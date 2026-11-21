<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Studio > Designer > Settings saves the default page layouts (BxDolStudioDesigner::submitSettings), taking only what the
 * page offers: a layout that isn't Default itself. The site template is set in one place, Designer > Template
 * (BxDolStudioDesigner::makeDefault), and only to an enabled template. A template's own Logo page is a note pointing to
 * Designer > Logo unless the template has a logo of its own (BxDolStudioDesigner::isLogoTemplateSet).
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

    public function testSavesRealLayouts(): void
    {
        setParam('sys_pt_default_visitor', BX_PAGE_TYPE_STANDARD);
        setParam('sys_pt_default_member', BX_PAGE_TYPE_STANDARD);
        $_GET = ['sys_pt_default_visitor' => BX_PAGE_TYPE_APPLICATION, 'sys_pt_default_member' => BX_PAGE_TYPE_DEFAULT_WO_HF];

        $this->designer()->submitSettings();

        $this->assertSame((string)BX_PAGE_TYPE_APPLICATION, (string)getParam('sys_pt_default_visitor'));
        $this->assertSame((string)BX_PAGE_TYPE_DEFAULT_WO_HF, (string)getParam('sys_pt_default_member'));
    }

    public function testIgnoresWhatThePageDoesNotOffer(): void
    {
        setParam('sys_pt_default_visitor', BX_PAGE_TYPE_STANDARD);
        setParam('sys_pt_default_member', BX_PAGE_TYPE_APPLICATION);
        $_GET = ['sys_pt_default_visitor' => BX_PAGE_TYPE_DEFAULT, 'sys_pt_default_member' => 999];

        $this->designer()->submitSettings();

        $this->assertSame((string)BX_PAGE_TYPE_STANDARD, (string)getParam('sys_pt_default_visitor'), 'Default is not a default');
        $this->assertSame((string)BX_PAGE_TYPE_APPLICATION, (string)getParam('sys_pt_default_member'), 'an unknown layout is not saved');
    }

    public function testSettingsNoLongerSetTheTemplate(): void
    {
        $sTemplate = getParam('template');
        setParam('template', 'sys-test-template');

        $_GET = ['template' => $sTemplate];
        $this->designer()->submitSettings();

        $this->assertSame('sys-test-template', getParam('template'), 'the template is set in Designer > Template only');
    }

    public function testTemplatePageMakesOnlyAnEnabledTemplateTheDefault(): void
    {
        $sTemplate = getParam('template');
        $this->assertArrayHasKey($sTemplate, $this->call('getSettingsTemplateList'), 'the template in use is enabled');

        $_GET = ['dsg_value' => 'no-such-template'];
        $this->assertFalse($this->designer()->makeDefault());
        $this->assertSame($sTemplate, getParam('template'), 'an unknown template is not saved');

        setParam('template', 'sys-test-template');
        $_GET = ['dsg_value' => $sTemplate];
        $this->assertTrue($this->designer()->makeDefault());
        $this->assertSame($sTemplate, getParam('template'));
    }

    public function testTemplateLogoPageIsANoteUntilTheTemplateHasALogo(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_artificer'))
            $this->markTestSkipped('Artificer is not installed.');

        $aParams = BxDolModule::getInstance('bx_artificer')->_oConfig->getLogoParams();
        $aBackup = [];
        foreach ($aParams as $sName)
            $aBackup[$sName] = getParam($sName);

        try {
            foreach ($aParams as $sName)
                setParam($sName, strpos($sName, '_inline') !== false || strpos($sName, '_alt') !== false ? '' : '0');

            $oDesigner = $this->designer();
            $oDesigner->setLogoParams($aParams);
            $oDesigner->setLogoTemplate('bx_artificer');
            $this->assertFalse($oDesigner->isLogoTemplateSet(), 'empty images (0) and codes are no logo');

            setParam($aParams['logo_inline'], '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
            $this->assertTrue($oDesigner->isLogoTemplateSet());
        }
        finally {
            foreach ($aBackup as $sName => $sValue)
                setParam($sName, $sValue);
        }
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
