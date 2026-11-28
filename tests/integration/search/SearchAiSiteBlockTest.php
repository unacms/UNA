<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The AI search block on the site, as NEO's with `use_page_results`: a field for words, read into the search
 * object's fields (searchExtended.php, action parse_ai) and drawn as chips; Search opens the object's results block
 * with them as `filters`, which the block takes as the search form's values.
 */
#[Group('integration')]
class SearchAiSiteBlockTest extends BxDolIntegrationTestCase
{
    protected $_aGetBackup;
    protected $_aPostBackup;

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_persons'))
            $this->markTestSkipped('Persons is not installed.');

        $oSearch = BxDolSearchExtended::getObjectInstance('bx_persons');
        if (!$oSearch || !$oSearch->isEnabled())
            $this->markTestSkipped('The bx_persons extended search is off.');

        $this->_aGetBackup = $_GET;
        $this->_aPostBackup = $_POST;
        unset($_GET['api'], $GLOBALS['bxDolClasses']['BxDolSearchExtended!bx_persons']);
    }

    protected function tearDown(): void
    {
        unset($GLOBALS['bxDolClasses']['BxDolSearchExtended!bx_persons']);
        $_GET = $this->_aGetBackup ?? [];
        $_POST = $this->_aPostBackup ?? [];

        parent::tearDown();
    }

    private function config(string $sHtml): array
    {
        $this->assertMatchesRegularExpression('/<script type="application\/json" id="bx-search-ai-[0-9a-f]+-cfg">(.+?)<\/script>/s', $sHtml);
        preg_match('/<script type="application\/json" id="bx-search-ai-[0-9a-f]+-cfg">(.+?)<\/script>/s', $sHtml, $m);

        return json_decode($m[1], true);
    }

    public function testTheBlockSendsItsResultsToTheObjectsSearchPage(): void
    {
        $_GET['i'] = 'persons-home';
        $sHtml = (new BxTemplServicesSearch())->serviceGetBlockSearchAi(['object' => 'bx_persons', 'use_page_results' => true, 'multiline' => true]);

        $this->assertStringContainsString('<textarea', $sHtml, 'multiline: a text area');
        $this->assertStringContainsString(bx_html_attribute(_t('_sys_search_ai_txt_placeholder')), $sHtml);

        $aConfig = $this->config($sHtml);
        $this->assertSame('bx_persons', $aConfig['object']);
        $this->assertSame('fullname', $aConfig['keyword_field'], 'Words alone go to the first text field.');
        $this->assertSame(BX_DOL_URL_ROOT . BxDolPermalinks::getInstance()->permalink('page.php?i=persons-search'), $aConfig['results_url'], 'This page has no results block: the search page has.');
    }

    public function testAPageWithItsOwnResultsBlockKeepsThem(): void
    {
        $_GET['i'] = 'persons-search';
        $aConfig = $this->config((new BxTemplServicesSearch())->serviceGetBlockSearchAi(['object' => 'bx_persons']));

        $this->assertSame(BX_DOL_URL_ROOT . BxDolPermalinks::getInstance()->permalink('page.php?i=persons-search'), $aConfig['results_url']);
    }

    public function testTheSectionsSearchDrawsNothingOnTheSite(): void
    {
        $oServices = new BxTemplServicesSearch();
        $this->assertSame('', $oServices->serviceGetBlockSearchAi(''));
        $this->assertSame('', $oServices->serviceGetBlockSearchAi(['object' => 'SearchAiSiteBlockTest_no_such_object']));
    }

    public function testChipsShowTheFieldsTheQueryWasReadInto(): void
    {
        $sHtml = (new BxTemplServicesSearch())->getSearchAiChips(['chips' => [
            'gender' => ['field' => 'gender', 'caption' => 'Gender', 'label' => 'Woman', 'filter_keys' => ['gender']],
            'fullname' => ['field' => 'fullname', 'caption' => 'Name', 'label' => '<b>Maya</b>', 'filter_keys' => ['fullname']],
        ]]);

        $this->assertSame(2, substr_count($sHtml, 'class="bx-search-window-chip '));
        $this->assertStringContainsString('bx-btn-group', $sHtml);
        $this->assertStringNotContainsString('__group__', $sHtml);
        $this->assertStringContainsString('Gender: Woman', $sHtml);
        $this->assertStringContainsString('data-remove="gender"', $sHtml);
        $this->assertStringContainsString('data-remove="fullname"', $sHtml);
        $this->assertStringNotContainsString('<b>Maya</b>', $sHtml, 'A label is text.');
        $this->assertSame('', (new BxTemplServicesSearch())->getSearchAiChips(['chips' => []]));
    }

    public function testFiltersInTheAddressAreSearchedForOnTheSite(): void
    {
        $sName = 'SearchAiSiteBlockTest no such name ' . time();
        $_GET['filters'] = json_encode(['fullname' => $sName]);

        $sHtml = (new BxTemplSearchExtendedServices())->serviceGetResults(['object' => 'bx_persons']);

        // searched for: the empty state of a search that found nothing, not the empty block before a search
        $this->assertNotSame('', trim($sHtml), 'Filters in the address run the search.');
        $this->assertStringContainsString(_t('_sys_txt_empty_search_title'), $sHtml);
    }

    public function testParseWithoutAModelReturnsNoFields(): void
    {
        $oParser = BxDolAiSearchExtParser::getInstance();
        if ($oParser->isAvailable())
            $this->markTestSkipped('A model is configured: its answer is not fixed.');

        $aResult = (new BxTemplServicesSearch())->parseAiExtended('bx_persons', 'women in Stockholm');
        $this->assertFalse($aResult['available']);
        $this->assertSame('extended', $aResult['mode']);
        $this->assertSame([], $aResult['filters']);
    }
}
