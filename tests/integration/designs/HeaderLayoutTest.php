<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The header per page layout (Studio > Designer > Settings > Header): its width and where the main menu sits, one pair
 * for Standard pages and one for Application pages (BxDolTemplate::getHeaderLayout). Designer saves only the values
 * there are, the site's header takes them (BxBaseFunctions::TemplPageAddComponent, Artificer's own settings winning),
 * and the apps get them with each page (`header` of the page API).
 */
#[Group('integration')]
class HeaderLayoutTest extends BxDolIntegrationTestCase
{
    private const OPTIONS = [
        'sys_pt_default_visitor', 'sys_pt_default_member',
        'sys_header_width_standard', 'sys_header_align_standard', 'sys_header_width_application', 'sys_header_align_application',
        'bx_artificer_header_width', 'bx_artificer_header_align',
    ];

    private array $_aOptionsBackup = [];
    private array $_aGetBackup = [];
    private $_mPageTypeBackup;

    protected function setUp(): void
    {
        parent::setUp();

        require_once(BX_DIRECTORY_PATH_ROOT . 'studio/inc/utils.inc.php'); // bx_get_js_result, for the save's reply

        foreach (self::OPTIONS as $sName)
            $this->_aOptionsBackup[$sName] = getParam($sName);
        $this->_aGetBackup = $_GET;
        $this->_mPageTypeBackup = BxDolTemplate::getInstance()->getPageType();

        $this->bxBecomeGuest();
    }

    protected function tearDown(): void
    {
        $_GET = $this->_aGetBackup;
        BxDolTemplate::getInstance()->setPageType($this->_mPageTypeBackup);

        foreach ($this->_aOptionsBackup as $sName => $sValue)
            setParam($sName, $sValue);

        BxDolDb::getInstance()->cleanMemoryAll();
        $GLOBALS['glMemCache'] = [];
        parent::tearDown();
    }

    public function testEachLayoutHasItsOwnHeader(): void
    {
        $this->setHeader('page', 'start', 'full', 'center');

        $this->assertSame(['layout' => 'standard', 'width' => 'page', 'align' => 'start'], BxDolTemplate::getHeaderLayout(BX_PAGE_TYPE_STANDARD));
        $this->assertSame(['layout' => 'application', 'width' => 'full', 'align' => 'center'], BxDolTemplate::getHeaderLayout(BX_PAGE_TYPE_APPLICATION));
        $this->assertSame('standard', BxDolTemplate::getHeaderLayout(BX_PAGE_TYPE_DEFAULT_WO_HF)['layout'], 'other layouts take the Standard header');
    }

    public function testDefaultIsTheViewersLayout(): void
    {
        $this->setHeader('page', 'start', 'full', 'end');

        setParam('sys_pt_default_visitor', BX_PAGE_TYPE_APPLICATION);
        $this->assertSame('application', BxDolTemplate::getHeaderLayout(BX_PAGE_TYPE_DEFAULT)['layout'], 'a guest gets the visitors\' layout');

        setParam('sys_pt_default_visitor', BX_PAGE_TYPE_STANDARD);
        $this->assertSame('standard', BxDolTemplate::getHeaderLayout(BX_PAGE_TYPE_DEFAULT)['layout']);
    }

    public function testUnknownValuesKeepTheHeaderAsItWas(): void
    {
        $this->setHeader('wide', 'middle', '', '');

        $this->assertSame(['layout' => 'standard', 'width' => 'page', 'align' => 'start'], BxDolTemplate::getHeaderLayout(BX_PAGE_TYPE_STANDARD));
        $this->assertSame(['layout' => 'application', 'width' => 'full', 'align' => 'start'], BxDolTemplate::getHeaderLayout(BX_PAGE_TYPE_APPLICATION));
    }

    public function testDesignerSavesOnlyRealValues(): void
    {
        $this->setHeader('page', 'start', 'full', 'start');

        $_GET = ['sys_header_width_standard' => 'full', 'sys_header_align_standard' => 'center', 'sys_header_width_application' => 'page', 'sys_header_align_application' => 'end'];
        $this->designer()->submitSettings();
        $this->assertSame(['full', 'center', 'page', 'end'], $this->getHeader());

        $_GET = ['sys_header_width_standard' => 'huge', 'sys_header_align_standard' => 'left', 'sys_header_width_application' => '', 'sys_header_align_application' => '<b>'];
        $this->designer()->submitSettings();
        $this->assertSame(['full', 'center', 'page', 'end'], $this->getHeader(), 'unknown values are not saved');
    }

