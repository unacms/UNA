<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Cover.
 *
 * It displays cover area for different pages, usually it have background image, text and some buttons on it.
 *
 * @section example Example of usage
 *
 * Setting cover:
 *
 * @code
 *  $oCover = BxDolCover::getInstance(); // get object instance
 *  if ($oCover) // check if Cover is available for using
 *      $oCover->set (array( // set cover with default template
 *          'title' => 'Hello World!',
 *      )); 
 * @endcode
 *
 */
class BxDolCover extends BxDolFactory implements iBxDolSingleton
{
    protected $_aOptions = array();
    protected $_sTemplateName = 'cover.html';
    protected $_sTemplateNameEmpty = 'cover_empty.html';
    protected $_sCoverImageUrl = false;
    protected $_aOptiondDefault = array();

    protected function __construct()
    {
        if (isset($GLOBALS['bxDolClasses']['BxDolCover']))
            trigger_error ('Multiple instances are not allowed for the BxDolCover class.', E_USER_ERROR);

        parent::__construct();

        $this->_aOptiondDefault = array(
            'class' => '',
            'title' => '',
            'actions' => '',
            'bx_if:image' => array (
                'condition' => false,
                'content' => array(),
            ),
            'bx_if:icon' => array (
                'condition' => false,
                'content' => array(),
            ),
            'bx_if:bg' => array (
                'condition' => false,
                'content' => array(),
            ),
            'bx_if:logged_in' => array(
                'condition' => isLogged(),
                'content' => array(),
            ),
        );
    }

    /**
     * Prevent cloning the instance
     */
    public function __clone()
    {
        if (isset($GLOBALS['bxDolClasses']['BxDolCover']))
            trigger_error('Clone is not allowed for the BxDolCover class.', E_USER_ERROR);
    }

    /**
     * Get Cover object instance
     * @return object instance or false on error
     */
    public static function getInstance($oTemplate = false)
    {
        if (isset($GLOBALS['bxDolClasses']['BxDolCover']))
            return $GLOBALS['bxDolClasses']['BxDolCover'];

        $o = new BxTemplCover($oTemplate);

        return ($GLOBALS['bxDolClasses']['BxDolCover'] = $o);
    }

    /**
     * Get cover image URL by descriptive array. 
     * @param mixed $mixedImage - image descriptive array.
     * @return string with image URL or false on error. 
     */
    public static function getCoverImageUrl($mixedImage)
    {
        $bObject = !empty($mixedImage['object']);
        $bTranscoder = !empty($mixedImage['transcoder']);
        if(!is_array($mixedImage) || !isset($mixedImage['id']) || (!$bObject && !$bTranscoder))
            return false;

        if($bObject)
            $o = BxDolStorage::getObjectInstance($mixedImage['object']);
        else if($bTranscoder)
            $o = BxDolTranscoder::getObjectInstance($mixedImage['transcoder']);

        if(!$o)
            return false;

        return $o->getFileUrlById($mixedImage['id']);
    }

    /**
     * The art page covers show without a picture, which Studio > Designer > Cover previews as the default and the apps
     * get with the home cover: a template's own art (its data/template/system/images/cover-default.svg, with
     * cover-default-dark.svg for dark mode, as Artificer has), else the base template's images/cover.svg. An upload in
     * Studio > Designer > Cover (sys_site_cover_common), or the page's own cover picture, wins over it.
     * @param array $aTemplateModule the template's module (its `path`), [] for the base template
     * @return array [light URL, dark URL]; the dark one is empty when the art has none
     */
    public static function getDefaultArt($aTemplateModule = [])
    {
        $sPath = !empty($aTemplateModule['path']) ? $aTemplateModule['path'] . 'data/template/system/images/' : '';
        $fTemplateFile = function($sFile) use ($sPath) {
            return $sPath !== '' && file_exists(BX_DIRECTORY_PATH_MODULES . $sPath . $sFile) ? BX_DOL_URL_MODULES . $sPath . $sFile : '';
        };

        $sLight = $fTemplateFile('cover-default.svg');
        if($sLight !== '') {
            return [$sLight, $fTemplateFile('cover-default-dark.svg')];
        }

        $sBase = file_exists(BX_DIRECTORY_PATH_ROOT . 'template/images/cover.svg') ? BX_DOL_URL_ROOT . 'template/images/cover.svg' : '';
        return [$sBase, ''];
    }

    /**
     * Determine whether cover is enabled globally or not.
     */
    public function isEnabled()
    {
        return getParam('sys_site_cover_disabled') != 'on';
    }

    /**
     * Determine whether cover is already set for the page or not.  
     */
    public function isCover()
    {
    	return !empty($this->_sCoverImageUrl) || !empty($this->_aOptions);
    }

    /**
     * Set custom cover options
     * @param $aOptions - cover options, default template supports the following: title. For more info @see template/cover.html
     * @param $sTemplateName - optional template name
     */
    public function set ($aOptions, $sTemplateName = false)
    {
        $this->_aOptions = $aOptions;
        if (false !== $sTemplateName)
            $this->_sTemplateName = $sTemplateName;

         /**
         * @hooks
         * @hookdef hook-system-set_cover 'system', 'set_cover' - hook in set cover 
         * - $unit_name - equals `account`
         * - $action - equals `set_cover` 
         * - $object_id - not used
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `options` - [array] by ref, cover options, default template supports the following: title, can be overridden in hook processing
         *      - `override_result` - [string] by ref, template name, can be overridden in hook processing
         *      - `cover` - [object] object cover
         * @hook @ref hook-system-set_cover
         */
        bx_alert('system', 'set_cover', 0, false, array(
            'options' => &$this->_aOptions, 
            'template_name' => &$this->_sTemplateName, 

            'options_ref' => &$this->_aOptions, 
            'template_name_ref' => &$this->_sTemplateName, 

            'cover' => $this
        ));
    }

    /**
     * Set cover image url for default cover template
     * @param $mixedCoverImageUrl - cover image url, or array with file id and storage or transcoder object:
     * @code
     *   array('id' => 12, 'object' => 'sample');
     *   // or 
     *   array('id' => 21, 'transcoder' => 'sample');
     * @endcode
     */
    public function setCoverImageUrl ($mixedCoverImage)
    {
        if (is_string($mixedCoverImage))
            $this->_sCoverImageUrl = $mixedCoverImage;
        else
            $this->_sCoverImageUrl = self::getCoverImageUrl($mixedCoverImage);

        if(!$this->_sCoverImageUrl)
            return false;

        /**
         * @hooks
         * @hookdef hook-system-set_cover 'system', 'set_cover_image' - hook on cover image
         * - $unit_name - equals `system`
         * - $action - equals `set_cover_image` 
         * - $object_id - not used
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `cover_image` - [string] by ref, cover image url, or array with file id and storage or transcoder object, can be overridden in hook processing
         *      - `cover` - [object] object cover
         * @hook @ref hook-system-set_cover_image
         */
        bx_alert('system', 'set_cover_image', 0, false, array(
            'cover_image' => &$this->_sCoverImageUrl,
            'cover_image_ref' => &$this->_sCoverImageUrl, 
            'cover' => $this
        ));

        return true;
    }

    /**
     * Set cover area class
     */
    public function setCoverClass ($sClass)
    {
        $this->_aOptiondDefault['class'] = $sClass;
    }
}

/** @} */
