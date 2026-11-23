<?php defined('BX_DOL') or die('hack attempt');
/**
* Copyright (c) UNA, Inc - https://una.io
* MIT License - https://opensource.org/licenses/MIT
*
* @defgroup    UnaCore UNA Core
* @{
*/

class BxDolCronAudit extends BxDolCron
{
    public function processing()
    {
        BxDolDb::getInstance()->query(BxDolDb::getInstance()->prepare("DELETE FROM `sys_audit` WHERE FROM_UNIXTIME(`added`) < NOW() - INTERVAL ? DAY", (int)getParam("sys_audit_days_before_expire")));
        BxDolDb::getInstance()->query("DELETE FROM `sys_audit` WHERE `id` < (SELECT MIN(`m`.`id`) FROM (SELECT `id` FROM `sys_audit` ORDER BY `id` DESC LIMIT " . (int)getParam("sys_audit_max_records") . ") `m`)");

        $iDays = BxDolAdminLog::daysBeforeExpire();
        if ($iDays > 0)
            BxDolAdminLogQuery::getInstance()->deleteOlderThan($iDays);
    }
}

/** @} */