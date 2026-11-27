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
	
class BxDolMMarket extends BxDolMData
{
	private $_sFilesPath = '';
	public function __construct(&$oMigrationModule, &$oDb)
	{
        parent::__construct($oMigrationModule, $oDb);
		$this -> _sModuleName = 'store';
		$this -> _sTableWithTransKey = 'bx_market_products';
		$this -> _sFilesPath = $this -> _oDb -> getExtraParam('root') . 'modules' . DIRECTORY_SEPARATOR . 'boonex' . DIRECTORY_SEPARATOR . 'files' . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'files' .  DIRECTORY_SEPARATOR ;
    }    
	
	public function getTotalRecords()
	{
		return (int)$this -> _mDb -> getOne("SELECT COUNT(*) FROM `" . $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['table_name'] . "`");			
	}
	
	public function runMigration()
	{        
		if (!$this -> getTotalRecords())
		{
			  $this -> setResultStatus(_t('_bx_dolphin_migration_no_data_to_transfer'));
	          return BX_MIG_SUCCESSFUL;
		}	
		
		$this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_market'));		
			
		$this -> createMIdField();
		$iProductId = $this -> getLastMIDField();						
		$sStart = '';
		if ($iProductId)
			$sStart = " AND `id` >= {$iProductId}";
		
		$aResult = $this -> _mDb -> getAll("SELECT * FROM `" . $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['table_name'] . "` {$sStart} ORDER BY `id`");
			
		$iCmts = 0;
		foreach($aResult as $iKey => $aValue)
		{ 
			$iProfileId = $this -> getProfileId((int)$aValue['author_id']);
			$iProductId = $this -> isItemExisted($aValue['id']);			
			if (!$iProfileId)
				continue;
			
			$iCreated = isset($aValue['created']) ? $aValue['created'] : time();
			$sTitle = isset($aValue['title']) ? $aValue['title'] : '';
			if (!$iProductId)
			{
				$sQuery = $this -> _oDb -> prepare( 
						 "
							INSERT INTO
								`{$this -> _sTableWithTransKey}`
							SET
								`author`   			= ?,
								`added`      		= ?,
								`changed`   		= ?,
								`name`				= ?,
								`title`				= ?,
								`text`				= ?,	
								`cat`				= ?,
								`views`				= ?,
								`featured`			= ?,
								`allow_view_to`		= ?
						 ", 
						$iProfileId, 
						$iCreated,
						$iCreated,
						$sTitle,
						$sTitle,
						isset($aValue['desc']) ? $aValue['desc'] : '',						
						$this -> transferCategory($aValue['categories']),
						isset($aValue['views']) ? (int)$aValue['views'] : 0,
						isset($aValue['featured']) ? (int)$aValue['featured'] : 0,
                        $this -> getPrivacy((int)$aValue['author_id'], isset($aValue['allow_view_product_to']) ? (int)$aValue['allow_view_product_to'] : 0, 'store', 'view_product')
					);			
		
				$this -> _oDb -> query($sQuery);				
				$iProductId = $this -> _oDb -> lastId();			
				if (!$iProductId)
				{
					$this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_market_error', (int)$aValue['id']));
					return BX_MIG_FAILED;
				}				
				
				$this -> setMID($iProductId, $aValue['id']);			
				$aInfo = $this -> exportFiles($aValue['id'], $iProductId);
				$iCmts = $this -> transferComments($iProductId, (int)$aValue['id'], 'market');
				$this -> _iTransferred++;
			}					
			
			
			$iPic = $this -> exportPictures($aValue['id'], $iProductId, (int)$aValue['thumb']);
			$this -> _oDb ->  query("UPDATE `{$this -> _sTableWithTransKey}` 
										SET 
											`thumb` = :thumb,
											`cover`	= :thumb,
											`comments` = :cmts,
											`price_single`	= :price,
											`package`		= :file_id
									WHERE `id` = :id", array('thumb' => $iPic, 'id' => $iProductId, 'cmts' => $iCmts, 'price' => $aInfo['price'], 'file_id' => $aInfo['file_id']));
			
			$this -> transferTags($aValue['id'], $iProductId, $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['type'], $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['keywords']);
		}      	

        // set as finished;
        $this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_market_finished', $this -> _iTransferred, $iCmts));
        return BX_MIG_SUCCESSFUL;
    }
	
	private function exportFiles($iStoreId, $iProductId)
	{
		$aFiles = $this -> _mDb -> getAll("SELECT * 
											FROM `bx_store_product_files` as `f1`
											LEFT JOIN `bx_files_main` as `f2` ON `f1`.`media_id` = `f2`.`ID`
											WHERE `entry_id` = :id", array('id' => $iStoreId));
		
		$aResult = array('price' => 0, 'file_id' => 0);
		$oZip = new ZipArchive();
		$i = 0;
		foreach($aFiles as $iKey => $aFile)
		{
			$sFilesPath = $this -> _sFilesPath . "{$aFile['media_id']}_" . sha1($aFile['Date']);
			$sName = $aFile['Title'];
			$sExt = $aFile['Ext'];		
			
			if (file_exists($sFilesPath) && copy($sFilesPath, BX_DIRECTORY_PATH_TMP . "{$sName}.{$sExt}"))
			{
				if ($oZip -> open(BX_DIRECTORY_PATH_TMP . "{$sName}.zip", ZipArchive::CREATE) !== TRUE)
					continue;
				
				$oZip -> addFile(BX_DIRECTORY_PATH_TMP . "{$sName}.{$sExt}", "{$sName}.{$sExt}");
				$oZip -> close();
				
				$iProfileId = $this -> getProfileId((int)$aFile['Owner']);
				$oStorage = BxDolStorage::getObjectInstance('bx_market_files');
				$iId = $oStorage->storeFileFromPath(BX_DIRECTORY_PATH_TMP . "{$sName}.zip", true, $iProfileId, $iProductId);				
				$sQuery = $this -> _oDb -> prepare("INSERT IGNORE INTO `bx_market_files2products` SET `content_id`=?, `file_id`=?, `version`='1.0', `order`=? ", $iProductId, $iId, $i++);
				$this -> _oDb-> query($sQuery);	
				
				if (floatval($aFile['price']))
				{
					$aResult = array(
						'price' => floatval($aFile['price']),
						'file_id' => $iId
					);				
				}
			}			
		}
		
		return $aResult;
    }
	
	protected function transferCategory($sCategory, $sPrefix = 'bx_market', $sPreValueCateg = 'bx_market_cats', $iValue = 0, $sData = '')
	{
		return parent::transferCategory($sCategory, $sPrefix, $sPreValueCateg);
	}
	
	private function exportPictures($iStoreId, $iProductId, $iThumb)
    {
        $iImage = 0;
		$aPhotos = $this -> _mDb -> getAll("SELECT `p`.* FROM `bx_store_product_images` as `g` 
											LEFT JOIN `bx_photos_main` as `p` ON `p`.`ID` = `g`.`media_id`
											WHERE `g`.`entry_id` = :id", array('id' => $iStoreId));
		
		$i = 0;
		foreach($aPhotos as $iKey => $aFile)
		{
			$sImageFile = $this -> _sImagePhotoFiles . "{$aFile['ID']}.{$aFile['Ext']}";
			$iProfileId = $this -> getProfileId((int)$aFile['Owner']);
			if (file_exists($sImageFile))
			{
	        	$oStorage = BxDolStorage::getObjectInstance('bx_market_photos'); 				
				$iId = $oStorage->storeFileFromPath($sImageFile, false, $iProfileId);
				$oStorage -> afterUploadCleanup($iId, $iProfileId);
				$sQuery = $this -> _oDb -> prepare("INSERT IGNORE INTO `bx_market_photos2products` SET `content_id`=?, `file_id`=?, `title` = ?, `order`=?", $iProductId, $iId, $aFile['Title'], $i++);
				$this -> _oDb-> query($sQuery);	
				if ($iThumb == $aFile['ID'])
					$iImage = $iId;
			}
		}
		
		return $iImage;
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
				BxDolService::call('bx_market', 'delete_entity', array($aValue['id']));
				$iNumber++;
			}
		}

		parent::removeContent();
		return $iNumber;
	}
}

/** @} */
