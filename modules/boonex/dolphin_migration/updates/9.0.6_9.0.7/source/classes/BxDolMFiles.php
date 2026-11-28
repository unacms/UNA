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
	
class BxDolMFiles extends BxDolMData
{	
	/**
	*@var path to the directory with Dolphin files
	*/
	private $_sFilesPath = '';
	
	public function __construct(&$oMigrationModule, &$oDb)
	{
        parent::__construct($oMigrationModule, $oDb);
		$this -> _sModuleName = 'files';
		$this -> _sTableWithTransKey = 'bx_files_main';
		$this -> _sFilesPath = $this -> _oDb -> getExtraParam('root') . 'modules' . DIRECTORY_SEPARATOR . 'boonex' . DIRECTORY_SEPARATOR . 'files' . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'files' .  DIRECTORY_SEPARATOR ;
	}    
	
	public function getTotalRecords()
	{
		return (int)$this -> _mDb -> getOne("SELECT COUNT(*) FROM `" . $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['table_name'] . "` WHERE `Status` IN ('approved', 'pending')");			
	}
	
	public function runMigration()
	{        
		if (!$this -> getTotalRecords())
		{
			  $this -> setResultStatus(_t('_bx_dolphin_migration_no_data_to_transfer'));
	          return BX_MIG_SUCCESSFUL;
		}	
		
		$this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_files'));		
			
		$this -> createMIdField();
		$iFileId = $this -> getLastMIDField();						
		$sStart = '';
		if ($iFileId)
			$sStart = " AND `ID` >= {$iFileId}";
		
		$aResult = $this -> _mDb -> getAll("SELECT * FROM `" . $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['table_name'] . "` WHERE `Status` IN ('approved', 'pending') {$sStart} ORDER BY `ID`");
		$iCmts = 0;
		foreach($aResult as $iKey => $aValue)
		{ 
			$iProfileId = $this -> getProfileId((int)$aValue['Owner']);
			$iFileId = $this -> isItemExisted($aValue['ID']);			
			if (!$iProfileId)
				continue;
			
			$iDate = isset($aValue['Date']) ? $aValue['Date'] : time();
			if (!$iFileId)
			{
				$sQuery = $this -> _oDb -> prepare( 
                     "
                     	INSERT INTO
                     		`{$this -> _sTableWithTransKey}`
                     	SET
                     		`author`   			= ?,
                     		`added`      		= ?,
                     		`changed`   		= ?,
							`title`				= ?,
                     		`desc`				= ?,							
							`cat`				= ?,
							`views`				= ?,
							`featured`			= ?,
							`allow_view_to`		= ?
                     ", 
						$iProfileId, 
						$iDate,
						$iDate,
						isset($aValue['Title']) ? $aValue['Title'] : '',
						isset($aValue['Desc']) ? $aValue['Desc'] : '',						
						$this -> transferCategory($aValue['Categories']),
						isset($aValue['Views']) ? (int)$aValue['Views'] : 0,
						isset($aValue['Featured']) ? (int)$aValue['Featured'] : 0,
                    	$this -> getPrivacy((int)$aValue['Owner'], isset($aValue['AllowDownload']) ? (int)$aValue['AllowDownload'] : 0, 'files', 'download')
						);			
		
				$this -> _oDb -> query($sQuery);
				
				$iFileId = $this -> _oDb -> lastId();			
				if (!$iFileId)
				{
					$this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_files_error', (int)$aValue['ID']));
					return BX_MIG_FAILED;
				}				
				
				$this -> setMID($iFileId, $aValue['ID']);			
				$this -> exportFile($aValue['ID'] . '_' . sha1($iDate), $aValue['Ext'], $iFileId, $iProfileId);		
			}					
			
			$iCmts = $this -> transferComments($iFileId, (int)$aValue['ID'], 'files');
		
			$this -> _iTransferred++;
					
			$this -> _oDb ->  query("UPDATE `{$this -> _sTableWithTransKey}`
									SET 
											`comments` = :cmts 
									WHERE `id` = :id", array('id' => $iFileId, 'cmts' => $iCmts));
			
			$this -> transferTags((int)$aValue['ID'], $iFileId, $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['type'], $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['keywords']);
        }      	

        // set as finished;
        $this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_files_finished', $this -> _iTransferred, $iCmts));
        return BX_MIG_SUCCESSFUL;
    }
	/**
	 *  Export file by hash name
	 *  
	 *  @param string $sName hash
	 *  @param string $sExt file extension
	 *  @param int $iFileID filed id in UNA
	 *  @param int $iProfileId file owner id in UNA
	 *  @return mixed affected rows or false
	 */
	private function exportFile($sName, $sExt, $iFileID, $iProfileId)
	 {
		$sFilesPath = $this -> _sFilesPath . "{$sName}";				
		if (file_exists($sFilesPath) && copy($sFilesPath, BX_DIRECTORY_PATH_TMP . "{$sName}.{$sExt}"))
		{
	        	$oStorage = BxDolStorage::getObjectInstance('bx_files_files');
				$iId = $oStorage->storeFileFromPath(BX_DIRECTORY_PATH_TMP . "{$sName}.{$sExt}", false, $iProfileId);
				$oStorage -> afterUploadCleanup($iId, $iProfileId);
				$sQuery = $this -> _oDb -> prepare("UPDATE `{$this -> _sTableWithTransKey}` SET `file_id`=? WHERE `id`=?", $iId, $iFileID);
				return $this -> _oDb-> query($sQuery);
		}
		
		return false;		
    }
   
	protected function transferCategory($sCategory, $sPrefix = 'bx_files', $sPreValueCateg = 'bx_files_cats', $iValue = 0, $sData = '')
	{
		return parent::transferCategory($sCategory, $sPrefix, $sPreValueCateg);
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
				BxDolService::call('bx_files', 'delete_entity', array($aValue['id']));
				$iNumber++;
			}
		}

		parent::removeContent();
		return $iNumber;
	}
}

/** @} */
