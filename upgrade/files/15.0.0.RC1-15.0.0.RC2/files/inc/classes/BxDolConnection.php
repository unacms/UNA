<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Default limit for connections list in Counter.
 */
define('BX_CONNECTIONS_LIST_COUNTER', 5);

/**
 * Default limit for connections lists
 */
define('BX_CONNECTIONS_LIST_LIMIT', 1000);

/**
 * No limit for connections lists. 
 * Is needed for Total Number calculation.
 */
define('BX_CONNECTIONS_LIST_NO_LIMIT', -1);

/**
 * Connections order: no order
 */
define('BX_CONNECTIONS_ORDER_NONE', 0);

/**
 * Connections order: by addded time, asceding
 */
define('BX_CONNECTIONS_ORDER_ADDED_ASC', 1);

/**
 * Connections order: by addded time, desceding
 */
define('BX_CONNECTIONS_ORDER_ADDED_DESC', 2);

/**
 * Connection type: one-way
 */
define('BX_CONNECTIONS_TYPE_ONE_WAY', 'one-way');

/**
 * Connection type: mutual
 */
define('BX_CONNECTIONS_TYPE_MUTUAL', 'mutual');

/**
 * Connections content type: content
 */
define('BX_CONNECTIONS_CONTENT_TYPE_CONTENT', 'content');

/**
 * Connections content type: initiators
 */
define('BX_CONNECTIONS_CONTENT_TYPE_INITIATORS', 'initiators');

/**
 * Connections content type: common
 */
define('BX_CONNECTIONS_CONTENT_TYPE_COMMON', 'common');

/**
 * Connections trigger type: initiator. 
 * It updates 'Initiator' data with a counter's value of connected 'Content'.
 */
define('BX_CONNECTIONS_TRIGGER_TYPE_INITIATOR', 'initiator');

/**
 * Connections trigger type: content. 
 * It updates 'Content' data with a counter's value of connected 'Initiators'.
 */
define('BX_CONNECTIONS_TRIGGER_TYPE_CONTENT', 'content');

/**
 * Connection is usefull when you need to organize some sorts of connections between different content,
 * for example: friends, contacts, favorites, block lists, subscriptions, etc.
 *
 * Two types of connections are supported one way connections (block list, favourites) and mutual (friends).
 *
 * For automatic handling of connections (like, add/remove connection in frontend) refer to JS function: @see bx_conn_action()
 *
 * @section connection_create Creating the Connection object:
 *
 * Step 1:
 * Add record to 'sys_objects_connection' table:
 * - object: name of the connection object, in the format: vendor prefix, underscore, module prefix, underscore, internal identifier or nothing;
 *           for example: bx_blogs_favorites - favorite blogs for users in blogs module.
 * - table: table name with connections, see step 2
 * - type: 'one-way' or 'mutual'
 * - override_class_name: user defined class name which is derived from one of base classes.
 * - override_class_file: the location of the user defined class, leave it empty if class is located in system folders.
 *
 * Step 2:
 * Create table for connections:
 * @code
 * CREATE TABLE `my_sample_connections` (
 *   `id` int(11) NOT NULL AUTO_INCREMENT,
 *   `initiator` int(11) NOT NULL,
 *   `content` int(11) NOT NULL,
 *   `mutual` tinyint(4) NOT NULL, -- can re removed for one-way connections
 *   `added` int(10) unsigned NOT NULL,
 *   PRIMARY KEY (`id`),
 *   UNIQUE KEY `initiator` (`initiator`,`content`),
 *   KEY `content` (`content`)
 * )
 * @endcode
 *
 *
 * @section example Example of usage
 *
 * Check if two profiles are friends:
 * @code
 *   $oConnectionFriends = BxDolConnection::getObjectInstance('bx_profiles_friends'); // get friends connections object
 *   if ($oConnectionFriends) // check if connections is available for using
 *      echo $oConnectionFriends->isConnected (100, 200, true) ? "100 and 200 are friends" : "100 and 200 aren't friends"; // check if profiles with IDs 100 and 200 have mutual connections
 * @endcode
 *
 * Get mutual content IDs (friends IDs)
 * @code
 *   $oConnectionFriends = BxDolConnection::getObjectInstance('bx_profiles_friends'); // get friends connections object
 *   if ($oConnectionFriends) // check if connections is available for using
 *       print_r($oConnection->getConnectedContent(100, 1)); // print array of friends IDs of 100's profile
 * @endcode
 *
 */
class BxDolConnection extends BxDolFactory implements iBxDolFactoryObject
{
    protected $_oQuery;

    protected $_sObject;
    protected $_aObject;
    protected $_iInitiator;
    protected $_iContent;
    protected $_sType;
    protected $_bMutual;

    protected $_aTriggerTypes;

    /**
     * Constructor
     * @param $aObject array of connection options
     */
    protected function __construct($aObject)
    {
        parent::__construct();

        $this->_sObject = $aObject['object'];
        $this->_aObject = $aObject;
        $this->_aObject['per_page_default'] = 20;

        $this->_iInitiator = bx_get_logged_profile_id();
        $this->_sType = $aObject['type'];
        $this->_bMutual = $this->_sType == BX_CONNECTIONS_TYPE_MUTUAL;

        $this->_aTriggerTypes = [BX_CONNECTIONS_TRIGGER_TYPE_INITIATOR, BX_CONNECTIONS_TRIGGER_TYPE_CONTENT];

        $this->_oQuery = new BxDolConnectionQuery($aObject);
    }

    /**
     * Get connection object instance by object name
     * @param $sObject object name
     * @return object instance or false on error
     */
    static public function getObjectInstance($sObject)
    {
        if (!$sObject)
            return false;

        if (isset($GLOBALS['bxDolClasses']['BxTemplConnection!'.$sObject]))
            return $GLOBALS['bxDolClasses']['BxTemplConnection!'.$sObject];

        $aObject = BxDolConnectionQuery::getConnectionObject($sObject);
        if (!$aObject || !is_array($aObject))
            return false;

        $sClass = empty($aObject['override_class_name']) ? 'BxTemplConnection' : $aObject['override_class_name'];
        if (!empty($aObject['override_class_file']))
            require_once(BX_DIRECTORY_PATH_ROOT . $aObject['override_class_file']);

        $o = new $sClass($aObject);
        $o->init();

        return ($GLOBALS['bxDolClasses']['BxTemplConnection!'.$sObject] = $o);
    }

    /**
     * Init something here if it's needed.
     */
    public function init()
    {
    }

