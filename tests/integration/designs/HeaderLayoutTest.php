<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The page, its header and its footer per page layout and audience (Studio > Designer > Settings > Page, header and
 * footer): the page's width, the header's width, where the main menu sits and the footer's width, for Standard and
 * Application pages, for visitors and for members (BxDolTemplate::getPageWidth, getHeaderLayout, getFooterLayout).
 * Designer saves only the values there are, the site takes them (BxBaseFunctions::TemplPageAddComponent, Artificer's
 * own settings winning), and the apps get them with each page (`page_width`, `header` and `footer` of the page API).
 */
#[Group('integration')]
class HeaderLayoutTest extends BxDolIntegrationTestCase
{
    private const OPTIONS = [
        'sys_pt_default_visitor', 'sys_pt_default_member',
        'sys_header_width_standard_visitor', 'sys_header_align_standard_visitor', 'sys_header_width_application_visitor', 'sys_header_align_application_visitor',
        'sys_header_width_standard_member', 'sys_header_align_standard_member', 'sys_header_width_application_member', 'sys_header_align_application_member',
        'sys_page_width_standard_visitor', 'sys_page_width_standard_member', 'sys_page_width_application_visitor', 'sys_page_width_application_member',
        'sys_footer_width_standard_visitor', 'sys_footer_width_standard_member', 'sys_footer_width_application_visitor', 'sys_footer_width_application_member',
        'bx_artificer_header_width', 'bx_artificer_header_align', 'bx_artificer_page_width',
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
            $this->setPageWidth(['standard_visitor' => '1280', 'standard_member' => 'full']);
            $this->assertSame('full', BxDolTemplate::getPageWidth(BX_PAGE_TYPE_STANDARD), 'and the members\' page width');
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
        $this->setPageWidth(['standard_visitor' => '1100', 'standard_member' => 'full', 'application_visitor' => '1280', 'application_member' => 'full']);

        $sTable = (new ReflectionMethod('BxBaseStudioDesigner', 'getSettingsHeader'))->invoke($this->designer());

        foreach (['visitor' => ['full', 'center', 'page', 'end'], 'member' => ['page', 'start', 'full', 'center']] as $sWho => $aValues)
            foreach (array_combine(['width_standard', 'align_standard', 'width_application', 'align_application'], $aValues) as $sName => $sValue)
                $this->assertMatchesRegularExpression('/name="sys_header_' . $sName . '_' . $sWho . '" value="' . $sValue . '" data-kind="\\w+" checked="checked"/', $sTable);
        $this->assertMatchesRegularExpression('/name="sys_page_width_kind_standard_member" value="full" data-kind="page" checked="checked"/', $sTable);
        $this->assertMatchesRegularExpression('/name="sys_page_width_kind_standard_visitor" value="limited" data-kind="page" checked="checked"/', $sTable);
        $this->assertStringContainsString('name="sys_page_width_standard_visitor" value="1100"', $sTable, 'the pixels beside Limited');
        $this->assertSame(36, substr_count($sTable, 'type="radio"'), 'four cells, each with two page widths, two header widths, three places and two footer widths');
        $this->assertSame(16, substr_count($sTable, 'checked="checked"'), 'one choice per control');
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

    public function testEachLayoutAndAudienceHasItsPageWidth(): void
    {
        // Setup A: a limited site for guests, the whole window for members.
        $this->setPageWidth(['standard_visitor' => '1280', 'standard_member' => 'full', 'application_visitor' => '1024', 'application_member' => '1600']);

        $this->assertSame(1280, BxDolTemplate::getPageWidth(BX_PAGE_TYPE_STANDARD, false));
        $this->assertSame('full', BxDolTemplate::getPageWidth(BX_PAGE_TYPE_STANDARD, true));
        $this->assertSame(1024, BxDolTemplate::getPageWidth(BX_PAGE_TYPE_APPLICATION, false));
        $this->assertSame(1600, BxDolTemplate::getPageWidth(BX_PAGE_TYPE_APPLICATION, true));
        $this->assertSame(1280, BxDolTemplate::getPageWidth(BX_PAGE_TYPE_STANDARD), 'a guest gets the visitors\' width');

        setParam('sys_pt_default_member', BX_PAGE_TYPE_APPLICATION);
        $this->assertSame(1600, BxDolTemplate::getPageWidth(BX_PAGE_TYPE_DEFAULT, true), 'Default is the audience\'s layout');
    }

    public function testUnknownPageWidthsAreTheDefault(): void
    {
        $this->setPageWidth(['standard_visitor' => 'wide', 'standard_member' => '100', 'application_visitor' => '99999', 'application_member' => '1280px']);

        foreach ([[BX_PAGE_TYPE_STANDARD, false], [BX_PAGE_TYPE_STANDARD, true], [BX_PAGE_TYPE_APPLICATION, false], [BX_PAGE_TYPE_APPLICATION, true]] as [$iType, $bMember])
            $this->assertSame(BxDolTemplate::PAGE_WIDTH_DEFAULT, BxDolTemplate::getPageWidth($iType, $bMember));
    }

    public function testDesignerSavesPageWidths(): void
    {
        $this->setPageWidth(['standard_visitor' => '1280', 'standard_member' => '1280', 'application_visitor' => '1280', 'application_member' => '1280']);

        $_GET = [
            'sys_page_width_kind_standard_visitor' => 'limited', 'sys_page_width_standard_visitor' => '1100',
            'sys_page_width_kind_standard_member' => 'full', 'sys_page_width_standard_member' => '1100',
            'sys_page_width_kind_application_visitor' => 'limited', 'sys_page_width_application_visitor' => '100',
            'sys_page_width_kind_application_member' => 'limited', 'sys_page_width_application_member' => '9000',
        ];
        $this->designer()->submitSettings();
        $this->assertSame(['1100', 'full', '480', '3840'], $this->getPageWidths(), 'Full width, or pixels brought into the range');

        $_GET = [
            'sys_page_width_kind_standard_visitor' => 'limited', 'sys_page_width_standard_visitor' => '12px; color: red',
            'sys_page_width_kind_standard_member' => 'wide', 'sys_page_width_standard_member' => '900',
            'sys_page_width_kind_application_visitor' => 'limited', 'sys_page_width_application_visitor' => '',
        ];
        $this->designer()->submitSettings();
        $this->assertSame(['1100', 'full', '480', '3840'], $this->getPageWidths(), 'other values are not saved');
    }

    public function testTheSiteTakesThePageWidth(): void
    {
        $this->setPageWidth(['standard_visitor' => '1100', 'standard_member' => 'full', 'application_visitor' => 'full', 'application_member' => '1280']);
        setParam('bx_artificer_page_width', '');
        $oFunctions = BxTemplFunctions::getInstance();

        BxDolTemplate::getInstance()->setPageType(BX_PAGE_TYPE_STANDARD);
        $this->assertSame('1100px', $oFunctions->TemplPageAddComponent('sys_page_width'));
        BxDolTemplate::getInstance()->setPageType(BX_PAGE_TYPE_APPLICATION);
        $this->assertSame('none', $oFunctions->TemplPageAddComponent('sys_page_width'), 'Full width has no limit');

        // <body> carries it, and .bx-def-page-width reads it in the templates that follow Designer.
        $this->assertStringContainsString('style="--bx-page-width: __sys_page_width__"', file_get_contents(BX_DIRECTORY_PATH_ROOT . 'template/_header.html'));
        foreach (['template/css/default.less', 'modules/boonex/artificer/data/template/system/css/default.less'] as $sFile)
            $this->assertStringContainsString('max-width: var(--bx-page-width, @bx-page-width);', file_get_contents(BX_DIRECTORY_PATH_ROOT . $sFile), $sFile);
    }

    public function testArtificersPageWidthWins(): void
    {
        $oFunctions = BxTemplFunctions::getInstance();
        if ((new ReflectionMethod($oFunctions, 'getPageWidth'))->getDeclaringClass()->getName() != 'BxTemplFunctions')
            $this->markTestSkipped('Artificer is not the site template');

        $this->setPageWidth(['standard_visitor' => '1100', 'standard_member' => '1100', 'application_visitor' => '1100', 'application_member' => '1100']);
        BxDolTemplate::getInstance()->setPageType(BX_PAGE_TYPE_STANDARD);

        setParam('bx_artificer_page_width', '960');
        $this->assertSame('960px', $oFunctions->TemplPageAddComponent('sys_page_width'));
        setParam('bx_artificer_page_width', '100%');
        $this->assertSame('none', $oFunctions->TemplPageAddComponent('sys_page_width'));
        setParam('bx_artificer_page_width', '');
        $this->assertSame('1100px', $oFunctions->TemplPageAddComponent('sys_page_width'), 'empty follows Designer');
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
        $this->assertSame(BxDolTemplate::getPageWidth(BX_PAGE_TYPE_STANDARD, false), $aData['page_width'] ?? null, 'and its width');
    }

    public function testEachLayoutAndAudienceHasItsFooter(): void
    {
        $this->setFooter(['standard_visitor' => 'page', 'standard_member' => 'full', 'application_visitor' => 'full', 'application_member' => 'page']);

        $this->assertSame(['width' => 'page'], BxDolTemplate::getFooterLayout(BX_PAGE_TYPE_STANDARD, false));
        $this->assertSame(['width' => 'full'], BxDolTemplate::getFooterLayout(BX_PAGE_TYPE_STANDARD, true));
        $this->assertSame(['width' => 'full'], BxDolTemplate::getFooterLayout(BX_PAGE_TYPE_APPLICATION, false));
        $this->assertSame(['width' => 'page'], BxDolTemplate::getFooterLayout(BX_PAGE_TYPE_APPLICATION, true));
        $this->assertSame(['width' => 'page'], BxDolTemplate::getFooterLayout(BX_PAGE_TYPE_STANDARD), 'a guest gets the visitors\' footer');
        $this->assertSame(['width' => 'page'], BxDolTemplate::getFooterLayout(BX_PAGE_TYPE_DEFAULT_WO_HF, false), 'other layouts take the Standard footer');

        setParam('sys_pt_default_member', BX_PAGE_TYPE_APPLICATION);
        $this->assertSame(['width' => 'page'], BxDolTemplate::getFooterLayout(BX_PAGE_TYPE_DEFAULT, true), 'Default is the audience\'s layout');
    }

    public function testUnknownFooterWidthsKeepTheFooterAsItWas(): void
    {
        $this->setFooter(['standard_visitor' => 'wide', 'standard_member' => '', 'application_visitor' => '1280', 'application_member' => '<b>']);

        foreach ([false, true] as $bMember) {
            $this->assertSame(['width' => 'page'], BxDolTemplate::getFooterLayout(BX_PAGE_TYPE_STANDARD, $bMember), 'under the page\'s content on Standard pages');
            $this->assertSame(['width' => 'full'], BxDolTemplate::getFooterLayout(BX_PAGE_TYPE_APPLICATION, $bMember), 'across the content\'s block on Application pages');
        }
    }

    public function testDesignerSavesFooterWidths(): void
    {
        $this->setFooter(['standard_visitor' => 'page', 'standard_member' => 'page', 'application_visitor' => 'full', 'application_member' => 'full']);

        $_GET = ['sys_footer_width_standard_visitor' => 'full', 'sys_footer_width_standard_member' => 'page', 'sys_footer_width_application_visitor' => 'page', 'sys_footer_width_application_member' => 'full'];
        $this->designer()->submitSettings();
        $this->assertSame(['full', 'page', 'page', 'full'], $this->getFooter());

        $_GET = ['sys_footer_width_standard_visitor' => 'wide', 'sys_footer_width_standard_member' => '', 'sys_footer_width_application_visitor' => '<b>'];
        $this->designer()->submitSettings();
        $this->assertSame(['full', 'page', 'page', 'full'], $this->getFooter(), 'unknown values are not saved');
    }

    public function testDesignerShowsTheFooterWidths(): void
    {
        $this->setFooter(['standard_visitor' => 'full', 'standard_member' => 'page', 'application_visitor' => 'page', 'application_member' => 'full']);

        $sTable = (new ReflectionMethod('BxBaseStudioDesigner', 'getSettingsHeader'))->invoke($this->designer());

        foreach (['standard_visitor' => 'full', 'standard_member' => 'page', 'application_visitor' => 'page', 'application_member' => 'full'] as $sSuffix => $sValue)
            $this->assertMatchesRegularExpression('/name="sys_footer_width_' . $sSuffix . '" value="' . $sValue . '" data-kind="footer" checked="checked"/', $sTable);
        $this->assertSame(4, substr_count($sTable, 'adm-dsg-hd-footer-inner'), 'each cell sketches its footer');
    }

    public function testTheSiteFooterTakesTheLayoutsWidth(): void
    {
        $this->setFooter(['standard_visitor' => 'full', 'standard_member' => 'full', 'application_visitor' => 'page', 'application_member' => 'page']);
        $oFunctions = BxTemplFunctions::getInstance();

        BxDolTemplate::getInstance()->setPageType(BX_PAGE_TYPE_STANDARD);
        $this->assertSame('', $oFunctions->TemplPageAddComponent('sys_footer_width'), 'a full width footer has no page width');
        BxDolTemplate::getInstance()->setPageType(BX_PAGE_TYPE_APPLICATION);
        $this->assertSame('bx-def-page-width', $oFunctions->TemplPageAddComponent('sys_footer_width'));

        // The footer's box carries the key in the templates that draw a footer for Designer's layouts.
        foreach (['template/footer.html', 'modules/boonex/artificer/data/template/system/pt_application.html'] as $sFile)
            $this->assertStringContainsString('class="bx-footer-box __sys_footer_width__ mx-auto', file_get_contents(BX_DIRECTORY_PATH_ROOT . $sFile), $sFile);
    }

    public function testTheAppsGetThePagesFooter(): void
    {
        setParam('sys_pt_default_visitor', BX_PAGE_TYPE_STANDARD);

        foreach (['full', 'page'] as $sWidth) {
            $this->setFooter(['standard_visitor' => $sWidth]);

            if (($sObject = BxDolPageQuery::getPageObjectNameByURI('home')))
                unset($GLOBALS['bxDolClasses']['BxDolPage!' . $sObject]);
            $_GET = ['api' => 1];
            $aData = BxDolService::call('system', 'get_page_by_request', ['page/home', '', '[]'], 'TemplServicePages', true);

            $this->assertIsArray($aData);
            $this->assertSame(['width' => $sWidth], $aData['footer'] ?? null, 'the page carries its footer');
        }
    }

    private function setFooter(array $aValues): void
    {
        foreach ($aValues as $sSuffix => $sValue)
            setParam('sys_footer_width_' . $sSuffix, $sValue);
    }

    private function getFooter(): array
    {
        return array_map(fn($sSuffix) => getParam('sys_footer_width_' . $sSuffix), ['standard_visitor', 'standard_member', 'application_visitor', 'application_member']);
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

    private function setPageWidth(array $aValues): void
    {
        foreach ($aValues as $sSuffix => $sValue)
            setParam('sys_page_width_' . $sSuffix, $sValue);
    }

    private function getPageWidths(): array
    {
        return array_map(fn($sSuffix) => getParam('sys_page_width_' . $sSuffix), ['standard_visitor', 'standard_member', 'application_visitor', 'application_member']);
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
