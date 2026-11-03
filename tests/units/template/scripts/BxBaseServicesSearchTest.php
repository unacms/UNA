<?php

/**
 * The apps' search page (search-keyword) calls get_data_search_api without `live`. A warning about the
 * missing key printed before the JSON, and NEO couldn't read the page.
 */
class BxBaseServicesSearchTest extends BxDolTestCase
{
    public function testSearchWithoutLiveRaisesNoWarning(): void
    {
        $bHadApi = isset($_GET['api']);
        $_GET['api'] = 1;
        set_error_handler(function ($iErrno, $sError) {
            throw new ErrorException($sError, 0, $iErrno);
        }, E_WARNING | E_NOTICE | E_DEPRECATED);
        try {
            $aResult = (new BxTemplServicesSearch())->serviceGetDataSearchApi(['params' => ['keyword' => 'phpunit-nothing-matches']]);
        }
        finally {
            restore_error_handler();
            if (!$bHadApi)
                unset($_GET['api']);
        }

        $this->assertIsArray($aResult);
    }
}
