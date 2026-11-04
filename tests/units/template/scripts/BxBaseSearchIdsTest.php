<?php

/**
 * The header's search popup is one more live search on a page that has the sidebar's: it takes ids of its own
 * (`setIdSuffix`), because the live search writes into the first element with the results id. Its results keep the
 * class the styles and scripts look for.
 */
class BxBaseSearchIdsTest extends BxDolTestCase
{
    private function liveSearch(string $sSuffix = ''): BxTemplSearch
    {
        $oSearch = new BxTemplSearch();
        $oSearch->setLiveSearch(true);
        if($sSuffix !== '')
            $oSearch->setIdSuffix($sSuffix);

        return $oSearch;
    }

    public function testSuffixGivesTheFormAndResultsTheirOwnIds(): void
    {
        $oSearch = $this->liveSearch('_popup');

        $sForm = $oSearch->getForm(BX_DB_PADDING_DEF, false, true);
        $this->assertStringContainsString('id="sys_search_form_quick_popup"', $sForm);
        $this->assertStringContainsString("'#sys_search_results_quick_popup'", $sForm, 'The live search writes into the popup\'s results.');

        $sResults = $oSearch->getResultsContainer();
        $this->assertStringContainsString('id="sys_search_results_quick_popup"', $sResults);
        $this->assertStringContainsString('sys-search-results-quick', $sResults);
        $this->assertStringNotContainsString('sys-search-results-quick-popup', $sResults, 'The class stays as it was.');
    }

    public function testWithoutSuffixTheIdsStay(): void
    {
        $oSearch = $this->liveSearch();

        $this->assertStringContainsString('id="sys_search_form_quick"', $oSearch->getForm(BX_DB_PADDING_DEF, false, true));
        $this->assertStringContainsString('id="sys_search_results_quick"', $oSearch->getResultsContainer());
    }
}
