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

define('BX_SEMIG_STUDIO_TRANSFER', 'config');

class BxSEMigStudioPage extends BxTemplStudioModule
{    
    protected $MODULE;
    protected $_oModule;	

    function __construct($sModule, $mixedPageName, $sPage = "")
    {
        $this -> MODULE = 'bx_se_migration';
        parent::__construct($sModule, $mixedPageName, $sPage);

        $this -> _oModule = BxDolModule::getInstance($sModule);			

        $this->aMenuItems = array(
            'settings' => array('name' => 'settings', 'icon' => 'cogs', 'title' => '_bx_se_migration_cpt_settings'),
            'config' => array('name' => 'config', 'icon' => 'exchange-alt', 'title' => '_bx_se_migration_cpt_transfer_data'),
        );	

        $this -> _oModule -> _oTemplate -> addStudioJs(array('jquery-ui/jquery-ui.min.js', 'transfer.js', 'BxDolGrid.js'));
        $this -> _oModule -> _oTemplate -> addStudioCss(array('main.css'));	
     } 
	
	public function saveData($sPath){
		$isDbDefined = false;

		if ( substr($sPath, strlen($sPath) - 1 ) != DIRECTORY_SEPARATOR ) {
                $sPath .= DIRECTORY_SEPARATOR;
        }    

			   
	   // get all settings from social engine config file;	   
	  if (file_exists($sPath . 'application' . DIRECTORY_SEPARATOR . 'settings' . DIRECTORY_SEPARATOR . 'database.php')) 
		$aSEConfig = include $sPath . 'application' . DIRECTORY_SEPARATOR . 'settings' . DIRECTORY_SEPARATOR . 'database.php';
	  else 
		return MsgBox( _t('_bx_se_migration_error_config_file_was_not_found'));
		

      if( is_array($aSEConfig['params']) ) {
           foreach($aSEConfig['params'] as $sKey => $sParamName){
                   $aConfig[$sKey] = $sParamName;
                   $isDbDefined = true; 
           }
      }

      // save social engine data and creates migration list
      if($isDbDefined) {
			$aConfig['root'] = $sPath;			
			$this -> _oModule -> _oDb -> saveConfig($aConfig);
			
			if ($this -> _oModule -> initSEDb())
				$this -> _oModule -> createMigration();
			else 	
				return MsgBox( _t('_bx_se_migration_error_data_was_not_set'), 2);
       }
       else
			return MsgBox( _t('_bx_se_migration_error_data_was_not_set'), 2);
              

		return MsgBox( _t('_bx_se_migration_data_was_set'), 2);			
	}
	
	
	public function getConfig(){		
		bx_import('Transfers', 'bx_se_migration');
		
		$sMessage = '';			
		if (bx_get('save') && bx_get('se_migration_location')) 
			$sMessage = $this -> saveData(bx_get('se_migration_location'));		
			
		
		$oGrid = BxDolGrid::getObjectInstance('bx_se_migration_transfers'); 
			if ($oGrid)	
				return $sMessage . $oGrid -> getCode(); // print grid object 
		
        
		return MsgBox(_t('_bx_se_migration_installation_problem'));
	}
}

/** @} */
