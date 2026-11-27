<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 * Tasks: the notification about a timer paused for running too long (`timer_stopped`, BxTasksCronTimers),
 * registered as the notifications module does for the others of the module (BxTasksModule::serviceGetNotificationsData).
 */

$oModuleQuery = BxDolModuleQuery::getInstance();
if(!$oModuleQuery->isEnabledByName('bx_tasks') || !$oModuleQuery->isEnabledByName('bx_notifications'))
    return true;

$oDb = BxDolDb::getInstance();
if($oDb->getOne("SELECT `id` FROM `bx_notifications_handlers` WHERE `alert_unit` = 'bx_tasks' AND `alert_action` = 'timer_stopped' LIMIT 1"))
    return true;

//--- Only the new one: the others are registered already.
$aData = bx_srv('bx_tasks', 'get_notifications_data');
foreach(['handlers' => 'alert_action', 'settings' => 'action', 'alerts' => 'action'] as $sKey => $sField)
    $aData[$sKey] = array_values(array_filter($aData[$sKey] ?? [], function($aItem) use ($sField) {
        return ($aItem[$sField] ?? '') == 'timer_stopped';
    }));

if(empty($aData['handlers']))
    return false;

BxDolModule::getInstance('bx_notifications')->_oDb->insertData($aData);
BxDolAlerts::cacheInvalidate();

return true;
