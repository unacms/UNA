<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * BxProfiler.php reads the module's install/config.php. The installer's last pages include that config before the
 * profiler starts; BxProfiler.php then found no $aConfig (12 warnings) and failed on bx_import('Template'), which
 * looked for /opt/una/modules/classes/Template.php. Run in its own PHP process: the file defines constants, and
 * the config is included before the header, as the installer does.
 */
#[Group('integration')]
class ProfilerRepeatIncludeTest extends BxDolIntegrationTestCase
{
    public function testLoadsAfterItsConfigWasIncluded(): void
    {
        $sScript = tempnam(sys_get_temp_dir(), 'bxprof');
        file_put_contents($sScript, <<<'PHP'
<?php
define('BX_SKIP_INSTALL_CHECK', 1);
error_reporting(E_ALL);
ini_set('display_errors', '1');
// As the installer does: the module's config is included before the site's header
define('BX_DOL_MODULE_TYPE_MODULE', 'module');
(function ($sRoot) { require_once $sRoot . 'modules/boonex/profiler/install/config.php'; })($argv[1]);
// the header starts the profiler when it is enabled; it is loaded here when it is not
require $argv[1] . 'inc/header.inc.php';
(function () { require_once BX_DIRECTORY_PATH_MODULES . 'boonex/profiler/classes/BxProfiler.php'; })();
echo "\n#RESULT#" . json_encode([
    'module' => $GLOBALS['bx_profiler_module'] ?? null,
    'template' => class_exists('BxProfilerTemplate', false),
    'config' => class_exists('BxProfilerConfig', false),
]);
PHP);

        try {
            exec(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($sScript) . ' ' . escapeshellarg(BX_DIRECTORY_PATH_ROOT) . ' 2>&1', $aOutput, $iCode);
        }
        finally {
            unlink($sScript);
        }

        $sOutput = implode("\n", $aOutput);
        $this->assertSame(0, $iCode, $sOutput);

        [$sBefore, $sResult] = array_pad(explode('#RESULT#', $sOutput, 2), 2, '');
        $this->assertDoesNotMatchRegularExpression('/(Warning|Notice|Deprecated|Fatal error)/', $sOutput, 'No errors while it loads.');

        $aResult = json_decode($sResult, true);
        $this->assertIsArray($aResult, $sOutput);
        $this->assertSame('boonex/profiler/', $aResult['module']['path']);
        $this->assertSame('BxProfiler', $aResult['module']['class_prefix']);
        $this->assertTrue($aResult['template'], 'Its template class is loaded from the module folder.');
        $this->assertTrue($aResult['config']);
    }
}
