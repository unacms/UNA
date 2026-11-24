<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup   DolphinMigration  Dolphin Migration
 * @ingroup     UnaModules
 *
 * @{
 */

require_once('BxMDb.php'); 
if ( function_exists('ini_set'))
{
    ini_set('max_execution_time', 0);
}
	
class BxDolMModule extends BxBaseModGeneralModule
{
    protected $_oMDb = null;			
	public function __construct(&$aModule){
        parent::__construct($aModule);       
    }		
	
	public function actionPerformAction($sModule, $sAction = 'clean')
	{
		if (!isAdmin())
		{
			echo json_encode(array('code' => 2, 'message' => _t('_Access denied')));
			exit;
		}

		if (!$sModule || !isset($this -> _oConfig -> _aMigrationModules[$sModule]))
		{
			echo json_encode(array('code' => 1, 'message' => _t('_bx_dolphin_migration_nothing_to_remove')));
			exit;
		}
		
		require_once($this -> _oConfig -> _aMigrationModules[$sModule]['migration_class'] . '.php');
        $oModule = new $this -> _oConfig -> _aMigrationModules[$sModule]['migration_class']($this, $this -> _oMDb);
		
		return $sAction == 'clean' ? $oModule -> dropMID() : $oModule -> removeContent();
	}	
	
	public function actionStartTransfer($aModules)
	{
		if (!isAdmin())
		{
			echo json_encode(array('code' => 2, 'message' => _t('_Access denied')));
			exit;
		}

		if (empty($aModules))
		{
			echo json_encode(array('code' => 1, 'message' => _t('_bx_dolphin_migration_successfully_finished')));
			exit;
		}

		$this -> initDb();
		header('Content-Type:text/javascript');			
		
		foreach($aModules as $iKey => $sModule){
            if( $sModule && !empty(($this -> _oConfig -> _aMigrationModules[$sModule])))
			{
				$sTransferred = $this -> _oDb -> getTransferStatus($sModule);	
				if ($sTransferred == 'finished') 
					continue;
		             
				if(isset($this -> _oConfig -> _aMigrationModules[$sModule]['dependencies']) && is_array($this -> _oConfig -> _aMigrationModules[$sModule]['dependencies']))
				{ 
						foreach($this -> _oConfig -> _aMigrationModules[$sModule]['dependencies'] as $iKey => $sDependenciesModule)
	                    {
	                        $sTransferred = $this -> _oDb -> getTransferStatus($sDependenciesModule);							
	                        if( $sTransferred != 'finished')
								return _t('_bx_dolphin_migration_install_before', _t("_bx_dolphin_migration_data_{$sDependenciesModule}"));
						}			   
				}
				 
				if(isset($this -> _oConfig -> _aMigrationModules[$sModule]['plugins']) && is_array($this -> _oConfig -> _aMigrationModules[$sModule]['plugins']))
				{
					$sPlugins = '';
					foreach($this -> _oConfig -> _aMigrationModules[$sModule]['plugins'] as $sKey => $sTitle)
					{
						if (!$this -> _oDb -> isPluginInstalled($sKey)) 	                                      								
							$sPlugins .= $sTitle . ', ';								
					}
						
					if ($sPlugins)
						return _t('_bx_dolphin_migration_install_plugin', trim($sPlugins, ', '), $sModule);														
	            }		 
					
                // create new module's instance;
				require_once($this -> _oConfig -> _aMigrationModules[$sModule]['migration_class'] . '.php');
				// set as started;
                $this -> _oDb -> updateTransferStatus($sModule, 'started');
				
                 // create new migration instance;
                $oModule = new $this -> _oConfig -> _aMigrationModules[$sModule]['migration_class']($this, $this -> _oMDb);
                if($oModule -> runMigration()) 
	                $this -> _oDb -> updateTransferStatus($sModule, 'finished');                
                else
                    $this -> _oDb -> updateTransferStatus($sModule, 'error');
            }
	     }
		
		return _t('_bx_dolphin_migration_successfully_finished');	
	}
	
	/** 
	* Creates date for migration
	*/
	public function createMigration()
	{
		if (is_null($this -> _oMDb)) 
			$this -> initDb();

		$this -> _oDb -> cleanTransfersTable();
		foreach ($this -> _oConfig -> _aMigrationModules as $sName => $aModule)
		{			
			if ($this -> _oMDb -> isTableExists($aModule['table_name']))
			{
				
				//Create transferring class object
				require_once($aModule['migration_class'] . '.php');			
				$oObject = new $aModule['migration_class']($this, $this -> _oMDb);			
				
				if ($mixedNumber = $oObject -> getTotalRecords()) 
						$this -> _oDb -> addToTransferList($sName, $mixedNumber);				
			}	
		}		
	}
	
	/** 
	* Init Dolphin database connect
	* @return mixed
	*/	
	public function initDb()
    {
        $aConfig = array(
            'host' => $this->_oDb->getExtraParam('host'),
            'user' => $this->_oDb->getExtraParam('user'),
            'pwd' => $this->_oDb->getExtraParam('passwd'),
            'name' => $this->_oDb->getExtraParam('db'),
            'port' => $this->_oDb->getExtraParam('port'),
            'sock' => $this->_oDb->getExtraParam('sock'),
        );

        $this->_oMDb = new BxMDb($aConfig);
        return $this->_oMDb->connect();
    }

    public function serviceGetSafeServices()
    {
        return array ();
    }

    public function serviceGetPrivacyGroups(){
        $aPrivacyList = $this -> _oDb -> getPrivacyList();
        $aValues = array();
        foreach($aPrivacyList as $aGroup)
            $aValues[] = array('key' => $aGroup['id'], 'value' => _t($aGroup['title']));

        return $aValues;
    }
}

/** @} */