    /**
     * Get connection type.
     * return BX_CONNECTIONS_TYPE_ONE_WAY or BX_CONNECTIONS_TYPE_MUTUAL
     */ 
    public function getType()
    {
        return $this->_sType;
    }

    /**
     * Get connection table.
     * return string with table name.
     */ 
    public function getTable()
    {
        return $this->_aObject['table'];
    }

    /**
     * Checks whether connection's Initiator is profile or not.
     * return boolean.
     */
    public function isProfileInitiator()
    {
        return (int)$this->_aObject['profile_initiator'] != 0;
    }

    /**
     * Checks whether connection's Content is profile or not.
     * return boolean.
     */
    public function isProfileContent()
    {
        return (int)$this->_aObject['profile_content'] != 0;
    }

    /**
     * Check whether connection between Initiator and Content can be established.
     */
    public function checkAllowedConnect ($iInitiator, $iContent, $isPerformAction = false, $isMutual = false, $isInvertResult = false, $isSwap = false, $isCheckExists = true)
    {
        $aResult = $this->_checkAllowedConnect($iInitiator, $iContent, $isPerformAction, $isMutual, $isInvertResult, $isSwap, $isCheckExists);

        return $aResult['code'] == 0 ? CHECK_ACTION_RESULT_ALLOWED : $aResult['message'];
    }
    
    public function checkAllowedConnectByAcl ($iInitiator, $iContent, $isPerformAction = false)
    {
        $aResult = $this->_checkAllowedConnectByAcl($iInitiator, $iContent, $isPerformAction);

        return $aResult['code'] == 0 ? CHECK_ACTION_RESULT_ALLOWED : $aResult['message'];
    }

    public function checkAllowedAddConnection ($iInitiator, $iContent, $isPerformAction = false, $isMutual = false, $isInvertResult = false, $isSwap = false, $isCheckExists = true)
    {
        $aResult = $this->_checkAllowedConnect($iInitiator, $iContent, $isPerformAction, $isMutual, $isInvertResult, $isSwap, $isCheckExists);

        return $aResult['code'] == 0 || ($aResult['code'] == 4  && $this->_sObject == 'sys_profiles_friends') ? CHECK_ACTION_RESULT_ALLOWED : $aResult['message'];
    }

    public function checkAllowedRemoveConnection ($iInitiator, $iContent, $isPerformAction = false, $isMutual = false, $isInvertResult = false, $isSwap = false, $isCheckExists = true)
    {
        $aResult = $this->_checkAllowedConnect($iInitiator, $iContent, $isPerformAction, $isMutual, $isInvertResult, $isSwap, $isCheckExists);

        return $aResult['code'] == 0 || ($aResult['code'] == 4  && $this->_sObject == 'sys_profiles_friends') ? CHECK_ACTION_RESULT_ALLOWED : $aResult['message'];
    }

    /**
     * Add new connection.
     * @param $iContent content to make connection to, in most cases some content id, or other profile id in case of friends
     * @return array
     */
    public function actionAdd ($iContent = 0, $iInitiator = false)
    {
        if(!$iContent && ($_iContent = bx_get('id')) !== false)
            $iContent = bx_process_input($_iContent, BX_DATA_INT);

        if($iInitiator)
            $this->_iInitiator = $iInitiator;
        $this->_iContent = $iContent;

        return $this->_action ($this->_iInitiator, $this->_iContent, 'addConnection', '_sys_conn_err_connection_already_exists', true);
    }

    /**
     * Remove connection. This method is wrapper for @see removeConnection to be called from @see conn.php upon AJAX request to this file.
     * @param $iContent content to make connection to, in most cases some content id, or other profile id in case of friends
     * @return array
     */
    public function actionRemove ($iContent = 0, $iInitiator = false)
    {
        if (!$iContent && ($_iContent = bx_get('id')) !== false)
            $iContent = bx_process_input($_iContent, BX_DATA_INT);

        if ($iContent != bx_get_logged_profile_id() && BX_CONNECTIONS_TYPE_MUTUAL == $this->_aObject['type']) {
            $a = $this->actionReject($iContent, $iInitiator);
            if (false == $a['err'])
                return $a;
        }

        if($iInitiator)
            $this->_iInitiator = $iInitiator;
        $this->_iContent = $iContent;

        return $this->_action ($this->_iInitiator, $this->_iContent, 'removeConnection', '_sys_conn_err_connection_does_not_exists', false, true);
    }

    /**
     * Reject connection request. This method is wrapper for @see removeConnection to be called from @see conn.php upon AJAX request to this file.
     * @param $iContent content to make connection to, in most cases some content id, or other profile id in case of friends
     * @return array
     */
    public function actionReject ($iContent = 0, $iInitiator = false)
    {
        if (!$iContent && ($_iContent = bx_get('id')) !== false)
            $iContent = bx_process_input($_iContent, BX_DATA_INT);

        if($iInitiator)
            $this->_iInitiator = $iInitiator;
        $this->_iContent = $iContent;

        return $this->_action($this->_iContent, $this->_iInitiator, 'removeConnection', '_sys_conn_err_connection_does_not_exists', false, true);
    }

    protected function _action ($iInitiator, $iContent, $sMethod, $sErrorKey, $isMutual = false, $isInvert = false)
    {
        bx_import('BxDolLanguages');

        if(!$iContent || !$iInitiator)
            return ['err' => true, 'msg' => _t('_sys_conn_err_input_data_is_not_defined')];

        $sMethodCheck = 'checkAllowed' . bx_gen_method_name($sMethod);
        if(($mixedResult = $this->{method_exists($this, $sMethodCheck) ? $sMethodCheck : 'checkAllowedConnect'}($iInitiator, $iContent, false, false, $isInvert)) !== CHECK_ACTION_RESULT_ALLOWED)
            return ['err' => true, 'msg' => $mixedResult];

        if (!$this->$sMethod((int)$iInitiator, (int)$iContent)) {
            if ($isMutual && BX_CONNECTIONS_TYPE_MUTUAL == $this->_sType && $this->isConnected((int)$iInitiator, (int)$iContent, false) && !$this->isConnected((int)$iInitiator, (int)$iContent, true))
                return ['err' => true, 'msg' => _t('_sys_conn_err_connection_is_awaiting_confirmation')];

            return ['err' => true, 'msg' => _t($sErrorKey)];
        }

        return ['err' => false, 'msg' => _t('_sys_conn_msg_success')];
    }

