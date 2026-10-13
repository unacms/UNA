<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Messenger Messenger
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Preview's messenger page.
 */
class BxMessengerPageMain extends BxBaseModGeneralPageBrowse
{
	public function __construct($aObject, $oTemplate = false)
	{
		$this->MODULE = 'bx_messenger';
		parent::__construct($aObject, $oTemplate);
	}
	
	public function getCode(){
		if (!isLogged())
			bx_login_form(false, false, BxDolPermalinks::getInstance()->permalink($this->_oModule->_oConfig->CNF['URL_HOME']));
		
		$this->_oModule->_oTemplate-> loadCssJS();
		return parent::getCode();
	}
	
	public function _isAvailablePage($a){
       if (isLogged())
           return true;
       
       return false;
   } 
}

/** @} */