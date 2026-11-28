<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    SocialEngineMigration SocialEngine Migration
 * @ingroup     UnaModules
 *
 * @{
 */
    
require_once('BxSEMigData.php');
bx_import('BxDolStudioLanguagesUtils');

class BxSEMigProfilesFields extends BxSEMigData
{
	private $_aProfileFields = array();
	private $_aFiltered = array();	

    public function BxSEMigProfilesFields($oMigrationModule, &$seDb)
    {
        parent::BxSEMigData($oMigrationModule, $seDb);  
		
		// dont transfer these fields 
		$this -> _aFiltered = array(
            'username', 'email', 'password', 'salt', 'language', 'creation_date', 'modified_dat', 'lastlogin_date', 'user_id',
			'profile_type', 'first_name', 'last_name', 'about_me', 'heading'
        );
    }

	public function getTotalRecords(){
		$aFields = $this -> _seDb -> getAll("SELECT * FROM `{$this -> _sEnginePrefix}user_fields_meta`");			
		foreach($aFields as $iKey => $aValue){
			if (in_array($aValue['type'], $this -> _aFiltered)) continue;
			
			$this -> _aProfileFields[$aValue['type']] = array(
		           'name' => $aValue['type'],
		           'caption' => $aValue['label'],
				   'id' => $aValue['field_id'],
		       );
		}
		
		return count($this -> _aProfileFields);
	}
	
	public function runMigration(){		 
		if (!$this -> getTotalRecords()){
			  $this -> setResultStatus(_t('_bx_se_migration_no_data_to_transfer'));
	          return BX_SEMIG_SUCCESSFUL;
		}	 
		 	 
		 $this -> setResultStatus(_t('_bx_se_migration_started_migration_profile_fields'));		
		 $oLanguage = BxDolStudioLanguagesUtils::getInstance();
		 
		 $i = 0;
		 foreach($this -> _aProfileFields as $sKey => $aItem){
	        if (!$this -> _oDb -> isFieldExists('bx_persons_data', $sKey)){
					$sQuery = $this -> _oDb -> prepare("ALTER TABLE `bx_persons_data` ADD $sKey varchar(255) default ''");               
               
				   if (!$this -> _oDb -> query($sQuery)){
						 $this -> setResultStatus(_t('_bx_se_migration_started_migration_profile_field_can_not_be_transferred'));
						 return BX_SEMIG_FAILED;				
				   }			   
			}
			   
			if ($this -> isFieldTransfered($sKey)) continue;
			   
			$iKeyID = time() + $i++; // unique language keys postfix
			
			$sQuery = $this -> _oDb -> prepare("
			INSERT INTO `sys_form_inputs` SET
					`object`	= 'bx_person', 
					`module`	= 'custom',
					`name`		= ?,	
					`type`		= 'text',
					`caption_system` = ?,
					`caption`	= ?", $sKey, '_sys_form_txt_field_caption_system_' . $iKeyID, '_sys_form_txt_field_caption_' . $iKeyID);

						
			if (!$this -> _oDb -> query($sQuery)){
				$this -> setResultStatus(_t('_bx_se_migration_started_migration_profile_field_can_not_be_transferred'));
				return BX_SEMIG_FAILED;				
			}			   
			
			// create form fields	
			$this -> _oDb -> query($sQuery);
			
			// add display for view and add forms
			$this -> _oDb -> query("INSERT INTO `sys_form_display_inputs` (`id`, `display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES
									(NULL, 'bx_person_add', '{$sKey}', 2147483647, 1, " . $i . "),
									(NULL, 'bx_person_view', '{$sKey}', 2147483647, 1, " . $i . ")");
			// add lanungage keys with translations						
				$oLanguage -> addLanguageString('_sys_form_txt_field_caption_system_' . $iKeyID, $aItem['caption'], 0, 0, false);
				$oLanguage -> addLanguageString('_sys_form_txt_field_caption_' . $iKeyID, $aItem['caption']);

				$this -> _iTransferred++;
	        }
	          
			$this -> migrateProfileFieldsInfo(); 
			
	        $this -> setResultStatus(_t('_bx_se_migration_started_migration_profile_fields_finished', $this -> _iTransferred));
	        return BX_SEMIG_SUCCESSFUL;
	    }

		private function isFieldTransfered($sName){
			$sQuery = $this -> _oDb -> prepare("SELECT COUNT(*) FROM `sys_form_inputs` WHERE `object` = 'bx_person' AND `module` = 'custom' AND `name` = ? LIMIT 1", $sName);
			return (int)$this -> _oDb -> getOne($sQuery) > 0;
		}			
        
		/**
		* Returns social engine profile fields list
		* @param int $iUserId social engine's user ID
		* @return array
		*/ 
		private function getFieldsValues($iUserId){
			return $this -> _seDb -> getPairs("SELECT * FROM `{$this -> _sEnginePrefix}user_fields_values` WHERE `item_id` = {$iUserId} AND `value` != ''", 'field_id', 'value');			
		}
		
		/**
		* Returns Una profile fields list
		* @param int $iProfileId profile ID
		* @return array
		*/ 
		private function getUsersFieldsValues($iProfileId){
			return $this -> _oDb -> getRow("SELECT * FROM `bx_persons_data` WHERE `id` = {$iProfileId} LIMIT 1");			
		}		
		
		/**
		* Transfers profile fields values for the all profiles
		*/ 		 
		private function migrateProfileFieldsInfo()
        {
            $sQuery = "SELECT * FROM `{$this -> _sEnginePrefix}users`";
            $aFields = $this -> _seDb -> getAll($sQuery);	
		
			foreach($aFields as $iKey => $aValue){
               if (!($iProfileId =  $this -> getContentId($aValue['user_id']))) continue;
			   
			   if (!empty($aValue['wp_data'])) $aValues = @unserialize($aValue['wp_data']);
		       
                $sUpdateField = '';
				$aFieldsValues = $this -> getFieldsValues($aValue['user_id']);
				
				$aCurrentMembersValues = $this -> getUsersFieldsValues($iProfileId);
					
	            foreach($this -> _aProfileFields as $sKey => $aItem)
					if (empty($aCurrentMembersValues[$sKey]))
							$sUpdateField .= "`{$sKey}` = '". addslashes(isset($aValues[$sKey]) && $aValues[$sKey] ? $aValues[$sKey] : 
																			  (isset($aFieldsValues[$aItem['id']]) ? $aFieldsValues[$aItem['id']] : '')) . "',";
                
				if ($sUpdateField){
					$sUpdateField = trim($sUpdateField, ',');

	                $sQuery = 
	                "
	                	UPDATE
	                		`bx_persons_data`
	                	SET
	                		{$sUpdateField}
	                	WHERE
	                		`id` = {$iProfileId}
	                ";
					
					$this -> _oDb -> query($sQuery);
			}	
		}
	}            
}

/** @} */
