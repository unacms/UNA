<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

class BxTimelineUpdater extends BxDolStudioUpdater
{
    function __construct($aConfig)
    {
        parent::__construct($aConfig);
    }

    public function actionExecuteSql($sOperation)
    {
        if($sOperation == 'install') {
            if(!$this->oDb->isIndexExists('bx_timeline_events', 'sticked_date_id'))
                $this->oDb->query("ALTER TABLE `bx_timeline_events` ADD INDEX `sticked_date_id` (`sticked`, `date`, `id`)");
            if(!$this->oDb->isIndexExists('bx_timeline_events', 'date_id'))
                $this->oDb->query("ALTER TABLE `bx_timeline_events` ADD INDEX `date_id` (`date`, `id`)");
            if(!$this->oDb->isIndexExists('bx_timeline_events', 'promoted'))
                $this->oDb->query("ALTER TABLE `bx_timeline_events` ADD INDEX `promoted` (`promoted`)");
            if(!$this->oDb->isIndexExists('bx_timeline_events', 'source'))
                $this->oDb->query("ALTER TABLE `bx_timeline_events` ADD INDEX `source` (`source`)");

            if(!$this->oDb->isIndexExists('bx_timeline_events_slice', 'sticked_date_id'))
                $this->oDb->query("ALTER TABLE `bx_timeline_events_slice` ADD INDEX `sticked_date_id` (`sticked`, `date`, `id`)");
            if(!$this->oDb->isIndexExists('bx_timeline_events_slice', 'date_id'))
                $this->oDb->query("ALTER TABLE `bx_timeline_events_slice` ADD INDEX `date_id` (`date`, `id`)");
            if(!$this->oDb->isIndexExists('bx_timeline_events_slice', 'promoted'))
                $this->oDb->query("ALTER TABLE `bx_timeline_events_slice` ADD INDEX `promoted` (`promoted`)");
            if(!$this->oDb->isIndexExists('bx_timeline_events_slice', 'source'))
                $this->oDb->query("ALTER TABLE `bx_timeline_events_slice` ADD INDEX `source` (`source`)");
        }

        return parent::actionExecuteSql($sOperation);
    }
}
