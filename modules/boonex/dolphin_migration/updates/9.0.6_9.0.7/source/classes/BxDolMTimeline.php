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
	
class BxDolMTimeline extends BxDolMData
{	
	/**
	 *  @var path in Dolphin to the video modules files
	 */
	private $_sImageVideoFiles = null;

	public function __construct(&$oMigrationModule, &$oDb)
	{
        parent::__construct($oMigrationModule, $oDb);
		$this -> _sModuleName = 'timeline';
		$this -> _sTableWithTransKey = 'bx_timeline_events';
		$this -> _sImageVideoFiles = $this -> _oDb -> getExtraParam('root') . 'flash' . DIRECTORY_SEPARATOR . 'modules' . DIRECTORY_SEPARATOR . "video" . DIRECTORY_SEPARATOR . "files" . DIRECTORY_SEPARATOR;
    }    
	
	public function getTotalRecords()
	{
	    return (int)$this -> _mDb -> getOne("SELECT COUNT(*) FROM `" . $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['table_name'] . "` ORDER BY `id`");
	}
	/**
	 *  Returns data from the module into which data was added
	 *  
	 *  @param int $iModuleItemId object id
	 *  @param string $sModule module name @uses BxDolMConfig::_aMigrationModules
	 *  @return array
	 */
	private function getModuleItemInfo($iModuleItemId, $sModule = 'forum')
	{
        $sTable = '';
        $sModule = '';
	    switch($sModule)
		{
			case 'events':
					$sTable = 'bx_events_data';
                    $sModule = 'bx_events';
					break;
			case 'store':
					$sTable = 'bx_market_products';
                    $sModule = 'bx_market';
					break;
			case 'files':
					$sTable = 'bx_files_main';
                    $sModule = 'bx_files';
					break;
			case 'polls':
					$sTable = 'bx_polls_entries';
                    $sModule = 'bx_polls';
					break;
			case 'groups':
				    $sTable = 'bx_groups_data';
                    $sModule = 'bx_groups';
					break;
			case 'blogs':
					$sTable = 'bx_posts_posts';
                    $sModule = 'bx_posts';
					break;
		}
		if (!$sTable)
			return array();
		
		if ($this->_oDb->isEnabledByName($sModule) && !$this -> _oDb -> isFieldExists($sTable, $this -> _sTransferFieldIdent))
			return array();

		return $this -> _oDb -> getRow("SELECT * FROM `{$sTable}` WHERE `{$this -> _sTransferFieldIdent}` = :id", array('id' => $iModuleItemId));
	}
	/**
	 *  Convert Dolphin timeline record into UNA timeline record
	 *  
	 *  @param array $aInfo Dolphin timeline record
	 *  @return array
	 */
	private function getFormatedData(&$aInfo)
	{
		$sAction = '';
		$sType = '';
		$sContent = '';
		$sDescription = '';
		$iAuthor = $this -> getProfileId($aInfo['owner_id']);
		$iObjectId = $this -> getProfileId($aInfo['object_id']);
		$iTime	= time();
		$sTitle = '';
		$aData = array();
		
		$mixedTransferred = $this -> isModuleContentTransferred($aInfo['type']);
		if ($mixedTransferred === 0)
			return array();
		
		switch($aInfo['type'])
		{
			case 'bx_events':
			case 'bx_forum':
			case 'bx_groups':
			case 'bx_blogs':
			case 'bx_store':
			case 'bx_polls':
				if (!($aInfo['action'] == 'add' || $aInfo['action'] == 'create'))
					return array();
						
				$sModule = $this -> _oConfig -> _aModulesAliases[$aInfo['type']];
				$aItemInfo = $this -> getModuleItemInfo($aInfo['object_id'], $sModule);
				if (empty($aItemInfo))
					return array();

				$sAction = 'added';
				$sType = $aInfo['type'];
				$iObjectId = $aItemInfo['id'];
				$iTime = $aInfo['date'];

				switch($sModule)
				{
					case 'events':
							$sTitle = $aItemInfo['event_name'];
							break;
					case 'store':
							$sTitle = $aItemInfo['title'];
							$sType = 'bx_market';
							break;
					case 'files':
							$sTitle = $aItemInfo['title'];
							break;
					case 'videos':
							$sTitle = $aItemInfo['title'];
							break;
					case 'photos':
							$sTitle = $aItemInfo['title'];
							break;
					case 'polls':
							$sTitle = $aItemInfo['text'];
							break;
					case 'groups':
							$sTitle = $aItemInfo['group_name'];
							break;
					case 'blogs':
							$sTitle = $aItemInfo['title'];
							$sType = 'bx_posts';
							break;
				}
								
				$oProfile = BxDolProfile::getInstance($iAuthor);
				$sDescription = _t('_bx_timeline_txt_user_added_sample', $oProfile -> getDisplayName(), _t("_{$sType}_txt_sample_single_with_article"));
				break;

			case 'wall_common_link':
				$sType = 'timeline_common_post';
				$sTitle = '<i class="sys-icon link"></i>';
				preg_match('!https?://\S+!', $aInfo['description'], $aUrl);				
				if (!empty($aUrl[0]))
				{
					$aData = array(
									'url' => $aUrl[0],
									'type' => 'link'
									);
					$sContent =  serialize(array());
				}
				break;				
			case 'wall_common_photos':				
			case 'wall_common_videos':
				$sType = 'timeline_common_post';
				$sTitle = $aInfo['type'] == 'wall_common_photos' ? '<i class="sys-icon far image"></i>' : '<i class="sys-icon film"></i>';
				$aItemInfo = @unserialize($aInfo['content']);
				if (!empty($aItemInfo))
				{
					$aData = array(
									'media_id' => $aItemInfo['id'],
									'type'	=> $aItemInfo['type']
									);
					$sContent =  serialize(array());
				}				
				break;				
			case 'wall_common_text':
				$sTitle = html2txt($aInfo['content']);				
				$sType = 'timeline_common_post';		
				$sContent =  serialize(array());
				break;
			case 'wall_common_repost':
				$sType = 'timeline_common_repost';
				 
				if (isset($aInfo['content']))
					$aItemInfo = @unserialize($aInfo['content']);
				
				if (!isset($aItemInfo['action']) || !($aItemInfo['action'] == 'add' || $aItemInfo['action'] == 'create')  || !isset($this -> _oConfig -> _aModulesAliases[$aItemInfo['type']]))
					break;
				else
					$sSubAction = 'added';


				$aSubInfo = $this -> getModuleItemInfo($aItemInfo['object_id'], $this -> _oConfig -> _aModulesAliases[$aItemInfo['type']]);
				if (empty($aSubInfo))
					break;
				
				$sSubType = $aItemInfo['type'];
				$sSubType = $sSubType == 'bx_blogs' ? 'bx_posts' : $sSubType;
				$sSubType = $sSubType == 'bx_store' ? 'bx_market' : $sSubType;			

				$sContent = serialize(array('type' => $sSubType, 'action' => 'added', 'object_id' => $aSubInfo['id']));
				break;
		}
		

		$aResult = array
		(
			'type' => $sType,
			'action' => $sAction,
			'owner_id' => $iAuthor,
			'object_id' => $iObjectId,
			'privacy' => 3,
			'content' => $sContent,
			'title'	=> $sTitle,
			'description' => $sDescription,
			'date'	=> $iTime,
			'active' => (int)$aInfo['active'],
			'hidden' => (int)$aInfo['hidden'],
			'data' => $aData
		);		
		
		return $aResult;
	}
	/**
	 *  Migrate timeline link from Dolphin to UNA
	 *  
	 *  @param int $iEventId record id 
	 *  @param string $sUrl html url
	 *  @param int $iProfileId profile id
	 *  @return int affected rows
	 */
	private function addLink($iEventId, $sUrl, $iProfileId)
    {
		$aSiteInfo = bx_get_site_info($sUrl, array(
            'thumbnailUrl' => array('tag' => 'link', 'content_attr' => 'href'),
            'OGImage' => array('name_attr' => 'property', 'name' => 'og:image'),
        ));

        $sTitle = !empty($aSiteInfo['title']) ? $aSiteInfo['title'] : _t('_Empty');
        $sDescription = !empty($aSiteInfo['description']) ? $aSiteInfo['description'] : _t('_Empty');

        $sMediaUrl = '';
        if(!empty($aSiteInfo['thumbnailUrl']))
        	$sMediaUrl = $aSiteInfo['thumbnailUrl'];
        else if(!empty($aSiteInfo['OGImage']))
        	$sMediaUrl = $aSiteInfo['OGImage'];

		$iMediaId = 0;
		$oStorage = null;
        if(!empty($sMediaUrl))
		{
        	$oStorage = BxDolStorage::getObjectInstance('bx_timeline_photos');
        	$iMediaId = $oStorage->storeFileFromUrl($sMediaUrl, true, $iProfileId);
			$oStorage -> afterUploadCleanup($iMediaId, $iProfileId);		
        }
	
		if (!$sTitle && !$sDescription && !$iMediaId)
			return false;
		
		$sQuery = $this -> _oDb -> prepare("
							INSERT INTO
								`bx_timeline_links`
							SET
							   `profile_id`	= ?,
							   `media_id`  	= ?,
							   `url` 		= ?,
							   `title` 		= ?,
							   `text`  		= ?,
							   `added` 		= UNIX_TIMESTAMP()
					   ", $iProfileId, $iMediaId, $sUrl, $sTitle, $sDescription);

		$this -> _oDb -> query($sQuery);
		return $this -> _oDb -> query("INSERT INTO `bx_timeline_links2events` SET `event_id` = :event, `link_id` = :link", array('event' => $iEventId, 'link' => $this -> _oDb -> lastId()));		
    }
	/**
	 *  Transfer timeline photos 
	 *  
	 *  @param int $iEventId UNA record id
	 *  @param int $iPhotoId Description for $iPhotoId
	 *  @param int $iProfileId Description for $iProfileId
	 *  @return Return description
	 */
	private function addPhoto($iEventId, $iPhotoId, $iProfileId)
    {
		$aMedia = $this -> _mDb -> getRow("SELECT * FROM `bx_photos_main` WHERE `ID`=:id LIMIT 1", array('id' => $iPhotoId));		
		if (empty($aMedia))
			return false;
		
		$sImagePath = $this -> _sImagePhotoFiles . "{$aMedia['ID']}.{$aMedia['Ext']}";				
		if (file_exists($sImagePath))
		{
			$oStorage = BxDolStorage::getObjectInstance('bx_timeline_photos'); 
			$iMediaId = $oStorage -> storeFileFromPath($sImagePath, true, $iProfileId, $iEventId);
			if ($iMediaId)
			{ 
				$oStorage -> afterUploadCleanup($iMediaId, $iProfileId);
				return $this -> _oDb -> query("INSERT INTO `bx_timeline_photos2events` SET `event_id` = :event, `media_id` = :media_id", array('event' => $iEventId, 'media_id' => $iMediaId));
			}			
		}	
		
		return false;
    }
	
	private function addVideo($iEventId, $iVideoId, $iProfileId)
    {
		$aMedia = $this -> _mDb -> getRow("SELECT * FROM `RayVideoFiles` WHERE `ID`=:id LIMIT 1", array('id' => $iVideoId));
		if (empty($aMedia))
			return false;
		
		$sVideoPath = $this -> _sImageVideoFiles . "{$iVideoId}.m4v";				
		if (file_exists($sVideoPath))
		{
			$oStorage = BxDolStorage::getObjectInstance('bx_timeline_videos'); 
			$iMediaId = $oStorage -> storeFileFromPath($sVideoPath, true, $iProfileId, $iEventId);					
			if ($iMediaId)
			{ 
				$oStorage -> afterUploadCleanup($iMediaId, $iProfileId);			
				return $this -> _oDb -> query("INSERT INTO `bx_timeline_videos2events` SET `event_id` = :event, `media_id` = :media_id", array('event' => $iEventId, 'media_id' => $iMediaId));
			}			
		}	
		
		return false;		
    }
	
	public function runMigration()
	{        
		if (!$this -> getTotalRecords())
		{
			  $this -> setResultStatus(_t('_bx_dolphin_migration_no_data_to_transfer'));
	          return BX_MIG_SUCCESSFUL;
		}	
		
		$this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_timeline'));
		
		$this -> createMIdField();
		$iFeedsId = $this -> getLastMIDField();						
		$sStart = '';
		if ($iFeedsId)
			$sStart = " WHERE `id` > {$iFeedsId}";
													 
		$aResult = $this -> _mDb -> getAll("SELECT * FROM `". $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['table_name'] . "` {$sStart} ORDER BY `id`");

		foreach($aResult as $iKey => $aValue)
		{
			$aInfo = $this -> getFormatedData($aValue);
			if (empty($aInfo) || !$aInfo['type'])
				continue;
			
			$iFeedId = $this -> isItemExisted($aValue['id']);
			if (!$iFeedId)
			{
				$sQuery = $this -> _oDb -> prepare( 
						 "
							INSERT INTO
								`{$this -> _sTableWithTransKey}`
							SET
								`owner_id`   			= ?,
								`type`      			= ?,
								`action`   				= ?,
								`object_id`				= ?,
								`object_privacy_view`	= ?,
								`content`				= ?,
								`title`					= ?,		
								`description`			= ?,		
								`date`					= ?,
								`active`				= ?,
								`status`				= ?
						 ", 
							$aInfo['owner_id'], 
							$aInfo['type'],
							$aInfo['action'],
							$aInfo['object_id'],
                            $this -> getValidPrivacy($aInfo['privacy']),
							$aInfo['content'],
							$aInfo['title'],
							$aInfo['description'],
							$aInfo['date'],
							$aInfo['active'],
							$aInfo['hidden'] ? 'hidden' : 'active'
							);			
			
				$this -> _oDb -> query($sQuery);
				
				$iFeedId = $this -> _oDb -> lastId();			
				if (!$iFeedId){
					$this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_timeline_error', (int)$aValue['id']));
					return BX_MIG_FAILED;
				}
				
				$this -> _iTransferred++;
			}
			
			if (!empty($aInfo['data']))
				switch($aInfo['data']['type'])
				{
					case 'videos' :  $this -> addVideo($iFeedId, $aInfo['data']['media_id'], $aInfo['owner_id']); break;
					case 'photos' :  $this -> addPhoto($iFeedId, $aInfo['data']['media_id'], $aInfo['owner_id']); break;
					case 'link' :  $this -> addLink($iFeedId, $aInfo['data']['url'], $aInfo['owner_id']); break;
				}
					
			$iComments = $this -> transferComments($iFeedId, (int)$aValue['id'], 'timeline');			
			$this -> _oDb ->  query("UPDATE `{$this -> _sTableWithTransKey}`
									SET 
										`comments` = :cmts
									WHERE `id` = :id", 
										array(
												'id' => $iFeedId, 
												'cmts' => (int)$iComments, 
											));
			
			$this -> setMID($iFeedId, $aValue['id']);
		}
        
		
        // set as finished;
        $this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_timeline_finished', $this -> _iTransferred));
        return BX_MIG_SUCCESSFUL;
    }
 
	public function removeContent()
	{
		if (!$this -> _oDb -> isTableExists($this -> _sTableWithTransKey) || !$this -> _oDb -> isFieldExists($this -> _sTableWithTransKey, $this -> _sTransferFieldIdent))
			return false;
		
		$aRecords = $this -> _oDb -> getAll("SELECT 
												`e`.`id`,
												`l`.`link_id`,
												`p`.`media_id` as `photo_id`,
												`v`.`media_id` as `video_id`
											FROM `{$this -> _sTableWithTransKey}` as `e`
											LEFT JOIN `bx_timeline_links2events` as `l` ON `e`.`id` = `l`.`event_id`
											LEFT JOIN `bx_timeline_photos2events` as `p` ON `e`.`id` = `p`.`event_id`
											LEFT JOIN `bx_timeline_videos2events` as `v` ON `e`.`id` = `v`.`event_id`
											WHERE `e`.`{$this -> _sTransferFieldIdent}`!=0");
		if (!empty($aRecords))
		{
			$iNumber = 0;
			foreach($aRecords as $iKey => $aValue)
			{			
				$oComments =  BxDolCmts::getObjectInstance('bx_timeline', $aValue['id']);
				if($oComments !== false)
					$oComments->onObjectDelete($aValue['id']);
				
				if ($aValue['video_id'])
				{
					$oStorage = BxDolStorage::getObjectInstance('bx_timeline_videos');
					$oStorage->deleteFile($aValue['video_id']);
					$this -> _oDb -> query("DELETE FROM `bx_timeline_videos2events` WHERE `event_id`=:id", array('id' => $aValue['id']));
				}
				
				if ($aValue['photo_id'])
				{
					$oStorage = BxDolStorage::getObjectInstance('bx_timeline_photos');
					$oStorage->deleteFile($aValue['photo_id']);
					$this -> _oDb -> query("DELETE FROM `bx_timeline_photos2events` WHERE `event_id`=:id", array('id' => $aValue['id']));
				}
				
				if ($aValue['link_id'])
				{
					$sQuery = $this-> _oDb -> prepare("DELETE FROM `tl`, `tle` USING `bx_timeline_links` AS `tl` LEFT JOIN `bx_timeline_links2events` AS `tle` ON `tl`.`id`=`tle`.`link_id` WHERE `tle`.`event_id` = ?", $aValue['id']);
					$this -> _oDb -> query($sQuery);
				}			
				
				$this -> _oDb -> query("DELETE FROM `{$this -> _sTableWithTransKey}` WHERE `id`=:id", array('id' => $aValue['id']));
				$iNumber++;
			}
		}

		parent::removeContent();
		return $iNumber;
	}	
}

/** @} */
