<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Message constants passed to _t_ext() function by checkAction()
 *
 * NOTE: checkAction() returns language dependent messages
 */
define('CHECK_ACTION_MESSAGE_NOT_ALLOWED',			"_sys_acl_action_not_allowed");
define('CHECK_ACTION_MESSAGE_LIMIT_REACHED',		"_sys_acl_action_limit_reached");
define('CHECK_ACTION_MESSAGE_MESSAGE_EVERY_PERIOD',	"_sys_acl_action_every_period");
define('CHECK_ACTION_MESSAGE_NOT_ALLOWED_BEFORE',	"_sys_acl_action_not_allowed_before");
define('CHECK_ACTION_MESSAGE_NOT_ALLOWED_AFTER',	"_sys_acl_action_not_allowed_after");

define('CHECK_ACTION_MESSAGE_UNAUTHENTICATED',	    "_sys_acl_action_unauthenticated");
define('CHECK_ACTION_MESSAGE_UNCONFIRMED',			"_sys_acl_action_unconfirmed");
define('CHECK_ACTION_MESSAGE_PENDING',			    "_sys_acl_action_pending");
define('CHECK_ACTION_MESSAGE_SUSPENDED',			"_sys_acl_action_suspended");

/**
 * Nodes of $args array that are passed to _t_ext() function by checkAction()
 */
define('CHECK_ACTION_LANG_FILE_ACTION', 1);
define('CHECK_ACTION_LANG_FILE_MEMBERSHIP', 2);
define('CHECK_ACTION_LANG_FILE_LIMIT', 3);
define('CHECK_ACTION_LANG_FILE_PERIOD', 4);
define('CHECK_ACTION_LANG_FILE_AFTER', 5);
define('CHECK_ACTION_LANG_FILE_BEFORE', 6);
define('CHECK_ACTION_LANG_FILE_SITE_EMAIL',	7);
define('CHECK_ACTION_LANG_FILE_PERIOD_RESTART_AT', 8);

/**
 * Standard membership ID's
 */
define('MEMBERSHIP_ID_NON_MEMBER', 1);
define('MEMBERSHIP_ID_ACCOUNT', 2);
define('MEMBERSHIP_ID_STANDARD', 3);
define('MEMBERSHIP_ID_UNCONFIRMED', 4);
define('MEMBERSHIP_ID_PENDING', 5);
define('MEMBERSHIP_ID_SUSPENDED', 6);
define('MEMBERSHIP_ID_MODERATOR', 7);
define('MEMBERSHIP_ID_ADMINISTRATOR', 8);

/**
 * Standard membership actions
 */
define('MEMBERSHIP_ACTION_EDIT_ANY_ENTRY', 'edit any entry');
define('MEMBERSHIP_ACTION_DELETE_ANY_ENTRY', 'delete any entry');

/**
 * Indices for checkAction() result array
 */
define('CHECK_ACTION_RESULT', 0);
define('CHECK_ACTION_MESSAGE', 1);
define('CHECK_ACTION_PARAMETER', 3);

/**
 * CHECK_ACTION_RESULT node values
 */
define('CHECK_ACTION_RESULT_ALLOWED', 0);
define('CHECK_ACTION_RESULT_NOT_ALLOWED', 1);
define('CHECK_ACTION_RESULT_NOT_ACTIVE', 2);
define('CHECK_ACTION_RESULT_LIMIT_REACHED', 3);
define('CHECK_ACTION_RESULT_NOT_ALLOWED_BEFORE', 4);
define('CHECK_ACTION_RESULT_NOT_ALLOWED_AFTER', 5);

/**
 * Standard period units
 */
define('MEMBERSHIP_PERIOD_UNIT_DAY', 'day');
define('MEMBERSHIP_PERIOD_UNIT_WEEK', 'week');
define('MEMBERSHIP_PERIOD_UNIT_MONTH', 'month');
define('MEMBERSHIP_PERIOD_UNIT_YEAR', 'year');


class BxDolAcl extends BxDolFactory implements iBxDolSingleton
{
    protected static $_aCacheData = array();

    protected $_bIsApi;

    protected $oDb;

    protected $_aStandardMemberships = array(
        MEMBERSHIP_ID_NON_MEMBER => 1,
        MEMBERSHIP_ID_ACCOUNT => 1,
        MEMBERSHIP_ID_UNCONFIRMED => 1,
        MEMBERSHIP_ID_PENDING => 1,
        MEMBERSHIP_ID_SUSPENDED => 1,
        MEMBERSHIP_ID_STANDARD => 1,
    );

    protected $_aProfileStatus2LevelMap = array (
        BX_PROFILE_STATUS_SUSPENDED => MEMBERSHIP_ID_SUSPENDED,
        BX_PROFILE_STATUS_PENDING => MEMBERSHIP_ID_PENDING,
    );

    protected $_aLevel2MessageMap = array (
        MEMBERSHIP_ID_NON_MEMBER => '_sys_acl_action_unauthenticated',
        MEMBERSHIP_ID_ACCOUNT => '_sys_acl_action_account',
        MEMBERSHIP_ID_UNCONFIRMED => '_sys_acl_action_unconfirmed',
        MEMBERSHIP_ID_PENDING => '_sys_acl_action_pending',
        MEMBERSHIP_ID_SUSPENDED => '_sys_acl_action_suspended',
    );

