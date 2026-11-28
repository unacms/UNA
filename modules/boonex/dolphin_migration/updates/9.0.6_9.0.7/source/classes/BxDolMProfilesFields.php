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
bx_import('BxDolStudioLanguagesUtils');

class BxDolMProfilesFields extends BxDolMData
{
	/**
	 *  @var  $_aProfileFields profile fields for transfer
	 */
	private $_aProfileFields = array();
	
	/**
	 *  @var array $_aFiltered exclude listed fields from migration list
	 */
	private $_aFiltered = array(
									'ID', 'NickName', 'Email', 'Password', 
									'Role', 'LangID', 'DateLastNav', 'DateReg', 
									'DateLastEdit', 'DateLastLogin', 'Sex', 
									'DateOfBirth', 'EmailNotify', 'Avatar', 'allow_view_to', 
									'Featured', 'DescriptionMe', 'FullName'
								);
	/**
	 *  @var  $_oAssocFields list of the fields from Dolphin
	 */	
	private $_oAssocFields = null;

    public function __construct($oMigrationModule, &$mDb)
    {
        parent::__construct($oMigrationModule, $mDb);
		$this -> _sModuleName = 'profile_fields';
		$this -> _sTableWithTransKey = 'sys_form_inputs';	
    }

	public function getTotalRecords()
	{
		$this -> _oAssocFields =  $this -> getAssocFields();
		foreach($this -> _oAssocFields as $sKey => $aValue)
		{
			if (in_array($aValue['name'], $this -> _aFiltered) || (!$aValue['add'] && !$aValue['edit'] && !$aValue['view'])) 
				continue;
			
			$this -> _aProfileFields[$aValue['name']] = array(
		           'name' => $aValue['name'],
				   'type' => $this -> getConvertToUnaType($aValue['type']),
		           'caption' => $this -> getLKeyTranslations($aValue['title']),
				   'required' => $aValue['required'],
				   'add' =>  $aValue['add'],
				   'edit' =>  $aValue['edit'],
				   'view' =>  $aValue['view'],
				   'values' => $this -> getFieldValues($sKey)
		       );
		}
		
		return sizeof($this -> _aProfileFields);
	}
	
	/**
	 *  Convert Dolphin's fields types to UNA format
	 *  
	 *  @param int $sType Dolphin's field
	 *  @return array
	 */
	private function getConvertToUnaType($sType)
	{
		$aM2UNATypes = array(
			'text' => array(
				'type' => 'text',
				'db_pass' => 'Xss',
				'sql' => "varchar(255) default ''",
			),
			'system' => array(
				'type' => 'text',
				'db_pass' => 'Xss',
				'sql' => "varchar(255) default ''",
			),
			'html_area' => array(
				'type' => 'textarea',
				'db_pass' => 'XssMultiline',
				'sql' => "text default ''",
			),
			'area' => array(
				'type' => 'textarea',
				'db_pass' => 'XssMultiline',
				'sql' => "text default ''",
			),
			'select_one' =>  array(
				'type' => 'select',
				'db_pass' => 'Xss',
				'sql' => "varchar(255) default NULL",
			),
			'date' => array(
				'type' => 'date',
				'db_pass' => 'Date',
				'sql' => "date default NULL",
			),
			'num' => array(
				'type' => 'text',
				'db_pass' => 'Int',
				'sql' => "int(10) default NULL",
			),
			'bool' =>  array(
				'type' => 'checkbox',
				'db_pass' => 'Xss',
				'sql' => "varchar(255) default NULL",
			),
			'select_set' => array(
				'type' => 'checkbox_set',
				'db_pass' => 'Set',
				'sql' => "bigint(20) default NULL",
			),
			'pass' =>  array(
				'type' => 'password',
				'sql' => "varchar(40) default NULL",
			),
			'range' => array(
				'type' => 'doublerange',
				'db_pass' => 'Xss',
				'sql' => "varchar(255) default NULL",
			)
		);

		return $aM2UNATypes[$sType] ? $aM2UNATypes[$sType] : $aM2UNATypes['text']; 
	}
		
