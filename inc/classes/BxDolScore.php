<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

bx_import('BxDolAcl');

define('BX_DOL_SCORE_USAGE_BLOCK', 'block');
define('BX_DOL_SCORE_USAGE_INLINE', 'inline');
define('BX_DOL_SCORE_USAGE_DEFAULT', BX_DOL_SCORE_USAGE_BLOCK);

define('BX_DOL_SCORE_DO_UP', 'up');
define('BX_DOL_SCORE_DO_DOWN', 'down');

/**
 * Score for any content
 *
 * Related classes:
 * - BxDolScoreQuery - vote database queries
 * - BxBaseScore - vote base representation
 * - BxTemplScore - custom template representation
 *
 * AJAX vote for any content. Stars and Plus based representations are supported.
 *
 * To add vote section to your feature you need to add a record to 'sys_objects_vote' table:
 *
 * - ID - autoincremented id for internal usage
 * - Name - your unique module name, with vendor prefix, lowercase and spaces are underscored
 * - TableMain - table name where summary votigs are stored
 * - TableTrack - table name where each vote is stored
 * - PostTimeout - number of seconds to not allow duplicate vote
 * - MinValue - min vote value, 1 by default
 * - MaxValue - max vote value, 5 by default
 * - IsUndo - is Undo enabled for Plus based votes
 * - IsOn - is this vote object enabled
 * - TriggerTable - table to be updated upon each vote
 * - TriggerFieldId - TriggerTable table field with unique record id, primary key
 * - TriggerFieldRate - TriggerTable table field with average rate
 * - TriggerFieldRateCount - TriggerTable table field with votes count
 * - ClassName - your custom class name, if you overrride default class
 * - ClassFile - your custom class path
 *
 * You can refer to BoonEx modules for sample record in this table.
 *
 *
 *
 * @section example Example of usage:
 * To get Star based vote you need to have different values for MinValue and MaxValue (for example 1 and 5)
 * and IsUndo should be equal to 0. To get Plus(Like) based vote you need to have equal values
 * for MinValue and MaxValue (for example 1) and IsUndo should be equal to 1. After filling the other
 * paramenters in the table you can show vote in any place, using the following code:
 * @code
 * $o = BxDolScore::getObjectInstance('system object name', $iYourEntryId);
 * if (!$o->isEnabled()) return '';
 *     echo $o->getElementBlock();
 * @endcode
 *
 *
 * @section acl Memberships/ACL:
 * - vote
 *
 *
 *
 * @section alerts Alerts:
 * Alerts type/unit - every module has own type/unit, it equals to ObjectName.
 * The following alerts are rised:
 *
 * - rate - comment was posted
 *      - $iObjectId - entry id
 *      - $iSenderId - rater user id
 *      - $aExtra['rate'] - rate
 *
 */

class BxDolScore extends BxDolObjectVote
{
    protected static $_sCounterStyleSimple = 'simple'; // total counter only.
    protected static $_sCounterStyleDivided = 'divided'; // counters [icon + counter] divided by action (up/down).

    protected function __construct($sSystem, $iId, $iInit = true, $oTemplate = false)
    {
        parent::__construct($sSystem, $iId, $iInit, $oTemplate);
        if(empty($this->_sSystem))
            return;

        $this->_oQuery = new BxDolScoreQuery($this);
    }

    /**
     * get votes object instanse
     * @param $sSys vote object name
     * @param $iId associated content id, where vote is available
     * @param $iInit perform initialization
     * @return null on error, or ready to use class instance
     */
    public static function getObjectInstance($sSys, $iId, $iInit = true, $oTemplate = false)
    {
        $sKey = 'BxDolScore!' . $sSys . $iId . ($oTemplate ? $oTemplate->getClassName() : '');
        if(isset($GLOBALS['bxDolClasses'][$sKey]))
            return $GLOBALS['bxDolClasses'][$sKey];

        $aSystems = self::getSystems();
        if(!isset($aSystems[$sSys]))
            return null;

        $sClassName = 'BxTemplScore';
        if(!empty($aSystems[$sSys]['class_name'])) {
            $sClassName = $aSystems[$sSys]['class_name'];
            if(!empty($aSystems[$sSys]['class_file']))
                require_once(BX_DIRECTORY_PATH_ROOT . $aSystems[$sSys]['class_file']);
        }

        $o = new $sClassName($sSys, $iId, $iInit, $oTemplate);
        return ($GLOBALS['bxDolClasses'][$sKey] = $o);
    }

