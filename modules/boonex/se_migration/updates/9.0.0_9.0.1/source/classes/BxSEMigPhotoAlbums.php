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
bx_import('BxDolStorage');
	
class BxSEMigPhotoAlbums extends BxSEMigData {		
	private $_iTransferredAlbums;
    
	public function BxSEMigPhotoAlbums (&$oMigrationModule, &$oSE) {
        parent::BxSEMigData($oMigrationModule, $oSE);
    }
	
	public function getTotalRecords(){
		return (int)$this -> _seDb -> getOne("SELECT SUM(`count`) FROM (
																		SELECT COUNT(*) as `count` FROM `{$this -> _sEnginePrefix}storage_files` 
																		WHERE  `parent_file_id` IS NULL AND `parent_type` IN ('album_photo', 'user') GROUP BY `parent_id`
																		) as `c`");
	}
    
	public function runMigration () {
		if (!$this -> getTotalRecords()){
			  $this -> setResultStatus(_t('_bx_se_migration_no_data_to_transfer'));
	          return BX_SEMIG_SUCCESSFUL;
		}
		
		$this -> setResultStatus(_t('_bx_se_migration_started_migration_photos'));

		$aResult = $this -> _seDb -> getAll("SELECT * FROM `{$this -> _sEnginePrefix}album_albums` WHERE `type` = 'profile' ORDER BY `album_id`");
		foreach($aResult as $iKey => $aValue){ 
			
			$iProfileId = $this -> getContentId((int)$aValue['owner_id']);
			if (!$iProfileId) continue;
			
			$sAlbumTitle = isset($aValue['title']) && $aValue['title'] ? $aValue['title'] : 'Profile Photos';
			
			if (!$this -> isAlbumExisted($iProfileId, $sAlbumTitle)){
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
	                     		`text`				= ?,
								`views`				= ?					
	                     ", 
							$iProfileId, 
							isset($aValue['creation_date']) ? strtotime($aValue['creation_date']) : time(), 
							isset($aValue['modified_date']) ? strtotime($aValue['modified_date']) : time(), 
							isset($aValue['title']) && $aValue['title'] ? $aValue['title'] : 'Profile Photos',
							isset($aValue['description']) && $aValue['description'] ? $aValue['description'] : '',
							(int)$aValue['view_count']
							);			
			
				$this -> _oDb -> query($sQuery);
				$iAlbumId = $this -> _oDb -> lastId();					
				if (!$iAlbumId){
					$this -> setResultStatus(_t('_bx_se_migration_started_migration_photos_album_error'));
		            return BX_SEMIG_FAILED;
				}	
			
			$this -> migrateAlbumPhotos($aValue['owner_id'], $iProfileId, $iAlbumId);	
			
			}
	
			$this -> _iTransferredAlbums++;
       }        

        // set as finished;
        $this -> setResultStatus(_t('_bx_se_migration_started_migration_photos_finished', $this -> _iTransferred));
        return BX_SEMIG_SUCCESSFUL;
    }
   	
   /**
	* Migrates all photo albums and users photos
	* @param int $iUserId social engine's profile ID
	* @param int $iProfileId una profile ID
	* @param int $iAlbumID created una Album		
	* @return Integer
         */  
   private function migrateAlbumPhotos($iUserId, $iProfileId, $iAlbumID){
       		$aResult = $this -> _seDb -> getAll("SELECT * FROM  `{$this -> _sEnginePrefix}storage_files` WHERE  `parent_file_id` IS NULL AND  `parent_type` IN ('album_photo', 'user') AND `parent_id` = {$iUserId} ORDER BY `file_id` ASC");

			$iTransferred  = 0;			
			foreach($aResult as $iKey => $aValue){ 
				if ($this -> isFileExisted($iProfileId, $aValue['name'])) continue;
				
				$sOldImagePath = $this -> _oDb -> getExtraParam('root') . $aValue['storage_path'];
				
				if (file_exists($sOldImagePath)){
					$oStorage = BxDolStorage::getObjectInstance('bx_albums_files'); 
					$iId = $oStorage -> storeFileFromPath($sOldImagePath, false, $iProfileId); 
				
				if ($iId){ 
						$sQuery = $this -> _oDb -> prepare("INSERT INTO `bx_albums_files2albums` SET `content_id` = ?, `file_id` = ?, `data` = ?, `title` = ?", $iAlbumID, $iId, $this -> getFileSize($sOldImagePath), $aValue['name']);
	                    $this -> _oDb -> query($sQuery);								
						$this -> _iTransferred++;
						$iTransferred++;
					}
				}
		   }
	  
	  return $iTransferred;
   }
   
    private function isAlbumExisted($iAuthor, $sTitle){    	
    	$sQuery  = $this -> _oDb ->  prepare("SELECT COUNT(*) FROM `bx_albums_albums` WHERE `author` = ? AND `title` = ? LIMIT 1", $iAuthor, $sTitle);
        return (bool)$this -> _oDb -> getOne($sQuery);
    }
	
	private function isFileExisted($iAuthor, $sTitle){    	
    	$sQuery  = $this -> _oDb ->  prepare("SELECT COUNT(*) FROM `bx_albums_files` WHERE `profile_id` = ? AND `file_name` = ? LIMIT 1", $iAuthor, $sTitle);
        return (bool)$this -> _oDb -> getOne($sQuery);
    }
    
    private function getFileSize ($sFile) {
    	$aInfo = getimagesize($sFile);
		return $aInfo[0] . 'x' . $aInfo[1];
    }    
}

/** @} */
