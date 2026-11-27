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

require_once('BxDolMData.php');
bx_import('BxDolStorage');
	
class BxDolMGroups extends BxDolMData
{	
	public function __construct(&$oMigrationModule, &$oDb)
	{
        parent::__construct($oMigrationModule, $oDb);
		$this -> _sModuleName = 'groups';
		$this -> _sTableWithTransKey = 'bx_groups_data';
    }    
	
	public function getTotalRecords()
	{
		return (int)$this -> _mDb -> getOne("SELECT COUNT(*) FROM `" . $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['table_name'] . "` WHERE `status` = 'approved'");			
	}
	
	public function runMigration()
	{        
		if (!$this -> getTotalRecords())
		{
			  $this -> setResultStatus(_t('_bx_dolphin_migration_no_data_to_transfer'));
	          return BX_MIG_SUCCESSFUL;
		}	
		
		$this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_groups'));		
			
		$this -> createMIdField();
		$iGroupId = $this -> getLastMIDField();						
		$sStart = '';
		if ($iGroupId)
			$sStart = " AND `id` >= {$iGroupId}";
		
		$aResult = $this -> _mDb -> getAll("SELECT * FROM `" . $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['table_name'] . "` WHERE `status` = 'approved' {$sStart} ORDER BY `id`");
		
		$iCmts = 0;
		foreach($aResult as $iKey => $aValue)
		{ 
			$iProfileId = $this -> getProfileId((int)$aValue['author_id']);
			$iGroupId = $this -> isItemExisted($aValue['id']);			
			if (!$iProfileId)
				continue;
			
			if (!$iGroupId)
			{
				$sQuery = $this -> _oDb -> prepare( 
                     "
                     	INSERT INTO
                     		`bx_groups_data`
                     	SET
                     		`author`   			= ?,
                     		`added`      		= ?,
                     		`changed`   		= ?,
							`group_name`		= ?,
                     		`group_desc`		= ?,							
							`group_cat`			= ?,
							`views`				= ?,
							`featured`			= ?,
							`allow_view_to`		= ?,
							`join_confirmation`	= ?
                     ", 
						$iProfileId, 
						isset($aValue['created']) ? $aValue['created'] : time(), 
						isset($aValue['created']) ? $aValue['created'] : time(), 						
						isset($aValue['title']) ? $aValue['title'] : '',
						isset($aValue['desc']) ? $aValue['desc'] : '',
						$this -> transferCategory($aValue['categories']),
						isset($aValue['views']) ? (int)$aValue['views'] : 0,
						isset($aValue['featured']) ? (int)$aValue['featured'] : 0,
                        $this -> getPrivacy((int)$aValue['author_id'], isset($aValue['allow_view_group_to']) ? (int)$aValue['allow_view_group_to'] : 0, 'groups', 'view_group'),
						isset($aValue['join_confirmation']) ? (int)$aValue['join_confirmation'] : 0
						);			
		
				$this -> _oDb -> query($sQuery);
				
				$iGroupId = $this -> _oDb -> lastId();			
				if (!$iGroupId)
				{
					$this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_groups_error', (int)$aValue['id']));
					return BX_MIG_FAILED;
				}				
				
				$this -> setMID($iGroupId, $aValue['id']);	
			
				$this -> exportFans($aValue['id'], $this-> addGroupToProfiles($iProfileId, $iGroupId));				
			}					
			
			$iCmts = $this -> transferComments($iGroupId, (int)$aValue['id'], 'groups');
			
			$iPic = $this -> exportPictures($aValue['id'], $iProfileId);			
			
			$this -> _iTransferred++;
					
			$this -> _oDb ->  query("UPDATE `{$this -> _sTableWithTransKey}` 
										SET 
											`picture` = :pic,
											`comments` = :cmts 
									WHERE `id` = :id", array('pic' => $iPic, 'id' => $iGroupId, 'cmts' => $iCmts));
			
			$this -> transferTags((int)$aValue['id'], $iGroupId, $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['type'], $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['keywords']);
        }      	

        // set as finished;
        $this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_groups_finished', $this -> _iTransferred, $iCmts));
        return BX_MIG_SUCCESSFUL;
    }
	
	protected function transferCategory($sCategory, $sPrefix = 'bx_groups', $sPreValueCateg = 'bx_groups_cats', $iValue = 0, $sData = '')
	{
		return parent::transferCategory($sCategory, $sPrefix, $sPreValueCateg);
	}
	/**
	 *  Transfer groups pictures 
	 *  
	 *  @param int $iGroupId Dolphin group ID
	 *  @param int $iProfileId UNA profile ID
	 *  @return Return description
	 */
	private function exportPictures($iGroupId, $iProfileId)
    {
        $iFirstImage = 0;
		$iProfileId = (int)$iProfileId;
		$aPhotos = $this -> _mDb -> getAll("SELECT `p`.* FROM `bx_photos_main` as `p`
											LEFT JOIN `bx_groups_images` as `g` ON `p`.`ID` = `g`.`media_id`
											WHERE `g`.`entry_id` = :id", array('id' => $iGroupId));
		
		if (empty($aPhotos))
			return false;
		
		foreach($aPhotos as $iKey => $aFile)
		{
			$sImageFile = $this -> _sImagePhotoFiles . "{$aFile['ID']}.{$aFile['Ext']}";
			if (file_exists($sImageFile))
			{
	        	$oStorage = BxDolStorage::getObjectInstance('bx_groups_pics'); 				
				$iId = $oStorage->storeFileFromPath($sImageFile, false, $iProfileId);
				$oStorage -> afterUploadCleanup($iId, $iProfileId);
				$iFirstImage = $iFirstImage ? $iFirstImage : $iId;
			}
		}
		
		return $iFirstImage;
    }
	
	private function addGroupToProfiles($iProfileId, $iGroupId)
	{
		$sQuery = $this -> _oDb -> prepare("
						INSERT INTO
							`sys_profiles`
						SET
						   `account_id`	= ?,
						   `type`    	= 'bx_groups',
						   `content_id` = ?,
						   `status`    	= 'active'
				   ", (int)BxDolProfile::getInstance($iProfileId)->getAccountId(), $iGroupId);

		$this -> _oDb -> query($sQuery);
		return $this -> _oDb -> lastId();
	}
	
	private function exportFans($iMID, $iGroupProfileId)
    {
		$aFans =  $this -> _mDb -> getAll("SELECT  `f` . * , IF(  `a`.`id_entry` IS NULL , 0, 1 ) AS  `admin` 
                                           FROM  `bx_groups_fans` AS  `f` 
                                           LEFT JOIN  `bx_groups_admins` AS  `a` ON  `f`.`id_entry` =  `a`.`id_entry` AND  `f`.`id_profile` =  `a`.`id_profile` 
                                           WHERE `f`.`id_entry`=:id ", array('id' => $iMID));
		foreach($aFans as $iKey => $aValue)
		{
			$iProfileId = $this -> getProfileId($aValue['id_profile']);
			$sQuery =  $this -> _oDb -> prepare("
						INSERT IGNORE INTO
							`bx_groups_fans`
						SET
						   `initiator`	= ?,
						   `content`    = ?,
						   `mutual`     = ?,
						   `added`     	= ?
			", $iProfileId,  $iGroupProfileId, $aValue['confirmed'], $aValue['when']);

            if(!$this -> _oDb -> query($sQuery))
                return _t('_bx_dolphin_migration_friends_exports_error');

                if ($aValue['confirmed']) {
                    $sQuery = $this->_oDb->prepare("
                            INSERT IGNORE INTO
                                `bx_groups_fans`
                            SET
                               `initiator`	= ?,
                               `content`    = ?,
                               `mutual`     = ?,
                               `added`     	= ?
                ", $iGroupProfileId, $iProfileId, 1, $aValue['when']);

                if(!$this -> _oDb -> query($sQuery))
                    return _t('_bx_dolphin_migration_friends_exports_error');
			}

            if ((int)$aValue['admin']) {
                   $this->_oDb->query("REPLACE INTO `bx_groups_admins` SET `fan_id` = :fan, `group_profile_id` = :group",
                       array('fan' => $iProfileId, 'group' => $iGroupProfileId));
            }
		}
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
				BxDolService::call('bx_groups', 'delete_entity_service', array($aValue['id'], true));
				$iNumber++;
			}
		}
		
		parent::removeContent();
		return $iNumber;
	}
}

/** @} */
