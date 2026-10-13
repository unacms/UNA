<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup	Messenger Messenger
 * @ingroup		UnaModules
 *
 * @{
 */

/**
 * Storage messenger module
 */

class BxMessengerStorage extends BxDolStorage
{	
	function __construct($sObject)
	{
		$aObject = BxDolStorageQuery::getStorageObject($sObject);
		parent::__construct($aObject);
	}
	
	public function isValidFileExt($sFileName){
		$sExt = $this -> getFileExt($sFileName);
        return $this -> isValidExt($sExt);
	}
	
	public function isImageFile($sMimeType){
		 $aImagesMimeTypes = array (
										'image/bmp' => 'bmp',
										'image/gif' => 'gif',
										'image/jpeg' => 'jpg',
										'image/pjpeg' => 'jpg',
										'image/png' => 'png'
									);
		return isset($aImagesMimeTypes[$sMimeType]);
	}	
	
	public function isImageExt($sFileName){
		$aImagesExts = array('bmp', 'gif', 'jpg', 'png');
		$sExt = $this -> getFileExt($sFileName);
		return in_array($sExt, $aImagesExts);
	}

	public function getRestrictedExt(){
	    $sExts = $this->_aObject['ext_deny'];
	    return $sExts ? explode(',', $sExts) : array();
    }
}

/** @} */
