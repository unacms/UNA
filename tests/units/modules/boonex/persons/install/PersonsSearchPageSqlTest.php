<?php

/**
 * The Persons search page a fresh install gets: the search form in the sidebar, the results in the main column,
 * as on other modules' search pages. Read from the SQL itself, so a site whose admin changed the page in Studio
 * does not fail the suite.
 */
class PersonsSearchPageSqlTest extends \PHPUnit\Framework\TestCase
{
    private static function sql(string $sFile): string
    {
        $sSql = file_get_contents(__DIR__ . '/../../../../../../modules/boonex/persons/install/sql/' . $sFile);
        if ($sSql === false)
            self::fail("modules/boonex/persons/install/sql/$sFile is not readable.");

        return $sSql;
    }

    /**
     * The search page's block row with this title: cell, content, and active and order from the end of the row.
     */
    private static function block(string $sTitle): array
    {
        $bFound = preg_match("/\\('bx_persons_search', (\\d+), 'bx_persons', '" . $sTitle . "', \\d+, \\d+, 'service', '([^']*)', \\d+, \\d+, (\\d+), (\\d+)\\)/", self::sql('enable.sql'), $aMatch);
        self::assertSame(1, $bFound, "enable.sql adds the $sTitle block to the search page.");

        return ['cell' => (int)$aMatch[1], 'content' => $aMatch[2], 'active' => (int)$aMatch[3], 'order' => (int)$aMatch[4]];
    }

    public function testSearchPageHasTheSidebarOnTheLeft(): void
    {
        $bFound = preg_match("/\\('bx_persons_search', '_bx_persons_page_title_sys_entries_search', '_bx_persons_page_title_entries_search', 'bx_persons', (\\d+),/", self::sql('enable.sql'), $aMatch);

        $this->assertSame(1, $bFound, 'enable.sql adds the search page.');
        $this->assertSame(1, (int)$aMatch[1], 'The page uses layout 1 (bar_left): a sidebar for the form and a main column for the results.');
    }

    public function testFormsSitInTheSidebarAndResultsInTheMainColumn(): void
    {
        $this->assertSame(1, self::block('_bx_persons_page_block_title_search_form')['cell']);
        $this->assertSame(1, self::block('_bx_persons_page_block_title_search_form_cmts')['cell']);
        $this->assertSame(2, self::block('_bx_persons_page_block_title_search_results')['cell']);
        $this->assertSame(2, self::block('_bx_persons_page_block_title_search_results_cmts')['cell']);

        $this->assertSame(1, self::block('_bx_persons_page_block_title_search_form')['order'], 'The profiles form comes first in the sidebar.');
        $this->assertSame(1, self::block('_bx_persons_page_block_title_search_results')['order'], 'The profiles results come first in the main column.');
    }

    public function testResultsShowNothingBeforeASearch(): void
    {
        foreach (['_bx_persons_page_block_title_search_results', '_bx_persons_page_block_title_search_results_cmts'] as $sTitle) {
            $aParams = unserialize(self::block($sTitle)['content']);

            $this->assertIsArray($aParams, "The $sTitle block content is a valid serialized service call.");
            $this->assertSame('get_results', $aParams['method']);
            $this->assertArrayNotHasKey('show_empty', $aParams['params'][0], "$sTitle shows no empty message before the visitor searches.");
        }
    }

    public function testOnlyTheProfilesSearchIsActive(): void
    {
        $this->assertSame(1, self::block('_bx_persons_page_block_title_search_form')['active']);
        $this->assertSame(1, self::block('_bx_persons_page_block_title_search_results')['active']);
        $this->assertSame(0, self::block('_bx_persons_page_block_title_search_form_cmts')['active']);
        $this->assertSame(0, self::block('_bx_persons_page_block_title_search_results_cmts')['active']);
    }

    public function testTheAppsUseTheFormAsFilters(): void
    {
        $sSql = self::sql('enable-app.sql');

        $bFound = preg_match("/UPDATE `sys_pages_blocks` SET `config_api`='([^']*)' WHERE `object`='bx_persons_search' AND `module`='bx_persons' AND `title_system`='' AND `title`='_bx_persons_page_block_title_search_form';/", $sSql, $aMatch);
        $this->assertSame(1, $bFound, 'enable-app.sql sets the search form block\'s App config.');
        $this->assertSame(['use_as_filter' => true], json_decode($aMatch[1], true), 'The apps show the form as filters: the sidebar on wide screens, the Filters sheet on narrow ones.');

        foreach (['_bx_persons_page_block_title_search_form', '_bx_persons_page_block_title_search_results'] as $sTitle)
            $this->assertStringContainsString("UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_persons_search' AND `module`='bx_persons' AND `title_system`='' AND `title`='$sTitle';", $sSql);
    }
}