    public function outputActionResult ($mixed, $sFormat = 'json')
    {
        switch ($sFormat) {
            case 'html':
                echo $mixed;
                break;
                
            case 'json':
            default:
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode($mixed);     
        }
        exit;
    }

    /**
     * Add new connection.
     * @param $iInitiator initiator of the connection, in most cases some profile id
     * @param $iContent content to make connection to, in most cases some content id, or other profile id in case of friends
     * @return true - if connection was added, false - if connection already exists or error occured
     */
    public function addConnection ($iInitiator, $iContent, $aParams = array())
    {
        $iMutual = 0;
        $iInitiator = (int)$iInitiator;
        $iContent = (int)$iContent;
        $iOverrideResult = null;

        $aAlertExtras = [
            'initiator' => &$iInitiator,
            'content' => &$iContent,
            'mutual' => &$iMutual,

            'initiator_ref' => &$iInitiator,
            'content_ref' => &$iContent,
            'mutual_ref' => &$iMutual,

            'object' => $this,
            'override_result' => &$iOverrideResult,
        ];
        if(!empty($aParams['alert_extras']) && is_array($aParams['alert_extras']))
            $aAlertExtras = array_merge($aAlertExtras, $aParams['alert_extras']);
        
        /**
         * @hooks
         * @hookdef hook-bx_dol_connection-connection_before_add '{object_name}', 'connection_before_add' - hook before connection was added. Connection params can be overridden
         * - $unit_name - connection object name
         * - $action - equals `connection_before_add`
         * - $object_id - not used
         * - $sender_id - logged in profile id
         * - $extra_params - array of additional params with the following array keys:
         *      - `initiator` - [int] by ref, profile id who is creating the connection, can be overridden in hook processing
         *      - `content` - [int] by ref, profile id with whom the connection is creating, can be overridden in hook processing
         *      - `mutual` - [int] by ref, if the relation is mutual or not, can be overridden in hook processing
         *      - `object` - [object] an instance of connection object, @see BxDolConnection
         *      - `object_name` - [string] connection object name
         *      - `override_result` - [boolean] by ref, stop adding and return specified result
         * @hook @ref hook-bx_dol_connection-connection_before_add
         */
        bx_alert($this->_sObject, 'connection_before_add', 0, false, $aAlertExtras);
        bx_alert('system', 'connection_before_add', 0, false, array_merge($aAlertExtras, ['object_name' => $this->_sObject]));
        if (null !== $aAlertExtras['override_result'])
            return $aAlertExtras['override_result'];

        $iId = 0;
        if(!($iId = $this->_oQuery->addConnection($iInitiator, $iContent, $iMutual)))
            return false;

        $iAlertSender = bx_get_logged_profile_id() ?: $iInitiator;
        $aAlertExtras = array_merge($aAlertExtras, [
            'source' => $this->_sObject . '_' . $iId,
            'source_mac' => $this->_sObject . '_' . $iAlertSender . '_' . $iId
        ]);

        /**
         * @hooks
         * @hookdef hook-bx_dol_connection-connection_added '{object_name}', 'connection_added' - hook after connection was added. Connection params can be overridden
         * It's equivalent to @ref hook-bx_dol_connection-connection_before_add
         * @hook @ref hook-bx_dol_connection-connection_added
         */
        bx_alert($this->_sObject, 'connection_added', 0, $iAlertSender, $aAlertExtras);
        bx_alert('system', 'connection_added', 0, $iAlertSender, array_merge($aAlertExtras, ['object_name' => $this->_sObject]));

        $this->onAdded($iInitiator, $iContent, $iMutual);

        return true;
    }

    public function onAdded($iInitiator, $iContent, $iMutual)
    {
        $this->checkAllowedConnect($iInitiator, $iContent, true, $iMutual, false);

        if($this->_isTriggerable($iMutual))
            $this->_updateTriggerValue($iInitiator, $iContent, 1);

        /**
         * Call socket.
         */
        if(($oSockets = BxDolSockets::getInstance()) && $oSockets->isEnabled()) {
            $aMessageInitiator = $aMessageContent = [
                'object' => $this->_sObject, 
                'action' => 'added',
                'initiator' => $iInitiator,
                'content' => $iContent,
            ];

            if(bx_is_api()) {
                $aMessageInitiator = array_merge($aMessageInitiator, [
                    'user' => BxDolProfile::getDataForPage($iInitiator)
                ]);

                $aMessageContent = array_merge($aMessageContent, [
                    'user' => BxDolProfile::getDataForPage($iContent)
                ]);
            }

            $oSockets->sendEvent('sys_connections', $iInitiator , 'changed', json_encode($aMessageInitiator));
            $oSockets->sendEvent('sys_connections', $iContent , 'changed', json_encode($aMessageContent));
        }

        $bMutual = false;
        if($this->_aObject['type'] == BX_CONNECTIONS_TYPE_ONE_WAY || ($bMutual = ($this->_aObject['type'] == BX_CONNECTIONS_TYPE_MUTUAL && $iMutual))) {
            $oProfileQuery = BxDolProfileQuery::getInstance();

            /**
             * Update recommendations.
             */
            if($this->_aObject['profile_initiator']) {
                $aInitiator = $oProfileQuery->getInfoById($iInitiator);
                if(bx_srv($aInitiator['type'], 'act_as_profile'))
                    BxDolRecommendation::updateData($iInitiator);
            }

            if($bMutual && $this->_aObject['profile_content']) {
                $aContent = $oProfileQuery->getInfoById($iContent);
                if(bx_srv($aContent['type'], 'act_as_profile'))
                    BxDolRecommendation::updateData($iContent);
            }
        }
    }

