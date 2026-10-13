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