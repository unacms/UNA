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
	
class BxDolMPhotoAlbums extends BxDolMData
{
	/**
	*  @var $_iTransferredAlbums transferred albums number
	*/
	private $_iTransferredAlbums;
    
	public function __construct(&$oMigrationModule, &$oDb)
	{
        parent::__construct($oMigrationModule, $oDb);
		$this -> _sModuleName = 'photos_albums';
		$this -> _sTableWithTransKey = 'bx_albums_albums';
    }
	
	public function getTotalRecords()
	{
        $aResult = $this -> _mDb -> getRow("SELECT COUNT(*) as `count`, SUM(`ObjCount`) as `obj` FROM `" . $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['table_name_albums'] ."` WHERE `Type` = 'bx_photos' AND `Uri` <> 'Hidden'");
		return !(int)$aResult['count'] && !(int)$aResult['obj'] ? 0 : $aResult;
	}
    
	public function runMigration()
	{
		if (!$this -> getTotalRecords())
		{
			  $this -> setResultStatus(_t('_bx_dolphin_migration_no_data_to_transfer'));
	          return BX_MIG_SUCCESSFUL;
		}

		$sWhereCount = '';
		if ($this -> _oConfig -> _bTransferEmpty)
            $sWhereCount = " AND `ObjCount` <> 0";

		$this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_photos'));
		
		$this -> createMIdField();
		$aResult = $this -> _mDb -> getAll("SELECT * FROM `" . $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['table_name_albums'] ."` 
		                                    WHERE `Type` = 'bx_photos' AND `Uri` <> 'Hidden' {$sWhereCount} ORDER BY `ID` ASC");
		foreach($aResult as $iKey => $aValue)
		{ 			
			$iProfileId = $this -> getProfileId((int)$aValue['Owner']);
			if (!$iProfileId) 
				continue;
			
			$iAlbumId = $this -> isItemExisted($aValue['ID']);			
			if (!$iAlbumId)
			{
				$sAlbumTitle = isset($aValue['Caption']) && $aValue['Caption'] ? $aValue['Caption'] : 'Profile Photos';			
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
                                $this -> getPrivacy($aValue['Owner'], (int)$aValue['AllowAlbumView'], 'photos', 'album_view'),
								$aValue['Description'],
								$aValue['Status'] == 'active' ? 'active' : 'hidden'
								);			
				
					$this -> _oDb -> query($sQuery);
					$iAlbumId = $this -> _oDb -> lastId();					
						
					if (!$iAlbumId)
					{
						$this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_photos_album_error'));
						return BX_MIG_FAILED;
					}
					
				$this -> setMID($iAlbumId, $aValue['ID']);				
			}
			
			$iAlbumsCmts = $this -> transferComments($iAlbumId, $aValue['ID'], 'photo_albums');
			if ($iAlbumsCmts)
				$this -> _oDb -> query("UPDATE `bx_albums_albums` SET `comments` = :comments WHERE `id` = :id", array('id' => $iAlbumId, 'comments' => $iAlbumsCmts));
			
			$this -> migrateAlbumPhotos($aValue['ID'], $iProfileId, $iAlbumId);	
			$this -> _iTransferredAlbums++;
       }        

        // set as finished;
        $this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_photos_albums_finished', $this -> _iTransferredAlbums, $this -> _iTransferred));
        return BX_MIG_SUCCESSFUL;
    }
   	
   /**
	* Migrates all photo albums and users photos
	* @param int $iAlbumId original albums id
	* @param int $iProfileId una profile ID
	* @param int $iNewAlbumID created una Album		
	* @return Integer
         */  
   private function migrateAlbumPhotos($iAlbumId, $iProfileId, $iNewAlbumID){
			$aResult = $this -> _mDb -> getAll("SELECT * 
													FROM  `sys_albums_objects` 
													LEFT JOIN `" . $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['table_name'] ."` ON `id_object` = `ID`
													WHERE  `id_album` = :album ORDER BY `id_object` ASC", array('album' => $iAlbumId));

			$iTransferred  = 0;
			foreach($aResult as $iKey => $aValue)
			{ 
				$sFileName = "{$aValue['ID']}.{$aValue['Ext']}";
			    if ($this -> isFileExisted($iProfileId, $sFileName, $aValue['Date']))
					continue;

				$sImagePath = $this -> _sImagePhotoFiles . $sFileName;
				if (file_exists($sImagePath))
				{
				    $oStorage = BxDolStorage::getObjectInstance('bx_albums_files');
					$iId = $oStorage -> storeFileFromPath($sImagePath, false, $iProfileId, $iNewAlbumID);
					if ($iId)
					{ 
                        $this -> updateFilesDate($iId, $aValue['Date']);
						
						$sQuery = $this -> _oDb -> prepare("INSERT INTO `bx_albums_files2albums` SET `content_id` = ?, `file_id` = ?, `data` = ?, `title` = ?", $iNewAlbumID, $iId, $aValue['Size'], $aValue['Title']);
						$this -> _oDb -> query($sQuery);
						
						$iCmts = $this -> transferComments($iItemId = $this -> _oDb -> lastId(), $aValue['ID'], 'photo_albums_items');
						if ($iCmts)
							$this -> _oDb -> query("UPDATE `bx_albums_files2albums` SET `comments` = :comments WHERE `id` = :id", array('id' => $iItemId, 'comments' => $iCmts));
						
						$this -> _iTransferred++;
						$iTransferred++;
						
						$this -> transferTags((int)$aValue['ID'], $iId, $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['type'], $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['keywords']);
						$this -> transferFavorites((int)$aValue['ID'], $iId);
					}
				}
			}	
				  
	  return $iTransferred;
   }

    private function transferFavorites($iPhotoId, $iNewID){
        $aData = $this->_mDb->getRow("SELECT * FROM `bx_photos_favorites` WHERE `ID`=:id LIMIT 1", array('id' => $iPhotoId));
        if (empty($aData))
            return false;

        $iProfileId = $this -> getProfileId((int)$aData['Profile']);
        if (!$iProfileId)
            return false;

        $sQuery = $this -> _oDb -> prepare("INSERT INTO `bx_albums_favorites_media_track` SET `object_id` = ?, `author_id` = ?, `date` = ?", $iNewID, $iProfileId, ($aData['Date'] ? $aData['Date'] : time()));
        return $this -> _oDb -> query($sQuery);
    }

	private function isFileExisted($iAuthor, $sTitle, $iDate){
    	$sQuery  = $this -> _oDb ->  prepare("SELECT COUNT(*) FROM `bx_albums_files` WHERE `profile_id` = ? AND `file_name` = ? AND `added` = ? LIMIT 1", $iAuthor, $sTitle, $iDate);
        return (bool)$this -> _oDb -> getOne($sQuery);
    }

    private function updateFilesDate($iId, $iDate){
        $sQuery  = $this -> _oDb ->  prepare("UPDATE `bx_albums_files` SET `added`=? WHERE `id` = ?", $iDate, $iId);
        return $this -> _oDb -> query($sQuery);
    }
	
	public function removeContent()
	{
		if (!$this -> _oDb -> isTableExists($this -> _sTableWithTransKey) || !$this -> _oDb -> isFieldExists($this -> _sTableWithTransKey, $this -> _sTransferFieldIdent))
			return false;
		
		$aRecords = $this -> _oDb -> getAll("SELECT * FROM `{$this -> _sTableWithTransKey}` WHERE `{$this -> _sTransferFieldIdent}` !=0");
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
