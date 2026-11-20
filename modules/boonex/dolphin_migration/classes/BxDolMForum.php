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
	
class BxDolMForum extends BxDolMData
{	
	private $_iSystem = 0;
	protected $_sImageForumFiles = '';
	
	public function __construct(&$oMigrationModule, &$oDb)
	{
        parent::__construct($oMigrationModule, $oDb);
		$this -> _sModuleName = 'forum';
		$this -> _sTableWithTransKey = 'bx_forum_discussions';
		$this -> _iSystem = $this -> _oDb -> getOne("SELECT `ID` FROM `sys_objects_cmts` WHERE `Name` = 'bx_forum' LIMIT 1");
    }    
	
	public function getTotalRecords()
	{
		$aResult = $this -> _mDb -> getRow("SELECT SUM(`forum_topics`) as `topics`, SUM(`forum_posts`) as `posts` FROM `bx_forum`");
		return !(int)$aResult['topics'] && !(int)$aResult['posts'] ? 0 : $aResult;
	}

	public function runMigration()
	{
		if (!$this -> getTotalRecords())
		{
			  $this -> setResultStatus(_t('_bx_dolphin_migration_no_data_to_transfer'));
	          return BX_MIG_SUCCESSFUL;
		}	
		
		$this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_forum'));
		
			
		$this -> createMIdField();	
		$aResult = $this -> _mDb -> getAll("SELECT * FROM `bx_forum` ORDER BY `forum_id`");	
		$iCmts = $iCount = 0;
		foreach($aResult as $iKey => $aValue)
		{ 
			$iCategory = $aValue['forum_uri'] == 'General-discussions' ? 1 : $this -> transferCategory($aValue['forum_title']);		
			$aTopicts = $this -> _mDb -> getAll("SELECT * FROM `" . $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['table_name'] . "` 
												  WHERE `forum_id` = :categ
												  ORDER BY `topic_id`", array('categ' => $aValue['forum_id']));

			foreach($aTopicts as $iTopic => $aTopic)
			{
				$iTopicId = $this -> isItemExisted($aTopic['topic_id']);
				$iProfileId = $this -> getProfileIdByNickName($aTopic['first_post_user']);
				if (!$iTopicId && $iProfileId)
				{
					$sTitle = isset($aTopic['topic_title']) ? $aTopic['topic_title'] : time();
					$sStatus = !$aTopic['topic_hidden'] ? 'active' : 'hidden';
					$sQuery = $this -> _oDb -> prepare( 
							"
								INSERT INTO
									`{$this -> _sTableWithTransKey}`
								SET
									`author`   			= ?,
									`added`				= ?,	
									`title`				= ?,
									`text`				= ?,
									`status_admin`		= ?,									
									`cat`				= ?,
									`lock`				= ?,
									`stick`				= ?
							",
							$iProfileId,
							$aTopic['when'],
							$sTitle,
							$sTitle,
							$sStatus,
							$iCategory,
							$aTopic['topic_locked'],
							$aTopic['topic_sticky']
							);
			
					$this -> _oDb -> query($sQuery);
					
					$iTopicId = $this -> _oDb -> lastId();
					if (!$iTopicId)
					{
						$this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_forum_error', (int)$aTopic['topic_id']));
						return BX_MIG_FAILED;					
					}
					
					$this -> setMID($iTopicId, $aTopic['topic_id']);	
				}
				
				$aTopicsTrasnferInfo = $this -> transferMessages($iTopicId, (int)$aTopic['topic_id']);	
				$this -> transferSubscribers($iTopicId, (int)$aTopic['topic_id']);
				$this -> _iTransferred++;				
					
				$aStat = $this -> getTopicStat($iTopicId);
				$this -> _oDb ->  query("UPDATE `{$this -> _sTableWithTransKey}` SET 
									`allow_view_to` = 3, 
									`comments` = :cmts,
									`lr_timestamp` = :lr_timestamp,
									`lr_profile_id` = :lr_profile_id,
									`lr_comment_id` = :lrc_id,
									`added` = :added,
									`changed` = :changed,
									`text_comments` = :all_text,
									`text` = :text
									 WHERE `id` = :id", 
									array(
											'id' => $iTopicId, 
											'cmts' => $aTopicsTrasnferInfo['number'],
											'lr_timestamp' =>  $aTopicsTrasnferInfo['lrt'],
											'lr_profile_id' =>  $aTopicsTrasnferInfo['lrp'],
											'lrc_id' =>  $aStat['lrc_id'],
											'added' => $aStat['first_time'] ? $aStat['first_time'] : time(),
											'changed' => $aStat['lr_timestamp'] ? $aStat['lr_timestamp'] : time(),
											'all_text' => strip_tags($aStat['text']),
											'text' => $aTopicsTrasnferInfo['first_message'],											
										 )
									);
			}
			
        }      	

        // set as finished;
		$this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_forum_finished', $this -> _iTransferred));
        return BX_MIG_SUCCESSFUL;
    } 
	
	/**
	 *  Transfer Forum posts 
	 *  
	 *  @param int $iEntryId UNA forum ID
	 *  @param int $iTopicId Dolphin topic id
	 *  @return array first message, transferred posts number, last replay profile id, last replay time
	 */
	protected function transferMessages($iEntryId, $iTopicId)
	{
		$aItems = $this -> _mDb -> getAll("SELECT
												`Profiles`.`ID` as `user`,
												`post_text` as `message`,
												`when`,
												`p`.`post_id`
												FROM `" . $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['table_name_post'] . "` AS  `p`
												LEFT JOIN `Profiles` ON `p`.`user` = `Profiles`.`NickName`
												WHERE `topic_id` = :id 
												ORDER BY `id` ASC", array('id' => $iTopicId));
												
		if (empty($aItems))
			return false;
		
		$iNumber = 0;
		$sMessage = '';
		$iProfileId = 0;
		foreach($aItems as $iKey => $aValue)
		{
			$iProfileId	= $this -> getProfileId($aValue['user']);
			$this -> _oDb -> query("INSERT INTO `bx_forum_cmts` (`cmt_id`, `cmt_parent_id`, `cmt_vparent_id`, `cmt_object_id`, `cmt_author_id`, `cmt_level`, `cmt_text`, `cmt_time`, `cmt_replies`, `cmt_rate`, `cmt_rate_count`)
									VALUES	(NULL, 0, 0, :object, :user, 0, :message, :time, 0, 0, 0)", 
									array(
											'object' => $iEntryId,
											'user' => $iProfileId, 
											'message' => $aValue['message'], 
											'time' => $aValue['when'],
										));
			$iNumber++;
			if (!$sMessage)
				$sMessage = $aValue['message'];
			
			$iTime = $aValue['when'];						
			$this -> transferAttachments($aValue['post_id'], $this -> _oDb -> lastId(), $iProfileId);
		}
		
		return array('first_message' => $sMessage, 'number' => $iNumber, 'lrp' => $iProfileId, 'lrt' => $iTime);
	}
	/**
	 *  Get profile ID in Una by Nickname in Dolphin
	 *  
	 *  @param string $sNickName Dolphin's nickname
	 *  @return mixed profile id or false if not found
	 */
	private function getProfileIdByNickName($sNickName)
	{
		$iProfileId = $this -> _mDb -> getOne("SELECT `ID` FROM `Profiles` WHERE `NickName` = :user  LIMIT 1", array('user' => $sNickName));
		return $iProfileId ? $this -> getProfileId($iProfileId) : 0;
	}
	
	protected function transferCategory($sTitle, $sPrefix = 'bx_forum', $sCategory = 'bx_forum_cats', $iValue = 0, $sData = '')
	{
		return parent::transferCategory($sTitle, $sPrefix, $sCategory);
	}	

	/**
	 *  Transfer forum's subscribers
	 *  
	 *  @param int $iTopicId topic id in UNA
	 *  @param int $iEntryId forum id in Dolphin
	 *  @return void
	 */
	private function transferSubscribers($iTopicId, $iEntryId)
	{
		$aSubscribers = $this -> _mDb -> getAll("SELECT
											*
											FROM `bx_forum_flag`
											WHERE `topic_id` = :id", array('id' => $iEntryId));
		
		foreach($aSubscribers as $iKey => $aValue)
		{
			$iProfileId = $this -> getProfileIdByNickName((int)$aValue['user']);			
			if (!$iProfileId)
				continue;
			
			$sQuery = $this -> _oDb -> prepare( 
						"
							REPLACE INTO
								`bx_forum_subscribers`
							SET
								`initiator` = ?,
								`content`	= ?,
								`added`		= ?
						", 
						$iProfileId,
						$iTopicId,
						$aValue['when']
						);
			
			$this -> _oDb -> query($sQuery);
		}
	}
	/**
	 *  Builds path to Forum image files in Dolphin 
	 *  
	 *  @param string $s hash
	 *  @return string path
	 */
	private function orca_build_path ($s)
	{
		return substr($s, 0, 1) . DIRECTORY_SEPARATOR . substr($s, 0, 2) . DIRECTORY_SEPARATOR . substr($s, 0, 3) . '/';
	}
	/**
	 *  Transfer attached images to the forum
	 *  
	 *  @param int $iPostId Dolphin's post ID
	 *  @param int $iCommentId una post ID
	 *  @param int $iProfileId profile ID
	 *  @return int first image ID
	 */
	private function transferAttachments($iPostId, $iCommentId, $iProfileId)
    {
        $iFirstImage = 0;
		$iProfileId = (int)$iProfileId;
		$aAttachments = $this -> _mDb -> getAll("SELECT * FROM `bx_forum_attachments`
											WHERE `post_id` = :id", array('id' => $iPostId));
		
		if (empty($aAttachments))
			return false;
		
		$this -> _sImageForumFiles = $this -> _oDb -> getExtraParam('root') . 'modules' . DIRECTORY_SEPARATOR . 'boonex' . DIRECTORY_SEPARATOR . "forum" . DIRECTORY_SEPARATOR . "data" . DIRECTORY_SEPARATOR . "attachments" . DIRECTORY_SEPARATOR;		
		foreach($aAttachments as $iKey => $aFile)
		{
			$sImageFile = $this -> _sImageForumFiles . $this ->  orca_build_path($aFile['att_hash']). $aFile['att_hash'];
			if (file_exists($sImageFile) && copy($sImageFile, BX_DIRECTORY_PATH_TMP . $aFile['att_name']))
			{
	        	$oStorage = BxDolStorage::getObjectInstance('bx_forum_files_cmts');
				$iId = $oStorage->storeFileFromPath(BX_DIRECTORY_PATH_TMP . $aFile['att_name'], true, $iProfileId);
				$oStorage -> afterUploadCleanup($iId, $iProfileId);
				$sQuery = $this -> _oDb -> prepare("INSERT IGNORE INTO `sys_cmts_images2entries` SET `system_id`=?, `cmt_id`=?, `image_id`=?", $this -> _iSystem, $iCommentId, $iId);
				$this -> _oDb-> query($sQuery);
			}
		}
		
		return $iFirstImage;
    }
	/**
	 *  Returns Forums topics params
	 *  
	 *  @param int $iObjectId forum ID
	 *  @return array
	 */
	private function getTopicStat($iObjectId)
	{
		return $this -> _oDb -> getRow("SELECT
											MAX(`cmt_id`) as `lrc_id`, 
											MAX(`cmt_time`) as `lr_timestamp`,
											MIN(`cmt_time`) as `first_time`,
											GROUP_CONCAT(`cmt_text` SEPARATOR '\n') as `text`
											FROM `bx_forum_cmts`
											WHERE `cmt_object_id` = :id", array('id' => $iObjectId));
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
				BxDolService::call('bx_forum', 'delete_entity', array($aValue['id']));
				$iNumber++;
			}
		}

		parent::removeContent();
		return $iNumber;
	}
}

/** @} */
