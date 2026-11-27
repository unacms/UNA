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

bx_import('BxDolProfile');
bx_import('BxDolTranscoderImage');
bx_import('BxDolStorage');
	
require_once('BxSEMigData.php');	
	
class BxSEMigProfiles extends BxSEMigData
{
    public function BxSEMigProfiles(&$oMigrationModule, &$seDb)
    {
		parent::BxSEMigData($oMigrationModule, $seDb);
    }

	public function getTotalRecords(){
		return (int)$this -> _seDb -> getOne("SELECT COUNT(*) FROM `{$this -> _sEnginePrefix}users`");			
	}
	
	public function runMigration(){
		if (!$this -> getTotalRecords()){
			  $this -> setResultStatus(_t('_bx_se_migration_no_data_to_transfer'));
	          return BX_SEMIG_SUCCESSFUL;
		}	
		
		$this -> setResultStatus(_t('_bx_se_migration_started_migration_profiles'));
        $sError = $this -> profilesMigrtion();
        if($sError) {
              $this -> setResultStatus($sError);
              return BX_SEMIG_FAILED;
        }
	
        $this -> setResultStatus(_t('_bx_se_migration_started_migration_profiles_finished', $this -> _iTransferred));
		return BX_SEMIG_SUCCESSFUL;
    }
	
	function profilesMigrtion()
    {
			$this -> createSEIdField();
			
			// get ID of the latest transferred profile from social engine 
			$iProfileID = (int)$this -> _oDb -> getOne("SELECT `se_id` FROM `sys_accounts` WHERE `se_id` <> 0 ORDER BY `id` DESC LIMIT 1");						
			$sStart = '';
			if ($iProfileID) 				
				$sStart = " WHERE `user_id` > {$iProfileID}";				
					
			$aResult = $this -> _seDb -> getAll("SELECT * FROM `{$this -> _sEnginePrefix}users` {$sStart} ORDER BY `user_id`");
			
			$oLanguage = BxDolLanguages::getInstance();
			foreach($aResult as $iKey => $aValue){                  

				  if($aValue['username'] && !$this -> isProfileExisted($aValue['username']) ) {					
					$aUsersFieldsValues = $this -> getMergedFieldsValues($aValue['user_id']);		
				
					$sQuery = $this -> _oDb -> prepare( 
                     "
                     	INSERT INTO
                     		`sys_accounts`
                     	SET
                     		`name`   			= ?,
                     		`email`      		= ?,
                     		`password`   		= ?,
							`salt`				= ?,
							`role`				= '1',		
                     		`lang_id`			= ?,
							`added`				= ?,
                     		`changed`	  		= ?,
                     		`logged` 			= ?,
							`email_confirmed`	= '1',
							`receive_updates`	= '1',	
							`receive_news`		= '1',
							`se_id`				=  ?
							
                     ", 
						$aValue['username'], 
						$aValue['email'], 
						$aValue['password'],
						$aValue['salt'],
						$oLanguage -> getLangId(strtolower($aValue['language'][0].$aValue['language'][1])),
						isset($aValue['creation_date']) ? strtotime($aValue['creation_date']) : time(),
						isset($aValue['modified_dat'])? strtotime($aValue['modified_dat']) : time(),
						isset($aValue['lastlogin_date']) ? strtotime($aValue['lastlogin_date']) : time(),
						$aValue['user_id']
						);
						
					$this -> _oDb -> query($sQuery);										
					$iAccountId = $this -> _oDb -> lastId();					
					if (!$iAccountId) continue;
										
					$sQuery = $this -> _oDb -> prepare( 
	                     "
	                     	INSERT INTO
	                     		`bx_persons_data`
	                     	SET
	                     		`author`   			= 0,
	                     		`added`      		= ?,
	                     		`changed`   		= ?,
								`picture`			= 0,		
	                     		`cover`				= 0,
								`fullname`			= ?,
	                     		`description`		= ?					
	                     ", 						
							isset($aValue['creation_date']) ? strtotime($aValue['creation_date']) : time(),
							isset($aValue['modified_dat'])? strtotime($aValue['modified_dat']) : time(),
							isset($aValue['displayname']) ? $aValue['displayname'] : "{$aUsersFieldsValues['first_name']} {$aUsersFieldsValues['last_name']}",
							isset($aUsersFieldsValues['about_me']) ? $aUsersFieldsValues['about_me'] : ''
							);
						
						$this -> _oDb -> query($sQuery);	
						$iContentId = $this -> _oDb -> lastId();
						
						$this -> _oDb -> query("INSERT INTO `sys_profiles` SET `account_id` = {$iAccountId}, `type` = 'system', `content_id` = {$iContentId}, `status` = 'active'");
						$this -> _oDb -> query("INSERT INTO `sys_profiles` SET `account_id` = {$iAccountId}, `type` = 'bx_persons', `content_id` = {$iContentId}, `status` = 'active'");
						$iProfile = $this -> _oDb -> lastId();

						if($iProfile)
							BxDolAccountQuery::getInstance() -> updateCurrentProfile($iAccountId, $iProfile);
						
						$sQuery = $this -> _oDb -> prepare("UPDATE `bx_persons_data` SET `author` = ? WHERE `id` = ?", $iProfile, $iContentId);
						
						$this -> _oDb -> query($sQuery);

						
					if($aValue['photo_id']) $iPictureID = $this -> exportAvatar($iContentId, $aValue['photo_id']);			
                   
					 $sResult = $this -> exportFriends($aValue['user_id']);
                     if($sResult)
                         return $sResult;                     

                     $this -> _iTransferred++;
                  }
             }
        }

