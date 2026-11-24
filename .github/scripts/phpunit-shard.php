<?php
/**
 * Splits the Integration suite across CI legs, and proves the legs together ran every file.
 *
 *   php .github/scripts/phpunit-shard.php plan <shard> <shards> [timings.json]
 *       Writes tests/phpunit.shard.xml: tests/phpunit.xml with an Integration suite of this
 *       shard's files. Files are balanced by the seconds master recorded (timings.json); a file
 *       master has no time for counts as the median. Without timings, by number of tests.
 *       Shard 1 also runs Units, so their time counts against it.
 *   php .github/scripts/phpunit-shard.php timings <out.json> <junit.xml>...
 *       Seconds per test file from JUnit reports, for the next plan.
 *   php .github/scripts/phpunit-shard.php verify <junit.xml>...
 *       Fails unless every tests/integration file ran in exactly one report.
 *
 * Paths are relative to tests/, as phpunit.xml writes them.
 */

$sRoot = dirname(__DIR__, 2);
$sTests = $sRoot . '/tests';

function integrationFiles(string $sTests): array
{
    $a = [];
    $o = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($sTests . '/integration', FilesystemIterator::SKIP_DOTS));
    foreach ($o as $oFile)
        if (substr($oFile->getFilename(), -8) === 'Test.php')
            $a[] = substr($oFile->getPathname(), strlen($sTests) + 1);
    sort($a);
    return $a;
}

/**
 * Seconds by file (relative to tests/) from JUnit reports; Units add up under '__units__'.
 */
function junitTimes(array $aReports): array
{
    $aTimes = [];
    foreach ($aReports as $sReport) {
        $o = simplexml_load_file($sReport);
        if ($o === false)
            fail("Not a JUnit report: $sReport");
        foreach ($o->xpath('//testcase') as $oCase) {
            $sFile = (string)$oCase['file'];
            $i = strrpos($sFile, '/tests/');
            if ($i === false)
                continue;
            $sFile = substr($sFile, $i + 7);
            $sKey = strpos($sFile, 'units/') === 0 ? '__units__' : $sFile;
            $aTimes[$sKey][$sReport] = ($aTimes[$sKey][$sReport] ?? 0) + (float)$oCase['time'];
        }
    }
    return $aTimes;
}

function fail(string $s): void
{
    fwrite(STDERR, $s . "\n");
    exit(1);
}

$sCmd = $argv[1] ?? '';

if ($sCmd === 'plan') {
    $iShard = (int)($argv[2] ?? 0);
    $iShards = (int)($argv[3] ?? 0);
    if ($iShards < 1 || $iShard < 1 || $iShard > $iShards)
        fail('Usage: plan <shard> <shards> [timings.json]');

    $aFiles = integrationFiles($sTests);
    $aTimings = [];
    if (!empty($argv[4]) && is_readable($argv[4]))
        $aTimings = json_decode(file_get_contents($argv[4]), true) ?: [];

    $aWeights = [];
    if ($aTimings) {
        $aKnown = array_values(array_intersect_key($aTimings, array_flip($aFiles)));
        sort($aKnown);
        $fMedian = $aKnown ? $aKnown[intdiv(count($aKnown), 2)] : 1.0;
        foreach ($aFiles as $sFile)
            $aWeights[$sFile] = $aTimings[$sFile] ?? $fMedian;
        $fUnits = $aTimings['__units__'] ?? 0;
        echo 'Balancing by master timings (' . count($aKnown) . ' of ' . count($aFiles) . " files known).\n";
    }
    else {
        foreach ($aFiles as $sFile)
            $aWeights[$sFile] = max(1, preg_match_all('/function\s+test\w*\s*\(/', file_get_contents($sTests . '/' . $sFile)));
        $fUnits = 0;
        echo "No timings from master yet; balancing by number of tests.\n";
    }

    // Longest first, each to the lightest shard: the same input always gives the same plan.
    uksort($aWeights, function ($a, $b) use ($aWeights) {
        return $aWeights[$b] <=> $aWeights[$a] ?: strcmp($a, $b);
    });
    $aLoad = array_fill(1, $iShards, 0.0);
    $aLoad[1] = $fUnits;
    $aPlan = array_fill(1, $iShards, []);
    foreach ($aWeights as $sFile => $fWeight) {
        $iLightest = array_keys($aLoad, min($aLoad))[0];
        $aPlan[$iLightest][] = $sFile;
        $aLoad[$iLightest] += $fWeight;
    }

    $aAll = array_merge(...array_values($aPlan));
    sort($aAll);
    if ($aAll !== $aFiles)
        fail('The plan does not hold every file exactly once.');

    foreach ($aLoad as $i => $f)
        printf("Shard %d of %d: %d files, weight %.1f%s\n", $i, $iShards, count($aPlan[$i]), $f, $i === $iShard ? ' (this one)' : '');

    $aMine = $aPlan[$iShard];
    sort($aMine);
    $oDom = new DOMDocument();
    $oDom->preserveWhiteSpace = false;
    $oDom->formatOutput = true;
    $oDom->load($sTests . '/phpunit.xml');
    $oSuites = $oDom->getElementsByTagName('testsuites')->item(0);
    foreach (iterator_to_array($oDom->getElementsByTagName('testsuite')) as $oSuite)
        if ($oSuite->getAttribute('name') === 'Integration')
            $oSuites->removeChild($oSuite);
    $oSuite = $oDom->createElement('testsuite');
    $oSuite->setAttribute('name', 'Integration');
    foreach ($aMine as $sFile)
        $oSuite->appendChild($oDom->createElement('file', './' . $sFile));
    $oSuites->appendChild($oSuite);
    $oDom->save($sTests . '/phpunit.shard.xml');
    echo implode("\n", $aMine) . "\n";
    exit(0);
}

if ($sCmd === 'timings') {
    if (count($argv) < 4)
        fail('Usage: timings <out.json> <junit.xml>...');
    $aTimes = [];
    foreach (junitTimes(array_slice($argv, 3)) as $sFile => $aByReport)
        $aTimes[$sFile] = round(max($aByReport), 3);
    ksort($aTimes);
    file_put_contents($argv[2], json_encode($aTimes, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n");
    echo count($aTimes) . " timings written to {$argv[2]}\n";
    exit(0);
}

if ($sCmd === 'verify') {
    if (count($argv) < 3)
        fail('Usage: verify <junit.xml>...');
    $aTimes = junitTimes(array_slice($argv, 2));
    $iFailed = 0;
    foreach (integrationFiles($sTests) as $sFile) {
        $iReports = count($aTimes[$sFile] ?? []);
        if ($iReports !== 1) {
            echo "::error file=tests/$sFile::ran in $iReports shards, expected exactly 1\n";
            ++$iFailed;
        }
    }
    if ($iFailed)
        fail("$iFailed Integration files did not run exactly once.");
    echo "Every Integration file ran exactly once.\n";
    exit(0);
}

fail('Usage: phpunit-shard.php plan|timings|verify ...');
