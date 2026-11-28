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
	
class BxDolMVideoAlbums extends BxDolMData {		
	/**
	 *  @var $_iTransferredAlbums transferred albums number
	 */	
	private $_iTransferredAlbums;	
	
	/**
	 *  @var $_sVideoFilesPath path to the video albums files
	 */	
	private $_sVideoFilesPath;
	private $_sVideoMigField = 'vid_id';

	public function __construct(&$oMigrationModule, &$oDb)
	{
        parent::__construct($oMigrationModule, $oDb);
		$this -> _sModuleName = 'videos_albums';
		$this -> _sTableWithTransKey = 'bx_albums_albums';
		$this -> _sVideoFilesPath = $this -> _oDb -> getExtraParam('root') . 'flash' . DIRECTORY_SEPARATOR . 'modules' . DIRECTORY_SEPARATOR . "video" . DIRECTORY_SEPARATOR . "files" . DIRECTORY_SEPARATOR;
    }
	
	public function getTotalRecords()
	{
		$aResult = $this -> _mDb -> getRow("SELECT COUNT(*) as `count`, SUM(`ObjCount`) as `obj` FROM `" . $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['table_name_albums'] ."` WHERE `Type` = 'bx_videos' AND `Uri` <> 'Hidden'");
		return !(int)$aResult['count'] && !(int)$aResult['obj'] ? 0 : $aResult;
	}
    
	public function runMigration()
	{
		if (!$this -> getTotalRecords())
		{
			  $this -> setResultStatus(_t('_bx_dolphin_migration_no_data_to_transfer'));
	          return BX_MIG_SUCCESSFUL;
		}
		
		$this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_videos'));
		
		$this -> createMIdField($this -> _sVideoMigField);


		$aResult = $this -> _mDb -> getAll("SELECT * FROM `" . $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['table_name_albums'] ."` WHERE `Type` = 'bx_videos' AND `Uri` <> 'Hidden' ORDER BY `ID` ASC");		
		foreach($aResult as $iKey => $aValue)
		{ 			
			$iProfileId = $this -> getProfileId((int)$aValue['Owner']);
			if (!$iProfileId) 
				continue;
			
			$iAlbumId = $this -> isItemExisted($aValue['ID'], 'id', $this -> _sVideoMigField);
			if (!$iAlbumId)
			{
				$sAlbumTitle = isset($aValue['Caption']) && $aValue['Caption'] ? $aValue['Caption'] : 'Profile Videos';			
				$sQuery = $this -> _oDb -> prepare( 
							 "
								INSERT INTO
									`bx_albums_albums`
								SET
									`author`   			= ?,
									`added`      		= ?,
									`changed`   		= ?,
									`thumb`				= 0,
									`title`				= ?,
									`allow_view_to` 	= ?,
									`text`				= ?,
									`status_admin`		= ?
							 ", 
								$iProfileId, 
								$aValue['Date'] ? $aValue['Date'] : time(), 
								$aValue['Date'] ? $aValue['Date'] : time(), 
								$sAlbumTitle,
                                $this -> getPrivacy($aValue['Owner'], (int)$aValue['AllowAlbumView'], 'videos', 'album_view'),
								$aValue['Description'],
								$aValue['Status'] == 'active' ? 'active' : 'hidden'
								);			
				
					$this -> _oDb -> query($sQuery);
					$iAlbumId = $this -> _oDb -> lastId();					
						
					if (!$iAlbumId)
					{
						$this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_videos_album_error'));
						return BX_MIG_FAILED;
					}
					
				$this -> setMID($iAlbumId, $aValue['ID'], 'id', $this -> _sVideoMigField);
				
			}
			
			$iAlbumsCmts = $this -> transferComments($iAlbumId, $aValue['ID'], 'video_albums');
			if ($iAlbumsCmts)
				$this -> _oDb -> query("UPDATE `bx_albums_albums` SET `comments` = :comments WHERE `id` = :id", array('id' => $iAlbumId, 'comments' => $iAlbumsCmts));
			
			$this -> migrateAlbumVideos($aValue['ID'], $iProfileId, $iAlbumId);	
			$this -> _iTransferredAlbums++;
       }        

        $this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_videos_albums_finished', $this -> _iTransferredAlbums, $this -> _iTransferred));
        return BX_MIG_SUCCESSFUL;
    }
   	
