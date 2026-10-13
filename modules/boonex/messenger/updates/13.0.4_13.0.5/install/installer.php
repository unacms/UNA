<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

class BxMessengerUpdater extends BxDolStudioUpdater
{
    function __construct($aConfig)
	{
        parent::__construct($aConfig);
    }

    public function actionExecuteSql($sOperation)
    {
        if($sOperation == 'install')
            if(!$this->oDb->isFieldExists('bx_messenger_files', 'dimensions'))
                $this->oDb->query("ALTER TABLE `bx_messenger_files` ADD `dimensions` varchar(24) NOT NULL");

        return parent::actionExecuteSql($sOperation);
    }

   function update($aParams) {
       $aResult = parent::update($aParams);
       if(!$aResult['result'])
			return $aResult;

	   $oCacheUtilities = BxDolCacheUtilities::getInstance();
       $oCacheUtilities->clear('css');
       $oCacheUtilities->clear('js');
       $oCacheUtilities->clear('template');

       return $aResult;
   }
}