    /**
     * Titles and icons of the states that say why an action was denied (getDenialState), by the level that denied it.
     * A level that isn't here is a membership that doesn't include the action.
     */
    protected $aLevel2State = array (
        MEMBERSHIP_ID_NON_MEMBER => ['title' => '_sys_acl_state_unauthenticated_title', 'icon' => 'log-in'],
        MEMBERSHIP_ID_ACCOUNT => ['title' => '_sys_acl_state_account_title', 'icon' => 'user-round-plus'],
        MEMBERSHIP_ID_UNCONFIRMED => ['title' => '_sys_acl_state_unconfirmed_title', 'icon' => 'mail'],
        MEMBERSHIP_ID_PENDING => ['title' => '_sys_acl_state_pending_title', 'icon' => 'clock'],
        MEMBERSHIP_ID_SUSPENDED => ['title' => '_sys_acl_state_suspended_title', 'icon' => 'ban'],
    );

    /**
     * The denials of this request, message => level id: checkAction's callers pass on only the message, and the
     * message box that shows it (MsgBox, bx_api_get_msg) asks getDenialState what the viewer can do about it.
     */
    protected static $aDenials = array();

    protected function __construct()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error ('Multiple instances are not allowed for the class: ' . get_class($this), E_USER_ERROR);

        parent::__construct();

        $this->_bIsApi = bx_is_api();