    /**
     * Remove connection.
     * @param $iInitiator initiator of the connection
     * @param $iContent connected content or other profile id in case of friends
     * @return true - if connection was removed, false - if connection isn't exist or error occured
     */
    public function removeConnection ($iInitiator, $iContent)
    {
        $iInitiator = (int)$iInitiator;
        $iContent = (int)$iContent;

        if(!($aConnection = $this->_oQuery->getConnection($iInitiator, $iContent))) // connection doesn't exist
            return false;

        $iMutual = isset($aConnection['mutual']) ? $aConnection['mutual'] : 0;

        $aAlertExtras = [
            'initiator' => &$iInitiator,
            'content' => &$iContent,
            'mutual' => &$iMutual,

            'initiator_ref' => &$iInitiator,
            'content_ref' => &$iContent,
            'mutual_ref' => &$iMutual,

            'object' => $this,
        ];
        if(!empty($aParams['alert_extras']) && is_array($aParams['alert_extras']))
            $aAlertExtras = array_merge($aAlertExtras, $aParams['alert_extras']);

        /**
         * @hooks
         * @hookdef hook-bx_dol_connection-connection_before_remove '{object_name}', 'connection_before_remove' - hook before connection was removed. Connection params can be overridden
         * - $unit_name - connection object name
         * - $action - equals `connection_before_remove`
         * - $object_id - not used
         * - $sender_id - logged in profile id
         * - $extra_params - array of additional params with the following array keys:
         *      - `initiator` - [int] by ref, profile id who is removing the connection, can be overridden in hook processing
         *      - `content` - [int] by ref, profile id with whom the connection is removing, can be overridden in hook processing
         *      - `mutual` - [int] by ref, if the relation is mutual or not, can be overridden in hook processing
         *      - `object` - [object] an instance of relation, @see BxDolConnection
         * @hook @ref hook-bx_dol_connection-connection_before_remove
         */
        bx_alert($this->_sObject, 'connection_before_remove', 0, false, $aAlertExtras);
        bx_alert('system', 'connection_before_remove', 0, false, array_merge($aAlertExtras, ['object_name' => $this->_sObject]));

        if(!$this->_oQuery->removeConnection($iInitiator, $iContent))
            return false;

        /**
         * @hooks
         * @hookdef hook-bx_dol_connection-connection_removed '{object_name}', 'connection_removed' - hook after a connection was removed.
         * It's equivalent to @ref hook-bx_dol_connection-connection_before_remove
         * @hook @ref hook-bx_dol_connection-connection_removed
         */
        bx_alert($this->_sObject, 'connection_removed', 0, false, $aAlertExtras);
        bx_alert('system', 'connection_removed', 0, false, array_merge($aAlertExtras, ['object_name' => $this->_sObject]));

        $this->onRemoved($iInitiator, $iContent, $iMutual);

        return true;
    }

    public function onRemoved($iInitiator, $iContent, $iMutual)
    {
        $this->_updateTriggerValue($iInitiator, $iContent, -1);

        /**
         * Call socket.
         */
        if(($oSockets = BxDolSockets::getInstance()) && $oSockets->isEnabled()) {
            $aMessageInitiator = $aMessageContent = [
                'object' => $this->_sObject, 
                'action' => 'deleted',
            ];

            if(bx_is_api()) {
                $aMessageInitiator = array_merge($aMessageInitiator, [
                    'user' => BxDolProfile::getDataForPage($iInitiator)
                ]);

                $aMessageContent = array_merge($aMessageContent, [
                    'user' => BxDolProfile::getDataForPage($iContent)
                ]);
            }

            $oSockets->sendEvent('sys_connections', $iInitiator , 'changed', json_encode($aMessageInitiator));
            $oSockets->sendEvent('sys_connections', $iContent , 'changed', json_encode($aMessageContent));
        }
    }

    /**
     * Compound function, which calls getCommonContent, getConnectedContent or getConnectedInitiators depending on $sContentType
     * @param $sContentType content type to get BX_CONNECTIONS_CONTENT_TYPE_CONTENT, BX_CONNECTIONS_CONTENT_TYPE_INITIATORS or BX_CONNECTIONS_CONTENT_TYPE_COMMON
     * @param $iId1 one content or initiator
     * @param $iId2 second content or initiator only in case of BX_CONNECTIONS_CONTENT_TYPE_COMMON content type
     * @param $isMutual get mutual connections only
     * @return array of available connections
     */
    public function getConnectionsAsArray ($sContentType, $iId1, $iId2, $isMutual = false, $iStart = 0, $iLimit = BX_CONNECTIONS_LIST_LIMIT, $iOrder = BX_CONNECTIONS_ORDER_NONE)
    {
        if (BX_CONNECTIONS_CONTENT_TYPE_COMMON == $sContentType)
            return $this->getCommonContent($iId1, $iId2, $isMutual, $iStart, $iLimit, $iOrder);

        if (BX_CONNECTIONS_CONTENT_TYPE_INITIATORS == $sContentType)
            $sMethod = 'getConnectedInitiators';
        else
            $sMethod = 'getConnectedContent';

        return $this->$sMethod($iId1, $isMutual, $iStart, $iLimit, $iOrder);
    }

    /**
     * Get common content IDs between two initiators
     * @param $iInitiator1 one initiator
     * @param $iInitiator2 second initiator
     * @param $isMutual get mutual connections only
     * @return array of available connections
     */
    public function getCommonContent ($iInitiator1, $iInitiator2, $isMutual = false, $iStart = 0, $iLimit = BX_CONNECTIONS_LIST_LIMIT, $iOrder = BX_CONNECTIONS_ORDER_NONE)
    {
        return $this->_oQuery->getCommonContent($iInitiator1, $iInitiator2, $isMutual, $iStart, $iLimit, $iOrder);
    }
    
    /**
     * Get common content count between two initiators
     * @param $iInitiator1 one initiator
     * @param $iInitiator2 second initiator
     * @param $isMutual get mutual connections only
     * @return number of connections
     */
    public function getCommonContentCount ($iInitiator1, $iInitiator2, $isMutual = false)
    {
        return $this->_oQuery->getCommonContentCount($iInitiator1, $iInitiator2, $isMutual);
    }

    /**
     * Get connected content count
     * @param $iInitiator initiator of the connection
     * @param $isMutual get mutual connections only
     * @return number of connections
     */
    public function getConnectedContentCount ($iInitiator, $isMutual = false, $iFromDate = 0)
    {
        if($this->_isTriggerable($isMutual) && ($iValue = $this->_getTriggerValueByContentType(BX_CONNECTIONS_CONTENT_TYPE_CONTENT, $iInitiator)) !== false)
            return $iValue;

        return $this->_oQuery->getConnectedContentCount($iInitiator, $isMutual, $iFromDate);
    }

    /**
     * Get connected content count
     * @param $iInitiator initiator of the connection
     * @param $isMutual get mutual connections only
     * @param $aParams additional params
     * @return number of connections
     */
    public function getConnectedContentCountExt ($iInitiator, $isMutual = false, $aParams = [])
    {
        return $this->_oQuery->getConnectedContentCountExt($iInitiator, $isMutual, $aParams);
    }

