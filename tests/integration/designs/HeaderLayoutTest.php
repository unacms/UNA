<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The header per page layout and audience (Studio > Designer > Settings > Header): its width and where the main menu
 * sits, for Standard and Application pages, for visitors and for members (BxDolTemplate::getHeaderLayout). Designer
 * saves only the values there are, the site's header takes them (BxBaseFunctions::TemplPageAddComponent, Artificer's
 * own settings winning), and the apps get them with each page (`header` of the page API).
 */
#[Group('integration')]
class HeaderLayoutTest extends BxDolIntegrationTestCase
{
    private const OPTIONS = [
        'sys_pt_default_visitor', 'sys_pt_default_member',
        'sys_header_width_standard_visitor', 'sys_header_align_standard_visitor', 'sys_header_width_application_visitor', 'sys_header_align_application_visitor',
        'sys_header_width_standard_member', 'sys_header_align_standard_member', 'sys_header_width_application_member', 'sys_header_align_application_member',
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
        $this->setHeader('visitor', 'page', 'start', 'full', 'center');

        $this->assertSame(['layout' => 'standard', 'width' => 'page', 'align' => 'start'], BxDolTemplate::getHeaderLayout(BX_PAGE_TYPE_STANDARD));
        $this->assertSame(['layout' => 'application', 'width' => 'full', 'align' => 'center'], BxDolTemplate::getHeaderLayout(BX_PAGE_TYPE_APPLICATION));
        $this->assertSame('standard', BxDolTemplate::getHeaderLayout(BX_PAGE_TYPE_DEFAULT_WO_HF)['layout'], 'other layouts take the Standard header');
    }

    public function testVisitorsAndMembersHaveTheirOwnHeaders(): void
    {
        // Setup A: a site for guests (page width, links next to the logo), full width centred tabs for members.
        $this->setHeader('visitor', 'page', 'start', 'full', 'start');
        $this->setHeader('member', 'full', 'center', 'page', 'end');

        $this->assertSame(['layout' => 'standard', 'width' => 'page', 'align' => 'start'], BxDolTemplate::getHeaderLayout(BX_PAGE_TYPE_STANDARD, false));
        $this->assertSame(['layout' => 'standard', 'width' => 'full', 'align' => 'center'], BxDolTemplate::getHeaderLayout(BX_PAGE_TYPE_STANDARD, true));
        $this->assertSame(['layout' => 'application', 'width' => 'page', 'align' => 'end'], BxDolTemplate::getHeaderLayout(BX_PAGE_TYPE_APPLICATION, true));
        $this->assertSame('start', BxDolTemplate::getHeaderLayout(BX_PAGE_TYPE_STANDARD)['align'], 'a guest gets the visitors\' header');
    }

    public function testDefaultIsTheAudiencesLayout(): void
    {
        // Setup B: guests get Standard pages, members Application pages, each with its own header.
        $this->setHeader('visitor', 'page', 'start', 'full', 'end');
        $this->setHeader('member', 'full', 'center', 'full', 'start');
        setParam('sys_pt_default_visitor', BX_PAGE_TYPE_STANDARD);
        setParam('sys_pt_default_member', BX_PAGE_TYPE_APPLICATION);

        $this->assertSame(['layout' => 'standard', 'width' => 'page', 'align' => 'start'], BxDolTemplate::getHeaderLayout(BX_PAGE_TYPE_DEFAULT, false));
        $this->assertSame(['layout' => 'application', 'width' => 'full', 'align' => 'start'], BxDolTemplate::getHeaderLayout(BX_PAGE_TYPE_DEFAULT, true));
        $this->assertSame('standard', BxDolTemplate::getHeaderLayout(BX_PAGE_TYPE_DEFAULT)['layout'], 'a guest gets the visitors\' layout');

        // A page with a layout of its own keeps it for members too (About, Terms, a wiki).
        $this->assertSame(['layout' => 'standard', 'width' => 'full', 'align' => 'center'], BxDolTemplate::getHeaderLayout(BX_PAGE_TYPE_STANDARD, true));
    }

    public function testASignedInViewerGetsTheMembersHeader(): void
    {
        $this->setHeader('visitor', 'page', 'start', 'page', 'start');
        $this->setHeader('member', 'full', 'end', 'full', 'end');

        $this->bxLoginAsAdmin(); // any signed-in account
        try {
            $this->assertSame(['layout' => 'standard', 'width' => 'full', 'align' => 'end'], BxDolTemplate::getHeaderLayout(BX_PAGE_TYPE_STANDARD));
        }
        finally {
            $this->bxBecomeGuest();
        }
    }

