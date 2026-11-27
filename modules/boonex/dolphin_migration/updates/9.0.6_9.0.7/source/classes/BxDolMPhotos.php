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
	
class BxDolMPhotos extends BxDolMData
{
	public function __construct(&$oMigrationModule, &$oDb)
	{
        parent::__construct($oMigrationModule, $oDb);
		$this -> _sModuleName = 'photos';
		$this -> _sTableWithTransKey = 'bx_photos_entries';
    }
	
	public function getTotalRecords()
	{
		return $this -> _mDb -> getOne("SELECT SUM(`ObjCount`) 
                                            FROM `" . $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['table_name_photos'] ."` 
                                            WHERE `Type` = 'bx_photos' AND `Uri` <> 'Hidden'");
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
		$aResult = $this -> _mDb -> getAll("SELECT * FROM `" . $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['table_name_photos'] ."` 
		                                    WHERE `Type` = 'bx_photos' AND `Uri` <> 'Hidden' {$sWhereCount} ORDER BY `ID` ASC");

		foreach($aResult as $iKey => $aValue)
		{ 			
			$iProfileId = $this -> getProfileId((int)$aValue['Owner']);
			if (!$iProfileId) 
				continue;

			$this -> migratePhoto($aValue['ID'], $iProfileId);
       }

        // set as finished;
        $this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_photos_finished', $this -> _iTransferred));
        return BX_MIG_SUCCESSFUL;
    }
   	
   /**
	* Migrates all photo albums and users photos
	* @param int $iAlbumId original albums id
	* @param int $iProfileId una profile ID
	* @param int $iNewPhotoId created una Album
	* @return Integer
         */  
   private function migratePhoto($iAlbumId, $iProfileId){
          $aResult = $this -> _mDb -> getAll("SELECT  `m`.*, `a`.`AllowAlbumView`, `a`.`Status` as `admin_status`, `m`.`Status` as `status`
													FROM  `sys_albums_objects` as `o`
													LEFT JOIN `sys_albums` as `a` ON `o`.`id_album` = `a`.`ID`
													LEFT JOIN `" . $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['table_name'] ."` as `m` ON `o`.`id_object` = `m`.`ID`
													WHERE  `o`.`id_album` = :album ORDER BY `o`.`id_object` ASC", array('album' => $iAlbumId));

		  $iTransferred  = 0;
          foreach($aResult as $iKey => $aValue)
		  {
                $iPhotoId = $this -> isItemExisted($aValue['ID']);
                if ($iPhotoId)
                    continue;

                $sPhotoTitle = $aValue['Title'];
                $sQuery = $this -> _oDb -> prepare(
                        "
								INSERT INTO
									`bx_photos_entries`
								SET
									`author`   			= ?,
									`added`      		= ?,
									`changed`   		= ?,
									`thumb`				= 0,
									`title`				= ?,
									`allow_view_to` 	= ?,
									`text`				= ?,
									`status_admin`		= ?,
                                    `status`            = ?,
                                    `cat`               = ?
							 ",
                        $iProfileId,
                        $aValue['Date'] ? $aValue['Date'] : time(),
                        $aValue['Date'] ? $aValue['Date'] : time(),
                        $sPhotoTitle,
                        $this -> getPrivacy($aValue['Owner'], (int)$aValue['AllowAlbumView'], 'photos', 'album_view'),
                        $aValue['Desc'],
                        $aValue['admin_status'] == 'active' ? 'active' : 'hidden',
                        $aValue['status'] == 'approved' ? 'active' : 'hidden',
                        $this -> transferCategory($aValue['Categories'], 'bx_photos', 'bx_photos_cats')
                    );

                    $this -> _oDb -> query($sQuery);
                    if ($iPhotoId = $this -> _oDb -> lastId())
                        $this -> setMID($iPhotoId, $aValue['ID']);
                    else
                        continue;

			    $sFileName = "{$aValue['ID']}.{$aValue['Ext']}";
				$sImagePath = $this -> _sImagePhotoFiles . $sFileName;
				if (file_exists($sImagePath))
				{
					$oStorage = BxDolStorage::getObjectInstance('bx_photos_photos');
					$iId = $oStorage -> storeFileFromPath($sImagePath, false, $iProfileId, $iPhotoId);
					if ($iId)
					{ 
                        $this -> _iTransferred++;
						$iTransferred++;

                        $this->updateExif($iPhotoId, array('thumb' => $iId, 'id' => $iPhotoId));
						$this->transferTags((int)$aValue['ID'], $iId, $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['type'], $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['keywords']);
						$this->transferFavorites((int)$aValue['ID'], $iId);
						$this->transferSVotes((int)$aValue['ID'], $iId);

                        $this->_oDb->query("UPDATE `bx_photos_entries` SET `comments` = :comments, `thumb`=:thumb WHERE `id` = :id", array('id' => $iPhotoId, 'thumb' => $iId, 'comments' => $this->transferComments($iPhotoId, $aValue['ID'])));

                    }
				}
			}	
				  
	  return $iTransferred;
   }

   private function transferFavorites($iPhotoId, $iNewID){
      $aData = $this->_mDb->getRow("SELECT * FROM `bx_photos_favorites` WHERE `ID`=:id LIMIT 1", array('id' => $iPhotoId));
      if (empty($aData))
          return false;

      $iProfileId = $this->getProfileId((int)$aData['Profile']);
      if (!$iProfileId)
          return false;

      $sQuery = $this->_oDb->prepare("INSERT INTO `bx_photos_favorites_track` SET `object_id` = ?, `author_id` = ?, `date` = ?", $iNewID, $iProfileId, ($aData['Date'] ? $aData['Date'] : time()));
      return $this->_oDb->query($sQuery);
   }

   private function transferSVotes($iPhotoId, $iNewID){
        $aData = $this->_mDb->getRow("SELECT * FROM `bx_photos_rating` WHERE `gal_id`=:id LIMIT 1", array('id' => $iPhotoId));
        if (empty($aData))
            return false;

        $sQuery = $this->_oDb->prepare("INSERT INTO `bx_photos_svotes` SET `object_id` = ?, `count` = ?, `sum` = ?", $iNewID, $aData['gal_rating_count'], $aData['gal_rating_sum']);
        $this->_oDb->query("UPDATE `bx_photos_entries` SET `svotes` = :votes WHERE `id` = :id", array('id' => $iPhotoId, 'votes' => $aData['gal_rating_count']));
        return $this->_oDb->query($sQuery);
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
				BxDolService::call('bx_photos', 'delete_entity', array($aValue['id']));
				$iNumber++;
			}
		}

		parent::removeContent();
		return $iNumber;
	}

    function updateExif($iPhotoId, $aContentInfo)
    {
        $CNF = &$this->_oConfig->CNF;
        $oStorage = BxDolStorage::getObjectInstance('bx_photos_photos');
        $oTranscoder = BxDolTranscoderImage::getObjectInstance('bx_photos_preview');

        if (!$oStorage || !$oTranscoder)
            return false;

        $aInfo = bx_get_image_exif_and_size($oStorage, $oTranscoder, $aContentInfo['thumb']);
        $this->_oDb->query("UPDATE `bx_photos_entries` SET `exif`=:exif WHERE `id`=:id", array('exif' => $aInfo['exif'], 'id' => $iPhotoId));

        $aExif = unserialize($aInfo['exif']);
        if ($aContentInfo && isset($aExif['Make']) && !empty($CNF['OBJECT_METATAGS_MEDIA_CAMERA'])) {
            $oMetatags = BxDolMetatags::getObjectInstance($CNF['OBJECT_METATAGS_MEDIA_CAMERA']);
            if ($oMetatags->keywordsIsEnabled()){
                $oMetatags->keywordsAddOne($aContentInfo['id'], $oMetatags->keywordsCameraModel($aExif));
            }
        }
    }
}

/** @} */