	public function runMigration()
	{		 
		if (!$this -> getTotalRecords())
		{
			$this -> setResultStatus(_t('_bx_dolphin_migration_no_data_to_transfer'));
	        return BX_MIG_SUCCESSFUL;			  
		}	 
		
		$this -> createMIdField();		
		$this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_profile_fields'));		
		$i = 0;

    	foreach($this -> _aProfileFields as $sKey => $aItem)
		{
			if (!$this -> _oDb -> isFieldExists('bx_persons_data', $sKey))
			{
			    if (!$this -> _oDb -> query("ALTER TABLE `bx_persons_data` ADD `{$sKey}` {$aItem['type']['sql']}")){
						 $this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_profile_field_can_not_be_transferred'));
						 return BX_MIG_FAILED;
				   }			   
			}
			  
			//continue;
			if ($this -> isFieldTransferred($sKey))
				continue;
			   
			$iKeyID = time() + $i++; // unique language keys postfix
			$sQuery = $this -> _oDb -> prepare("
				INSERT INTO `{$this -> _sTableWithTransKey}` SET
					`object`	= 'bx_person', 
					`module`	= 'custom',
					`values`	= ?,
					`name`		= ?,
					`db_pass`	= ?,
					`type`		= ?,
					`required`	= ?,
					`caption_system` = ?,
					`caption`	= ?",
					$this -> transferPreValues($sKey, $aItem['name'], $aItem['values']),
					$sKey,
					$aItem['type']['db_pass'],
					$aItem['type']['type'],
					$aItem['required'],
					'_sys_form_txt_field_caption_system_' . $iKeyID,
					'_sys_form_txt_field_caption_' . $iKeyID
					);
			
			if (!$this -> _oDb -> query($sQuery))
			{
				$this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_profile_field_can_not_be_transferred'));
				return BX_MIG_FAILED;				
			}			   
			
			$iFieldId = $this -> _oDb -> lastId();
			$this -> setMID($iFieldId, $iFieldId);
			
			// create form fields	
			$this -> _oDb -> query($sQuery);
			
			$sQueryDisplay = "INSERT INTO `sys_form_display_inputs` (`id`, `display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES";			
			if ($aItem['view'])
				$sQueryDisplay .= "(NULL, 'bx_person_view', '{$sKey}', 2147483647, 1, 0),";
			
			if ($aItem['add'])
				$sQueryDisplay .= "(NULL, 'bx_person_add', '{$sKey}', 2147483647, 1, 0),";
			
			if ($aItem['edit'])
				$sQueryDisplay .= "(NULL, 'bx_person_edit', '{$sKey}', 2147483647, 1, 0),";
			
			// add display for view and add forms
			$this -> _oDb -> query(trim($sQueryDisplay, ','));
			// add language keys with translations
			
			foreach($this -> _aLanguages as $sLangKey => $sValue)
			{
				$sTitle = isset($aItem['caption'][$sLangKey]) ? $aItem['caption'][$sLangKey] : $sKey;
				$this -> _oLanguage -> addLanguageString('_sys_form_txt_field_caption_system_' . $iKeyID, $sTitle, $this -> _aLanguages[$sLangKey], 0, false);
				$this -> _oLanguage -> addLanguageString('_sys_form_txt_field_caption_' . $iKeyID, $sTitle, $this -> _aLanguages[$sLangKey]);
			}
			
				$this -> _iTransferred++;
		}		
			
		$this -> migrateProfileFieldsInfo(); 
			
		$this -> setResultStatus(_t('_bx_dolphin_migration_started_migration_profile_fields_finished', $this -> _iTransferred));
		return BX_MIG_SUCCESSFUL;
	}

	private function isFieldTransferred($sName)
	{
	    $sQuery = $this -> _oDb -> prepare("SELECT COUNT(*) FROM `sys_form_inputs` WHERE `object` = 'bx_person' AND `module` = 'custom' AND `name` = ?", $sName);
		return (int)$this -> _oDb -> getOne($sQuery) > 0;
	}        
			
	/**
	* Returns Una profile fields list
	* @param int $iProfileId profile ID
	* @return array
	*/ 
	private function getPersonsFieldValues($iProfileId)
	{
		return $this -> _oDb -> getRow("SELECT * FROM `bx_persons_data` WHERE `id` = {$iProfileId} LIMIT 1");			
	}		
	
	/**
	 *  Builds value for multivalues type fields
	 *  
	 *  @param array $aFiled fields params
	 *  @param string $sFiledValue value
	 *  @return int value
	 */
	private function convertValues($aFiled, $sFiledValue)
	{
		$aOriginalFields = $this -> getAssocFields();
		if (!$aOriginalFields[$aFiled['name']]['values'] ||
            ($aOriginalFields[$aFiled['name']]['values'] && substr($aOriginalFields[$aFiled['name']]['values'], 0, 2) != '#!')
               || $aOriginalFields[$aFiled['name']]['type'] !== 'select_set')
			return $sFiledValue;
		
		$aItems = explode(',', $sFiledValue);
		$aPairs = $this -> getPreValuesBy(substr($aOriginalFields[$aFiled['name']]['values'], 2), 'Value', 'Order');
		$iResult = 0;
		foreach($aItems as $iKey => $sValue)
			$iResult += pow(2, (int)$aPairs[$sValue] - 1);			
		
		return $iResult ? $iResult : $sFiledValue;
	}
	