    public function testUnknownValuesKeepTheHeaderAsItWas(): void
    {
        $this->setHeader('visitor', 'wide', 'middle', '', '');
        $this->setHeader('member', '', '', 'huge', 'left');

        foreach ([false, true] as $bMember) {
            $this->assertSame(['layout' => 'standard', 'width' => 'page', 'align' => 'center'], BxDolTemplate::getHeaderLayout(BX_PAGE_TYPE_STANDARD, $bMember));
            $this->assertSame(['layout' => 'application', 'width' => 'full', 'align' => 'start'], BxDolTemplate::getHeaderLayout(BX_PAGE_TYPE_APPLICATION, $bMember));
        }
    }

    public function testStartAndEndOutrankTheHeadersCentring(): void
    {
        // tailwind.css centres '#bx-toolbar .bx-menu-main' for every template; the setting's rules must be stronger.
        foreach (['template/css/menu.css', 'modules/boonex/artificer/data/template/system/css/menu.css'] as $sFile) {
            $sCss = file_get_contents(BX_DIRECTORY_PATH_ROOT . $sFile);
            foreach (['start', 'center', 'end'] as $sAlign)
                $this->assertStringContainsString('#bx-toolbar .bx-header-menu-' . $sAlign . ' ul.bx-menu-main', $sCss, $sFile);
        }
    }

    public function testDesignerSavesOnlyRealValues(): void
    {
        $this->setHeader('visitor', 'page', 'start', 'full', 'start');
        $this->setHeader('member', 'page', 'start', 'full', 'start');

        $_GET = $this->request('visitor', 'full', 'center', 'page', 'end') + $this->request('member', 'page', 'end', 'full', 'center');
        $this->designer()->submitSettings();
        $this->assertSame(['full', 'center', 'page', 'end'], $this->getHeader('visitor'));
        $this->assertSame(['page', 'end', 'full', 'center'], $this->getHeader('member'));

        $_GET = $this->request('visitor', 'huge', 'left', '', '<b>') + $this->request('member', 'wide', '1', 'page width', 'middle');
        $this->designer()->submitSettings();
        $this->assertSame(['full', 'center', 'page', 'end'], $this->getHeader('visitor'), 'unknown values are not saved');
        $this->assertSame(['page', 'end', 'full', 'center'], $this->getHeader('member'), 'unknown values are not saved');
    }

    public function testDesignerShowsTheTable(): void
    {
        $this->setHeader('visitor', 'full', 'center', 'page', 'end');
        $this->setHeader('member', 'page', 'start', 'full', 'center');

        $sTable = (new ReflectionMethod('BxBaseStudioDesigner', 'getSettingsHeader'))->invoke($this->designer());

        foreach (['visitor' => ['full', 'center', 'page', 'end'], 'member' => ['page', 'start', 'full', 'center']] as $sWho => $aValues)
            foreach (array_combine(['width_standard', 'align_standard', 'width_application', 'align_application'], $aValues) as $sName => $sValue)
                $this->assertMatchesRegularExpression('/name="sys_header_' . $sName . '_' . $sWho . '" value="' . $sValue . '" checked="checked"/', $sTable);
        $this->assertSame(20, substr_count($sTable, 'type="radio"'), 'four headers, each with two widths and three places');
        $this->assertSame(8, substr_count($sTable, 'checked="checked"'), 'one choice per control');
        $this->assertStringContainsString('aria-labelledby="adm-dsg-ht-application adm-dsg-ht-member"', $sTable, 'each cell is named by its row and column');
    }

    public function testTheSiteHeaderTakesTheLayoutsHeader(): void
    {
        $this->setHeader('visitor', 'full', 'center', 'page', 'end');
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

        $this->setHeader('visitor', 'page', 'start', 'page', 'start');
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
        $this->setHeader('visitor', 'full', 'end', 'page', 'center');
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

    private function setHeader(string $sWho, string $sWidthStandard, string $sAlignStandard, string $sWidthApplication, string $sAlignApplication): void
    {
        foreach ($this->request($sWho, $sWidthStandard, $sAlignStandard, $sWidthApplication, $sAlignApplication) as $sName => $sValue)
            setParam($sName, $sValue);
    }

    private function request(string $sWho, string $sWidthStandard, string $sAlignStandard, string $sWidthApplication, string $sAlignApplication): array
    {
        return [
            'sys_header_width_standard_' . $sWho => $sWidthStandard,
            'sys_header_align_standard_' . $sWho => $sAlignStandard,
            'sys_header_width_application_' . $sWho => $sWidthApplication,
            'sys_header_align_application_' . $sWho => $sAlignApplication,
        ];
    }

    private function getHeader(string $sWho): array
    {
        return array_map('getParam', array_keys($this->request($sWho, '', '', '', '')));
    }

    private function designer(): BxDolStudioDesigner
    {
        return new BxTemplStudioDesigner(BX_DOL_STUDIO_DSG_TYPE_SETTINGS);
    }
}
