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
	
class BxDolMPolls extends BxDolMData
{	
	public function __construct(&$oMigrationModule, &$oDb)
	{
        parent::__construct($oMigrationModule, $oDb);
		$this -> _sModuleName = 'polls';
		$this -> _sTableWithTransKey = 'bx_polls_entries';
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
		
		$this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_polls'));
		
			
		$this -> createMIdField();
		$iPollId = $this -> getLastMIDField();						
		$sStart = '';
		if ($iPollId)
			$sStart = " WHERE `id_poll` >= {$iPollId}";
		
		$aResult = $this -> _mDb -> getAll("SELECT * FROM `" . $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['table_name'] . "` {$sStart} ORDER BY `id_poll`");
		$iCmts = 0;
		foreach($aResult as $iKey => $aValue)
		{ 
			$iProfileId = $this -> getProfileId((int)$aValue['id_profile']);						
			if (!$iProfileId)
				continue;
			
			$iPollId = $this -> isItemExisted($aValue['id_poll']);
			if (!$iPollId)
			{
				$sQuery = $this -> _oDb -> prepare( 
                     "
                     	INSERT INTO
                     		`{$this -> _sTableWithTransKey}`
                     	SET
                     		`author`   			= ?,
                     		`added`      		= ?,
                     		`changed`   		= ?,
                     		`text`				= ?,							
							`cat`				= ?,
							`featured`			= ?,
							`allow_view_to`		= ?,
							`status_admin`		= ?
                     ", 
						$iProfileId, 
						isset($aValue['poll_date']) ? $aValue['poll_date'] : time(),
						isset($aValue['poll_date']) ? $aValue['poll_date'] : time(),						
						isset($aValue['poll_question']) ? $aValue['poll_question'] : '',
						$this -> transferCategory($aValue['poll_categories']),
						isset($aValue['poll_featured']) ? (int)$aValue['poll_featured'] : 0,
                        $this -> getPrivacy((int)$aValue['id_profile'], isset($aValue['allow_view_to']) ? (int)$aValue['allow_view_to'] : 0, 'poll', 'view'),
						$aValue['poll_status'] = 'active' && $aValue['poll_approval'] ? 'active' : 'hidden'
						);			
		
				$this -> _oDb -> query($sQuery);
				
				$iPollId = $this -> _oDb -> lastId();
				if (!$iPollId)
				{
					$this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_polls_error', (int)$aValue['id_poll']));
					return BX_MIG_FAILED;
				}				
				
				$this -> setMID($iPollId, $aValue['id_poll']);	
			
				$this -> exportAnswers($aValue['poll_results'], $aValue['poll_answers'], $iPollId);				
			}
			
			$iCmts = $this -> transferComments($iPollId, (int)$aValue['id_poll'], 'polls');
			
			$this -> _oDb ->  query("UPDATE `{$this -> _sTableWithTransKey}` 
										SET 
											`comments` = :cmts 
										WHERE `id` = :id", array('id' => $iPollId, 'cmts' => $iCmts));
			
			$this -> _iTransferred++;
			
			$this -> transferTags($aValue['id_poll'], $iPollId, $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['type'], $this -> _oConfig -> _aMigrationModules[$this -> _sModuleName]['keywords']);
        }      	


        // set as finished;
        $this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_polls_finished', $this -> _iTransferred));
        return BX_MIG_SUCCESSFUL;
    }
	
	protected function transferCategory($sCategory, $sPrefix = 'bx_polls', $sPreValueCateg = 'bx_polls_cats', $iValue = 0, $sData = '')
	{
		return parent::transferCategory($sCategory, $sPrefix, $sPreValueCateg);
	}
	
	private function exportAnswers($sResults, $sQuestions, $iPollId)
    {
		$aResults = preg_split('/[;]/', $sResults, -1, PREG_SPLIT_NO_EMPTY);
		$aQuestions = preg_split('/<delim>/', $sQuestions, -1, PREG_SPLIT_NO_EMPTY);
		if (empty($aQuestions))
			return false;

		$aObjects = array();
		foreach($aQuestions as $iKey => $sQ)
		{
			$sQuery =  $this -> _oDb -> prepare("
						INSERT INTO
							`bx_polls_subentries`
						SET
						   `entry_id`	= ?,
						   `title`  	= ?,
						   `rate`	    = ?,
						   `votes`	    = ?,
						   `order`	    = ?
						", $iPollId, $sQ, (int)($aResults[$iKey] != 0), $aResults[$iKey], $iKey);
			
			$this -> _oDb -> query($sQuery);
			$aObjects[$this -> _oDb -> lastId()] = $aResults[$iKey];
		}
		
		foreach($aObjects as $iKey => $iValue)
		{
			$sQuery =  $this -> _oDb -> prepare("
						INSERT INTO
							`bx_polls_votes_subentries`
						SET
						   `object_id`	= ?,
						   `count`  	= ?,
						   `sum`	    = ?
			", $iKey, $iValue, $iValue);
				
			$this -> _oDb -> query($sQuery);
		}
		
		return true;
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
				BxDolService::call('bx_polls', 'delete_entity', array($aValue['id']));
				$iNumber++;
			}
		}

		parent::removeContent();		
		return $iNumber;
	}
}

/** @} */
