<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

bx_import('BxDolAcl');

define('BX_DOL_VOTE_TYPE_STARS', 'stars');
define('BX_DOL_VOTE_TYPE_LIKES', 'likes');
define('BX_DOL_VOTE_TYPE_REACTIONS', 'reactions');

define('BX_DOL_VOTE_USAGE_BLOCK', 'block');
define('BX_DOL_VOTE_USAGE_INLINE', 'inline');
define('BX_DOL_VOTE_USAGE_DEFAULT', BX_DOL_VOTE_USAGE_BLOCK);

/**
 * Vote for any content
 *
 * Related classes:
 * - BxDolVoteQuery - vote database queries
 * - BxBaseVote - vote base representation
 * - BxTemplVote - custom template representation
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
 * $o = BxDolVote::getObjectInstance('system object name', $iYourEntryId);
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

class BxDolVote extends BxDolObjectVote
{
    protected $_sType;

    protected function __construct($sSystem, $iId, $iInit = true, $oTemplate = false)
    {
        parent::__construct($sSystem, $iId, $iInit, $oTemplate);
        if(empty($this->_sSystem))
            return;
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
        $sKey = 'BxDolVote!' . $sSys . $iId . ($oTemplate ? $oTemplate->getClassName() : '');
        if(isset($GLOBALS['bxDolClasses'][$sKey]))
            return $GLOBALS['bxDolClasses'][$sKey];

        $aSystems = self::getSystems();
        if(!isset($aSystems[$sSys]))
            return null;

        $sClassName = 'BxTemplVoteLikes';
        if(!empty($aSystems[$sSys]['class_name'])) {
            $sClassName = $aSystems[$sSys]['class_name'];
            if(!empty($aSystems[$sSys]['class_file']))
                require_once(BX_DIRECTORY_PATH_ROOT . $aSystems[$sSys]['class_file']);
        }

        $o = new $sClassName($sSys, $iId, false, $oTemplate);
        if($iInit && method_exists($o, 'init'))
            $o->init($iId);

        return ($GLOBALS['bxDolClasses'][$sKey] = $o);
    }

    public static function &getSystems()
    {
        $sKey = 'bx_dol_cache_memory_vote_systems';

        if(!isset($GLOBALS[$sKey]))
            $GLOBALS[$sKey] = BxDolDb::getInstance()->fromCache('sys_objects_vote', 'getAllWithKey', '
                SELECT
                    `ID` as `id`,
                    `Name` AS `name`,
                    `Module` AS `module`,
                    `TableMain` AS `table_main`,
                    `TableTrack` AS `table_track`,
                    `PostTimeout` AS `post_timeout`,
                    `MinValue` AS `min_value`,
                    `MaxValue` AS `max_value`,
                    `Pruning` AS `pruning`,
                    `IsUndo` AS `is_undo`,
                    `IsOn` AS `is_on`,
                    `TriggerTable` AS `trigger_table`,
                    `TriggerFieldId` AS `trigger_field_id`,
                    `TriggerFieldAuthor` AS `trigger_field_author`,
                    `TriggerFieldRate` AS `trigger_field_rate`,
                    `TriggerFieldRateCount` AS `trigger_field_count`,
                    `ClassName` AS `class_name`,
                    `ClassFile` AS `class_file`
                FROM `sys_objects_vote`', 'name');

        return $GLOBALS[$sKey];
    }


    /**
     * Interface functions for outer usage
     */
    public function getType()
    {
        return $this->_sType;
    }

    public function getMinValue()
    {
        return (int)$this->_aSystem['min_value'];
    }

    public function getMaxValue()
    {
        return (int)$this->_aSystem['max_value'];
    }

    public function getStatCounter()
    {
        $aVote = $this->_getVote();
        return $aVote['count'];
    }

    public function getStatRate()
    {
        $aVote = $this->_getVote();
        return $aVote['rate'];
    }

    public function getSocketName()
    {
        return $this->_sSystem . '_' . $this->_sType;
    }

    /**
     * Actions functions
     */
    public function actionVote()
    {
        if(!$this->isEnabled())
            return echoJson(['code' => BX_DOL_OBJECT_ERR_NOT_AVAILABLE, 'message' => _t('_vote_err_not_enabled')]);

        $aVoteData = $this->_getVoteData();
        $aRequestParamsData = $this->_getRequestParamsData();
        if($aVoteData === false)
            return echoJson(['code' => BX_DOL_OBJECT_ERR_WRONG_DATE]);

        return echoJson($this->vote($aVoteData, $aRequestParamsData));
    }

    public function vote($aVoteData = [], $aRequestParamsData = [])
    {
        $iObjectId = $this->getId();
        $iObjectAuthorId = $this->getObjectAuthorId($iObjectId);
        $iAuthorId = $this->_getAuthorId();
        $iAuthorIp = $this->_getAuthorIp();

        $bUndo = $this->isUndo();
        $bVoted = $this->isPerformed($iObjectId, $iAuthorId);
        $bPerformUndo = $bVoted && $bUndo;

        if(!$bPerformUndo && !$this->isAllowedVote())
            return ['code' => BX_DOL_OBJECT_ERR_ACCESS_DENIED, 'message' => $this->msgErrAllowedVote()];

        if($this->_isDuplicate($iObjectId, $iAuthorId, $iAuthorIp, $bVoted))
            return ['code' => BX_DOL_OBJECT_ERR_DUPLICATE, 'message' => _t('_vote_err_duplicate_vote')];

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

        $aAlertExtras = [
            'object_author_id' => $iObjectAuthorId,
            'source' => 'sys_vote_' . $iId,
            'source_mac' => 'sys_vote_' . $iAuthorId . '_' . $iId,
        ];
        /**
         * @hooks
         * @hookdef hook-vote-undo 'vote', 'undo' - hook on cancel vote 
         * - $unit_name - equals `vote`
         * - $action - equals `undo` 
         * - $object_id - vote id 
         * - $sender_id - profile_id for vote's author
         * - $extra_params - array of additional params with the following array keys:
         *      - `object_system` - [string] system name, ex: bx_posts
         *      - `object_id` - [int] reported object id 
         *      - `object_author_id` - [int] author's profile_id for reported object_id 
         * @hook @ref hook-vote-undo
         */
        bx_alert($this->_sSystem, ($bPerformUndo ? 'un' : '') . 'doVote', $iObjectId, $iAuthorId, array_merge([
            'vote_id' => $iId, 
            'vote_author_id' => $iAuthorId
        ], $aAlertExtras, $aVoteData));
        /**
         * @hooks
         * @hookdef hook-vote-do 'vote', 'do' - hook on new vote 
         * - $unit_name - equals `vote`
         * - $action - equals `do` 
         * - $object_id - vote id 
         * - $sender_id - profile_id for vote's author
         * - $extra_params - array of additional params with the following array keys:
         *      - `object_system` - [string] system name, ex: bx_posts
         *      - `object_id` - [int] reported object id 
         *      - `object_author_id` - [int] author's profile_id for reported object_id 
         * @hook @ref hook-vote-do
         */
        bx_alert('vote', ($bPerformUndo ? 'un' : '') . 'do', $iId, $iAuthorId, array_merge([
            'object_system' => $this->_sSystem, 
            'object_id' => $iObjectId
        ], $aAlertExtras, $aVoteData));

        $aResult = $this->_returnVoteData($iObjectId, $iAuthorId, $iAuthorIp, $aVoteData, !$bVoted, $aRequestParamsData);

        if(($oSockets = BxDolSockets::getInstance()) && $oSockets->isEnabled())
            $oSockets->sendEvent($this->getSocketName(), $iObjectId, 'voted', json_encode($this->_returnVoteDataForSocket($aResult)));

        return $aResult;
    }

    public function actionGetVotedBy()
    {
        if (!$this->isEnabled())
           return '';

        return $this->_getVotedBy();
    }


    /**
     * Internal functions
     */
    protected function _isDuplicate($iObjectId, $iAuthorId, $iAuthorIp, $bVoted)
    {
        return false;
    }

    protected function _isCount($aVote = array())
    {
        if(empty($aVote))
            $aVote = $this->_getVote();

        return isset($aVote['count']) && (int)$aVote['count'] != 0;
    }

    protected function _isAllowedVoteByObject($aObject)
    {
        return bx_srv($this->_aSystem['module'], 'check_allowed_view_for_profile', [$aObject]) === CHECK_ACTION_RESULT_ALLOWED;
    }

    protected function _getVoteData()
    {
        $iValue = bx_get('value');
        if($iValue === false)
            return false;

        $iValue = bx_process_input($iValue, BX_DATA_INT);

        $iMinValue = $this->getMinValue();
        if($iValue < $iMinValue)
            $iValue = $iMinValue;

        $iMaxValue = $this->getMaxValue();
        if($iValue > $iMaxValue)
            $iValue = $iMaxValue;

        return array('value' => $iValue);
    }

    protected function _putVoteData($iObjectId, $iAuthorId, $iAuthorIp, $aData, $bPerformUndo)
    {
        return $this->_oQuery->putVote($iObjectId, $iAuthorId, $iAuthorIp, $aData, $bPerformUndo);
    }

    protected function _returnVoteData($iObjectId, $iAuthorId, $iAuthorIp, $aData, $bVoted, $aParams = [])
    {
        $bUndo = $this->isUndo();
        $aVote = $this->_getVote($iObjectId, true);

        $aResult = [
            'code' => 0,
            'rate' => $aVote['rate'],
            'count' => $aVote['count'],
            'countf' => (int)$aVote['count'] > 0 ? $this->_getCounterLabel($aVote['count'], $aParams) : '',
            'label_use' => $this->_useIconAs($aParams),
            'label_icon' => $this->_getIconDo($bVoted),
            'label_emoji' => $this->_getEmojiDo($bVoted),
            'label_image' => $this->_getImageDo($bVoted),
            'label_title' => _t($this->_getTitleDo($bVoted)),
            'voted' => $bVoted,
            'disabled' => $bVoted && !$bUndo,
        ];

        $aResult['api'] = [
            'performer_id' => $iAuthorId,
            'is_voted' => $aResult['voted'],
            'is_disabled' => $aResult['disabled'],
            'value' => $aResult['voted'] ? $aData['value'] : 0,
            'icon' => $aResult['label_emoji'],
            'title' => $aResult['label_title'],
            'counter' => $this->getVote()
        ];

        return $aResult;
    }

    protected function _returnVoteDataForSocket($aData, $aMask = [])
    {
        if(empty($aMask) || !is_array($aMask))
            $aMask = ['code', 'rate', 'count', 'countf', 'api'];

        return array_intersect_key($aData, array_flip($aMask));
    }

    protected function _prepareRequestParamsData($aParams, $aParamsAdd = array())
    {
        if(isset($aParams['is_voted']))
            $aParamsAdd['is_voted'] = $aParams['is_voted'];

        return parent::_prepareRequestParamsData($aParams, $aParamsAdd);
    }

    protected function _isVote($iObjectId = 0, $bForceGet = false)
    {
        $aVote = $this->_getVote($iObjectId, $bForceGet);

        return (int)$aVote['count'] > 0;
    }

    protected function _getIconDo($bVoted)
    {
    	return '';
    }

    protected function _getImageDo($bVoted)
    {
        return '';
    }

    protected function _getEmojiDo($bVoted)
    {
    	return '';
    }

    protected function _getTitleDo($bVoted)
    {
    	return '';
    }

    protected function _getTitleDoBy($aParams = [])
    {
    	return _t('_vote_do_by');
    }

    protected function _useIconAs($aParams = [])
    {
    	return 'emoji';
    }
}

/** @} */
