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
            if(!$this->oDb->isFieldExists('bx_messenger_jots', 'reply'))
                $this->oDb->query("ALTER TABLE `bx_messenger_jots` add `reply` int(11) NOT NULL default 0");

            if(!$this->oDb->isFieldExists('bx_messenger_lots', 'parent_jot'))
                $this->oDb->query("ALTER TABLE `bx_messenger_lots` add `parent_jot` int(11) unsigned NOT NULL default 0");
        }

        return parent::actionExecuteSql($sOperation);
    }

   function update($aParams) {
       $aResult = parent::update($aParams);
       if(!$aResult['result'])
			return $aResult;	   
	   
		$iTalkId = $this->oDb->getOne("SELECT `id` FROM `bx_messenger_lots` WHERE `title` = '_bx_messenger_lots_class_my_members'  AND `class` = 'members' LIMIT 1");
		if ($iTalkId)
			$this->oDb->query("REPLACE INTO `bx_messenger_groups_lots` (`lot_id`, `group_id`) VALUES (:talk, 1)", ['talk' => $iTalkId]);

       $this->oDb->query("DELETE FROM `sys_options` WHERE `name` IN ('bx_messenger_is_push_enabled', 'bx_messenger_push_app_id', 'bx_messenger_push_rest_api', 'bx_messenger_push_short_name', 'bx_messenger_push_safari_id')");

		bx_srv('bx_messenger', 'public_to_pages');
		bx_srv('bx_messenger', 'convert_to_reply');

		$iActionResult = bx_srv('bx_messenger', 'update_memberships');
		if ($iActionResult !== FALSE && is_numeric($iActionResult))
             $this->oDb->query("DELETE `sys_acl_actions`, `sys_acl_matrix`
                                    FROM `sys_acl_actions`, `sys_acl_matrix`
                                    WHERE `sys_acl_matrix`.`IDAction` = `sys_acl_actions`.`ID` AND `sys_acl_actions`.`Module` =:module AND `sys_acl_actions`.`ID`=:action",
                                ['module' => 'bx_messenger', 'action' => $iActionResult]);

	   $oCacheUtilities = BxDolCacheUtilities::getInstance();
       $oCacheUtilities->clear('css');
       $oCacheUtilities->clear('js');
       $oCacheUtilities->clear('template');
		
       return $aResult;
   }
}