<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

class BxCreditsUpdater extends BxDolStudioUpdater
{
    function __construct($aConfig)
    {
        parent::__construct($aConfig);
    }

    public function actionExecuteSql($sOperation)
    {
        if($sOperation == 'install') {
            if(!$this->oDb->isIndexExists('bx_credits_history', 'date'))
                $this->oDb->query("ALTER TABLE `bx_credits_history` ADD INDEX `date` (`date`, `type`, `direction`)");
        }

        return parent::actionExecuteSql($sOperation);
    }
}