	/**
	* Migrate profile fields values for transferred profiles
	 *  
	 *  @return void
	 */
	private function migrateProfileFieldsInfo()
    {
        $sQuery = "SELECT * FROM `" . $this -> _oConfig -> _aMigrationModules['profiles']['table_name'] . "`";
        $aProfiles = $this -> _mDb -> getAll($sQuery);
		
		foreach($aProfiles as $iKey => $aProfile)
		{
           if (!($iProfileId =  $this -> getContentId($aProfile['ID']))) 
			   continue;
		   	                
			$aValues = array();
			$sNewField = '';
			$aCurrentMembersValues = $this -> getPersonsFieldValues($iProfileId);
	        foreach($this -> _aProfileFields as $sFieldName => $aItem)
			{
				if (!(isset($aProfile[$sFieldName]) && $aProfile[$sFieldName] && empty($aCurrentMembersValues[$sFieldName])))
					continue;
				
				$sNewField .= "`{$aItem['name']}` = :{$aItem['name']},";
				$aValues[$sFieldName] = $this -> convertValues($aItem, $aProfile[$sFieldName]);				
			}
			
			if ($sNewField)
			{
				$sNewField = trim($sNewField, ',');

			    $sQuery = 
				"
					UPDATE
						`bx_persons_data`
					SET
						{$sNewField}
					WHERE
						`id` = {$iProfileId}
				";
				
				$this -> _oDb -> query($sQuery, $aValues);
			}
							
		}	
	}		
	/**
	 *  Builds list for fields lists with translations
	 *  
	 *  @param int $sField fields list's name
	 *  @param boolean $bGetKeyIfExists dont add values if list exists.
	 *  @return mixed array with fields list or pre values key list name
	 */
	public function getFieldValues($sField, $bGetKeyIfExists = true)
	{
		$sValues = $this -> _mDb -> getOne("SELECT `Values` FROM `sys_profile_fields` WHERE `name` = :name", array('name' => $sField));
		if (empty($sValues))
			return '';
		
		$aItems = array();
		if (substr($sValues, 0, 2) == '#!')
		{
			$sKey = substr($sValues, 2);			
			if ($this -> isKeyPreKeyExits($sKey) && $bGetKeyIfExists)
				return $sValues;
			
			$aValues = $this -> getPreValuesBy($sKey, 'Value');
			foreach($aValues as $mixedKey => $sValue) {
				$aItems[$mixedKey] = $this -> getLKeyTranslations($sValue);
                $aItems[$mixedKey] = $aItems[$mixedKey] ? $aItems[$mixedKey] : $sValue;
            }
		}
		else
		{
			$aValues = preg_split('/\r\n|\n|\r/', $sValues);		
			foreach($aValues as $iKey => $sValue)
				$aItems[$sValue] = $this -> getLKeyTranslations("_FieldValues_{$sValue}");
		}

		return $aItems;		
	}
	
	public function removeContent()
	{
		if (!$this -> _oDb -> isTableExists($this -> _sTableWithTransKey) || !$this -> _oDb -> isFieldExists($this -> _sTableWithTransKey, $this -> _sTransferFieldIdent))
			return false;

		$aRecords = $this -> _oDb -> getAll("SELECT  * FROM `sys_form_inputs` WHERE `object` =  'bx_person' AND `{$this -> _sTransferFieldIdent}` != 0");
        $iNumber = 0;
		if (!empty($aRecords))
		{
			foreach($aRecords as $iKey => $aValue)
			{
				$sSql = $this -> _oDb -> prepare("DELETE `td`, `tdi` FROM `sys_form_display_inputs` AS `tdi` LEFT JOIN `sys_form_inputs` AS `td` ON `tdi`.`input_name`=`td`.`name` WHERE `td`.`object`='bx_person' AND `td`.`name` = ?", $aValue['name']);
				if ($this-> _oDb -> query($sSql))
				{
					$oLanguage = BxDolStudioLanguagesUtils::getInstance();
					if(!empty($aValue['caption']))
						$oLanguage->deleteLanguageString($aValue['caption']);
					
					if(!empty($aValue['caption_system']))
						$oLanguage->deleteLanguageString($aValue['caption_system']);
					
					if(!empty($aValue['info']))
						$oLanguage->deleteLanguageString($aValue['info']);
					
					if(!empty($aValue['checker_error']))
						$oLanguage->deleteLanguageString($aValue['checker_error']);

					if ($this -> _oDb -> isFieldExists('bx_persons_data', $aValue['name']))
					    $this -> _oDb -> query("ALTER TABLE `bx_persons_data` DROP `{$aValue['name']}`");

					$iNumber++;
				}
			}
		}

		parent::removeContent();			
		return $iNumber;
	}
}

/** @} */
