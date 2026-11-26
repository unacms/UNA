<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 *
 * Tasks: the tasks added before numbers get theirs, the oldest first in each community, which gets
 * its prefix from its name with it. Their SEO links become their numbers (view-task/una-12); the
 * links made from their titles are kept in bx_tasks_former_links first and lead to the new ones.
 * A task with a number is left as it is, so a second run changes nothing.
 */

$oModule = BxDolModule::getInstance('bx_tasks');
if (!$oModule)
    return true;

$oModule->_oDb->saveFormerSeoLinks();

$aNumbered = [];
while (($aTasks = $oModule->_oDb->getTasksWithoutNumber(1000))) {
    foreach ($aTasks as $aTask) {
        $iId = (int)$aTask['id'];
        // a task which could get no number would be read again and again
        if (isset($aNumbered[$iId]) || !$oModule->assignNumber($iId))
            throw new Exception('Task ' . $iId . ' got no number');
        $aNumbered[$iId] = true;
    }
}

return true;