   /**
	* Migrates all photo albums and users videos
	* @param int $iAlbumId original albums id
	* @param int $iProfileId una profile ID
	* @param int $iNewAlbumID created una Album		
	* @return Integer
         */  
   private function migrateAlbumVideos($iAlbumId, $iProfileId, $iNewAlbumID)
   {
			$aResult = $this -> _mDb -> getAll("SELECT * 
													FROM  `sys_albums_objects` 
													LEFT JOIN `" . $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['table_name'] ."` ON `id_object` = `ID`
													WHERE  `id_album` = :album ORDER BY `id_object` ASC", array('album' => $iAlbumId));

			$iTransferred  = 0;
			foreach($aResult as $iKey => $aValue)
			{ 
				if ($this -> isFileExisted($iProfileId, $aValue['Title'], $aValue['Date'])) 
					continue;
				
				$sVideoPath = $this -> _sVideoFilesPath . "{$aValue['ID']}.m4v";				
				if (file_exists($sVideoPath))
				{
					$oStorage = BxDolStorage::getObjectInstance('bx_albums_files'); 
					$iId = $oStorage -> storeFileFromPath($sVideoPath, false, $iProfileId);					
					if ($iId)
					{ 
						$oStorage -> afterUploadCleanup($iId, $iProfileId);
						
						$sQuery = $this -> _oDb -> prepare("INSERT INTO `bx_albums_files2albums` SET `content_id` = ?, `file_id` = ?, `title` = ?", $iNewAlbumID, $iId, $aValue['Title']);
						$this -> _oDb -> query($sQuery);
						
						$iCmts = $this -> transferComments($iItemId = $this -> _oDb -> lastId(), $aValue['ID'], 'video_albums_items');
						if ($iCmts)
							$this -> _oDb -> query("UPDATE `bx_albums_files2albums` SET `comments` = :comments WHERE `id` = :id", array('id' => $iItemId, 'comments' => $iCmts));
						
						$this -> _iTransferred++;
						$iTransferred++;
						
						$this -> transferTags((int)$aValue['ID'], $iId, $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['type'], $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['keywords']);
					}
				}
			}	
				  
	  return $iTransferred;
   }

    public function dropMID($sIdentFieldName = '', $sTableName = '')
    {
        return parent::dropMID($this -> _sVideoMigField);
    }

	private function isFileExisted($iAuthor, $sTitle, $iDate)
	{    	
    	$sQuery  = $this -> _oDb ->  prepare("SELECT COUNT(*) FROM `bx_albums_files` WHERE `profile_id` = ? AND `file_name` = ? AND `added` = ? LIMIT 1", $iAuthor, $sTitle, $iDate);
        return (bool)$this -> _oDb -> getOne($sQuery);
    }
	
	public function removeContent()
	{
		if (!$this -> _oDb -> isTableExists($this -> _sTableWithTransKey) || !$this -> _oDb -> isFieldExists($this -> _sTableWithTransKey, $this -> _sVideoMigField))
			return false;
		
		$aRecords = $this -> _oDb -> getAll("SELECT * FROM `{$this -> _sTableWithTransKey}` WHERE `{$this -> _sVideoMigField}` !=0");
		
		$iNumber = 0;
		if (!empty($aRecords))
		{
			foreach($aRecords as $iKey => $aValue)
			{
				BxDolService::call('bx_albums', 'delete_entity', array($aValue['id']));
				$iNumber++;
			}
		}

		parent::removeContent();
		return $iNumber;
	}
}

/** @} */
