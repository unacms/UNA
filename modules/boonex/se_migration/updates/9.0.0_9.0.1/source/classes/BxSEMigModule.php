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

require_once('BxSEDb.php'); 
if ( function_exists('ini_set')) {
    ini_set('max_execution_time', 0);
}
	
define('_ENGINE', 1); //defined to allow including Social Engine config file 

class BxSEMigModule extends BxBaseModGeneralModule
{
    protected $_oSEDb = null;			
	public function __construct(&$aModule){
        parent::__construct($aModule);       
    }		
	
	public function actionStartTransfer($aModules){
		if (!isAdmin()){
			echo json_encode(array('code' => 2, 'message' => _t('_Access denied')));
			exit;
		}

		if (empty($aModules)){
			echo json_encode(array('code' => 1, 'message' => _t('_bx_se_migration_successfully_finished')));
			exit;
		}
		
		$this -> initSEDb();		
		header('Content-Type:text/javascript');	
		
		
		foreach($aModules as $iKey => $sModule){
            if( $sModule && !empty(($this -> _oConfig -> _aMigrationModules[$sModule]))) {
				
				$sTransferred = $this -> _oDb -> getTransferStatus($sModule);	
				if ($sTransferred == 'finished') continue;
		             
				if(is_array($this -> _oConfig -> _aMigrationModules[$sModule]['dependencies'])) {
						foreach($this -> _oConfig -> _aMigrationModules[$sModule]['dependencies'] as $iKey => $sDependenciesModule)
	                    {
	                        $sTransferred = $this -> _oDb -> getTransferStatus($sDependenciesModule);							
	                        if( $sTransferred != 'finished')
								return _t('_bx_se_migration_install_before', _t("_bx_se_migration_data_{$sDependenciesModule}"));
	                   }					   
	             }
				 
				 if(is_array($this -> _oConfig -> _aMigrationModules[$sModule]['plugins'])) {
						$sPlugins = '';
						foreach($this -> _oConfig -> _aMigrationModules[$sModule]['plugins'] as $sKey => $sTitle){
	                        if (!$this -> _oDb -> isPluginInstalled($sKey)) 	                                      								
								$sPlugins .= $sTitle . ', ';								
	                    }
						
						if ($sPlugins)
							return _t('_bx_se_migration_install_plugin', trim($sPlugins, ', '), $sModule);														
	             }		 
				 
					
                // create new module's instance;
				require_once($this -> _oConfig -> _aMigrationModules[$sModule]['migration_class'] . '.php');
				$this -> sProcessedModule = $sModule;
		
				// set as started;
                $this -> _oDb -> updateTransferStatus($sModule, 'started');
				
                 // create new migration instance;
                $oModule = new $this -> _oConfig -> _aMigrationModules[$sModule]['migration_class']($this, $this -> _oSEDb);
                if($oModule -> runMigration()) 
	                $this -> _oDb -> updateTransferStatus($sModule, 'finished');                
                else {                    
                    $this -> _oDb -> updateTransferStatus($sModule, 'error');
					return _t('_bx_se_migration_successfully_failed');					
                }
            }		
	     }
		
		return _t('_bx_se_migration_successfully_finished');	
	}
	
	/** 
	* Creates Migration Info before to start with number of records
	* @param ref $oSEDb social engine database connect
	*/
	public function createMigration(){
		if (is_null($this -> _oSEDb)) $this -> initSEDb();
		
		foreach ($this -> _oConfig -> _aMigrationModules as $sName => $aModule){			
			if ($this -> _oSEDb -> isTableExists($this -> _oConfig -> getEngineVersionPrefix() . $aModule['table_name'])){
				
				//Create transferring class object
				require_once($aModule['migration_class'] . '.php');			
				$oObject = new $aModule['migration_class']($this, $this -> _oSEDb);			
				
				if ($iNumber = $oObject -> getTotalRecords()) 
							$this -> _oDb -> addToTransferList($sName, $iNumber);		
			}	
		}
		
		//Get Social Engine Secret Salt
		$sSecret = $this -> _oSEDb -> getSEParam( $this -> _oConfig -> getEngineVersionPrefix() . "core_settings", 'core.secret');
		if ($sSecret) $this -> _oDb -> setParam('se_migration_salt', $sSecret);
	}
	
	/** 
	* Inits connect with Social Engine database
	* @return Boolean
	*/	
	public function initSEDb(){
		$aConfig = array(
                'host'    => $this -> _oDb -> getExtraParam('host'),
                'user'	  => $this -> _oDb -> getExtraParam('username'),
            	'pwd'     => $this -> _oDb -> getExtraParam('password'),
                'name' 	  => $this -> _oDb -> getExtraParam('dbname'),
				'charset' => $this -> _oDb -> getExtraParam('charset'),				
				'port'    => '',
				'sock'	  => ''	
			);
					
		$this -> _oSEDb = new BxSEDb($aConfig);		
		return $this -> _oSEDb	-> connect(); 
	}

    public function serviceGetSafeServices()
    {
        return array ();
    }

	/** 
	 * Returns Password Ecnrypted by Seocial Engine Rules
	 * @param object	
	 */	
	public function serviceSocialEngineResponse($oAlert){
		// if imported member tries to login set new hash for password
		if ($oAlert -> sAction == 'encrypt_password_after' && isset($oAlert -> aExtras['info']['se_id']) && (int)$oAlert -> aExtras['info']['se_id']){
			$oAlert -> aExtras['password'] = $this -> _oDb -> encryptPassword($oAlert -> aExtras['pwd'], $oAlert -> aExtras['info']['salt']);
		}		
		else if (isset($oAlert -> aExtras['action']) && $oAlert -> aExtras['action'] == 'forgot_password'){
		// set 0 for se_id - it means now member's password is encrypted using standard algorithm
			$this -> _oDb -> updateSEId($oAlert -> iObject);
		}				
	}
}

/** @} */