        $this->oDb = BxDolAclQuery::getInstance();
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
    public static function getInstance()
    {
        if(!isset($GLOBALS['bxDolClasses'][__CLASS__]))
            $GLOBALS['bxDolClasses'][__CLASS__] = new BxTemplAcl();

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    /**
     * Why an action was denied and what the viewer can do about it, for a message that checkAction gave in this
     * request: a state as BxDolEmptyState::resolve takes it (title, text, buttons) with an icon. A guest is asked to
     * log in or sign up, an account without a profile to create one; a membership that doesn't include the action
     * gets the reason only. Null for any other message.
     *
     * @param string $sMessage the message, as checkAction gave it
     * @return array|null ['icon' => name, 'title' => text, 'text' => message, 'buttons' => [['title' => text, 'link' => url], ...]]
     */
    public static function getDenialState($sMessage)
    {
        if(!is_string($sMessage) || !isset(self::$aDenials[$sMessage])) {
            return null;
        }

        return self::getDenialStateByLevel(self::$aDenials[$sMessage], $sMessage);
    }

    /**
     * The state of a denial for a viewer at the membership level: a guest is asked to sign in or sign up, an account
     * without a profile to create one.
     *
     * @param int $iLevel membership level id (MEMBERSHIP_ID_*)
     * @param string $sMessage translated text of the state
     * @return array as getDenialState
     */
    public static function getDenialStateByLevel($iLevel, $sMessage)
    {
        $iLevel = (int)$iLevel;
        $oAcl = self::getInstance();
        $aState = $oAcl->aLevel2State[$iLevel] ?? ['title' => '_sys_acl_state_not_allowed_title', 'icon' => 'lock'];

        $aButtons = [];
        if($iLevel == MEMBERSHIP_ID_NON_MEMBER) {
            $aButtons = [
                ['title' => '_sys_menu_item_title_login', 'link' => 'page.php?i=login'],
                ['title' => '_sys_menu_item_title_join', 'link' => 'page.php?i=create-account'],
            ];
        }
        elseif($iLevel == MEMBERSHIP_ID_ACCOUNT && isLogged()) {
            $aButtons = [
                ['title' => '_sys_txt_account_profile_system_action', 'link' => BxDolPage::getProfileRequiredUrl()],
            ];
        }

        return [
            'level' => $iLevel,
            'icon' => $aState['icon'],
            'title' => _t($aState['title']),
            'text' => $sMessage,
            'buttons' => array_map(function($a) {
                return ['title' => _t($a['title']), 'link' => $a['link']];
            }, $aButtons),
        ];
    }

	/**
     * Get necessary condition array to use membership level in search classes
     * @param $sContentField content table field name
     * @param $mixedLevelId level ID or array of level IDs
     * @return array of conditions is returned
     */
    public function getContentByLevelAsCondition($sContentField, $mixedLevelId)
    {
        $iLevelId = !is_array($mixedLevelId) ? $mixedLevelId : 0;
        if (!$iLevelId && is_array($mixedLevelId) && 1 == count($mixedLevelId)) {
            $a = array_values($mixedLevelId);
            $iLevelId = array_shift($a);
        }

        // unconfirmed
        if (MEMBERSHIP_ID_UNCONFIRMED == $iLevelId) {
            return array(
                'restriction_sql' => ' AND `sys_accounts`.`email_confirmed` = 0 ',
                'restriction' => array (),
                'join' => array (),
            );
        }
        // standard
        elseif (MEMBERSHIP_ID_STANDARD == $iLevelId) {
            return array(
                'restriction_sql' => ' AND (`tlm`.DateStarts IS NULL OR `tlm`.DateStarts <= NOW()) AND (`tlm`.DateExpires IS NULL OR `tlm`.DateExpires > NOW()) AND `tlm`.`IDMember` IS NULL AND `sys_accounts`.`email_confirmed` != 0 ',
                'restriction' => array (
                ),
                'join' => array (
                    'acl_members' => array(
                        'type' => 'LEFT',
                        'table' => 'sys_acl_levels_members',
                        'table_alias' => 'tlm',
                        'mainField' => $sContentField,
                        'onField' => 'IDMember',
                        'joinFields' => array(),
                    ),
                ),
            );
        }
        // other levels
        else {
            return array(
                'restriction_sql' => ' AND (`tlm`.DateStarts IS NULL OR `tlm`.DateStarts <= NOW()) AND (`tlm`.DateExpires IS NULL OR `tlm`.DateExpires > NOW()) AND `sys_accounts`.`email_confirmed` != 0 ',
                'restriction' => array (
                    'acl_members' => array(
                        'value' => $mixedLevelId,
                        'field' => 'IDLevel',
                        'operator' => is_array($mixedLevelId) ? 'in' : '=',
                        'table' => 'tlm',
                    ),
                ),
                'join' => array (
                    'acl_members' => array(
                        'type' => 'INNER',
                        'table' => 'sys_acl_levels_members',
                        'table_alias' => 'tlm',
                        'mainField' => $sContentField,
                        'onField' => 'IDMember',
                        'joinFields' => array(),
                    ),
                ),
            );
        }
    }

	/**
     * Get necessary parts of SQL query to use membership levels in other queries
     * @param $sContentTable content table name
     * @param $sContentField content table field name
     * @param $mixedLevelId level ID or array of level IDs
     * @return array of SQL string parts, for now 'where' part only is returned
     */
    public function getContentByLevelAsSQLPart($sContentTable, $sContentField, $mixedLevelId)
    {
        return $this->oDb->getContentByLevelAsSQLPart($sContentTable, $sContentField, $mixedLevelId);
    }

    /**
     * Check if member has one of the provided membership levels
     * @param $mixedPermissions - integer value (every bit is matched with some membership ID) or an array of membership IDs to check permissions for
     * @param $iProfileId - profile to check, if it isn't provided or is false then currently logged in profile is used.
     * @return true if member has privided membership levels, or false if member hasn't.
     */
    public function isMemberLevelInSet($mixedPermissions, $iProfileId = false)
    {
        $iPermissions = 0;
        if(is_array($mixedPermissions))
            foreach($mixedPermissions as $iPermissionId)
                $iPermissions += pow(2, (int)$iPermissionId - 1);
        else if(is_numeric($mixedPermissions))
            $iPermissions = (int)$mixedPermissions;

        if(!$iPermissions)
            return false;

        return ($iPermissions & $this->getMemberLevelBit($iProfileId));
    }

    /**
     * Get user's membership level bit for bitwise operarions
     */
    public function getMemberLevelBit($iProfileId = 0)
    {
        if (!$iProfileId)
            $iProfileId = bx_get_logged_profile_id();

        $aACL = $this->getMemberMembershipInfo($iProfileId);
        return pow(2, $aACL['id'] - 1);
    }

    /**
     * Checks if a given action is allowed for a given profile and updates action information if the
     * action is performed.
     *
     * @param  int     $iProfileId     ID of a profile that is going to perform an action
     * @param  int     $iActionId      ID of the action itself
     * @param  boolean $bPerformAction if true, then action information is updated, i.e. action is 'performed'
     * @return array(
     *                                CHECK_ACTION_RESULT => CHECK_ACTION_RESULT_ constant,
     *                                CHECK_ACTION_MESSAGE => CHECK_ACTION_MESSAGE_ constant,
     *                                CHECK_ACTION_PARAMETER => additional action parameter (string)
     *                                )
     *
     * NOTES:
     *
     * $aResult[CHECK_ACTION_MESSAGE] contains a message with detailed information about the result,
     * already processed by the language file
     *
     * if $aResult[CHECK_ACTION_RESULT] === CHECK_ACTION_RESULT_ALLOWED then this node contains
     * an empty string
     *
     * The error messages themselves are stored in the language file. Additional variables are
     * passed to the languages.inc.php function _t_ext() as an array and can be used there in the form of
     * {0}, {1}, {2} ...
     *
     * Additional variables passed to the lang. file on errors (can be used in error messages):
     *
     * 	For all errors:
     *
     * 		$arg0[CHECK_ACTION_LANG_FILE_ACTION]	= name of the action
     * 		$arg0[CHECK_ACTION_LANG_FILE_MEMBERSHIP]= name of the current membership
     *
     * 	CHECK_ACTION_RESULT_LIMIT_REACHED:
     *
     * 		$arg0[CHECK_ACTION_LANG_FILE_LIMIT]		= limit on number of actions allowed for the profile
     * 		$arg0[CHECK_ACTION_LANG_FILE_PERIOD]	= period that the limit is set for (in hours, 0 if unlimited)
     * 		$arg0[CHECK_ACTION_LANG_FILE_PERIOD_RESTART_AT]	= time when new period begins, so counter will be reset
     *
     * 	CHECK_ACTION_RESULT_NOT_ALLOWED_BEFORE:
     *
     * 		$arg0[CHECK_ACTION_LANG_FILE_BEFORE]	= date/time since when the action is allowed
     *
     * 	CHECK_ACTION_RESULT_NOT_ALLOWED_AFTER:
     *
     * 		$arg0[CHECK_ACTION_LANG_FILE_AFTER]		= date/time since when the action is not allowed
     *
     * $aResult[CHECK_ACTION_PARAMETER] contains an additional parameter that can be considered
     * when performing the action (like the number of profiles to show in search result)
    */
    function checkAction($iProfileId, $iActionId, $bPerformAction = false)
    {
        $aResult = array();
        $aLangFileParams = array();

        $iProfileId = (int)$iProfileId;
        $iActionId = (int)$iActionId;
        $bPerformAction = $bPerformAction ? true : false;

        $aMembership = $this->getMemberMembershipInfo($iProfileId); // get current profile's membership information

        $aLangFileParams[CHECK_ACTION_LANG_FILE_MEMBERSHIP] = _t($aMembership['name']);
        $aLangFileParams[CHECK_ACTION_LANG_FILE_SITE_EMAIL] = getParam('site_email');

        $aAction = $this->oDb->getAction($aMembership['id'], $iActionId);
        if (!$aAction)
            bx_trigger_error('Unknown action ID: ' . $iActionId, 2);

        $aResult[CHECK_ACTION_PARAMETER] = $aAction['additional_param_value'];
        $aLangFileParams[CHECK_ACTION_LANG_FILE_ACTION] = !empty($aAction['title']) ? _t($aAction['title']) : $aAction['name'];

        /* Check membership action with ability to overwrite params - begin */
        $bContinue = true;
        /**
         * @hooks
         * @hookdef hook-membership-check_action 'membership', 'check_action' - hook to override the result of checking whether an action is allowed or not
         * - $unit_name - equals `membership`
         * - $action - equals `check_action`
         * - $object_id - action id
         * - $sender_id - performer profile id
         * - $extra_params - array of additional params with the following array keys:
         *      - `action` - [string] by ref, action name, can be overridden in hook processing
         *      - `perform` - [boolean] by ref, check only or mark action as performed after checking, can be overridden in hook processing
         *      - `result` - [array] by ref, check action result array, can be overridden in hook processing
         *      - `lang` - [array] by ref, array of parsable into check result message variables, can be overridden in hook processing
         *      - `continue` - [boolean] by ref, continue or not the default check operation after the hook, can be overridden in hook processing
         * @hook @ref hook-membership-check_action
         */
        bx_alert('membership', 'check_action', $iActionId, $iProfileId, array(
            'action' => &$aAction,
            'perform' => &$bPerformAction,
            'result' => &$aResult,
            'lang' => &$aLangFileParams,
            'continue' => &$bContinue,
            'action_ref' => &$aAction,
            'perform_ref' => &$bPerformAction,
            'result_ref' => &$aResult,
            'lang_ref' => &$aLangFileParams,
            'continue_ref' => &$bContinue
        ));

        if (!$bContinue)
            return $aResult;
        /* Check membership action with ability to overwrite params - end */

        /**
         * Action is not allowed for the current membership
         */
        if (is_null($aAction['id'])) {

            $sLangKey = CHECK_ACTION_MESSAGE_NOT_ALLOWED;
            if (isset($this->_aLevel2MessageMap[$aMembership['id']]))
                $sLangKey = $this->_aLevel2MessageMap[$aMembership['id']];

            $aResult[CHECK_ACTION_RESULT] = CHECK_ACTION_RESULT_NOT_ALLOWED;
            $aResult[CHECK_ACTION_MESSAGE] = _t_ext($sLangKey, $aLangFileParams);
            self::$aDenials[$aResult[CHECK_ACTION_MESSAGE]] = (int)$aMembership['id'];
            return $aResult;
        }

        /**
         * Check fixed period limitations if present (also for non-members)
         */
        if($aAction['allowed_period_start'] && time() < $aAction['allowed_period_start']) {
            $aLangFileParams[CHECK_ACTION_LANG_FILE_BEFORE] = bx_time_js($aAction['allowed_period_start'], BX_FORMAT_DATE_TIME);

            $aResult[CHECK_ACTION_RESULT] = CHECK_ACTION_RESULT_NOT_ALLOWED_BEFORE;
            $aResult[CHECK_ACTION_MESSAGE] = _t_ext(CHECK_ACTION_MESSAGE_NOT_ALLOWED_BEFORE, $aLangFileParams);

            return $aResult;
        }

        if($aAction['allowed_period_end'] && time() > $aAction['allowed_period_end']) {
            $aLangFileParams[CHECK_ACTION_LANG_FILE_AFTER] = bx_time_js($aAction['allowed_period_end'], BX_FORMAT_DATE_TIME);

            $aResult[CHECK_ACTION_RESULT] = CHECK_ACTION_RESULT_NOT_ALLOWED_AFTER;
            $aResult[CHECK_ACTION_MESSAGE] = _t_ext(CHECK_ACTION_MESSAGE_NOT_ALLOWED_AFTER, $aLangFileParams);

            return $aResult;
        }

        /**
         * if non-member, allow action without performing further checks
         */
        if ($aMembership['id'] == MEMBERSHIP_ID_NON_MEMBER) {
            $aResult[CHECK_ACTION_RESULT] = CHECK_ACTION_RESULT_ALLOWED;
            return $aResult;
        }

        /**
         * Check other limitations (for members only)
         */
        $iAllowedCnt = (int)$aAction['allowed_count']; ///< Number of allowed actions. Unlimited if not specified or 0
        $iPeriodLen = (int)$aAction['allowed_period_len']; ///< Period for AllowedCount in hours. If not specified, AllowedCount is treated as total number of actions permitted.

        if($iAllowedCnt > 0) {
            $aActionTrack = $this->oDb->getActionTrack($iActionId, $iProfileId);

            $iActionsLeft = $bPerformAction ? $iAllowedCnt - 1 : $iAllowedCnt;
            $iValidSince = time();

            /**
             * Member is requesting/performing this action for the first time,
             * and there is no corresponding record in sys_acl_actions_track table.
             */
            if(!$aActionTrack) {
                $this->oDb->insertActionTarck($iActionId, $iProfileId, $iActionsLeft, $iValidSince);

                $aResult[CHECK_ACTION_RESULT] = CHECK_ACTION_RESULT_ALLOWED;
                return $aResult;
            }

            /**
             * Action has been requested/performed at least once at this point and there is a corresponding record in sys_acl_actions_track table
             *
             * Action record in sys_acl_actions_track table is out of date.
             */
            $iPeriodEnd = (int)$aActionTrack['valid_since'] + $iPeriodLen * 3600; //ValidSince is in seconds, PeriodLen is in hours
            if($iPeriodLen > 0 && $iPeriodEnd < time()) {
                $this->oDb->updateActionTrack($iActionId, $iProfileId, $iActionsLeft, $iValidSince);

                $aResult[CHECK_ACTION_RESULT] = CHECK_ACTION_RESULT_ALLOWED;
                return $aResult;
            }

            $iActionsLeft = (int)$aActionTrack['actions_left']; ///< Action record is up to date

            /**
             * Action limit reached for now
             */
            if($iActionsLeft <= 0){
                $aLangFileParams[CHECK_ACTION_LANG_FILE_LIMIT] = $iAllowedCnt;
                $aLangFileParams[CHECK_ACTION_LANG_FILE_PERIOD] = $iPeriodLen;
                $aLangFileParams[CHECK_ACTION_LANG_FILE_PERIOD_RESTART_AT] = bx_time_js($iPeriodEnd);

                $aResult[CHECK_ACTION_RESULT] = CHECK_ACTION_RESULT_LIMIT_REACHED;
                $aResult[CHECK_ACTION_MESSAGE] = '<div class="bx-acl-err-msg">' . _t_ext(CHECK_ACTION_MESSAGE_LIMIT_REACHED, $aLangFileParams) . ($iPeriodLen > 0 ? _t_ext(CHECK_ACTION_MESSAGE_MESSAGE_EVERY_PERIOD, $aLangFileParams) : '') . '.</div>';

                return $aResult;
            }

            if($bPerformAction) {
                $iActionsLeft--;
                $this->oDb->updateActionTrack($iActionId, $iProfileId, $iActionsLeft);
            }
        }

        $aResult[CHECK_ACTION_RESULT] = CHECK_ACTION_RESULT_ALLOWED;
        return $aResult;
    }
    
    /**
     * Get the action data
     *
     * @param  int     $iProfileId     ID of a profile to get action data for
     * @param  int     $iActionId      ID of the action itself
     * @return array with action data
     */
    function getAction($iProfileId, $iActionId)
    {
        $aMembership = $this->getMemberMembershipInfo($iProfileId); // get current profile's membership information

        return $this->oDb->getAction($aMembership['id'], $iActionId);
    }

    /**
     * Get the number of allowed action
     *
     * @param  int     $iProfileId     ID of a profile that is going to perform an action
     * @param  int     $iActionId      ID of the action itself
     * @param  boolean $bPerformAction if true, then action information is updated, i.e. action is 'performed'
     * @return int if the action is countable, or true if it's not countable
     */
    function getActionNumberLeft($iProfileId, $iActionId)
    {
        $aMembership = $this->getMemberMembershipInfo($iProfileId); // get current profile's membership information

        $aAction = $this->oDb->getAction($aMembership['id'], $iActionId);
        
        $iAllowedCnt = (int)$aAction['allowed_count']; ///< Number of allowed actions. Unlimited if not specified or 0
        
        if($iAllowedCnt > 0) {
            $aActionTrack = $this->oDb->getActionTrack($iActionId, $iProfileId);
        
            if(!$aActionTrack) 
                return $iAllowedCnt;
            
           return (int)$aActionTrack['actions_left']; 
        }
        
        return true;
    }

    /**
     * Get the list of existing memberships
     *
     * @param  bool   $bPurchasableOnly if true, fetches only purchasable memberships; 'purchasable' here means that:
     *                                  - MemLevels.Purchasable = 'yes'
     *                                  - MemLevels.Active = 'yes'
     *                                  - there is at least one pricing option for the membership
     * @return array( membershipID_1 => membershipName_1,  membershipID_2 => membershipName_2, ...) if no such memberships, then just array()
     */
    function getMemberships($bPurchasableOnly = false, $bActiveOnly = false, $isTranslate = true, $bFilterOutSystemAutomaticLevels = false)
    {
        $sType = 'all_pair';
        if($bPurchasableOnly)
            $sType = 'all_active_purchasble_pair';
        else if($bActiveOnly)
            $sType = 'all_active_pair';

        $aLevels = array();
        $this->oDb->getLevels(array('type' => $sType), $aLevels, false);
        if ($isTranslate)
            foreach ($aLevels as $k => $s)
                $aLevels[$k] = _t($s);

        if ($bFilterOutSystemAutomaticLevels) {
            unset($aLevels[MEMBERSHIP_ID_NON_MEMBER]);
            unset($aLevels[MEMBERSHIP_ID_ACCOUNT]);
            unset($aLevels[MEMBERSHIP_ID_UNCONFIRMED]);
            unset($aLevels[MEMBERSHIP_ID_PENDING]);
            unset($aLevels[MEMBERSHIP_ID_SUSPENDED]);
        }

        return $aLevels;
    }

    function getMembershipsBy($aParams)
    {
        $aLevels = array();
        $this->oDb->getLevels($aParams, $aLevels, false);

        return $aLevels;
    }

    /**
     * Get info about a given membership
     *
     * @param  int    $iLevelId membership to get info about
     * @return array(
     *                         'id'					=>	ID,
     *                         'name'					=>	name,
     *                         'icon'					=>	icon,
     *                         'description'			=>	description,
     *                         'active'				=>	active,
     *                         'purchasable'			=>	purchasable,
     *                         'removable'				=>	removable
     *                         'quota_size'			=>	quota size,
     *                         'quota_number'			=>	quota number,
     *                         'quota_max_file_size'	=>	quota max file size
     *                         )
     */
    function getMembershipInfo($iLevelId)
    {
        $aLevel = array();
        $this->oDb->getLevels(array('type' => 'by_id', 'value' => $iLevelId), $aLevel, false);
        return $aLevel;
    }

    /**
     * Retrieves information about membership for a given profile at a given moment.
     *
     * If there are no memberships purchased/assigned to the
     * given profile or all of them have expired at the given point,
     * the profile is assumed to be a standard profile, and the function
     * returns	information about the Standard membership. This will
     * also happen if a profile wasnt actually registered in the database
     * at that point - the function will still return info about Standard
     * membership, not the Non-member one.
     *
     * If there is no profile with the given $iProfileId,
     * the function returns information about the Non-member or Authenticated
     * predefined membership.
     *
     * The Standard, Authenticated and Non-member memberships have their
     * DateStarts and DateExpires attributes set to NULL.
     *
     * @param  int    $iProfileId ID of a profile to get info about
     * @param  int    $time       specifies the time to use when determining membership; if not specified, the function takes the current time
     * @return array(
     *                           'id'			=> membership id,
     *                           'name'			=> membership name,
     *                           'date_starts'	=> (UNIX timestamp) date/time purchased,
     *                           'date_expires'	=> (UNIX timestamp) date/time expires
     *                           )
     */
    function getMemberMembershipInfo($iProfileId, $iTime = 0, $bClearCache = 0)
    {
        $aMembershipCurrent = $this->getMemberMembershipInfoCurrent($iProfileId, $iTime, $bClearCache);
        if (isset($this->_aStandardMemberships[$aMembershipCurrent['id']]))
            return $aMembershipCurrent;

        $aMembership = $aMembershipCurrent;
        do {
            $iDateStarts = $aMembership['date_starts'];
            $aMembership = $this->getMemberMembershipInfoCurrent($iProfileId, ((int)$iDateStarts < 1 ? 0 : $iDateStarts - 1), $bClearCache);
        }
        while($aMembership['id'] == $aMembershipCurrent['id'] && (int)$aMembership['date_starts']);

        $aMembership = $aMembershipCurrent;
        do {
            $iDateExpires = $aMembership['date_expires'];
            $aMembership = $this->getMemberMembershipInfoCurrent($iProfileId, $iDateExpires, $bClearCache);
        } while($aMembership['id'] == $aMembershipCurrent['id'] && (int)$aMembership['date_expires']);

        $aMembershipCurrent['date_starts'] = $iDateStarts;
        $aMembershipCurrent['date_expires'] = $iDateExpires;

        return $aMembershipCurrent;
    }

    /**
     * Set a membership for a profile
     *
     * @param  int     $iProfileId profile that is going to get the membership
     * @param  int     $iLevelId   membership that is going to be assigned to the profile
     *                             if $iLevelId == MEMBERSHIP_ID_STANDARD then $days and $bStartsNow parameters are not used,
     *                             so Standard membership is always set immediately and `forever`
     * @param  mixed   $mixedPeriod  number of Days to set membership for or an array with 'period'-'period unit' pair. If number or 'period' in pair equal 0, then the membership is set forever
     * @param  boolean $bStartsNow if true, the membership will start immediately if false, the membership will start after the current membership expires
     * @return boolean true in case of success, false in case of failure
     */
    /**
     * Set a profile's membership level.
     * @param $bNotify email the member about the change; false when the level is the one a new profile starts with
     */
    public function setMembership($iProfileId, $iLevelId, $mixedPeriod = 0, $bStartsNow = false, $sTransactionId = '', $bNotify = true)
    {
        $iProfileId = (int)$iProfileId;
        $iLevelId = (int)$iLevelId;
        $bStartsNow = $bStartsNow ? true : false;

        if (!$iProfileId)
            $iProfileId = -1;

        if (empty($sTransactionId))
            $sTransactionId = 'NULL';

        // check if profile exists
        if(($sProfileEmail = BxDolProfileQuery::getInstance()->getEmailById($iProfileId)) === false)
            return false;

        // check if membership exists
        $aLevel = array();
        $this->oDb->getLevels(array('type' => 'by_id', 'value' => $iLevelId), $aLevel, false);
        if(empty($aLevel) || !is_array($aLevel))
            return false;

        if($iLevelId == MEMBERSHIP_ID_NON_MEMBER)
            return false;

        $aMembershipCurrent = $this->getMemberMembershipInfo($iProfileId);
        $aMembershipLatest = $this->getMemberMembershipInfoLatest($iProfileId);

        // setting Standard membership level
        if ($iLevelId == MEMBERSHIP_ID_STANDARD) {
            if ($aMembershipCurrent['id'] == MEMBERSHIP_ID_STANDARD)
                return true;

            // delete present and future memberships
            $bResult = $this->oDb->deleteLevelByProfileId($iProfileId);
            if($bResult) {
                $this->oDb->cleanMemory('BxDolAclQuery::getLevelCurrent' . $iProfileId . time());
                unset(self::$_aCacheData[$iProfileId . '_0']);

                /**
                 * @hooks
                 * @hookdef hook-profile-unset_membership 'profile', 'unset_membership' - hook after a default membership level was set
                 * - $unit_name - equals `profile`
                 * - $action - equals `unset_membership`
                 * - $object_id - not used
                 * - $sender_id - profile id to set level to 
                 * - $extra_params - array of additional params with the following array keys:
                 *      - `mlevel` - [int] membership level id
                 * @hook @ref hook-profile-unset_membership
                 */
                bx_alert('profile', 'unset_membership', '', $iProfileId, [
                    'mlevel'=> $iLevelId
                ]);
            }

            return $bResult;
        }

        if ((is_numeric($mixedPeriod) && (int)$mixedPeriod < 0) || (is_array($mixedPeriod) && (!isset($mixedPeriod['period']) || $mixedPeriod['period'] < 0)))
            return false;

        /*
         * Make the membership starts after the latest membership expires or starts immediately 
         * if latest membership is lifetime membership or immediate start was requested.
         */
        $iDateStarts = time();
        if ($bStartsNow || empty($aMembershipLatest['date_expires'])) {
            // Delete any profile's membership level and actions traces
            $this->oDb->deleteLevelByProfileId($iProfileId, true); 
            $this->oDb->clearActionsTracksForMember($iProfileId);
            $this->oDb->cleanMemory('BxDolAclQuery::getLevelCurrent' . $iProfileId . time());
            unset(self::$_aCacheData[$iProfileId . '_0']);
        }
        else
            $iDateStarts = $aMembershipLatest['date_expires'];

        // set lifetime membership if 0 days is used.
        if(is_numeric($mixedPeriod))
            $mixedPeriod = array('period' => (int)$mixedPeriod, 'period_unit' => MEMBERSHIP_PERIOD_UNIT_DAY);

        if(!$this->oDb->insertLevelByProfileId($iProfileId, $iLevelId, $iDateStarts, $mixedPeriod, $sTransactionId))
           return false;

        $bProlong = $iLevelId == $aMembershipCurrent['id'];

        /**
         * @hooks
         * @hookdef hook-profile-set_membership 'profile', 'set_membership' - hook after a new membership level was set
         * - $unit_name - equals `profile`
         * - $action - equals `set_membership`
         * - $object_id - not used
         * - $sender_id - profile id to set level to 
         * - $extra_params - array of additional params with the following array keys:
         *      - `mlevel` - [int] membership level id
         *      - `period` - [int] number of periods
         *      - `period_unit` - [string] period unit (day, week, month, etc)
         *      - `starts_now` - [boolean] if new membership starts immediately or queued
         *      - `txn_id` - [string] related payment transaction id
         * @hook @ref hook-profile-set_membership
         */
        /**
         * @hooks
         * @hookdef hook-profile-prolong_membership 'profile', 'prolong_membership' - hook after current membership level was prolonged
         * It's equivalent to @ref hook-profile-set_membership
         * @hook @ref hook-profile-prolong_membership
         */
        bx_alert('profile', ($bProlong ? 'prolong' : 'set') . '_membership', '', $iProfileId, [
            'mlevel'=> $iLevelId, 
            'period' => $mixedPeriod['period'], 
            'period_unit' => $mixedPeriod['period_unit'], 
            'starts_now' => $bStartsNow, 
            'txn_id' => $sTransactionId
        ]);

        // audit
        $aDataForAudit = array();
        if (!empty($aMembershipCurrent))
            $aDataForAudit = array('new_membership_level' => _t($aLevel['name']), 'old_membership_level' => _t($aMembershipCurrent['name']));
        BxDolProfile::getInstance($iProfileId)->doAudit('_sys_audit_action_set_membership', $aDataForAudit);

        if(!$bNotify)
            return true;

        $oEmailTemplates = BxDolEmailTemplates::getInstance();
        // Check if there is a special email template for this membership level
        $sTemplateName = 't_Mem' . ($bProlong ? 'Prolonged' : 'Changed') . '_' . $aLevel['id'];
        if ($oEmailTemplates->getTemplate($sTemplateName) === FALSE)
            $sTemplateName = 't_Mem' . ($bProlong ? 'Prolonged' : 'Changed');

        // Send notification
        $aTemplate = $oEmailTemplates->parseTemplate($sTemplateName, array('membership_level' => _t($aLevel['name'])), 0, $iProfileId);
        if ($aTemplate)
            sendMail($sProfileEmail, $aTemplate['Subject'], $aTemplate['Body']);

        return true;
    }

    function unsetMembership($iProfileId, $iLevelId, $sTransactionId)
    {
    	return $this->oDb->deleteLevelBy(array(
    		'IDMember' => $iProfileId,
    		'IDLevel' => $iLevelId,
    		'TransactionID' => $sTransactionId
    	));
    }

    /**
     * get action id by module and name
     * @param $sAction action name
     * @param $sModule module name
     * @param $aActions array of actions from sys_acl_actions table, with default array keys (starting from 0) and text values
     */
    function getMembershipActionId($sAction, $sModule)
    {
        $this->oDb->getActions(array('type' => 'by_names_and_module', 'value' => $sAction, 'module' => $sModule), $aActions, false);
        if (count($aActions) > 1)
            trigger_error('Duplicate action - name:' . $sAction . ', module:' . $sModule, E_USER_ERROR);
        $aAction = array_pop($aActions);
        // 0 for an action the module does not have (callers test !$iActionId), without a warning.
        return isset($aAction['id']) ? $aAction['id'] : 0;
    }

    function getExpirationLetter($iProfileId, $sLevelName, $iLevelExpireDays )
    {
        $iProfileId = (int)$iProfileId;

        if(!$iProfileId)
            return false;

        $oProfileQuery = BxDolProfileQuery::getInstance();
        $sProfileEmail = $oProfileQuery->getEmailById($iProfileId);

        $aPlus = array(
            'membership_name' => _t($sLevelName),
            'expire_days' => $iLevelExpireDays,
            'page_url' => BxDolRequest::serviceExists('bx_acl', 'get_view_url') ? BxDolService::call('bx_acl', 'get_view_url') : '#'
        );

        $aTemplate = BxDolEmailTemplates::getInstance()->parseTemplate('t_MemExpiration', $aPlus, 0, $iProfileId);

        $iResult = $aTemplate && sendMail($sProfileEmail, $aTemplate['Subject'], $aTemplate['Body'], $iProfileId, $aPlus);
        return !empty($iResult);
    }

    /**
     * clear expired membership levels
     */
    public function maintenance()
    {
        return $this->oDb->maintenance();
    }

    protected function getMemberMembershipInfoCurrent($iProfileId, $iTime = 0, $bClearCache = 0)
    {
        $sKey = $iProfileId . '_' . $iTime;
        if ($bClearCache && isset(self::$_aCacheData[$sKey]))
            unset(self::$_aCacheData[$sKey]);
        elseif (array_key_exists($sKey, self::$_aCacheData) && !defined('BX_DOL_INSTALL') && !defined('BX_DOL_CRON_EXECUTE'))
            return self::$_aCacheData[$sKey];

        $aMemLevel = false;

        do {
            // get profile status
            $oProfile = BxDolProfile::getInstance($iProfileId);
            $aProfileInfo = $oProfile ? $oProfile->getInfo() : false;
            $sProfileStatus = $aProfileInfo ? $aProfileInfo['status'] : false;
            $sProfileType = $aProfileInfo ? $aProfileInfo['type'] : false;

            // account profile
            if($sProfileType == 'system') {
                $aMemLevel = $this->oDb->getLevelByIdCached(MEMBERSHIP_ID_ACCOUNT);
                if (!$aMemLevel)
                    trigger_error ('Standard member level is missing: MEMBERSHIP_ID_ACCOUNT', E_USER_ERROR);
                break;
            }

            // check if account is unconfirmed, every account's profile is unconfirmed if account is unconfirmed
            $oAccount = $aProfileInfo ? BxDolAccount::getInstance($aProfileInfo['account_id']) : false;
            if ($oAccount && !$oAccount->isConfirmed()) {
                $aMemLevel = $this->oDb->getLevelByIdCached(MEMBERSHIP_ID_UNCONFIRMED);
                if (!$aMemLevel)
                    trigger_error ('Standard member level is missing: MEMBERSHIP_ID_UNCONFIRMED', E_USER_ERROR);
                break;
            }
            
            // profile is not active, so return standard memberships according to profile status        
            if (false === $sProfileStatus || BX_PROFILE_STATUS_ACTIVE != $sProfileStatus) {                
                if (!isset($this->_aProfileStatus2LevelMap[$sProfileStatus]))
                    $iLevelId = MEMBERSHIP_ID_NON_MEMBER; // if there is no profile status - then it isn't member
                else
                    $iLevelId = $this->_aProfileStatus2LevelMap[$sProfileStatus]; // get member level id which associated with every non-active status

                $aMemLevel = $this->oDb->getLevelByIdCached($iLevelId);

                if (!$aMemLevel)
                    trigger_error ('Standard member level is missing: ' . $iLevelId, E_USER_ERROR);
                break;
            }

            // profile is active get memebr level from profile
            $aMemLevel = $this->oDb->getLevelCurrent($oProfile ? (int)$oProfile->id() : (int)$iProfileId, $iTime);

            // There are no purchased/assigned memberships for the profile or all of them have expired.
            // In this case the profile is assumed to have Standard membership.
            if (!$aMemLevel || is_null($aMemLevel['id'])) {
                $aMemLevel = $this->oDb->getLevelByIdCached(MEMBERSHIP_ID_STANDARD);
                if (!$aMemLevel)
                    trigger_error ('Standard member level is missing: ' . MEMBERSHIP_ID_NON_MEMBER, E_USER_ERROR);
                break;
            }
        } 
        while (0);

        return (self::$_aCacheData[$sKey] = $aMemLevel);
    }

    protected function getMemberMembershipInfoLatest($iProfileId, $iTime = 0, $bClearCache = 0)
    {
        $aMembershipCurrent = $this->getMemberMembershipInfoCurrent($iProfileId, $iTime, $bClearCache);
        if (isset($this->_aStandardMemberships[$aMembershipCurrent['id']]))
            return $aMembershipCurrent;

        $aMembership = $aMembershipCurrent;
        while ($aMembership['id'] != MEMBERSHIP_ID_STANDARD) {
            $aMembershipLast = $aMembership;
            if(!isset($aMembership['date_expires']) || (int)$aMembership['date_expires'] == 0)
                break;

            $aMembership = $this->getMemberMembershipInfoCurrent($iProfileId, $aMembership['date_expires'], $bClearCache);
        }

        return $aMembershipLast;
    }

    public function onProfileDelete ($iProfileId)
    {
        return $this->oDb->deleteLevelByProfileId($iProfileId, true);
    }
}

function checkAction($iProfileId, $iActionId, $bPerformAction = false)
{
    return BxDolAcl::getInstance()->checkAction($iProfileId, $iActionId, $bPerformAction);
}

function checkActionModule($iProfileId, $sActionName, $sModuleName, $bPerformAction = false)
{
    $oACL = BxDolAcl::getInstance();

    $iActionId = $oACL->getMembershipActionId($sActionName, $sModuleName);
    if (!$iActionId)
        bx_trigger_error("Unknown action: '$sActionName' in module '$sModuleName'", 1);

    return $oACL->checkAction($iProfileId, $iActionId, $bPerformAction);
}

function getActionModule($iProfileId, $sActionName, $sModuleName)
{
    $oACL = BxDolAcl::getInstance();

    $iActionId = $oACL->getMembershipActionId($sActionName, $sModuleName);
    if (!$iActionId)
        bx_trigger_error("Unknown action: '$sActionName' in module '$sModuleName'", 1);

    return $oACL->getAction($iProfileId, $iActionId);
}

function getActionNumberLeftModule($iProfileId, $sActionName, $sModuleName)
{
    $oACL = BxDolAcl::getInstance();

    $iActionId = $oACL->getMembershipActionId($sActionName, $sModuleName);
    if (!$iActionId)
        bx_trigger_error("Unknown action: '$sActionName' in module '$sModuleName'", 1);

    return $oACL->getActionNumberLeft($iProfileId, $iActionId);
}

/** @} */