    /**
     * Get connected initiators count
     * @param $iContent content of the connection
     * @param $isMutual get mutual connections only
     * @return number of connections
     */
    public function getConnectedInitiatorsCount ($iContent, $isMutual = false)
    {
        if($this->_isTriggerable($isMutual) && ($iValue = $this->_getTriggerValueByContentType(BX_CONNECTIONS_CONTENT_TYPE_INITIATORS, $iContent)) !== false)
            return $iValue;

        return $this->_oQuery->getConnectedInitiatorsCount($iContent, $isMutual);
    }

    /**
     * Get connected content IDs
     * @param $iInitiator initiator of the connection
     * @param $isMutual get mutual connections only
     * @return array of available connections
     */
    public function getConnectedContent ($iInitiator, $isMutual = false, $iStart = 0, $iLimit = BX_CONNECTIONS_LIST_LIMIT, $iOrder = BX_CONNECTIONS_ORDER_NONE)
    {
        return $this->_oQuery->getConnectedContent($iInitiator, $isMutual, $iStart, $iLimit, $iOrder);
    }
    
    /**
     * Get connected content IDs for specified type
     * @param $iInitiator initiator of the connection
     * @param $mixedType type of content or an array of types
     * @param $isMutual get mutual connections only
     * @return array of available connections
     */
    public function getConnectedContentByType ($iInitiator, $mixedType, $isMutual = false, $iStart = 0, $iLimit = BX_CONNECTIONS_LIST_LIMIT, $iOrder = BX_CONNECTIONS_ORDER_NONE)
    {
        return $this->_oQuery->getConnectedContentByType($iInitiator, $mixedType, $isMutual, $iStart, $iLimit, $iOrder);
    }

    /**
     * Get connected content IDs for specified type
     * @param $iInitiator initiator of the connection
     * @param $iDate get connections appeared since this date 
     * @param $isMutual get mutual connections only
     * @return array of available connections
     */
    public function getConnectedContentSince ($iInitiator, $iDate, $isMutual = false, $iStart = 0, $iLimit = BX_CONNECTIONS_LIST_LIMIT, $iOrder = BX_CONNECTIONS_ORDER_NONE)
    {
        return $this->_oQuery->getConnectedContentSince($iInitiator, $iDate, $isMutual, $iStart, $iLimit, $iOrder);
    }

    /**
     * Get connected initiators IDs
     * @param $iContent content of the connection
     * @param $isMutual get mutual connections only
     * @return array of available connections
     */
    public function getConnectedInitiators ($iContent, $isMutual = false, $iStart = 0, $iLimit = BX_CONNECTIONS_LIST_LIMIT, $iOrder = BX_CONNECTIONS_ORDER_NONE)
    {
        return $this->_oQuery->getConnectedInitiators($iContent, $isMutual, $iStart, $iLimit, $iOrder);
    }

    /**
     * Get connected initiators IDs
     * @param $iContent content of the connection
     * @param $mixedType type of content or an array of types
     * @param $isMutual get mutual connections only
     * @return array of available connections
     */
    public function getConnectedInitiatorsByType ($iContent, $mixedType, $isMutual = false, $iStart = 0, $iLimit = BX_CONNECTIONS_LIST_LIMIT, $iOrder = BX_CONNECTIONS_ORDER_NONE)
    {
        return $this->_oQuery->getConnectedInitiatorsByType($iContent, $mixedType, $isMutual, $iStart, $iLimit, $iOrder);
    }

    /**
     * Get connected initiators IDs
     * @param $iContent content of the connection
     * @param $iDate get connections appeared since this date 
     * @param $isMutual get mutual connections only
     * @return array of available connections
     */
    public function getConnectedInitiatorsSince ($iContent, $iDate, $isMutual = false, $iStart = 0, $iLimit = BX_CONNECTIONS_LIST_LIMIT, $iOrder = BX_CONNECTIONS_ORDER_NONE)
    {
        return $this->_oQuery->getConnectedInitiatorsSince($iContent, $iDate, $isMutual, $iStart, $iLimit, $iOrder);
    }

    /**
     * Similar to getConnectionsAsArray, but for getCommonContentAsSQLParts, getConnectedContentAsSQLParts or getConnectedInitiatorsAsSQLParts methods
     * @see getConnectionsAsArray
     */
    public function getConnectionsAsSQLParts ($sContentType, $sContentTable, $sContentField, $iId1, $iId2, $isMutual = false)
    {
        if (BX_CONNECTIONS_CONTENT_TYPE_COMMON == $sContentType)
            return $this->getCommonContentAsSQLParts($sContentTable, $sContentField, $iId1, $iId2, $isMutual);

        if (BX_CONNECTIONS_CONTENT_TYPE_INITIATORS == $sContentType)
            $sMethod = 'getConnectedInitiatorsAsSQLParts';
        else
            $sMethod = 'getConnectedContentAsSQLParts';

        return $this->$sMethod($sContentTable, $sContentField, $iId1, $isMutual);
    }

    /**
     * Get necessary parts of SQL query to use connections in other queries
     * @param $sContentTable content table or alias
     * @param $sContentField content table field or field alias
     * @param $iInitiator initiator of the connection
     * @param $isMutual get mutual connections only
     * @return array of SQL string parts, for now 'join' part only is returned
     */
    public function getCommonContentAsSQLParts ($sContentTable, $sContentField, $iInitiator1, $iInitiator2, $isMutual = false)
    {
        return $this->_oQuery->getCommonContentSQLParts($sContentTable, $sContentField, $iInitiator1, $iInitiator2, $isMutual);
    }

    /**
     * Get necessary parts of SQL query to use connections in other queries
     * @param $sContentTable content table or alias
     * @param $sContentField content table field or field alias
     * @param $iInitiator initiator of the connection
     * @param $isMutual get mutual connections only
     * @return array of SQL string parts, for now 'join' part only is returned
     */
    public function getConnectedContentAsSQLParts ($sContentTable, $sContentField, $iInitiator, $isMutual = false)
    {
        return $this->_oQuery->getConnectedContentSQLParts($sContentTable, $sContentField, $iInitiator, $isMutual);
    }
    
    public function getConnectedContentAsSQLPartsExt ($sContentTable, $sContentField, $iInitiator, $isMutual = false)
    {
        return $this->_oQuery->getConnectedContentSQLPartsExt($sContentTable, $sContentField, $iInitiator, $isMutual);
    }

