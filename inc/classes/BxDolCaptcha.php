<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * CAPTCHA objects.
 *
 * Default captcha is stored in 'sys_captcha_default' setting option.
 *
 * @section captcha_create Creating the Captcha object:
 *
 *
 * Add record to 'sys_objects_captcha' table:
 *
 * - object: name of the captcha object, in the format: vendor prefix, underscore, module prefix, underscore, internal identifier or nothing; for example: bx_blogs - custom captcha in blogs module.
 * - title: captcha title.
 * - override_class_name: user defined class name which is derived from one of base captcha classes.
 * - override_class_file: the location of the user defined class, leave it empty if class is located in system folders.
 *
 *
 * @section example Example of usage
 *
 * Display captcha:
 *
 * @code
 *  $oCaptcha = BxDolCaptcha::getObjectInstance(); // get default captcha object instance
 *  if ($oCaptcha) // check if captcha is available for using
 *      echo $oCaptcha->display (); // output HTML which will automatically show captcha
 * @endcode
 *
 * Check captcha:
 *
 * @code
 *  $oCaptcha = BxDolCaptcha::getObjectInstance(); // get default captcha object instance
 *  if ($oCaptcha && $oCaptcha->check ()) // check if captcha is correct
 *      echo 'captcha is OK';
 *  else
 *      echo 'captcha is incorrect'; //
 * @endcode
 */
class BxDolCaptcha extends BxDolFactory implements iBxDolFactoryObject
{
    protected $_sObject;
    protected $_aObject;

    protected $_sKeyPublic;
    protected $_sKeyPrivate;

    protected $_oTemplate;

    protected $_error;

    /**
     * Constructor
     * @param $aObject array of captcha options
     */
    protected function __construct($aObject, $oTemplate)
    {
        parent::__construct();

        $this->_sObject = $aObject['object'];
        $this->_aObject = $aObject;
        
        $this->_sKeyPublic = getParam('sys_recaptcha_key_public');
        $this->_sKeyPrivate = getParam('sys_recaptcha_key_private');
        
        if ($oTemplate)
            $this->_oTemplate = $oTemplate;
        else
            $this->_oTemplate = BxDolTemplate::getInstance();
    }

    /**
     * Get captcha object instance by object name
     * @param $sObject object name
     * @return object instance or false on error
     */
    static public function getObjectInstance($sObject = false)
    {
        if (!$sObject)
            $sObject = getParam('sys_captcha_default');

        if (isset($GLOBALS['bxDolClasses']['BxDolCaptcha!'.$sObject]))
            return $GLOBALS['bxDolClasses']['BxDolCaptcha!'.$sObject];

        $aObject = BxDolCaptchaQuery::getCaptchaObject($sObject);
        
        if (!$aObject || !is_array($aObject))
            return false;

        if (empty($aObject['override_class_name']))
            return false;

        $sClass = $aObject['override_class_name'];
        if (!empty($aObject['override_class_file']))
            require_once(BX_DIRECTORY_PATH_ROOT . $aObject['override_class_file']);

        $o = new $sClass($aObject);
        if (!$o->isAvailable())
            return false;

        return ($GLOBALS['bxDolClasses']['BxDolCaptcha!'.$sObject] = $o);
    }

    /**
     * Display captcha.
     * @param $bDynamicMode - is AJAX mode or not, if true then HTML code with captcha is loaded dynamically.
     */
    public function display ($bDynamicMode = false)
    {
        // override this function in particular class
    }

    /**
     * Check captcha.
     */
    public function check ()
    {
        // override this function in particular class
    }

    /**
     * Return text entered by user
     */
    public function getUserResponse ()
    {
        // override this function in particular class
    }

    /**
     * Check if captcha is available, like all API keys are specified.
     */
    public function isAvailable ()
    {
        return !empty($this->_sKeyPublic) && !empty($this->_sKeyPrivate);
    }
}

/** @} */
