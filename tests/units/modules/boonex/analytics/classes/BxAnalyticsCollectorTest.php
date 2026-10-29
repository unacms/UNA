<?php

/**
 * What the collector needs from the rest of UNA before its first hit.
 */
class BxAnalyticsCollectorTest extends \PHPUnit\Framework\TestCase
{
    /**
     * The collect endpoint may be the first code in a request to use the MEMBERSHIP_ID_*
     * constants. Autoloading doesn't define a constant, so the collector file has to load
     * BxDolAcl.php itself: a guest's hit was a fatal error on sites where nothing else had.
     * This test process has loaded BxDolAcl already, so the file is loaded in a new one, with
     * the autoloader and nothing else.
     */
    public function testDefinesTheMembershipConstantsItUses()
    {
        $sFile = BX_DIRECTORY_PATH_MODULES . 'boonex/analytics/classes/BxAnalyticsCollector.php';

        $aConstants = [];
        foreach (token_get_all(file_get_contents($sFile)) as $mixedToken)
            if (is_array($mixedToken) && $mixedToken[0] === T_STRING && strncmp($mixedToken[1], 'MEMBERSHIP_ID_', 14) === 0)
                $aConstants[$mixedToken[1]] = true;
        $aConstants = array_keys($aConstants);
        $this->assertNotEmpty($aConstants, 'the collector uses no MEMBERSHIP_ID_* constant any more, drop this test');

        $sScript = <<<'PHP'
define('BX_DOL', 1);
define('BX_DIRECTORY_PATH_INC', $argv[1] . 'inc/');
define('BX_DIRECTORY_PATH_CLASSES', BX_DIRECTORY_PATH_INC . 'classes/');
define('BX_DIRECTORY_PATH_MODULES', $argv[1] . 'modules/');
define('BX_DOL_DIR_STUDIO_CLASSES', $argv[1] . 'studio/classes/');
require_once(BX_DIRECTORY_PATH_CLASSES . 'BxDol.php');
require_once(BX_DIRECTORY_PATH_INC . 'utils.inc.php');
spl_autoload_register('bx_autoload');
require_once($argv[2]);
echo json_encode(array_values(array_filter(array_slice($argv, 3), function ($s) { return !defined($s); })));
PHP;

        $aPipes = [];
        $rProcess = proc_open(array_merge([PHP_BINARY, '-d', 'xdebug.mode=off', '-r', $sScript, '--', BX_DIRECTORY_PATH_ROOT, $sFile], $aConstants), [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $aPipes);
        $sOutput = stream_get_contents($aPipes[1]);
        $sErrors = stream_get_contents($aPipes[2]);
        fclose($aPipes[1]);
        fclose($aPipes[2]);
        $iCode = proc_close($rProcess);

        $this->assertSame(0, $iCode, $sOutput . $sErrors);
        $this->assertSame([], json_decode($sOutput, true), 'undefined after loading only ' . basename($sFile));
    }
}