    public static function &getSystems()
    {
        $sKey = 'bx_dol_cache_memory_score_systems';

        if(!isset($GLOBALS[$sKey]))
            $GLOBALS[$sKey] = BxDolDb::getInstance()->fromCache('sys_objects_score', 'getAllWithKey', '
                SELECT
                    `id` as `id`,
                    `name` AS `name`,
                    `module` AS `module`,
                    `table_main` AS `table_main`,
                    `table_track` AS `table_track`,
                    `post_timeout` AS `post_timeout`,
                    `pruning` AS `pruning`,
                    `is_undo` AS `is_undo`,
                    `is_on` AS `is_on`,
                    `trigger_table` AS `trigger_table`,
                    `trigger_field_id` AS `trigger_field_id`,
                    `trigger_field_author` AS `trigger_field_author`,
                    `trigger_field_score` AS `trigger_field_score`,
                    `trigger_field_cup` AS `trigger_field_cup`,
                    `trigger_field_cdown` AS `trigger_field_cdown`,
                    `class_name` AS `class_name`,
                    `class_file` AS `class_file`
                FROM `sys_objects_score`', 'name');

        return $GLOBALS[$sKey];
    }

    public function isPerformed($iObjectId, $iAuthorId, $iAuthorIp = 0)
    {
        return parent::isPerformed($iObjectId, $iAuthorId) && !$this->_oQuery->isPostTimeoutEnded($iObjectId, $iAuthorId, $iAuthorIp);        
    }


    /**
     * Interface functions for outer usage
     */
    public function getStatCounterUp()
    {
        $aScore = $this->_getVote();
        return $aScore['count_up'];
    }

    public function getStatCounterDown()
    {
        $aScore = $this->_getVote();
        return $aScore['count_down'];
    }

    public function getStatScore()
    {
        $aScore = $this->_getVote();
        return $aScore['score'];
    }

    public function getSocketName()
    {
        return $this->_sSystem . '_scores';
    }

    /**
     * Actions functions
     */
    public function actionVoteUp()
    {
        if(!$this->isEnabled())
            return echoJson(array('code' => 1, 'message' => _t('_sys_score_err_not_enabled')));
        
        $aVoteData = ['type' => BX_DOL_SCORE_DO_UP];
        $aRequestParamsData = $this->_getRequestParamsData();
        
        return echoJson($this->vote($aVoteData, $aRequestParamsData));
    }

    public function actionVoteDown()
    {
        if(!$this->isEnabled())
            return echoJson(array('code' => 1, 'message' => _t('_sys_score_err_not_enabled')));

        $aVoteData = ['type' => BX_DOL_SCORE_DO_DOWN];
        $aRequestParamsData = $this->_getRequestParamsData();

        return echoJson($this->vote($aVoteData, $aRequestParamsData));
    }

    public function actionGetVotedBy()
    {
        if (!$this->isEnabled())
           return '';

        $aParams = $this->_getRequestParamsData();

        if(($sType = bx_get('type')) !== false) {
            $sType = bx_process_input($sType);

            if(in_array($sType, [BX_DOL_SCORE_DO_UP, BX_DOL_SCORE_DO_DOWN]))
                $aParams['type'] = $sType;
        }

        return $this->_getVotedBy($aParams);
    }

    public function vote($aVoteData = [], $aRequestParamsData = [])
    {
        if(!$this->isAllowedVote(true))
            return ['code' => BX_DOL_OBJECT_ERR_ACCESS_DENIED, 'message' => $this->msgErrAllowedVote()];

        $sType = $aVoteData['type'];
        $iObjectId = $this->getId();
        $iObjectAuthorId = $this->getObjectAuthorId($iObjectId);
        $iAuthorId = $this->_getAuthorId();
        $iAuthorIp = $this->_getAuthorIp();

        $bUndo = $this->isUndo();
        $bVoted = $this->isPerformed($iObjectId, $iAuthorId, $iAuthorIp);
        $bPerformUndo = $bVoted && $bUndo;

        if(!$bPerformUndo && !$this->isAllowedVote())
            return ['code' => BX_DOL_OBJECT_ERR_ACCESS_DENIED, 'message' => $this->msgErrAllowedVote()];

        if($bVoted && !$bUndo)
            return ['code' => BX_DOL_OBJECT_ERR_DUPLICATE, 'message' => _t('_sys_score_err_duplicate_vote')];

        if($bPerformUndo) {
            $aTrack = $this->_getTrack($iObjectId, $iAuthorId);
            if(!empty($aTrack) && is_array($aTrack))
                $aVoteData = array_intersect_key($aTrack, $aVoteData);
        }

        $iId = $this->_putVoteData($iObjectId, $iAuthorId, $iAuthorIp, $aVoteData, $bPerformUndo);
        if($iId === false)
            return ['code' => BX_DOL_OBJECT_ERR_CANNOT_PERFORM];

        if(!$bPerformUndo)
            $this->isAllowedVote(true);

        $this->_trigger();

        $sTypeUc = ucfirst($sType);
        $aAlertExtras = [
            'object_author_id' => $iObjectAuthorId,
            'source' => 'sys_score_' . $iId,
            'source_mac' => 'sys_score_' . $iAuthorId . '_' . $iId,
        ];
        /**
         * @hooks
         * @hookdef hook-bx_dol_score-doVoteUp '{object_name}', 'doVoteUp' - hook after score vote 
         * - $unit_name - score object name
         * - $action - equals `doVoteUp`
         * - $object_id - object id which got a vote
         * - $sender_id - profile id who voted
         * - $extra_params - array of additional params with the following array keys:
         *      - `score_id` - [int] vote id
         *      - `score_author_id` - [int] profile id who voted
         *      - `object_author_id` - [int] author id of the object which got a vote
         * @hook @ref hook-bx_dol_score-doVoteUp
         */
        /**
         * @hooks
         * @hookdef hook-bx_dol_score-doVoteDown '{object_name}', 'doVoteDown' - hook after score vote 
         * It's equivalent to @ref hook-bx_dol_score-doVoteUp
         * @hook @ref hook-bx_dol_score-doVoteDown
         */
        /**
         * @hooks
         * @hookdef hook-bx_dol_score-undoVoteUp '{object_name}', 'undoVoteUp' - hook after undo score vote 
         * It's equivalent to @ref hook-bx_dol_score-doVoteUp
         * @hook @ref hook-bx_dol_score-undoVoteUp
         */
        /**
         * @hooks
         * @hookdef hook-bx_dol_score-undoVoteDown '{object_name}', 'undoVoteDown' - hook after undo score vote 
         * It's equivalent to @ref hook-bx_dol_score-doVoteUp
         * @hook @ref hook-bx_dol_score-undoVoteDown
         */
        bx_alert($this->_sSystem, ($bPerformUndo ? 'un' : '') . 'doVote' . $sTypeUc, $iObjectId, $iAuthorId, array_merge([
            'score_id' => $iId, 
            'score_author_id' => $iAuthorId
        ], $aAlertExtras));

        /**
         * @hooks
         * @hookdef hook-score-doUp 'score', 'doUp' - hook after score vote 
         * - $unit_name - equals `score`
         * - $action - equals `doUp`
         * - $object_id - score vote id
         * - $sender_id - profile id who voted
         * - $extra_params - array of additional params with the following array keys:
         *      - `object_system` - [string] vote object name
         *      - `object_id` - [int] object id which got a vote
         *      - `object_author_id` - [int] author id of the object which got a vote
         * @hook @ref hook-score-doUp
         */
        /**
         * @hooks
         * @hookdef hook-score-doDown 'score', 'doDown' - hook after score vote 
         * It's equivalent to @ref hook-score-doUp
         * @hook @ref hook-score-doDown
         */
        /**
         * @hooks
         * @hookdef hook-score-undoUp 'score', 'undoUp' - hook after undo score vote 
         * It's equivalent to @ref hook-score-doUp
         * @hook @ref hook-score-undoUp
         */
        /**
         * @hooks
         * @hookdef hook-score-undoDown 'score', 'undoDown' - hook after undo score vote 
         * It's equivalent to @ref hook-score-doUp
         * @hook @ref hook-score-undoDown
         */
        bx_alert('score', ($bPerformUndo ? 'un' : '') . 'do' . $sTypeUc, $iId, $iAuthorId, array_merge([
            'object_system' => $this->_sSystem, 
            'object_id' => $iObjectId
        ], $aAlertExtras));

        $aRequestParamsData['show_script'] = false;

        $bVoted = !$bVoted;
        $aScore = $this->_getVote($iObjectId, true);
        $iCup = (int)$aScore['count_up'];
        $iCdown = (int)$aScore['count_down'];

        $aResult = [
            'code' => 0,
            'type' => $sType,
            'score' => $aScore['score'],
            'scoref' => $iCup > 0 || $iCdown > 0 ? $this->_getCounterLabel($aScore['score'], $aRequestParamsData) : '',
            'cup' => $iCup,
            'cdown' => $iCdown,
            'counter' => $this->getCounter($aRequestParamsData),
            'label_icon' => $this->_getIconDo($sType),
            'label_title' => _t($this->_getTitleDo($sType)),
            'voted' => $bVoted,
            'disabled' => $bVoted && !$bUndo,
        ];

        $aResult['api'] = [
            'performer_id' => $iAuthorId,
            'is_voted' => $aResult['voted'], //TODO: Remove after 14.0.0-RC3 is released.
            'is_disabled' => $aResult['disabled'], //TODO: Remove after 14.0.0-RC3 is released.
            $sType => [
                'is_voted' => $aResult['voted'],
                'is_disabled' => $aResult['disabled'],
                'icon' => $aResult['label_icon'],
                'title' => $aResult['label_title'],
            ],
            'counter' => $this->getVote()
        ];

        if(($oSockets = BxDolSockets::getInstance()) && $oSockets->isEnabled())
            $oSockets->sendEvent($this->getSocketName(), $iObjectId, 'voted', json_encode($this->_returnVoteDataForSocket($aResult)));

        return $aResult;
    }

    /**
     * Internal functions
     */
    protected function _isAllowedVoteByObject($aObject)
    {
        return bx_srv($this->_aSystem['module'], 'check_allowed_view_for_profile', [$aObject]) === CHECK_ACTION_RESULT_ALLOWED;
    }

    protected function _putVoteData($iObjectId, $iAuthorId, $iAuthorIp, $aData, $bPerformUndo)
    {
        return $this->_oQuery->putVote($iObjectId, $iAuthorId, $iAuthorIp, $aData, $bPerformUndo);
    }

    protected function _returnVoteDataForSocket($aData, $aMask = [])
    {
        if(empty($aMask) || !is_array($aMask))
            $aMask = ['code', 'type', 'score', 'scoref', 'cup', 'cdown', 'counter', 'api'];

        return array_intersect_key($aData, array_flip($aMask));
    }

    protected function _isVote($iObjectId = 0, $bForceGet = false)
    {
        $aScore = $this->_getVote($iObjectId, $bForceGet);

        return $this->_isCount($aScore);
    }

    protected function _isCount($aScore = [])
    {
        if(empty($aScore))
            $aScore = $this->_getVote();

        return (isset($aScore['count_up']) && (int)$aScore['count_up'] != 0) || (isset($aScore['count_down']) && (int)$aScore['count_down'] != 0);
    }

    /**
     * Note. By default image based controls aren't used.
     * Therefore it can be overwritten in custom template.
     */
    protected function _getImageDo($sType)
    {
        $sResult = '';

        switch($sType) {
            case BX_DOL_SCORE_DO_UP:
                $sResult = '';
                break;
            case BX_DOL_SCORE_DO_DOWN:
                $sResult = '';
                break;
        }

    	return $sResult;
    }

    protected function _getIconDo($sType = '')
    {
        $sResult = '';

        switch($sType) {
            case BX_DOL_SCORE_DO_UP:
                $sResult = 'arrow-up';
                break;

            case BX_DOL_SCORE_DO_DOWN:
                $sResult = 'arrow-down';
                break;

            default:
                $sResult = 'arrows-alt-v';
        }

    	return $sResult;
    }

    protected function _getTitleDo($sType)
    {
        $sResult = '';

        switch($sType) {
            case BX_DOL_SCORE_DO_UP:
                $sResult = '_sys_score_do_up';
                break;
            case BX_DOL_SCORE_DO_DOWN:
                $sResult = '_sys_score_do_down';
                break;
        }

    	return $sResult;
    }

    protected function _getTitleDoBy()
    {
    	return '_sys_score_do_by';
    }

    protected function _encodeElementParams($aParams)
    {
        if(empty($aParams) || !is_array($aParams))
            return '';

        return urlencode(base64_encode(json_encode($aParams)));
    }

    protected function _decodeElementParams($sParams, $bMergeWithDefaults = true)
    {
        $aParams = array();
        if(!empty($sParams))
            $aParams = json_decode(base64_decode(urldecode($sParams)), true);

        if(empty($aParams) || !is_array($aParams))
            $aParams = array();

        if($bMergeWithDefaults)
            $aParams = array_merge($this->_aElementDefaults, $aParams);

        return $aParams;
    }
}

/** @} */
