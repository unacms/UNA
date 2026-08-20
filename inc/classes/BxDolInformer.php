<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

define('BX_INFORMER_ALERT', 1);
define('BX_INFORMER_INFO', 2);
define('BX_INFORMER_ERROR', 3);

/**
 * Informer.
 *
 * It displays alerts or information messages in clearly visible area on the page to let user know important information.
 *
 * @section example Example of usage
 *
 * Adding message to informer:
 *
 * @code
 *  $oInformer = BxDolInformer::getInstance(); // get object instance
 *  if ($oInformer) // check if Informer is available for using
 *      echo $oInformer->add ('my_id', 'Some important information here', BX_INFORMER_ALERT); // add an alert message
 * @endcode
 *
 */
class BxDolInformer extends BxDolFactory implements iBxDolSingleton
{
    protected $_bEnabled = true;
    protected $_aMessages = array();

    /**
     * Constructor
     */
    protected function __construct()
    {
        if (isset($GLOBALS['bxDolClasses']['BxDolInformer']))
            trigger_error ('Multiple instances are not allowed for the BxDolInformer class.', E_USER_ERROR);

        parent::__construct();

        $this->_addPermanentMessages();
    }

    /**
     * Prevent cloning the instance
     */
    public function __clone()
    {
        if (isset($GLOBALS['bxDolClasses']['BxDolInformer']))
            trigger_error('Clone is not allowed for the BxDolInformer class.', E_USER_ERROR);
    }

    /**
     * Get Informer object instance
     * @return object instance or false on error
     */
    public static function getInstance($oTemplate = false)
    {
        if (isset($GLOBALS['bxDolClasses']['BxDolInformer']))
            return $GLOBALS['bxDolClasses']['BxDolInformer'];

        $o = new BxTemplInformer($oTemplate);

        return ($GLOBALS['bxDolClasses']['BxDolInformer'] = $o);
    }

    public function setEnabled($bEnabled)
    {
    	$this->_bEnabled = $bEnabled;
    }

    /**
     * Add message to informer.
     * @param $sId - message id
     * @param $sMsg - message text
     * @param $iType - message type: BX_INFORMER_ALERT, BX_INFORMER_INFO or BX_INFORMER_ERROR
     * @param $aExtras - optional extras:
     *      - `icon` - [string] indicator icon name, e.g. `plus` (uses the type icon when empty)
     *      - `action_url` - [string] trailing action link
     *      - `action_title` - [string] trailing action label
     */
    public function add ($sId, $sMsg, $iType = BX_INFORMER_INFO, $aExtras = [])
    {
        if(!$this->_bEnabled)
            return;

        if (!is_array($aExtras))
            $aExtras = [];

        $this->_addJsCss();
        $this->_aMessages[$sId] = [
            'id' => $sId,
            'msg' => $sMsg,
            'type' => $iType,
            'icon' => isset($aExtras['icon']) ? $aExtras['icon'] : '',
            'action_url' => isset($aExtras['action_url']) ? $aExtras['action_url'] : '',
            'action_title' => isset($aExtras['action_title']) ? $aExtras['action_title'] : '',
        ];
    }

    /**
     * Remove message from informer.
     * @param $sId - message id
     */
    public function remove ($sId)
    {
        unset($this->_aMessages[$sId]);
    }
    
    /**
     * Get message from informer.
     * @param $sId - message id
     */
    public function get ($sId)
    {
        return $this->_aMessages[$sId];
    }

    /**
     * Add permanent messages which are displayed on every page.
     */
    protected function _addPermanentMessages ()
    {
        // add account & profile related permament messages
        if (isLogged()) {
            $oAccount = BxDolAccount::getInstance();
            if ($oAccount)
                $oAccount->addInformerPermanentMessages($this);
                
            $oProfile = BxDolProfile::getInstance();
            if ($oProfile)
                $oProfile->addInformerPermanentMessages($this);
        }

        /**
         * @hooks
         * @hookdef hook-system-informer_permament_messages 'system', 'informer_permament_messages' - hook on informer
         * - $unit_name - equals `system`
         * - $action - equals `informer_permament_messages` 
         * - $object_id - label id 
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `informer` - [object] object with informer
         * @hook @ref hook-system-informer_permament_messages
         */
        bx_alert('system', 'informer_permament_messages', 0, false, array('informer' => $this));
    }

}

/** @} */
