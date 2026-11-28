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
	
class BxDolMEvents extends BxDolMData
{	
	public function __construct(&$oMigrationModule, &$oDb)
	{
        parent::__construct($oMigrationModule, $oDb);
		$this -> _sModuleName = 'events';
		$this -> _sTableWithTransKey = 'bx_events_data';
    }    
	
	public function getTotalRecords()
	{
		return (int)$this -> _mDb -> getOne("SELECT COUNT(*) FROM `" . $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['table_name'] . "` WHERE `Status` = 'approved'");			
	}
	
	public function runMigration()
	{        
		if (!$this -> getTotalRecords())
		{
			  $this -> setResultStatus(_t('_bx_dolphin_migration_no_data_to_transfer'));
	          return BX_MIG_SUCCESSFUL;
		}	
		
		$this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_events'));
			
		$this -> createMIdField();
		$iEventId = $this -> getLastMIDField();						
		$sStart = '';
		if ($iEventId)
			$sStart = " AND `ID` >= {$iEventId}";
		
		$aResult = $this -> _mDb -> getAll("SELECT * FROM `" . $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['table_name'] . "` WHERE `Status` = 'approved' {$sStart} ORDER BY `ID`");
		$iCmts = 0;
		foreach($aResult as $iKey => $aValue)
		{ 
			$iProfileId = $this -> getProfileId((int)$aValue['ResponsibleID']);
			$iEventId = $this -> isItemExisted($aValue['ID']);			
			if (!$iProfileId)
				continue;
			
			if (!$iEventId)
			{
				$sQuery = $this -> _oDb -> prepare( 
                     "
                     	INSERT INTO
                     		`{$this -> _sTableWithTransKey}`
                     	SET
                     		`author`   			= ?,
                     		`added`      		= ?,
                     		`changed`   		= ?,
							`event_name`		= ?,
                     		`event_desc`		= ?,							
							`event_cat`			= ?,
							`views`				= ?,
							`featured`			= ?,
							`allow_view_to`		= ?,
							`join_confirmation`	= ?,
							`date_start`		= ?,
							`date_end`			= ?
                     ", 
						$iProfileId, 
						isset($aValue['Date']) ? $aValue['Date'] : time(),
						isset($aValue['Date']) ? $aValue['Date'] : time(),						
						isset($aValue['Title']) ? $aValue['Title'] : '',
						isset($aValue['Description']) ? $aValue['Description'] : '',						
						$this -> transferCategory($aValue['Categories']),
						isset($aValue['Views']) ? (int)$aValue['Views'] : 0,
						isset($aValue['Featured']) ? (int)$aValue['Featured'] : 0,
						$this -> getPrivacy((int)$aValue['ResponsibleID'], isset($aValue['allow_view_event_to']) ? (int)$aValue['allow_view_event_to'] : 0, 'events', 'view_event'),
						isset($aValue['JoinConfirmation']) ? (int)$aValue['JoinConfirmation'] : 0,
						isset($aValue['EventStart']) ? $aValue['EventStart'] : time(), 
						isset($aValue['EventEnd']) ? $aValue['EventEnd'] : time()
						);			
		
				$this -> _oDb -> query($sQuery);
				
				$iEventId = $this -> _oDb -> lastId();			
				if (!$iEventId)
				{
					$this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_events_error', (int)$aValue['ID']));
					return BX_MIG_FAILED;
				}				
				
				$this -> setMID($iEventId, $aValue['ID']);	
			
				$this -> exportFans($aValue['ID'], $this-> addEventToProfiles($iProfileId, $iEventId));				
			}					
			
			$iCmts = $this -> transferComments($iEventId, (int)$aValue['ID'], 'events');
			
			$iPic = $this -> exportPictures($aValue['ID'], $iProfileId);			
			
			$this -> _iTransferred++;
					
			$this -> _oDb ->  query("UPDATE `{$this -> _sTableWithTransKey}` 
										SET 
											`picture` = :pic,
											`comments` = :cmts 
									WHERE `id` = :id", array('pic' => $iPic, 'id' => $iEventId, 'cmts' => $iCmts));
			
			$this -> transferTags((int)$aValue['ID'], $iEventId, $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['type'], $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['keywords']);
        }      	
        
		// set as finished;
        $this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_events_finished', $this -> _iTransferred, $iCmts));
        return BX_MIG_SUCCESSFUL;
    }
	
	protected function transferCategory($sCategory, $sPrefix = 'bx_events', $sPreValueCateg = 'bx_events_cats', $iValue = 0, $sData = '')
	{
		return parent::transferCategory($sCategory, $sPrefix, $sPreValueCateg);
	}
	/**
	 *  Transfers all Dolphin's events pictures
	 *  
	 *  @param int $iEventId Dolphin's event's id
	 *  @param int $iProfileId event's owner id in UNA events table
	 *  @return int  first transferred events image's id
	 */
	private function exportPictures($iEventId, $iProfileId)
    {
        $iFirstImage = 0;
		$iProfileId = (int)$iProfileId;
		$aPhotos = $this -> _mDb -> getAll("SELECT `p`.* FROM `bx_photos_main` as `p`
											LEFT JOIN `bx_events_images` as `e` ON `p`.`ID` = `e`.`media_id`
											WHERE `e`.`entry_id` = :id", array('id' => $iEventId));
		
		if (empty($aPhotos))
			return false;
		
		foreach($aPhotos as $iKey => $aFile)
		{
			$sImageFile = $this -> _sImagePhotoFiles . "{$aFile['ID']}.{$aFile['Ext']}";
			if (file_exists($sImageFile))
			{
	        	$oStorage = BxDolStorage::getObjectInstance('bx_events_pics'); 				
				$iId = $oStorage->storeFileFromPath($sImageFile, false, $iProfileId);
				$oStorage -> afterUploadCleanup($iId, $iProfileId);
				$iFirstImage = $iFirstImage ? $iFirstImage : $iId;
			}
		}
		
		return $iFirstImage;
    }
	/**
	 *  Add event to sys_profiles table in una
	 *  
	 *  @param int $iProfileId profile id
	 *  @param int $iEventId event id
	 *  @return int last insert id
	 */
	private function addEventToProfiles($iProfileId, $iEventId)
	{
		$sQuery = $this -> _oDb -> prepare("
						INSERT INTO
							`sys_profiles`
						SET
						   `account_id`	= ?,
						   `type`    	= 'bx_events',
						   `content_id` = ?,
						   `status`    	= 'active'
				   ", (int)BxDolProfile::getInstance($iProfileId)->getAccountId(), $iEventId);

		$this -> _oDb -> query($sQuery);
		return $this -> _oDb -> lastId();
	}
	/**
	 *  Transfer Event's participants lists
	 *  
	 *  @param int $iMID event's id in Dolphin
	 *  @param int $iEventProfileId events id from sys_profile
	 *  @return int participants number
	 */

    private function exportFans($iMID, $iEventProfileId)
    {
        $aFans =  $this -> _mDb -> getAll("SELECT  `p` . * , IF(  `a`.`id_entry` IS NULL , 0, 1 ) AS  `admin` 
                                           FROM  `bx_events_participants` AS  `p` 
                                           LEFT JOIN  `bx_events_admins` AS  `a` ON  `p`.`id_entry` =  `a`.`id_entry` AND  `p`.`id_profile` =  `a`.`id_profile` 
                                           WHERE `p`.`id_entry`=:id", array('id' => $iMID));
        foreach($aFans as $iKey => $aValue)
        {
            $iProfileId = $this -> getProfileId($aValue['id_profile']);

            $sQuery =  $this -> _oDb -> prepare("
						INSERT IGNORE INTO
							`bx_events_fans`
						SET
						   `initiator`	= ?,
						   `content`    = ?,
						   `mutual`     = ?,
						   `added`     	= ?
			", $iProfileId,  $iEventProfileId, $aValue['confirmed'], $aValue['when']);

            if(!$this -> _oDb -> query($sQuery))
                return _t('_bx_dolphin_migration_friends_exports_error');

            if ($aValue['confirmed']) {
                $sQuery = $this->_oDb->prepare("
                            INSERT IGNORE INTO
                                `bx_events_fans`
                            SET
                               `initiator`	= ?,
                               `content`    = ?,
                               `mutual`     = ?,
                               `added`     	= ?
                ", $iEventProfileId, $iProfileId, 1, $aValue['when']);

                if (!$this->_oDb->query($sQuery))
                    return _t('_bx_dolphin_migration_friends_exports_error');
            }

            if ((int)$aValue['admin']) {
                $this->_oDb->query("REPLACE INTO `bx_events_admins` SET `fan_id` = :fan, `group_profile_id` = :group",
                    array('fan' => $iProfileId, 'group' => $iEventProfileId));
            }

        }
    }
	
	public function removeContent()
	{
		if (!$this -> _oDb -> isTableExists($this -> _sTableWithTransKey) || !$this -> _oDb -> isFieldExists($this -> _sTableWithTransKey, $this -> _sTransferFieldIdent))
			return false;
		
		$aRecords = $this -> _oDb -> getAll("SELECT * FROM `{$this -> _sTableWithTransKey}` WHERE `{$this -> _sTransferFieldIdent}` !=0 ");
		$iNumber = 0;
		if (!empty($aRecords))
		{	
			foreach($aRecords as $iKey => $aValue)
			{
				BxDolService::call('bx_events', 'delete_entity_service', array($aValue['id'], true));
				$iNumber++;
			}
		}
		parent::removeContent();
		return $iNumber;
	}
}

/** @} */