	/**
     * Get necessary parts of SQL query to use connections in other queries
     * @param $sContentTable content table or alias
     * @param $sContentField content table field or field alias
     * @param $sInitiatorTable initiator table or alias
     * @param $sInitiatorField initiator table field or field alias
     * @param $iInitiator initiator of the connection
     * @param $isMutual get mutual connections only
     * @return array of SQL string parts, for now 'join' part only is returned
     */
    public function getConnectedContentAsSQLPartsMultiple ($sContentTable, $sContentField, $sInitiatorTable, $sInitiatorField, $isMutual = false)
    {
        return $this->_oQuery->getConnectedContentSQLPartsMultiple($sContentTable, $sContentField, $sInitiatorTable, $sInitiatorField, $isMutual);
    }

    /**
     * Get necessary parts of SQL query to use connections in other queries
     * @param $sInitiatorTable initiator table or alias
     * @param $sInitiatorField initiator table field or field alias
     * @param $iContent content of the connection
     * @param $isMutual get mutual connections only
     * @return array of SQL string parts, for now 'join' part only is returned
     */
    public function getConnectedInitiatorsAsSQLParts ($sInitiatorTable, $sInitiatorField, $iContent, $isMutual = false)
    {
        return $this->_oQuery->getConnectedInitiatorsSQLParts($sInitiatorTable, $sInitiatorField, $iContent, $isMutual);
    }

	/**
     * Get necessary parts of SQL query to use connections in other queries
     * @param $sInitiatorTable initiator table or alias
     * @param $sInitiatorField initiator table field or field alias
     * @param $sContentTable content table or alias
     * @param $sContentField content table field or field alias
     * @param $isMutual get mutual connections only
     * @return array of SQL string parts, for now 'join' part only is returned
     */
    public function getConnectedInitiatorsAsSQLPartsMultiple ($sInitiatorTable, $sInitiatorField, $sContentTable, $sContentField, $isMutual = false)
    {
        return $this->_oQuery->getConnectedInitiatorsSQLPartsMultiple ($sInitiatorTable, $sInitiatorField, $sContentTable, $sContentField, $isMutual);
    }

    /**
     * Similar to getConnectionsAsArray, but for getCommonContentAsCondition, getConnectedContentAsCondition or getConnectedInitiatorsAsCondition methods
     * @see getConnectionsAsArray
     */
    public function getConnectionsAsCondition ($sContentType, $sContentField, $iId1, $iId2, $isMutual = false)
    {
        if (BX_CONNECTIONS_CONTENT_TYPE_COMMON == $sContentType)
            return $this->getCommonContentAsCondition($sContentField, $iId1, $iId2, $isMutual);

        if (BX_CONNECTIONS_CONTENT_TYPE_INITIATORS == $sContentType)
            $sMethod = 'getConnectedInitiatorsAsCondition';
        else
            $sMethod = 'getConnectedContentAsCondition';

        return $this->$sMethod($sContentField, $iId1, $isMutual);
    }

    /**
     * Get necessary condition array to use connections in search classes
     * @param $sContentField content table field name
     * @param $iInitiator initiator of the connection
     * @param $iMutual get mutual connections only
     * @return array of conditions, for now with 'restriction' and 'join' parts
     */
    public function getCommonContentAsCondition ($sContentField, $iInitiator1, $iInitiator2, $iMutual = false)
    {
        return array(

            'restriction' => array (
                'connections_' . $this->_sObject => array(
                    'value' => $iInitiator1,
                    'field' => 'initiator',
                    'operator' => '=',
                    'table' => 'c',
                ),
                'connections_mutual_' . $this->_sObject => array(
                    'value' => $iMutual,
                    'field' => 'mutual',
                    'operator' => '=',
                    'table' => 'c',
                ),
                'connections2_' . $this->_sObject => array(
                    'value' => $iInitiator2,
                    'field' => 'initiator',
                    'operator' => '=',
                    'table' => 'c2',
                ),
                'connections2_mutual_' . $this->_sObject => array(
                    'value' => $iMutual,
                    'field' => 'mutual',
                    'operator' => '=',
                    'table' => 'c2',
                ),
            ),

            'join' => array (
                'connections_' . $this->_sObject => array(
                    'type' => 'INNER',
                    'table' => $this->_aObject['table'],
                    'table_alias' => 'c',
                    'mainField' => $sContentField,
                    'onField' => 'content',
                    'joinFields' => array(),
                ),
                'connections2_' . $this->_sObject => array(
                    'type' => 'INNER',
                    'table' => $this->_aObject['table'],
                    'table_alias' => 'c2',
                    'mainTable' => 'c',
                    'mainField' => 'content',
                    'onField' => 'content',
                    'joinFields' => array(),
                ),
            ),

        );
    }

    /**
     * Get necessary condition array to use connections in search classes
     * @param $sContentField content table field name
     * @param $iInitiator initiator of the connection
     * @param $iMutual get mutual connections only
     * @return array of conditions, for now with 'restriction' and 'join' parts
     */
    public function getConnectedContentAsCondition ($sContentField, $iInitiator, $iMutual = false)
    {
        $sOperation = '=';
        if(is_array($iInitiator))
            $sOperation = 'in';

        return array(

            'restriction' => array (
                'connections_' . $this->_sObject => array(
                    'value' => $iInitiator,
                    'field' => 'initiator',
                    'operator' => $sOperation,
                    'table' => $this->_aObject['table'],
                ),
                'connections_mutual_' . $this->_sObject => array(
                    'value' => $iMutual,
                    'field' => 'mutual',
                    'operator' => '=',
                    'table' => $this->_aObject['table'],
                ),
            ),

            'join' => array (
                'connections_' . $this->_sObject => array(
                    'type' => 'INNER',
                    'table' => $this->_aObject['table'],
                    'mainField' => $sContentField,
                    'onField' => 'content',
                    'joinFields' => array(),//'initiator'),
                ),
            ),

        );
    }

    /**
     * Get necessary condition array to use connections in search classes
     * @param $sContentField content table field name
     * @param $iInitiator initiator of the connection
     * @param $iMutual get mutual connections only
     * @return array of conditions, for now with 'restriction' and 'join' parts
     */
    public function getConnectedInitiatorsAsCondition ($sContentField, $iContent, $iMutual = false)
    {
        $sOperation = '=';
        if(is_array($iContent))
            $sOperation = 'in';

        return array(

            'restriction' => array (
                'connections_' . $this->_sObject => array(
                    'value' => $iContent,
                    'field' => 'content',
                    'operator' => $sOperation,
                    'table' => $this->_aObject['table'],
                ),
                'connections_mutual_' . $this->_sObject => array(
                    'value' => $iMutual,
                    'field' => 'mutual',
                    'operator' => '=',
                    'table' => $this->_aObject['table'],
                ),
            ),

            'join' => array (
                'connections_' . $this->_sObject => array(
                    'type' => 'INNER',
                    'table' => $this->_aObject['table'],
                    'mainField' => $sContentField,
                    'onField' => 'initiator',
                    'joinFields' => array(),//'initiator'),
                ),
            ),

        );
    }

