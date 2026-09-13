<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolDesigns extends BxDolFactory implements iBxDolSingleton
{
    public static $fLogoAspectRatioDefault = 1.0;
    public static $fMarkAspectRatioDefault = 1.0;

    protected $sDesign;
    protected $oDesign;

    protected $aParams;
    protected $aValues;

    protected $sLogoStorage;
    protected $sLogoTranscoder;

    protected function __construct()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error ('Multiple instances are not allowed for the class: ' . get_class($this), E_USER_ERROR);

        parent::__construct();

        $this->sLogoStorage = 'sys_images_custom';
        $this->sLogoTranscoder = 'sys_custom_images';
    }

    /**
     * Prevent cloning the instance
     */
    public function __clone()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error('Clone is not allowed for the class: ' . get_class($this), E_USER_ERROR);
    }

    /**
     * Get singleton instance of the class
     */
    static function getInstance()
    {
        if(!isset($GLOBALS['bxDolClasses'][__CLASS__])) {
            $GLOBALS['bxDolClasses'][__CLASS__] = new BxDolDesigns();
            $GLOBALS['bxDolClasses'][__CLASS__]->init();
        }

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    protected function init()
    {
    	$this->sDesign = BxDolTemplate::getInstance()->getCode();

    	$aDesign = BxDolModuleQuery::getInstance()->getModuleByUri($this->sDesign);
    	if(!empty($aDesign) && is_array($aDesign))
            $this->oDesign = BxDolModule::getInstance($aDesign['name']);

    	//--- Init site's logo params.
    	if($this->oDesign instanceof BxDolModule && method_exists($this->oDesign->_oConfig, 'getLogoParams')) {
            $this->aParams = $this->oDesign->_oConfig->getLogoParams();

            $this->aValues = $this->oDesign->_oConfig->getLogoValues('logo', $this->getSiteLogoUrl(), $this->getSiteLogoInfo());
            if(isset($this->aParams['logo_dark']))
                $this->aValues += $this->oDesign->_oConfig->getLogoValues('logo_dark', $this->getSiteLogoDarkUrl(), $this->getSiteLogoDarkInfo());

            $this->aValues += $this->oDesign->_oConfig->getLogoValues('mark', $this->getSiteMarkUrl(), $this->getSiteMarkInfo());
            if(isset($this->aParams['mark_dark']))
                $this->aValues += $this->oDesign->_oConfig->getLogoValues('mark_dark', $this->getSiteMarkDarkUrl(), $this->getSiteMarkDarkInfo());
        }
    }

    public static function getAspectRatioDefault($sType)
    {
        return in_array($sType, ['logo', 'logo_dark']) ? self::$fLogoAspectRatioDefault : self::$fMarkAspectRatioDefault;
    }

    public function getSiteLogo()
    {
    	return $this->getSiteLogoParam('logo');
    }
    
    public function getSiteLogoDark()
    {
    	return $this->getSiteLogoParam('logo_dark');
    }

    public function getSiteLogoUrl($iFileId = 0, $bOriginal = true)
    {
        if(!$iFileId && !($iFileId = (int)$this->getSiteLogo()))
            return false;

        if($bOriginal)
            return BxDolStorage::getObjectInstance($this->sLogoStorage)->getFileUrlById($iFileId);

        $aParams = [];
        if(($iLogoWidth = (int)$this->getSiteLogoWidth()) > 0)
            $aParams['x'] = $iLogoWidth;

        if(($iLogoHeight = (int)$this->getSiteLogoHeight()) > 0)
            $aParams['y'] = $iLogoHeight;

        if(!empty($aParams))
            $sFileUrl = BX_DOL_URL_ROOT . bx_append_url_params('image_transcoder.php', array_merge(array('o' => $this->sLogoTranscoder, 'h' => $iFileId), $aParams));
        else 
            $sFileUrl = BxDolTranscoder::getObjectInstance($this->sLogoTranscoder)->getFileUrl($iFileId);

        return !empty($sFileUrl) ? $sFileUrl : false;
    }
    
    public function getSiteLogoDarkUrl($iFileId = 0, $bOriginal = true)
    {
        if(!$iFileId && !($iFileId = (int)$this->getSiteLogoDark()))
            return false;

        return $this->getSiteLogoUrl($iFileId, $bOriginal);
    }

    public function getSiteMark()
    {
    	return $this->getSiteLogoParam('mark');
    }

    public function getSiteMarkDark()
    {
    	return $this->getSiteLogoParam('mark_dark');
    }

    public function getSiteMarkUrl($iFileId = 0, $bOriginal = true)
    {
        if(!$iFileId && !($iFileId = (int)$this->getSiteMark()))
            return false;

        return $this->getSiteLogoUrl($iFileId, $bOriginal);
    }

    public function getSiteMarkDarkUrl($iFileId = 0, $bOriginal = true)
    {
        if(!$iFileId && !($iFileId = (int)$this->getSiteMarkDark()))
            return false;

        return $this->getSiteLogoUrl($iFileId, $bOriginal);
    }

    public function getSiteLogoInfo($iFileId = 0)
    {
        if(!$iFileId && !($iFileId = (int)$this->getSiteLogo())) 
            return false;

        $oStorage = BxDolStorage::getObjectInstance($this->sLogoStorage);

        $aInfo = $oStorage->getFile($iFileId);
        if(!empty($aInfo) && is_array($aInfo))
            $aInfo['local_path'] = $oStorage->getFileLocalPath($aInfo);

        return $aInfo;
    }

    public function getSiteLogoDarkInfo($iFileId = 0)
    {
        if(!$iFileId && !($iFileId = (int)$this->getSiteLogoDark()))
            return false;

        return $this->getSiteLogoInfo($iFileId);
    }

    public function getSiteMarkInfo($iFileId = 0)
    {
        if(!$iFileId && !($iFileId = (int)$this->getSiteMark()))
            return false;

        return $this->getSiteLogoInfo($iFileId);
    }

    public function getSiteMarkDarkInfo($iFileId = 0)
    {
        if(!$iFileId && !($iFileId = (int)$this->getSiteMarkDark()))
            return false;

        return $this->getSiteLogoInfo($iFileId);
    }

    public function getSiteLogoAlt()
    {
    	return $this->getSiteLogoParam('logo_alt');
    }

    public function getSiteLogoWidth()
    {
    	return ($iResult = $this->getSiteLogoValue('logo_width')) !== false ? $iResult : 0;
    }

    public function getSiteLogoDarkWidth()
    {
        return ($iResult = $this->getSiteLogoValue('logo_dark_width')) !== false ? $iResult : 0;
    }

    public function getSiteLogoHeight()
    {
        return ($iResult = $this->getSiteLogoValue('logo_height')) !== false ? $iResult : 0;
    }
    
    public function getSiteLogoDarkHeight()
    {
        return ($iResult = $this->getSiteLogoValue('logo_dark_height')) !== false ? $iResult : 0;
    }

    public function getSiteMarkWidth()
    {
    	return ($iResult = $this->getSiteLogoValue('mark_width')) !== false ? $iResult : 0;
    }

    public function getSiteMarkDarkWidth()
    {
        return ($iResult = $this->getSiteLogoValue('mark_dark_width')) !== false ? $iResult : 0;
    }

    public function getSiteMarkHeight()
    {
        return ($iResult = $this->getSiteLogoValue('mark_height')) !== false ? $iResult : 0;
    }

    public function getSiteMarkDarkHeight()
    {
        return ($iResult = $this->getSiteLogoValue('mark_dark_height')) !== false ? $iResult : 0;
    }

    public function getSiteLogoParam($sName, $bGetSystem = false)
    {
    	if(!empty($this->aParams[$sName]) && !$bGetSystem) {
            $sResult = getParam($this->aParams[$sName]);
            if(!empty($sResult))
                return $sResult;
    	}

    	return getParam('sys_site_' . $sName);
    }

    protected function getSiteLogoValue($sName)
    {
        return isset($this->aValues[$sName]) ? $this->aValues[$sName] : false;
    }
}

/** @} */
