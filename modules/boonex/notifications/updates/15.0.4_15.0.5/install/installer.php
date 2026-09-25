<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

class BxNtfsUpdater extends BxDolStudioUpdater
{
    function __construct($aConfig)
    {
        parent::__construct($aConfig);
    }

    public function actionExecuteSql($sOperation)
    {
        if($sOperation == 'install') {
            if(!$this->oDb->isFieldExists('bx_notifications_events', 'author_id'))
                $this->oDb->query("ALTER TABLE `bx_notifications_events` ADD `author_id` int(11) NOT NULL default '0' AFTER `id`");

            if(!$this->oDb->isFieldExists('bx_notifications_events', 'source_mac')) {
                $this->oDb->query("ALTER TABLE `bx_notifications_events` ADD `source_mac` varchar(64) NOT NULL default '' AFTER `source`");
                $this->oDb->query("UPDATE `bx_notifications_events` SET `source_mac`=CONCAT('sys_old_', `id`) WHERE `source_mac`=''");
            }

            if($this->oDb->isFieldExists('bx_notifications_events', 'source'))
                $this->oDb->query("ALTER TABLE `bx_notifications_events` MODIFY `source` varchar(48) NOT NULL default ''");
        }

        return parent::actionExecuteSql($sOperation);
    }
}