    /**
     * Check if initiator and content are connected.
     * In case if friends this function in conjunction with isMutual parameter can be used to check pending friend requests.
     * @param $iInitiator initiator of the connection
     * @param $iContent connected content or other profile id in case of friends
     * @return true - if content and initiator are connected or false - in all other cases
     */
    public function isConnected ($iInitiator, $iContent, $isMutual = false)
    {
        $oConnection = $this->_oQuery->getConnection ($iInitiator, $iContent);
        if (!$oConnection)
            return false;
        return false === $isMutual ? true : (isset($oConnection['mutual']) ? $oConnection['mutual'] : false);
    }

    /**
     * Check if initiator and content are connected but connetion is not mutual, for checking pending connection requests.
     * This method makes sense only when type of connection is mutual.
     * @param $iInitiator initiator of the connection
     * @param $iContent connected content or other profile id in case of friends
     * @return true - if content and initiator are connected but connection is not mutual or false in all other cases
     */
    public function isConnectedNotMutual ($iInitiator, $iContent)
    {
        $oConnection = $this->_oQuery->getConnection ($iInitiator, $iContent);
        if (!$oConnection)
            return false;
        return $oConnection['mutual'] ? false : true;
    }

    public function getConnection ($iInitiator, $iContent)
    {
        return $this->_oQuery->getConnection($iInitiator, $iContent);
    }

    public function getConnectionById ($iId)
    {
        return $this->_oQuery->getConnectionById($iId);
    }

    /**
     * Must be called when some content is deleted which can have connections as 'content' or as 'initiator', to delete any associated data
     * @param $iId which can be as conetnt ot initiator
     * @return true if some connections were deleted
     */
    public function onDeleteInitiatorAndContent ($iId)
    {
        $b = $this->onDeleteInitiator ($iId);
        $b = $this->onDeleteContent ($iId) || $b;
        return $b;
    }

    /**
     * Must be called when some content is deleted which can have connections as 'initiator', to delete any associated data
     * @param $iIdInitiator initiator id
     * @return true if some connections were deleted
     */
    public function onDeleteInitiator ($iIdInitiator)
    {
        if(!$this->_oQuery->onDelete ($iIdInitiator, 'initiator'))
            return false;

        /**
         * @hooks
         * @hookdef hook-bx_dol_connection-connection_removed_all '{object_name}', 'connection_removed_all' - hook after all connections with deleted 'initiator' were removed.
         * - $unit_name - connection object name
         * - $action - equals `connection_removed_all`
         * - $object_id - not used
         * - $sender_id - logged in profile id
         * - $extra_params - array of additional params with the following array keys:
         *      - `initiator` - [int] profile id who created the connection
         *      - `object` - [object] an instance of relation, @see BxDolConnection
         * @hook @ref hook-bx_dol_connection-connection_removed_all
         */
        bx_alert($this->_sObject, 'connection_removed_all', 0, bx_get_logged_profile_id(), array(
            'initiator' => (int)$iIdInitiator,
            'object' => $this,
        ));

        return true;
    }

    /**
     * Must be called when some content is deleted which can have connections as 'content', to delete any associated data
     * @param $iIdInitiator initiator id
     * @return true if some connections were deleted
     */
    public function onDeleteContent ($iIdContent)
    {
        if(!$this->_oQuery->onDelete ($iIdContent, 'content'))
            return false;

        /**
         * @hooks
         * @hookdef hook-bx_dol_connection-connection_removed_all '{object_name}', 'connection_removed_all' - hook after all connections with deleted 'content' were removed.
         * - $unit_name - connection object name
         * - $action - equals `connection_removed_all`
         * - $object_id - not used
         * - $sender_id - logged in profile id
         * - $extra_params - array of additional params with the following array keys:
         *      - `content` - [int] profile id with whom the connection was created
         *      - `object` - [object] an instance of relation, @see BxDolConnection
         * @hook @ref hook-bx_dol_connection-connection_removed_all
         */
        bx_alert($this->_sObject, 'connection_removed_all', 0, bx_get_logged_profile_id(), array(
            'content' => (int)$iIdContent,
            'object' => $this,
        ));

        return true;
    }


    /**
     * Must be called when module (which can have connections as 'content' or as 'initiator') is deleted, to delete any associated data.
     * This method call may be automated via @see BxBaseModGeneralInstaller::_aConnections property.
     * @param $sTable table name with data which have assiciations with the connection
     * @param $sFieldId id field name which is associated with the connection
     * @return number of deleted connections
     */
    public function onModuleDeleteInitiatorAndContent ($sTable, $sFieldId)
    {
        $iAffected = $this->onModuleDeleteInitiator ($sTable, $sFieldId);
        $iAffected += $this->onModuleDeleteContent ($sTable, $sFieldId);
        return $iAffected;
    }

    /**
     * Must be called when module (which can have connections as 'initiator') is deleted, to delete any associated data.
     * This method call may be automated via @see BxBaseModGeneralInstaller::_aConnections property.
     * @param $sTable table name with data which have assiciations with the connection
     * @param $sFieldId id field name which is associated with the connection
     * @return number of deleted connections
     */
    public function onModuleDeleteInitiator ($sTable, $sFieldId)
    {
        return $this->_oQuery->onModuleDelete ($sTable, $sFieldId, 'initiator');
    }

    /**
     * Must be called when module (which can have connections as 'content') is deleted, to delete any associated data.
     * This method call may be automated via @see BxBaseModGeneralInstaller::_aConnections property.
     * @param $sTable table name with data which have assiciations with the connection
     * @param $sFieldId id field name which is associated with the connection
     * @return number of deleted connections
     */
    public function onModuleDeleteContent ($sTable, $sFieldId)
    {
        return $this->_oQuery->onModuleDelete ($sTable, $sFieldId, 'content');
    }


    /**
     * Must be called when module (which can have connections as 'content' or as 'initiator' with 'sys_profiles' table) is deleted, to delete any associated data.
     * This method call may be automated via @see BxBaseModGeneralInstaller::_aConnections property.
     * @param $sModuleName module name to delete connections for
     * @return number of deleted connections
     */
    public function onModuleProfileDeleteInitiatorAndContent ($sModuleName)
    {
        $iAffected = $this->onModuleProfileDeleteInitiator ($sModuleName);
        $iAffected += $this->onModuleProfileDeleteContent ($sModuleName);
        return $iAffected;
    }

