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

bx_import('BxDolDb');

class BxSEMigDb extends BxBaseModGeneralDb
{	
	public function __construct(&$oConfig)
	{
		parent::__construct($oConfig);			
	}

	/** 
	* Saving Social Engine config info
	* @param array $aConfig parameters
	*/ 
	public function saveConfig($aConfig){
		if( is_array($aConfig) ) {
            
			$bRecords = false;
			foreach($aConfig as $sName => $mValue)
            {
                $mValue = bx_process_input($mValue);
                $sName  = bx_process_input($sName);
				$sQuery = $this -> prepare("REPLACE INTO `{$this -> _sPrefix}config` SET `name` = ?, `value` = ?", $sName, $mValue);
				if ($this -> res($sQuery)) $bRecords = true;
            }			
      }
	} 
	
	/** 
	* Get Social Engine config parameter
	* @param string $sConfigName param's name 
	* @return string 
	*/
	public function getExtraParam($sConfigName){ 
		$sQuery = $this -> prepare("SELECT `value` FROM `{$this -> _sPrefix}config` WHERE `name` = ?", $sConfigName);
		return $this -> getOne($sQuery);
	}

	/** 
	* Create migration list
	* @param array $aConfig social engine config info 
	*/	
	public function createConfig($aConfig){
        if( is_array($aConfig) ) {
            foreach($aConfig as $sName => $mValue)
            {
                $mValue = $this -> escape($mValue);
                $sName  = $this -> escape($sName);

                // create new;
                if( !$this -> getExtraParam($sName) ) {
                    $sQuery = $this -> prepare("INSERT INTO `{$this -> _sPrefix}config` SET `name` = ?, `value` = ?", $sName, $mValue);
                    $this -> query($sQuery);
                }
                else {
                // update exsisting;
                    $sQuery = $this -> prepare("UPDATE `{$this -> _sPrefix}config` SET  `value` = ? WHERE `name` = ?", $mValue, $sName);					
                    $this -> query($sQuery);
                }
            }
        }
	}
	
	/** 
	* Returns Migration Result information
	* @param string $sModule name
	* @return  string
	*/
	public function getTransferStatusText($sModule)
    {
        $sQuery = $this -> prepare("SELECT `status_text` FROM `{$this -> _sPrefix}transfers` WHERE `module` = ? LIMIT 1", $sModule);
        return $this -> getOne($sQuery);
    }

	/** 
	* Returns current migration status
	* @param string $sModule name
	* @return  string
	*/
	 public function getTransferStatus($sModule)
	 {
	     $sQuery = $this -> prepare("SELECT `status` FROM `{$this -> _sPrefix}transfers` WHERE `module` = ? LIMIT 1", $sModule);
	     return $this -> getOne($sQuery);
	 }

	 public function updateTransferStatus($sModule, $sStatus){            
	     $this -> query("UPDATE `{$this -> _sPrefix}transfers` SET `status` = :status WHERE `module` = :module", array('module' => $sModule, 'status' => $sStatus));
	 }

	/** 
	* Check if social engine configuration exists
	* @return  Boolean
	*/
	 public function isConfigInstalled(){
		return $this -> getExtraParam('dbname') && $this -> getExtraParam('username');
	 }
	
	/** 
	* Adds module for migration to migration list
	* @param string $sName modules name
	* @param int $iNumber records number
	* @return mixed 
	*/		
	public function addToTransferList($sName, $iNumber){
		return $this -> query("REPLACE INTO `{$this -> _sPrefix}transfers` SET `module` = :module, `status` = 'not_started', `number` = :number", array('module' => $sName, 'number' => $iNumber));	
	}		

	public function getTransfers(){
		return $this -> getAll("SELECT * FROM `{$this -> _sPrefix}transfers` ORDER BY `id`");
	}

	/** 
	* Check whether requiered Una plugin installed for transferring
	* @param string $sName pugin name
	* @return Boolean
	*/			
	public function isPluginInstalled($sName){
		$sQuery = $this -> prepare("SELECT COUNT(*) FROM `sys_modules` WHERE `type` = 'module' AND `name` = ? LIMIT 1" , $sName);
		return (int)$this -> getOne($sQuery) == 1;
	}
	
	public function encryptPassword($sPwd, $sSalt){
		return md5($this -> getParam('se_migration_salt') . $sPwd. $sSalt);
   }
   
	public function updateSEId($iAccountId, $iVal = 0){
		$sQuery = $this -> prepare("UPDATE `sys_accounts` SET `se_id` = ? WHERE `id` = ?", (int)$iVal, (int)$iAccountId);
		return $this -> query($sQuery);
	}	   
}

/** @} */