    public function testDesignerShowsTheChoicesOfBothLayouts(): void
    {
        $this->setHeader('full', 'center', 'page', 'end');

        $oMethod = new ReflectionMethod('BxBaseStudioDesigner', 'getSettingsHeader');
        $sStandard = $oMethod->invoke($this->designer(), 'standard');
        $sApplication = $oMethod->invoke($this->designer(), 'application');

        $this->assertMatchesRegularExpression('/name="sys_header_width_standard" value="full" checked="checked"/', $sStandard);
        $this->assertMatchesRegularExpression('/name="sys_header_align_standard" value="center" checked="checked"/', $sStandard);
        $this->assertMatchesRegularExpression('/name="sys_header_width_application" value="page" checked="checked"/', $sApplication);
        $this->assertMatchesRegularExpression('/name="sys_header_align_application" value="end" checked="checked"/', $sApplication);
        $this->assertSame(5, substr_count($sStandard, 'type="radio"'), 'two widths and three places');
    }

    public function testTheSiteHeaderTakesTheLayoutsHeader(): void
    {
        $this->setHeader('full', 'center', 'page', 'end');
        setParam('bx_artificer_header_width', '');
        setParam('bx_artificer_header_align', '');
        $oFunctions = BxTemplFunctions::getInstance();

        BxDolTemplate::getInstance()->setPageType(BX_PAGE_TYPE_STANDARD);
        $this->assertSame('', $oFunctions->TemplPageAddComponent('sys_header_width'), 'a full width header has no page width');
        $this->assertSame('bx-header-menu-center', $oFunctions->TemplPageAddComponent('sys_header_align'));

        BxDolTemplate::getInstance()->setPageType(BX_PAGE_TYPE_APPLICATION);
        $this->assertSame('bx-def-page-width', $oFunctions->TemplPageAddComponent('sys_header_width'));
        $this->assertSame('bx-header-menu-end', $oFunctions->TemplPageAddComponent('sys_header_align'));
    }

    public function testArtificersOwnSettingsWin(): void
    {
        $oFunctions = BxTemplFunctions::getInstance();
        if (!method_exists($oFunctions, 'getHeaderLayout') || (new ReflectionMethod($oFunctions, 'getHeaderLayout'))->getDeclaringClass()->getName() != 'BxTemplFunctions')
            $this->markTestSkipped('Artificer is not the site template');

        $this->setHeader('page', 'start', 'page', 'start');
        BxDolTemplate::getInstance()->setPageType(BX_PAGE_TYPE_STANDARD);

        setParam('bx_artificer_header_width', 'full');
        setParam('bx_artificer_header_align', 'end');
        $this->assertSame('', $oFunctions->TemplPageAddComponent('sys_header_width'));
        $this->assertSame('bx-header-menu-end', $oFunctions->TemplPageAddComponent('sys_header_align'));

        setParam('bx_artificer_header_width', '');
        setParam('bx_artificer_header_align', '');
        $this->assertSame('bx-def-page-width', $oFunctions->TemplPageAddComponent('sys_header_width'), 'empty follows Designer');
        $this->assertSame('bx-header-menu-start', $oFunctions->TemplPageAddComponent('sys_header_align'));
    }

    public function testTheHeaderTemplatesHaveTheKeys(): void
    {
        foreach (['template/_page_toolbar.html', 'modules/boonex/artificer/data/template/system/pt_application.html'] as $sFile) {
            $sCode = file_get_contents(BX_DIRECTORY_PATH_ROOT . $sFile);
            $this->assertStringContainsString('__sys_header_width__ __sys_header_align__', $sCode, $sFile);
        }
    }

    public function testTheAppsGetThePagesHeader(): void
    {
        $this->setHeader('full', 'end', 'page', 'center');
        setParam('sys_pt_default_visitor', BX_PAGE_TYPE_STANDARD);

        if (($sObject = BxDolPageQuery::getPageObjectNameByURI('home')))
            unset($GLOBALS['bxDolClasses']['BxDolPage!' . $sObject]);
        $_GET = ['api' => 1];
        $aData = BxDolService::call('system', 'get_page_by_request', ['page/home', '', '[]'], 'TemplServicePages', true);

        $this->assertIsArray($aData);
        $this->assertIsArray($aData['header'] ?? null, 'the page carries its header');
        $this->assertSame('full', $aData['header']['width']);
        $this->assertSame('end', $aData['header']['align']);
    }

    private function setHeader(string $sWidthStandard, string $sAlignStandard, string $sWidthApplication, string $sAlignApplication): void
    {
        setParam('sys_header_width_standard', $sWidthStandard);
        setParam('sys_header_align_standard', $sAlignStandard);
        setParam('sys_header_width_application', $sWidthApplication);
        setParam('sys_header_align_application', $sAlignApplication);
    }

    private function getHeader(): array
    {
        return [getParam('sys_header_width_standard'), getParam('sys_header_align_standard'), getParam('sys_header_width_application'), getParam('sys_header_align_application')];
    }

    private function designer(): BxDolStudioDesigner
    {
        return new BxTemplStudioDesigner(BX_DOL_STUDIO_DSG_TYPE_SETTINGS);
    }
}
