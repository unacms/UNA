<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    DolphinMigration  Dolphin Migration
 * @ingroup     UnaModules
 *
 * @{
 */

bx_import('BxDolProfile');
bx_import('BxDolTranscoderImage');
bx_import('BxDolStorage');
	
require_once('BxDolMData.php');	
	
class BxDolMProfiles extends BxDolMData
{
    private $_sProfileCoverName = '';
    private $_sProfileInfoName = '';
    private $_aFriendsConnections = array();
    private $_aAccounts = array();
    private $_aProfiles = array();

    public function __construct(&$oMigrationModule, &$mDb)
    {
		parent::__construct($oMigrationModule, $mDb);
		$this -> _sModuleName = 'profiles';
		$this -> _sTableWithTransKey = 'sys_accounts';
    }

	public function getTotalRecords()
	{
		return (int)$this -> _mDb -> getOne("SELECT COUNT(*) FROM `" . $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['table_name'] . "`");			
	}
	
	public function runMigration()
	{
        $this -> _sProfileCoverName = $this -> _mDb -> getParam('bx_photos_profile_cover_album_name');
        $this -> _sProfileInfoName = $this -> _mDb -> getParam('sys_member_info_name');

        if (!$this -> getTotalRecords())
		{
			  $this -> setResultStatus(_t('_bx_dolphin_migration_no_data_to_transfer'));
	          return BX_MIG_SUCCESSFUL;
		}	
		
		$this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_profiles'));
        $sError = $this -> profilesMigration();
        if($sError) {
              $this -> setResultStatus($sError);
              return BX_MIG_FAILED;
        }
	
        $this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_profiles_finished', $this -> _iTransferred));
		return BX_MIG_SUCCESSFUL;
    }
	
	/**
	* Check if account with the same nickname or email already exists
	* @param string $sEmail user email
	* @return integer account id
     */
	private function isAccountExisted($sEmail){
        if (empty($this -> _aAccounts))
            $this -> _aAccounts = $this->_oDb->getAllWithKey("SELECT LOWER(`email`) as `email`, `id` FROM `sys_accounts`", 'email');

        return isset($this -> _aAccounts[strtolower($sEmail)]) ? $this -> _aAccounts[strtolower($sEmail)]['id'] : false;
	}

    /**
     * Check if profile with the same nickname already exists
     * @param integer $iAccountId account id
     * @param string $sFullName name of the user
     * @return array person and profile id
     */
    private function isPersonExisted($iAccountId, $sFullName){
        if (empty($this -> _aProfiles))
            $this -> _aProfiles = $this -> _oDb -> getAllWithKey("SELECT `s`.`account_id`, `p`.`id`, `p`.`fullname`, `s`.`content_id` as `p_id`  
                                             FROM `bx_persons_data` as `p`
                                             LEFT JOIN `sys_profiles` as `s` ON `s`.`id` = `p`.`author` 
                                             WHERE `s`.`type` = 'bx_persons'", 'account_id');

        return isset($this -> _aProfiles[$iAccountId]) && strcasecmp($this -> _aProfiles[$iAccountId]['fullname'], $sFullName) === 0 ? $this -> _aProfiles[$iAccountId] : false;
    }

	function profilesMigration()
    {
			$this -> createMIdField();

			// get IDs of the latest transferred profile for UNA Accounts and Dolphin Profiles
			$iProfileID = $this -> getLastMIDField();
			$sStart = '';
			if ($iProfileID)
				$sStart = "WHERE `ID` > {$iProfileID}";
			else 
				$this -> addPreValues('Sex', true, 2); // transfer all sex values more then 2 value

			$aResult = $this -> _mDb -> getAll("SELECT * FROM `"  . $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['table_name'] . "` {$sStart} ORDER BY `ID` ASC");
			$aSex = $this -> getPreValuesBy('Sex', 'Value', 'Order');

			foreach($aResult as $iKey => $aValue)
			{

			    if($aValue['Email'])
				{
                     $sAction = "INSERT INTO";
                     $sWhere  = "";
                     $bAccountExists = false;
                     $iAccountId = $this -> isAccountExisted($aValue['Email']);
                     if ($iAccountId)
                     {
                         if ($this -> _oConfig -> _bIsOverwrite) {
                             $sAction = "UPDATE";
                             $sWhere = "WHERE `id` = '{$iAccountId}'";
                             $bAccountExists = true;
                         }
                         else
                             continue;
				     }

                      $sQuery = $this -> _oDb -> prepare(
                     "
                     	{$sAction}
                     		`sys_accounts`
                     	SET
                     		`name`   			= ?,
                     		`email`      		= ?,
                     		`password`   		= ?,
                     		`salt`		   		= ?,
							`role`				= ?,		
                     		`lang_id`			= ?,
							`added`				= ?,
                     		`changed`	  		= ?,
                     		`logged` 			= ?,
							`email_confirmed`	= ?,
							`receive_updates`	= ?,	
							`receive_news`		= ?
						{$sWhere}	
                     ", 
						$aValue['NickName'], 
						$aValue['Email'], 
						$aValue['Password'],
						$aValue['Salt'],
						$aValue['Role'],
						$aValue['LangID'],
						strtotime($aValue['DateReg']),
						strtotime($aValue['DateLastEdit']),
						strtotime($aValue['DateLastLogin']),
						isset($aValue['Status']) && $aValue['Status'] != 'Unconfirmed' ? 1 : 0,
						$aValue['EmailNotify'],
						$aValue['EmailNotify']
						);
						
					$this -> _oDb -> query($sQuery);

					$iAccountId = $iAccountId ? $iAccountId : $this -> _oDb -> lastId();
					if (!$iAccountId) 
						continue;

					$iSysProfileId = 0;
					if (!$bAccountExists) {
                        $this->_oDb->query("INSERT INTO `sys_profiles` SET `account_id` = {$iAccountId}, `content_id` = {$iAccountId}, `type` = 'system', `status` = 'active'");
                        $iSysProfileId = $this->_oDb->lastId();
                    }


                    $this -> setMID($iAccountId, $aValue['ID']);

                    if ($this -> _oConfig -> _bUseNickName)
                        $sFullName = $aValue['NickName'];
					else
					{
                       $sFullName = isset($aValue['FullName']) ? $aValue['FullName'] : "{$aValue['FirstName']} {$aValue['LastName']}";
                       $sFullName = trim($sFullName) ? $sFullName : $aValue['NickName'];
                    }

                    $sAction = "INSERT INTO";
                    $sWhere = '';
                    $iProfile = $iProfID = 0;
                    if ($bAccountExists && ($aPersonInfo = $this -> isPersonExisted($iAccountId, $sFullName))) {
                        $sAction = "UPDATE";
                        $sWhere = "WHERE `id` = '{$iProfID}'";
                        $iProfID = $aPersonInfo['id'];
                        $iProfile = $aPersonInfo['p_id'];
                    }

                    $iDateReg = strtotime($aValue['DateReg']);
                    $iDateEdit = strtotime($aValue['DateLastEdit']);
					$sQuery = $this -> _oDb -> prepare( 
	                     "{$sAction}
	                     		`bx_persons_data`
	                     	SET
	                     		`author`   			= ?,
	                     		`added`      		= ?,
	                     		`changed`   		= ?,
								`picture`			= 0,		
	                     		`cover`				= 0,
								`fullname`			= ?,
								`birthday`			= ?,
								`gender`			= ?,
								`allow_view_to`		= ?,
								`featured`			= ?,
								`views`				= ?,
								`description`		= ?
							{$sWhere}
	                     ",
                            $iSysProfileId,
                            $iDateReg ? $iDateReg : 0,
                            $iDateEdit ? $iDateEdit : 0,
							$sFullName,
							isset($aValue['DateOfBirth']) ? $aValue['DateOfBirth'] : 'NULL',
							isset($aValue['Sex']) && $aValue['Sex'] ? $aSex[$aValue['Sex']] : 1,
                            $this -> getPrivacy($aValue['ID'], isset($aValue['allow_view_to']) ? $aValue['allow_view_to'] : 0, '', '', $aValue['PrivacyDefaultGroup']),
							isset($aValue['Featured']) ? (int)$aValue['Featured'] : 0,
							isset($aValue['Views']) ? (int)$aValue['Views'] : 0,
							isset($aValue['DescriptionMe']) && $aValue['DescriptionMe'] ? nl2br(htmlspecialchars_adv($aValue['DescriptionMe'])) : ''
							);
						
						$this -> _oDb -> query($sQuery);	
						$iContentId = $iProfID ? $iProfID : $this -> _oDb -> lastId();
						if (!$iProfID) {
                            $this->_oDb->query("UPDATE `sys_profiles` SET `content_id` = {$iAccountId} WHERE `account_id` = {$iAccountId} AND `type` = 'system'");
                            $this->_oDb->query("INSERT INTO `sys_profiles` SET `account_id` = {$iAccountId}, `type` = 'bx_persons', `content_id` = {$iContentId}, `status` = 'active'");

                            $iProfile = $this->_oDb->lastId();
                            if ($iProfile) {
                                BxDolAccountQuery::getInstance()->updateCurrentProfile($iAccountId, $iProfile);
                                if ($aValue['Role'] == 3)
                                    BxDolAcl::getInstance()->setMembership($iProfile, MEMBERSHIP_ID_ADMINISTRATOR);
                            }

                            $sQuery = $this->_oDb->prepare("UPDATE `bx_persons_data` SET `author` = ? WHERE `id` = ?", $iProfile, $iContentId);
                            $this->_oDb->query($sQuery);

                         if (isset($aValue['Country']) || isset($aValue['City']) || isset($aValue['zip']) || isset($aValue['State'])) {
                                $this->_oDb->query("INSERT INTO `bx_persons_meta_locations` 
                                                    SET `object_id`=:object, `country`=:country, `city`=:city, zip = :zip, `state`=:state",
                                    array(
                                        'object' => $iContentId,
                                        'country' => isset($aValue['Country']) ? $aValue['Country'] : '',
                                        'city' => isset($aValue['City']) ? $aValue['City'] : '',
                                        'zip' => isset($aValue['zip']) ? $aValue['zip'] : '',
                                        'state' => isset($aValue['State']) ? $aValue['State'] : '',
                                ));
                            }
                        }

                        $this->exportCover($iProfile, $iContentId, $aValue);
                        $this->exportAvatar($iProfile, $iContentId, $aValue);
						$this -> _iTransferred++;
                  }
          }


		 if ($this->_iTransferred)
             $this->exportFriends();
    }

	/**
	* Get Avatar's image  path
	* @param array $aProfileInfo profile information
	* @return string
         */ 	
	private function getProfileImage($aProfileInfo)
	{	   
       $sAvatarType = $this -> _mDb -> getParam('sys_member_info_thumb');
	   $sImagePath = $this -> _oDb -> getExtraParam('root') . 'modules' . DIRECTORY_SEPARATOR . 'boonex' . DIRECTORY_SEPARATOR;
	   if ($sAvatarType == 'bx_photos_thumb')
		{
			$sAlbumName = $this -> _mDb -> getParam('bx_photos_profile_album_name');
			$aReplacement = array(
				'{nickname}' => $aProfileInfo['NickName'],
				'{fullname}' =>  $aProfileInfo['NickName']
			);
			
			$sAlbumName = str_replace(array_keys($aReplacement), array_values($aReplacement), $sAlbumName);
			$sAlbumName = uriFilter($sAlbumName);
			$aInfo = $this -> _mDb -> getRow("SELECT `bx_photos_main`.*  FROM `bx_photos_main`
					LEFT JOIN `sys_albums_objects` ON `sys_albums_objects`.`id_object`=`bx_photos_main`.`ID` 
					LEFT JOIN `sys_albums` ON `sys_albums`.`ID`=`sys_albums_objects`.`id_album` 
					WHERE `bx_photos_main`.`Status` ='approved' 
					      AND `bx_photos_main`.`Owner` =:id 
					      AND `sys_albums`.`Status` ='active' 
					      AND `sys_albums`.`Type` ='bx_photos' 
					      AND `sys_albums`.`Uri` = :uri 
					ORDER BY `obj_order` ASC, `id_object` DESC
					LIMIT 1", array('uri' => $sAlbumName, 'id' => $aProfileInfo['ID']));
			
			if (!empty($aInfo) && isset($aInfo['ID']))
				$sImagePath = $this -> _sImagePhotoFiles ."{$aInfo['ID']}.{$aInfo['Ext']}";
		}
		else
		{
			$iId = $this -> _mDb -> getOne("SELECT `id` FROM `bx_avatar_images` WHERE `author_id` = :id LIMIT 1", array('id' => $aProfileInfo['ID']));
			if ($iId)
				$sImagePath = $sImagePath . "avatar" . DIRECTORY_SEPARATOR . "data" . DIRECTORY_SEPARATOR . "images" . DIRECTORY_SEPARATOR ."{$iId}b.jpg";
		}

	   if (file_exists($sImagePath))
		   return $sImagePath;

	   return false;	 
	}


	private function exportCover($iProfileId, $iContentId, $aProfileInfo){
	    if (!$this -> _sProfileCoverName)
            return FALSE;

        $sUserName = $aProfileInfo['NickName'];
        switch ($this -> _sProfileInfoName) {
                case 'sys_username':
                    $sUserName = $aProfileInfo['NickName'];
                    break;
                case 'sys_full_name':
                    $sUserName = htmlspecialchars_adv($aProfileInfo['FullName'] ? $aProfileInfo['FullName'] : $aProfileInfo['NickName']);
                    break;
                case 'sys_first_name':
                    $sUserName = $aProfileInfo['FirstName'] ? $aProfileInfo['FirstName'] : $aProfileInfo['NickName'];
                    break;
                case 'sys_first_name_last_name':
                    $sUserName = $aProfileInfo['FirstName'] || $aProfileInfo['LastName'] ? $aProfileInfo['FirstName'] . ' ' . $aProfileInfo['LastName'] : $aProfileInfo['NickName'];
                    break;
                case 'sys_last_name_firs_name':
                    $sUserName = $aProfileInfo['FirstName'] || $aProfileInfo['LastName'] ? $aProfileInfo['LastName'] . ' ' . $aProfileInfo['FirstName'] : $aProfileInfo['NickName'];
        }

        $aReplacement = array(
            '{nickname}' => $sUserName,
            '{fullname}' => $aProfileInfo['NickName']
        );

       $sAlbumName = uriFilter(str_replace(array_keys($aReplacement), array_values($aReplacement), $this -> _sProfileCoverName));
       $aCoverInfo = $this -> _mDb -> getRow("SELECT `bx_photos_main`.* FROM `bx_photos_main` 
          LEFT JOIN `sys_albums_objects` ON `sys_albums_objects`.`id_object`=`bx_photos_main`.`ID` 
          LEFT JOIN `sys_albums` ON `sys_albums`.`ID`=`sys_albums_objects`.`id_album` AND `sys_albums`.`LastObjId` = `bx_photos_main`.`ID`  
          WHERE  `bx_photos_main`.`Owner` = :owner AND `sys_albums`.`Status` ='active' AND `sys_albums`.`Type` ='bx_photos' AND `sys_albums`.`Uri` =:album", array('owner' => $aProfileInfo['ID'],'album' => $sAlbumName));

       if (!empty($aCoverInfo))
       {
           $sImagePath = $this->_sImagePhotoFiles . "{$aCoverInfo['ID']}.{$aCoverInfo['Ext']}";
           if (file_exists($sImagePath)) {
               $oStorage = BxDolStorage::getObjectInstance('bx_persons_pictures');
               $iId = $oStorage->storeFileFromPath($sImagePath, false, $iProfileId, $iContentId);
               if ($iId) {
                   $sQuery = $this->_oDb->prepare("UPDATE `bx_persons_data` SET `Cover` = ? WHERE `id` = ?", $iId, $iContentId);
                   $this->_oDb->query($sQuery);
               }
           }
       }

       return false;
    }

	private function exportFriends()
    {
       $sQuery = $this -> _mDb -> prepare("SELECT * FROM `sys_friend_list` WHERE `ID` <> 0 AND `Profile` <> 0");
       $aFriends = $this -> _mDb -> getAll($sQuery);
		foreach($aFriends as $iKey => $aValue)
		{
			$iUserId = $this -> getProfileId($aValue['ID']);
			$iFriendId = $this -> getProfileId($aValue['Profile']);
			
			if($iUserId && $iFriendId && !$this -> isFriendExists($iUserId, $iFriendId))
			{

				   $sQuery =  $this -> _oDb -> prepare("
						INSERT IGNORE INTO
							`sys_profiles_conn_friends`
						SET
						   `initiator`	= ?,
						   `content`    = ?,
						   `mutual`     = ?,
						   `added`     	= UNIX_TIMESTAMP()
				   ", $iUserId, $iFriendId, $aValue['Check']);
                $iResult = $this -> _oDb -> query($sQuery);

                // make initiator to follow content
                $this->_oDb->query("
						INSERT IGNORE INTO
							`sys_profiles_conn_subscriptions`
						SET
						   `initiator`	=:initiator,
						   `content`    =:content ,
						   `added`     	= UNIX_TIMESTAMP()
				   ", array('initiator' => $iUserId, 'content' => $iFriendId));

                $iResult = $this -> _oDb -> query($sQuery);


				if ($iResult && (int)$aValue['Check']){
                    $sQuery = $this->_oDb->prepare("
                            INSERT IGNORE INTO
                                `sys_profiles_conn_friends`
                            SET
                               `initiator`	= ?,
                               `content`    = ?,
                               `mutual`     = ?,
                               `added`     	= UNIX_TIMESTAMP()
                       ", $iFriendId, $iUserId, 1);
                        $this->_oDb->query($sQuery);

                         // make content to follow initiator
                        $this->_oDb->query("
                            INSERT IGNORE INTO
                                `sys_profiles_conn_subscriptions`
                            SET
                               `initiator`	=:initiator,
                               `content`    =:content ,
                               `added`     	= UNIX_TIMESTAMP()
                       ", array('initiator' => $iFriendId, 'content' => $iUserId));
                 }
			}
		}
	}

	private function exportAvatar($iProfileId, $iContentId, $aProfileInfo)
    {
       $sAvatarPath = $this -> getProfileImage($aProfileInfo);
       if($sAvatarPath)
		{
			$oStorage = BxDolStorage::getObjectInstance('bx_persons_pictures'); 				
			$iId = $oStorage->storeFileFromPath($sAvatarPath, false, $iProfileId, $iContentId);
			if ($iId)
			{
				$sQuery = $this -> _oDb -> prepare("UPDATE `bx_persons_data` SET `Picture` = ? WHERE `id` = ?", $iId, $iContentId);
				$this -> _oDb -> query($sQuery);
			}
		}
    }

	private function isFriendExists($iProfileId, $iFriendId)
    {
        if (empty($this -> _aFriendsConnections))
            $this->_aFriendsConnections = $this->_oDb->getAll("SELECT `initiator`, `content` FROM `sys_profiles_conn_friends`");

        if (!empty($this -> _aFriendsConnections))
            foreach($this -> _aFriendsConnections as &$aFriends)
                if ((int)$aFriends['initiator'] == (int)$iProfileId && (int)$aFriends['content'] == (int)$iFriendId)
                    return true;

        return false;
	}
	
	public function removeContent()
	{
		if (!$this -> _oDb -> isTableExists($this -> _sTableWithTransKey) || !$this -> _oDb -> isFieldExists($this -> _sTableWithTransKey, $this -> _sTransferFieldIdent))
			return false;
		
		$iNumber = 0;
		$aRecords = $this -> _oDb -> getAll("SELECT * FROM `{$this -> _sTableWithTransKey}` WHERE `{$this -> _sTransferFieldIdent}` !=0");
		if (!empty($aRecords))
		{
			foreach($aRecords as $iKey => $aValue)
			{
				$oAccount = BxDolAccount::getInstance($aValue['id']);
				if ($oAccount)
					$oAccount -> delete(true);			
				
				$iNumber++;
			}
					
			if ($iNumber)
                foreach ($this -> _oConfig -> _aMigrationModules as $sName => $aModule)
                {
                    //Create transferring class object
                    require_once($aModule['migration_class'] . '.php');
                    $oObject = new $aModule['migration_class']($this -> _oMainModule, $this -> _mDb);
                    $oObject -> removeContent();
                }
		}

		parent::removeContent();
		return $iNumber;
	}
	/**
	 *  Adds fields list if doesn't exist or value to existed fields list
	 *  
	 *  @param string $sName list name
	 *  @param boolean $bUseOrder use Order field instead of Value as value for profile
	 *  @param int $iStart start value, to show all above it
	 *  @param boolean $bCreate create fields list if doesn't exists
	 *  @return string fields list name
	 */
	private function addPreValues($sName, $bUseOrder = false, $iStart = 0, $bCreate = false)
	{
		$sKeyField = 'Value';
		if ($bUseOrder)
			$sKeyField = 'Order';

		$aPairs = $this -> getPreValuesBy($sName, $sKeyField, 'LKey', $iStart);
		$aValues = array();
		foreach($aPairs as $sKey => $sValue)
		{
			$aTranslations = $this -> getLKeyTranslations($sValue);
			$aValues[$sKey] = !empty($aTranslations) && sizeof($aTranslations) > 1 ? $this -> getLKeyTranslations($sValue) : $aTranslations[$this -> getDefaultLang()];
		}

		return $this -> transferPreValues($sName, $sName, $aValues, true);	
	}
}

	
/** @} */
