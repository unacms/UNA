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
    /**
     * Where a logo image comes from (BxDolDesigns::getLogoSources).
     */
    const LOGO_SOURCE_TEMPLATE = 'template'; // uploaded in the template's own logo settings
    const LOGO_SOURCE_SYSTEM = 'system'; // uploaded in Studio > Designer > Logo
    const LOGO_SOURCE_INLINE = 'inline'; // SVG code, in place of the built-in image
    const LOGO_SOURCE_BUILTIN = 'builtin'; // the image the template ships with
    const LOGO_SOURCE_NONE = 'none'; // nothing: another image stands in, or the site name as text

    public static $fLogoAspectRatioDefault = 1.0;
    public static $fMarkAspectRatioDefault = 1.0;

    /**
     * Built-in images, by logo type, that a template can ship in its images folder.
     */
    public static $aLogoBuiltins = [
        'logo' => 'logo-generic.svg',
        'logo_dark' => 'logo-dark-generic.svg',
        'mark' => 'mark-generic.svg',
        'mark_dark' => 'mark-dark-generic.svg',
    ];

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

        $oTranscoder = BxDolTranscoder::getObjectInstance($this->sLogoTranscoder);
        if(!$oTranscoder)
            return false;

        if(!empty($aParams))
            $sFileUrl = BX_DOL_URL_ROOT . bx_append_url_params('image_transcoder.php', array_merge(array('o' => $this->sLogoTranscoder, 'h' => $iFileId), $aParams, array('s' => $oTranscoder->getHandlerSignature($iFileId))));
        else
            $sFileUrl = $oTranscoder->getFileUrl($iFileId);

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

        return BxDolStorage::getObjectInstance($this->sLogoStorage)->getFile($iFileId);
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

    /**
     * Intrinsic size of a local image file, for the width and height attributes of a logo image:
     * with them the browser reserves the logo's space before the file arrives.
     * An SVG gives its width and height attributes, else its viewBox; other images their pixel size.
     * @param string $sPath absolute file path
     * @return array [width, height] in pixels, [] when it isn't known
     */
    public static function getImageFileSize($sPath)
    {
        static $aCache = [];

        if(!is_string($sPath) || $sPath === '') {
            return [];
        }
        if(!isset($aCache[$sPath])) {
            $aCache[$sPath] = is_file($sPath) && is_readable($sPath) ? static::_readImageFileSize($sPath) : [];
        }

        return $aCache[$sPath];
    }

    protected static function _readImageFileSize($sPath)
    {
        if(!preg_match('/\.svg$/i', $sPath)) {
            $a = @getimagesize($sPath);
            return $a && $a[0] > 0 && $a[1] > 0 ? [(int)$a[0], (int)$a[1]] : [];
        }

        $sHead = (string)file_get_contents($sPath, false, null, 0, 4096);
        if(!preg_match('/<svg\b[^>]*>/i', $sHead, $aMatch)) {
            return [];
        }

        $sTag = $aMatch[0];
        $fWidth = static::_getSvgLength($sTag, 'width');
        $fHeight = static::_getSvgLength($sTag, 'height');
        if((!$fWidth || !$fHeight) && preg_match('/\sviewBox\s*=\s*["\']\s*[-0-9.]+[\s,]+[-0-9.]+[\s,]+([0-9.]+)[\s,]+([0-9.]+)\s*["\']/i', $sTag, $a)) {
            $fWidth = (float)$a[1];
            $fHeight = (float)$a[2];
        }

        return $fWidth > 0 && $fHeight > 0 ? [(int)round($fWidth), (int)round($fHeight)] : [];
    }

    /**
     * An absolute length (unitless or px) of an SVG root tag attribute, 0 for none or a relative one.
     */
    protected static function _getSvgLength($sTag, $sAttr)
    {
        return preg_match('/\s' . $sAttr . '\s*=\s*["\']\s*([0-9]*\.?[0-9]+)\s*(px)?\s*["\']/i', $sTag, $a) ? (float)$a[1] : 0;
    }

    /**
     * Width and height attributes for a logo image shown at the given CSS size.
     * When the CSS sets the height only, the width attribute gives the aspect ratio and the CSS width becomes auto.
     * @param array $aIntrinsic [width, height] from getImageFileSize, or []
     * @param int $iWidth CSS width in pixels, 0 when not set
     * @param int $iHeight CSS height in pixels, 0 when not set
     * @return array ['attrs' => 'width="" height=""' or '', 'style' => extra CSS]
     */
    public static function getLogoSizeAttrs($aIntrinsic, $iWidth, $iHeight)
    {
        if($iWidth > 0 && $iHeight > 0) {
            return ['attrs' => 'width="' . (int)$iWidth . '" height="' . (int)$iHeight . '"', 'style' => ''];
        }

        if(empty($aIntrinsic) || count($aIntrinsic) != 2 || $aIntrinsic[0] <= 0 || $aIntrinsic[1] <= 0) {
            return ['attrs' => '', 'style' => ''];
        }

        $sStyle = '';
        if($iWidth > 0) {
            $sStyle = 'height:auto;';
        }
        elseif($iHeight > 0) {
            $sStyle = 'width:auto;';
        }

        return [
            'attrs' => 'width="' . (int)$aIntrinsic[0] . '" height="' . (int)$aIntrinsic[1] . '"',
            'style' => $sStyle
        ];
    }

    /**
     * Where each logo image of the current template comes from. See getLogoSources.
     * @param callable|null $fBuiltinUrl the URL of a built-in image by its file name, '' when the template has none
     * @return array
     */
    public function getSiteLogoSources($fBuiltinUrl = null)
    {
        return static::getLogoSources(is_array($this->aParams) ? $this->aParams : [], $fBuiltinUrl);
    }

    /**
     * Where each logo image of a template comes from, in the order its header looks for them:
     * 1. the file uploaded in the template's own logo settings,
     * 2. the file uploaded in Studio > Designer > Logo,
     * 3. SVG code (the template's, then Designer's),
     * 4. the template's built-in image.
     * The dark logo and the mark fall back to built-in images only while the logo itself does, and the
     * dark mark only while the mark does, so an upload is never paired with a built-in counterpart.
     *
     * @param array $aTemplateParams the template's logo option names (its config's getLogoParams()), [] for none
     * @param callable|null $fBuiltinUrl the URL of a built-in image by its file name, '' when the template has none
     * @return array by type (logo, logo_dark, mark, mark_dark): ['source' => LOGO_SOURCE_*, 'file_id' => int, 'url' => string, 'code' => string]
     */
    public static function getLogoSources($aTemplateParams, $fBuiltinUrl = null)
    {
        $oStorage = BxDolStorage::getObjectInstance('sys_images_custom');

        $aResult = [];
        foreach(self::$aLogoBuiltins as $sType => $sBuiltin) {
            $aResult[$sType] = ['source' => self::LOGO_SOURCE_NONE, 'file_id' => 0, 'url' => '', 'code' => ''];

            list($sSource, $sValue) = static::getLogoSourceValue($aTemplateParams, $sType);
            $sUrl = $sSource != self::LOGO_SOURCE_NONE ? $oStorage->getFileUrlById((int)$sValue) : '';
            if($sUrl) {
                $aResult[$sType] = ['source' => $sSource, 'file_id' => (int)$sValue, 'url' => $sUrl, 'code' => ''];
                continue;
            }

            // The dark mark follows the mark, everything else the logo.
            $sBase = $sType == 'mark_dark' ? 'mark' : 'logo';
            if($sType != 'logo' && $aResult[$sBase]['source'] != self::LOGO_SOURCE_BUILTIN)
                continue;

            $sUrl = is_callable($fBuiltinUrl) ? (string)call_user_func($fBuiltinUrl, $sBuiltin) : '';
            if($sUrl != '')
                $aResult[$sType] = ['source' => self::LOGO_SOURCE_BUILTIN, 'file_id' => 0, 'url' => $sUrl, 'code' => ''];
        }

        foreach(['logo' => 'logo_dark', 'mark' => 'mark_dark'] as $sType => $sTypeDark)
            static::applyLogoSourceCode($aResult, $aTemplateParams, $sType, $sTypeDark);

        return $aResult;
    }

    /**
     * The value of a logo option: the template's own when it is set, else Designer's (sys_site_*).
     * @return array [LOGO_SOURCE_TEMPLATE | LOGO_SOURCE_SYSTEM | LOGO_SOURCE_NONE, value]
     */
    protected static function getLogoSourceValue($aTemplateParams, $sName)
    {
        if(!empty($aTemplateParams[$sName])) {
            $sValue = getParam($aTemplateParams[$sName]);
            if($sValue != '' && $sValue !== '0')
                return [self::LOGO_SOURCE_TEMPLATE, $sValue];
        }

        $sValue = getParam('sys_site_' . $sName);
        if($sValue != '' && $sValue !== '0')
            return [self::LOGO_SOURCE_SYSTEM, $sValue];

        return [self::LOGO_SOURCE_NONE, ''];
    }

    /**
     * SVG code stands in for an image that is not uploaded (built-in or missing), in both modes,
     * for templates with an SVG code setting of their own.
     */
    protected static function applyLogoSourceCode(&$aResult, $aTemplateParams, $sType, $sTypeDark)
    {
        if(!in_array($aResult[$sType]['source'], [self::LOGO_SOURCE_BUILTIN, self::LOGO_SOURCE_NONE]))
            return;

        if(!empty($aTemplateParams) && !isset($aTemplateParams[$sType . '_inline']))
            return;

        list($sSource, $sCode) = static::getLogoSourceValue($aTemplateParams, $sType . '_inline');
        if($sSource == self::LOGO_SOURCE_NONE)
            return;

        $aResult[$sType] = ['source' => self::LOGO_SOURCE_INLINE, 'file_id' => 0, 'url' => '', 'code' => $sCode, 'code_source' => $sSource];
        $aResult[$sTypeDark] = ['source' => self::LOGO_SOURCE_NONE, 'file_id' => 0, 'url' => '', 'code' => ''];
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

    /**
     * The web app manifest fields set in Studio > Designer > PWA (sys_pwa_manifest_*): for each, the saved value,
     * the default an empty one takes, and the one in use. The manifest, the theme-color meta tag and Studio all read this.
     * @return array name => ['value' => ..., 'default' => ..., 'used' => ...]
     */
    public static function getPwaSettings()
    {
        $sName = trim(getParam('site_title'));
        if($sName === '')
            $sName = parse_url(BX_DOL_URL_ROOT, PHP_URL_HOST);

        $aDefaults = [
            'name' => $sName,
            'short_name' => '', // the app name in use, shortened: set below
            'description' => '',
            'background_color' => '#ffffff',
            'theme_color' => self::getTemplateThemeColor(),
        ];

        $aResult = [];
        foreach($aDefaults as $sKey => $sDefault) {
            if($sKey == 'short_name')
                $sDefault = self::getPwaShortName($aResult['name']['used']);

            $sValue = trim((string)getParam('sys_pwa_manifest_' . $sKey));
            $aResult[$sKey] = ['value' => $sValue, 'default' => $sDefault, 'used' => $sValue !== '' ? $sValue : $sDefault];
        }

        return $aResult;
    }

    /**
     * A name that fits under a home screen icon (about 12 characters): the name itself, its first word, or its start.
     */
    public static function getPwaShortName($sName)
    {
        $iMax = 12;
        if(get_mb_len($sName) <= $iMax)
            return $sName;

        $aWords = preg_split('/\s+/u', $sName);
        if(!empty($aWords[0]) && get_mb_len($aWords[0]) <= $iMax)
            return $aWords[0];

        return get_mb_substr($sName, 0, $iMax);
    }

    /**
     * The theme color the site's template sets in its _header_meta.html, the one browsers use when Designer sets none.
     */
    public static function getTemplateThemeColor()
    {
        $sMeta = BxDolTemplate::getInstance()->getHtml('_header_meta.html');
        if(is_string($sMeta) && preg_match('/name="theme-color"\s+content="(#[0-9a-fA-F]{3,8})"/', $sMeta, $aMatch))
            return strtolower($aMatch[1]);

        return '#ffffff';
    }
}

/** @} */