	/**
	* Create se_id field in sys_accounts for transferring other content conntected with users from social engine
	* @return mixed
         */  	  
	private function createSEIDField(){
		if ($this -> _oDb -> isFieldExists('sys_accounts', 'se_id')) return true;
		return $this -> _oDb -> query("ALTER TABLE `sys_accounts` ADD `se_id` int(11) unsigned NOT NULL default '0'");
	}		
	
	/**
	* Find all fields with the same names and merge fields with the same names into one field with value
	* @param int $iUserId social engine's user id
	* @return array
         */ 	
	private function getMergedFieldsValues($iUserId){
		$aValues = $this -> _seDb -> getAll("SELECT * FROM `{$this -> _sEnginePrefix}user_fields_values` WHERE `item_id` = {$iUserId} AND `value` != ''");
		$aMap = $this -> _seDb -> getPairs("SELECT * FROM `{$this -> _sEnginePrefix}user_fields_meta`", 'field_id', 'type');
			
		if (empty($aValues) || empty($aMap)) return array();						
			
		$aResult = array();			
		foreach($aValues as $iKey => $aValue){
			$aResult[$aMap[$aValue['field_id']]] = $aValue['value'];
		}
			
		return $aResult;
	}

	/**
	* Get Avatar's image  path
	* @param int $iImgId image ID
	* @return string
         */ 	
	private function getProfileImage($iImgId){        	
       $sQuery = $this -> _seDb -> prepare("SELECT `storage_path` FROM `{$this -> _sEnginePrefix}storage_files` WHERE `file_id` = ? AND `parent_file_id` IS NULL LIMIT 1" , $iImgId);            
       return $this -> _seDb -> getOne($sQuery);			
	}
 
	private function exportFriends($iProfileId)
    {
       $iProfileId = (int) $iProfileId;

       $sQuery = $this -> _seDb -> prepare("SELECT * FROM `{$this -> _sEnginePrefix}user_membership` WHERE `resource_id` = {$iProfileId} OR `user_id` = {$iProfileId}");
	   $aFriends = $this -> _seDb -> getAll($sQuery);

		foreach($aFriends as $iKey => $aValue){
			if( !$this -> isFriendExists($aValue['resource_id'], $aValue['user_id'])) {

			       $sQuery =  $this -> _oDb -> prepare("
	                 	INSERT IGNORE INTO
	                    	`sys_profiles_conn_friends`
	                    SET
	                       `initiator`	= ?,
	                       `content`    = ?,
	                       `mutual`     = ?,
	                       `added`     	= UNIX_TIMESTAMP()
			       ", $aValue['resource_id'], $aValue['user_id'], $aValue['active']);
	
			       $iResult = (int) $this -> _oDb -> query($sQuery);
			       if($iResult <= 0) {
			           return _t('_bx_se_migration_friends_exports_error');
			       }
		        }
				
			}	    
	}

	private function exportAvatar($iProfileId, $iAvatarId)
    {
        	$iProfileId = (int) $iProfileId;
        	$iAvatarId = (int) $iAvatarId;

            $sSEAvatar = $this -> getProfileImage($iAvatarId);

            if($sSEAvatar) {
	            $sSEAvatarPath = $this -> _oDb -> getExtraParam('root') . $sSEAvatar;
				
				$oStorage = BxDolStorage::getObjectInstance('bx_persons_pictures'); 
				
				$iId = $oStorage->storeFileFromPath($sSEAvatarPath, false, $iProfileId); 
				if ($iId){ 
					$sQuery = $this -> _oDb -> prepare("UPDATE `bx_persons_data` SET `Picture` = ? WHERE `id` = ?", $iId, $iProfileId);
                    $this -> _oDb -> query($sQuery);								
				}
            }
      }
    
	/**
	* Check if profile with the same nickname already exists
	* @param string $sNickName nameof the user
	* @return string
         */ 	 
	private function isProfileExisted($sNickName)
	{
         $sQuery  = $this -> _oDb -> prepare("SELECT COUNT(*) FROM `sys_accounts` WHERE `name` = ?", $sNickName);
         return $this -> _oDb -> getOne($sQuery) ? true : false;
	} 

	private function isFriendExists($iProfileId, $iFriendId)
    {
            $iProfileId = (int) $iProfileId;
            $iFriendId  = (int) $iFriendId;

            $sQuery =  "
            	SELECT 
            		COUNT(*) 
            	FROM 
            		`sys_profiles_conn_friends` 
            	WHERE
            		(
            			(`initiator` = {$iProfileId} AND `content` = {$iFriendId})
            				OR
            			(`initiator` = {$iFriendId} AND `content` = {$iProfileId})	
            		)
            ";

            return $this -> _oDb -> getOne($sQuery) ? true : false;
	}
}

	
/** @} */
