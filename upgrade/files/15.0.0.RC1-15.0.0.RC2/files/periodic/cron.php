<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

$GLOBALS['bx_profiler_disable'] = true;
define('BX_DOL_CRON_EXECUTE', '1');

$aPathInfo = pathinfo(__FILE__);
require_once ($aPathInfo['dirname'] . '/../inc/header.inc.php');

function getRange($iLow, $iHigh, $iStep)
{
    $aResult = array();
    for ($i = $iLow; $i <= $iHigh && $iStep; $i += $iStep)
        $aResult[] = $i;
    return $aResult;
}

function getPeriod($sPeriod, $iLow, $iHigh)
{
    $aRes = array();
    $iStep = 1;
    $sErr = '';

    do {
        if ('' === $sPeriod) {
            $sErr = 'Variable sPeriod is emply';
            break;
        }

        $aParam = explode('/', $sPeriod);

        if (count($aParam) > 2) {
            $sErr = 'Error of format for string assigning period';
            break;
        }

        if (count($aParam) == 2 && is_numeric($aParam[1]))
            $iStep = $aParam[1];

        $sPeriod = $aParam[0];

        if ($sPeriod != '*') {
            $aParam = explode('-', $sPeriod);

            if (count($aParam) > 2) {
                $sErr = 'Error of format for string assigning period';
                break;
            }

            if (count($aParam) == 2)
                $aRes = getRange($aParam[0], $aParam[1], $iStep);
            else
                $aRes = explode(',', $sPeriod);
        } else
            $aRes = getRange($iLow, $iHigh, $iStep);
    } while(false);

    if ($sErr) {
        // show error or add to log
    }

    return $aRes;
}

function checkCronJob($sPeriods, $aDate = array())
{
    $aParam = explode(' ', preg_replace("{ +}", ' ', trim($sPeriods)));
    $bRes = true;

    if(empty($aDate))
        $aDate = getdate(time());

    for ($i = 0; $i < count($aParam); $i++) {
        switch ($i) {
            case 0:
                $aRes = getPeriod($aParam[$i], 0, 59);
                $bRes = in_array($aDate['minutes'], $aRes);
                break;
            case 1:
                $aRes = getPeriod($aParam[$i], 0, 23);
                $bRes = in_array($aDate['hours'], $aRes);
                break;
            case 2:
                $aRes = getPeriod($aParam[$i], 1, 31);
                $bRes = in_array($aDate['mday'], $aRes);
                break;
            case 3:
                $aRes = getPeriod($aParam[$i], 1, 12);
                $bRes = in_array($aDate['mon'], $aRes);
                break;
            case 4:
                $aRes = getPeriod($aParam[$i], 0, 6);
                $bRes = in_array($aDate['wday'], $aRes);
                break;
        }

        if (!$bRes)
            break;
    }

    return $bRes;
}

function runJob($aJob)
{
    $fStart = microtime(true);
    $oDb = BxDolCronQuery::getInstance();
    $oDb->updateJob($aJob['id'], array('ts' => time(), 'timing' => 0));

    if (!empty($aJob['file']) && !empty($aJob['class']) && file_exists(BX_DIRECTORY_PATH_ROOT . $aJob['file'])) {
        if (!class_exists($aJob['class'], false))
            require_once(BX_DIRECTORY_PATH_ROOT . $aJob['file']);

        $oHandler = new $aJob['class']();
        $oHandler->processing();
    } else if (!empty($aJob['service_call']) && BxDolService::isSerializedService($aJob['service_call'])) {
        BxDolService::callSerialized($aJob['service_call']);
    }
    bx_log('sys_cron_jobs', $aJob['name'] . ' / timing: ' . (microtime(true) - $fStart) . ' / memory: ' . memory_get_usage(), BX_LOG_INFO);
    $oDb->updateJob($aJob['id'], array('timing' => microtime(true) - $fStart));
}

bx_import('BxDolCronQuery');
$oDb = BxDolCronQuery::getInstance();

setParam('sys_cron_time', time());

// run one time transient jobs
$aJobsTransient = $oDb->getTransientJobs();
if (!empty($aJobsTransient)) {
    if (!defined('BX_CRON_FILTER') || in_array($aJobsTransient['name'], constant('BX_CRON_FILTER'))) {
    	$oDb->deleteTransientJobs();

        foreach ($aJobsTransient as $aRow)
            runJob($aRow);

        if (isset($aJobsTransient['sys_perform_upgrade']))
            exit;
    }
}

if (bx_check_maintenance_mode()) // don't run regular cron jobs when site is in maintenance mode
    exit;

bx_import('BxDolLanguages');

// run regular cron jobs
$aJobs = $oDb->getJobs();
$aDate = getdate(time());
foreach($aJobs as $aRow) {
    if (!defined('BX_CRON_FILTER') || in_array($aRow['name'], constant('BX_CRON_FILTER')))
        if (checkCronJob($aRow['time'], $aDate))
            runJob($aRow);
}

// run agents (schedulers)
if (BxDolAi::getInstance())
    BxDolAiTrigger::getInstance('scheduler')->handle($aDate);
/** @} */
