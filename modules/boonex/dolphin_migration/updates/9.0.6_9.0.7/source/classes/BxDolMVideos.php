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
	
class BxDolMVideos extends BxDolMData
{
	private $_sVideoFilesPath;

    public function __construct(&$oMigrationModule, &$oDb)
	{
        parent::__construct($oMigrationModule, $oDb);
		$this -> _sModuleName = 'videos';
		$this -> _sTableWithTransKey = 'bx_videos_entries';
        $this -> _sVideoFilesPath = $this -> _oDb -> getExtraParam('root') . 'flash' . DIRECTORY_SEPARATOR . 'modules' . DIRECTORY_SEPARATOR . "video" . DIRECTORY_SEPARATOR . "files" . DIRECTORY_SEPARATOR;

    }
	
	public function getTotalRecords()
	{
		return $this -> _mDb -> getOne("SELECT SUM(`ObjCount`) as `obj` 
                                            FROM `" . $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['table_name_videos'] ."` 
                                            WHERE `Type` = 'bx_videos' AND `Uri` <> 'Hidden'");
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

		$this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_videos'));
		
		$this -> createMIdField();
		$aResult = $this -> _mDb -> getAll("SELECT * FROM `" . $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['table_name_videos'] ."` 
		                                    WHERE `Type` = 'bx_videos' AND `Uri` <> 'Hidden' {$sWhereCount} ORDER BY `ID` ASC");

		foreach($aResult as $iKey => $aValue)
		{ 			
			$iProfileId = $this -> getProfileId((int)$aValue['Owner']);
			if (!$iProfileId) 
				continue;

			$this -> migrateVideo($aValue['ID'], $iProfileId);
       }

        // set as finished;
        $this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_videos_finished', $this -> _iTransferred));
        return BX_MIG_SUCCESSFUL;
    }
   	
   /**
	* Migrates all photo albums and users photos
	* @param int $iAlbumId original albums id
	* @param int $iProfileId una profile ID
	* @param int $iNewPhotoId created una Album
	* @return Integer
         */  
   private function migrateVideo($iAlbumId, $iProfileId){
          $aResult = $this -> _mDb -> getAll("SELECT  `m`.*, `a`.`AllowAlbumView`, `a`.`Status` as `admin_status`, `m`.`Status` as `status`
													FROM  `sys_albums_objects` as `o`
													LEFT JOIN `sys_albums` as `a` ON `o`.`id_album` = `a`.`ID`
													LEFT JOIN `" . $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['table_name'] ."` as `m` ON `o`.`id_object` = `m`.`ID`
													WHERE  `o`.`id_album` = :album ORDER BY `o`.`id_object` ASC", array('album' => $iAlbumId));

          $iTransferred = 0;
		  foreach($aResult as $iKey => $aValue)
		  {
                $iVideoId = $this -> isItemExisted($aValue['ID']);
                if ($iVideoId)
                    continue;

                $sVideoTitle = $aValue['Title'];
                $sQuery = $this -> _oDb -> prepare(
                        "
								INSERT INTO
									`bx_videos_entries`
								SET
									`author`   			= ?,
									`added`      		= ?,
									`changed`   		= ?,
									`video`				= 0,
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
                        $sVideoTitle,
                        $this -> getPrivacy($aValue['Owner'], (int)$aValue['AllowAlbumView'], 'videos', 'album_view'),
                        $aValue['Description'],
                        $aValue['admin_status'] == 'active' ? 'active' : 'hidden',
                        $aValue['status'] == 'approved' ? 'active' : 'hidden',
                        $this -> transferCategory($aValue['Categories'], 'bx_videos', 'bx_videos_cats')
                    );

                    $this -> _oDb -> query($sQuery);
                    if ($iVideoId = $this -> _oDb -> lastId())
                        $this -> setMID($iVideoId, $aValue['ID']);
                    else
                        continue;

			    $sFileName = "{$aValue['ID']}.m4v";
			    $sVideoPath = $this -> _sVideoFilesPath . $sFileName;
				if (file_exists($sVideoPath))
				{
					$oStorage = BxDolStorage::getObjectInstance('bx_videos_videos');
					$iId = $oStorage -> storeFileFromPath($sVideoPath, false, $iProfileId, $iVideoId);
					if ($iId)
					{ 
                        $this -> _iTransferred++;
               			$this->transferTags((int)$aValue['ID'], $iId, $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['type'], $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['keywords']);
						$this->transferFavorites((int)$aValue['ID'], $iId);
						$this->transferSVotes((int)$aValue['ID'], $iId);

                        $this->_oDb->query("UPDATE `bx_videos_entries` SET `comments` = :comments, `video`=:video WHERE `id` = :id", array('id' => $iVideoId, 'video' => $iId, 'comments' => $this->transferComments($iVideoId, $aValue['ID'], 'videos')));
                    }
				}
			}	
				  
	  return $iTransferred;
   }

    private function transferFavorites($iItemId, $iNewID){
        $aData = $this->_mDb->getRow("SELECT * FROM `bx_videos_favorites` WHERE `ID`=:id LIMIT 1", array('id' => $iItemId));
        if (empty($aData))
            return false;

        $iProfileId = $this -> getProfileId((int)$aData['Profile']);
        if (!$iProfileId)
            return false;

        $sQuery = $this -> _oDb -> prepare("INSERT INTO `bx_videos_favorites_track` SET `object_id` = ?, `author_id` = ?, `date` = ?", $iNewID, $iProfileId, ($aData['Date'] ? $aData['Date'] : time()));
        return $this -> _oDb -> query($sQuery);
    }

    private function transferSVotes($iItemId, $iNewID){
        $aData = $this->_mDb->getRow("SELECT * FROM `bx_videos_rating` WHERE `gal_id`=:id LIMIT 1", array('id' => $iItemId));
        if (empty($aData))
            return false;

        $sQuery = $this->_oDb->prepare("INSERT INTO `bx_videos_svotes` SET `object_id` = ?, `count` = ?, `sum` = ?", $iNewID, $aData['gal_rating_count'], $aData['gal_rating_sum']);
        $this->_oDb->query("UPDATE `bx_videos_entries` SET `svotes` = :votes WHERE `id` = :id", array('id' => $iItemId, 'votes' => $aData['gal_rating_count']));
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
				BxDolService::call('bx_videos', 'delete_entity', array($aValue['id']));
				$iNumber++;
			}
		}

		parent::removeContent();
		return $iNumber;
	}
}

/** @} */