    /**
     * Must be called when module (which can have connections as 'initiator' with 'sys_profiles' table) is deleted, to delete any associated data.
     * This method call may be automated via @see BxBaseModGeneralInstaller::_aConnections property.
     * @param $sModuleName module name to delete connections for
     * @return number of deleted connections
     */
    public function onModuleProfileDeleteInitiator ($sModuleName)
    {
        return $this->_oQuery->onModuleProfileDelete ($sModuleName, 'initiator');
    }

    /**
     * Must be called when module (which can have connections as 'content' with 'sys_profiles' table) is deleted, to delete any associated data.
     * This method call may be automated via @see BxBaseModGeneralInstaller::_aConnections property.
     * @param $sModuleName module name to delete connections for
     * @return number of deleted connections
     */
    public function onModuleProfileDeleteContent ($sModuleName)
    {
        return $this->_oQuery->onModuleProfileDelete ($sModuleName, 'content');
    }

    protected function _checkAllowedConnect ($iInitiator, $iContent, $isPerformAction = false, $isMutual = false, $isInvertResult = false, $isSwap = false, $isCheckExists = true)
    {
        $sErr = _t('_sys_txt_access_denied');

        if(!$iInitiator || !$iContent || $iInitiator == $iContent)
            return ['code' => 1, 'message' => $sErr];

        $oInitiator = BxDolProfile::getInstance($iInitiator);
        $oContent = BxDolProfile::getInstance($iContent);
        if(!$oInitiator || !$oContent)
            return ['code' => 2, 'message' => $sErr];

        // check ACL
        if(($mixedResult = $this->_checkAllowedConnectInitiator($oInitiator, $isPerformAction)) !== CHECK_ACTION_RESULT_ALLOWED)
            return ['code' => 3, 'message' => $mixedResult];

        $iCode = 0;
        $sMessage = '';

        // check content's visibility
        if(!$this->isConnected($iContent, $iInitiator) && ($mixedResult = $this->_checkAllowedConnectContent($oContent)) !== CHECK_ACTION_RESULT_ALLOWED)
            list($iCode, $sMessage) = [4, $mixedResult];

        if(!$isCheckExists)
            return ['code' => $iCode, 'message' => $sMessage != '' ? $sMessage : null];

        if($isSwap)
            $isConnected = $this->isConnected($iContent, $iInitiator, $isMutual);
        else
            $isConnected = $this->isConnected($iInitiator, $iContent, $isMutual);

        if($isInvertResult)
            $isConnected = !$isConnected;

        if($isConnected)
            list($iCode, $sMessage) = [5, $sErr];

        return ['code' => $iCode, 'message' => $sMessage != '' ? $sMessage : null];
    }

    protected function _checkAllowedConnectByAcl ($iInitiator, $iContent, $isPerformAction = false)
    {
        $sErr = _t('_sys_txt_access_denied');

        if(!$iInitiator || !$iContent || $iInitiator == $iContent)
            return ['code' => 1, 'message' => $sErr];

        $oInitiator = BxDolProfile::getInstance($iInitiator);
        if(!$oInitiator || !BxDolProfile::getInstance($iContent))
            return ['code' => 2, 'message' => $sErr];

        // check ACL
        if(($mixedResult = $this->_checkAllowedConnectInitiator($oInitiator, $isPerformAction)) !== CHECK_ACTION_RESULT_ALLOWED)
            return ['code' => 3, 'message' => $mixedResult];

        return ['code' => 0];
    }

    protected function _checkAllowedConnectInitiator ($oInitiator, $isPerformAction = false)
    {
        $aCheck = checkActionModule($oInitiator->id(), 'connect', 'system', $isPerformAction);
        if($aCheck[CHECK_ACTION_RESULT] !== CHECK_ACTION_RESULT_ALLOWED)
            return $aCheck[CHECK_ACTION_MESSAGE];

        return CHECK_ACTION_RESULT_ALLOWED;
    }

    protected function _checkAllowedConnectContent ($oContent)
    {
        return $oContent->checkAllowedProfileView();
    }

    protected function _isTriggerable($mixedMutual)
    {
        return $this->_aObject['type'] == BX_CONNECTIONS_TYPE_ONE_WAY || ($this->_aObject['type'] == BX_CONNECTIONS_TYPE_MUTUAL && $mixedMutual);
    }

    protected function _updateTriggerValue($iInitiator, $iContent, $iValue)
    {
        foreach($this->_aTriggerTypes as $sType) {
            if(empty($this->_aObject['tt_' . $sType]) || empty($this->_aObject['tf_id_' . $sType]) || empty($this->_aObject['tf_count_' . $sType]))
                continue;

            $iObjectId = $this->_getTriggerObject($sType, $iInitiator, $iContent);
            if(!$iObjectId)
                continue;

            $this->_oQuery->updateTriggerValue($sType, $iObjectId, $iValue);
        }
    }

    protected function _getTriggerValueByContentType($sContentType, $iParticipantId)
    {
        $aCt2Tt = [
            BX_CONNECTIONS_CONTENT_TYPE_CONTENT => BX_CONNECTIONS_TRIGGER_TYPE_INITIATOR,
            BX_CONNECTIONS_CONTENT_TYPE_INITIATORS => BX_CONNECTIONS_TRIGGER_TYPE_CONTENT
        ];

        if(!isset($aCt2Tt[$sContentType]))
            return false;

        $sTriggerType = $aCt2Tt[$sContentType];
        if(empty($this->_aObject['tt_' . $sTriggerType]) || empty($this->_aObject['tf_id_' . $sTriggerType]) || empty($this->_aObject['tf_count_' . $sTriggerType]))
            return false;

        $iObjectId = 0;
        if((int)$this->_aObject['profile_' . $sTriggerType]) {
            if(($oParticipant = BxDolProfile::getInstance($iParticipantId)) !== false)
                $iObjectId = $oParticipant->getContentId();
        }
        else
            $iObjectId = $iParticipantId;

        return $iObjectId ? $this->_oQuery->getTriggerValue($sTriggerType, $iObjectId) : false;
    }

    /**
     * Should be overwritten in Connection class which uses triggerable fields.
     */
    protected function _getTriggerObject($sType, $iInitiator, $iContent)
    {
        return false;
    }
}

/** @} */
