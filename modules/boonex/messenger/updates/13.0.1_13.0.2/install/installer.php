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
        if($sOperation == 'install') {
            if(!$this->oDb->isFieldExists('bx_messenger_lots', 'hash'))
                $this->oDb->query("ALTER TABLE `bx_messenger_lots` ADD `hash` varchar(32) NOT NULL");

            if(!$this->oDb->isFieldExists('bx_messenger_jots', 'rrate'))
                $this->oDb->query("ALTER TABLE `bx_messenger_jots` ADD `rrate` float NOT NULL default '0'");

            if(!$this->oDb->isFieldExists('bx_messenger_jots', 'rvotes'))
                $this->oDb->query("ALTER TABLE `bx_messenger_jots` ADD `rvotes` int(11) NOT NULL default '0'");
        }

        return parent::actionExecuteSql($sOperation);
    }

    private function generateConvoHash(){
        $iCount = $this->oDb->getOne("SELECT COUNT(*) FROM `bx_messenger_lots` WHERE `hash` = ''");

        if (!$iCount)
            return true;

        $aKeys = [];
        for($i = 0; $i < $iCount; $i++)
            $aKeys[] = genRndPwd(10, false);

        $aResult = array_unique($aKeys, SORT_STRING);
        if (count($aResult) < $iCount) {
            $aResult = array_values($aResult);
            if (count($aResult) < $iCount) {
                $iDiff = $iCount - count($aResult);
                for ($i = 0; $i < $iDiff; $i++)
                    $aResult[] = md5($i . BX_DOL_SECRET);
            }
        }

        $aTalksList = $this->oDb->getColumn("SELECT `id` FROM `bx_messenger_lots` ORDER BY `id`");
        foreach($aTalksList as &$iId)
            $this->oDb->query("UPDATE `bx_messenger_lots` SET `hash`=:hash WHERE `id`=:id", ['id' => $iId, 'hash' => array_pop($aResult)]);

        $this->oDb->query("ALTER TABLE `bx_messenger_lots` ADD UNIQUE KEY `hash` (`hash`)");
        return true;
    }

   function update($aParams) {
       $aResult = parent::update($aParams);
       if(!$aResult['result'])
			return $aResult;

       if ($this->generateConvoHash() !== true)
            return ['result' => false, 'message' => 'Hash function can not be updated!'];

	   $oCacheUtilities = BxDolCacheUtilities::getInstance();
       $oCacheUtilities->clear('css');
       $oCacheUtilities->clear('js');
       $oCacheUtilities->clear('template');

       return $aResult;
   }
}