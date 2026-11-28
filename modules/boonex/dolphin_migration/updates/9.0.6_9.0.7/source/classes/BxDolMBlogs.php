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
	
class BxDolMBlogs extends BxDolMData
{	
	public function __construct(&$oMigrationModule, &$oDb)
	{
        parent::__construct($oMigrationModule, $oDb);
		$this -> _sModuleName = 'blogs';
		$this -> _sTableWithTransKey = 'bx_posts_posts';
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
		
		$this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_blogs'));		
			
		$this -> createMIdField();
		$iBlogId = $this -> getLastMIDField();						
		$sStart = '';
		if ($iBlogId)
			$sStart = " WHERE `PostID` >= {$iBlogId}";
		
		$aResult = $this -> _mDb -> getAll("SELECT * FROM `" . $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['table_name'] . "` {$sStart} ORDER BY `PostID`");
		
		$iCmts = 0;
		foreach($aResult as $iKey => $aValue)
		{
			$iProfileId = $this -> getProfileId((int)$aValue['OwnerID']);
			$iBlogId = $this -> isItemExisted($aValue['PostID']);			
			if (!$iProfileId)
				continue;
			
			if (!$iBlogId)
			{
				$sQuery = $this -> _oDb -> prepare( 
                     "
                     	INSERT INTO
                     		`{$this -> _sTableWithTransKey}`
                     	SET
                     		`author`   			= ?,
                     		`added`      		= ?,
                     		`changed`   		= ?,
							`thumb`				= 0,
							`title`				= ?,		
                     		`text`				= ?,							
							`cat`				= ?,
							`views`				= ?,
							`featured`			= ?,
                     	    `allow_view_to`     = ?
							
                     ", 
						$iProfileId, 
						isset($aValue['PostDate']) ? $aValue['PostDate'] : time(),
						isset($aValue['PostDate']) ? $aValue['PostDate'] : time(),
						isset($aValue['PostCaption']) ? $aValue['PostCaption'] : time() + 1,
						isset($aValue['PostText']) ? $aValue['PostText'] : '',						
						$this -> transferCategory($aValue['Categories']),						
						isset($aValue['Views']) ? (int)$aValue['Views'] : 0,
						isset($aValue['Featured']) ? (int)$aValue['Featured'] : 0,
                        $this -> getPrivacy((int)$aValue['OwnerID'], isset($aValue['allowView']) ? (int)$aValue['allowView'] : 0, 'blogs', 'view')
						);			
		
				$this -> _oDb -> query($sQuery);
				
				$iBlogId = $this -> _oDb -> lastId();			
				if (!$iBlogId){
					$this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_blogs_error', (int)$aValue['PostID']));
					return BX_MIG_FAILED;
				}	
				
				$this -> setMID($iBlogId, $aValue['PostID']);				
			}
			
			if (isset($aValue['PostPhoto']))
				$this -> exportThumb($iBlogId, $aValue['PostPhoto'], $iProfileId);
						
			$iCmts = $this -> transferComments($iBlogId, (int)$aValue['PostID'], 'blogs');
			$this -> _iTransferred++;
						
			$this -> _oDb ->  query("UPDATE `{$this -> _sTableWithTransKey}` SET `allow_view_to` = :privacy, `comments` = :cmts WHERE `id` = :id", array('privacy' => $aValue['allowView'], 'id' => $iBlogId, 'cmts' => $iCmts));
			
			$this -> transferTags((int)$aValue['PostID'], $iBlogId, $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['type'], $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['keywords']);
        }

        $this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_blogs_finished', $this -> _iTransferred));
        return BX_MIG_SUCCESSFUL;
    }
	
	protected function transferCategory($sCategory, $sPrefix = 'bx_posts', $sPreValueCateg = 'bx_posts_cats', $iValue = 0, $sData = '')
	{
		return parent::transferCategory($sCategory, $sPrefix, $sPreValueCateg);
	}
	
	/**
	 * Export blog's thumbnail
	 *
	 * @param integer $iEntryId una blog Id
	 * @param string $sPhotoName photo file name
	 * @param integer $iProfileId  profile id
	 * @return void
	 */
	private function exportThumb($iEntryId, $sPhotoName, $iProfileId)
    {
       if (!$sPhotoName || $this -> _oDb -> getOne("SELECT `thumb` FROM `{$this -> _sTableWithTransKey}` WHERE `id` = :id", array('id' => $iEntryId)))
		   return;
	   
       $sBlogImgPath = $this -> _oDb -> getExtraParam('root') . 'media' . DIRECTORY_SEPARATOR . 'images' . DIRECTORY_SEPARATOR . "blog" . DIRECTORY_SEPARATOR ."orig_{$sPhotoName}";
       if($sBlogImgPath)
		{
			$oFileStorage = BxDolStorage::getObjectInstance('bx_posts_covers');
			$iFile = $oFileStorage -> storeFileFromPath($sBlogImgPath, false, $iProfileId, (int)$iEntryId);
			if ($iFile)
			{
				$sQuery = $this -> _oDb -> prepare("UPDATE `{$this -> _sTableWithTransKey}` SET `thumb` = ? WHERE `id` = ?", $iFile, $iEntryId);
				$this -> _oDb -> query($sQuery);
			}		
		}
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
				BxDolService::call('bx_posts', 'delete_entity', array($aValue['id']));
				$iNumber++;
			}
		}		
		parent::removeContent();
		return $iNumber;
	}	
}

/** @} */
