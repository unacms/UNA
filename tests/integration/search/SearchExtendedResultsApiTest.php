<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The apps get the extended search results as a browse block. Before the visitor searches the list is empty and
 * says so (`hide_empty_msg`), so the apps show no "Nothing found" under a form nobody has filled in yet. A search
 * that finds nothing keeps the message.
 */
#[Group('integration')]
class SearchExtendedResultsApiTest extends BxDolIntegrationTestCase
{
    protected $_aGetBackup;

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_persons'))
            $this->markTestSkipped('Persons is not installed.');

        $this->_aGetBackup = $_GET;
        $_GET['api'] = 1;
        unset($GLOBALS['bxDolClasses']['BxDolSearchExtended!bx_persons']);
    }

    protected function tearDown(): void
    {
        unset($GLOBALS['bxDolClasses']['BxDolSearchExtended!bx_persons']);
        $_GET = $this->_aGetBackup ?? [];

        parent::tearDown();
    }

    protected function results(array $aParams): array
    {
        $oSearch = BxDolSearchExtended::getObjectInstance('bx_persons');
        if (!$oSearch || !$oSearch->isEnabled())
            $this->markTestSkipped('The bx_persons extended search is off.');

        $aResults = $oSearch->getResults($aParams);
        $this->assertIsArray($aResults);
        $this->assertSame('browse', $aResults[0]['type'] ?? null);

        return $aResults[0]['data'];
    }

    public function testListBeforeASearchHidesTheEmptyMessage(): void
    {
        $aData = $this->results(['search_params' => []]);

        $this->assertSame([], $aData['data']);
        $this->assertTrue($aData['hide_empty_msg'], 'Nothing was searched for, so the empty list is not "nothing found".');
    }

    public function testSearchThatFindsNothingKeepsTheEmptyMessage(): void
    {
        $aData = $this->results(['cond' => ['fullname' => 'SearchExtendedResultsApiTest no such name ' . time()]]);

        $this->assertSame([], $aData['data']);
        $this->assertFalse($aData['hide_empty_msg'], 'The visitor searched and nothing matched: the apps say so.');
    }
}
