<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Like based votes for any content
 */
class BxDolVoteReactions extends BxTemplVote
{
    protected static $_sCounterStyleSimple = 'simple'; // total counter only.
    protected static $_sCounterStyleDivided = 'divided'; // counters [icon + counter] divided by reactions.
    protected static $_sCounterStyleCompound = 'compound'; // total counter with a list of reaction icons.

    public static $sModeSolo = 'solo'; // one reaction (the default one), cast with a click.
    public static $sModeFew = 'few'; // the reactions list.
    public static $sModeMany = 'many'; // the reactions list plus any emoji.

    public static $iPerUserMax = 5; // most reactions one person may give to one object.

    protected static $_sEmojiCodePrefix = 'e_'; // free-picked emoji are stored as e_<hex code points>.
    protected static $_iReactionLengthMax = 32; // the `reaction` column is varchar(32).

    protected $_sMenuDoVote; //--- Do vote (reaction)  menu name.

    protected $_sDataList; //--- Reactions list name.
    protected $_aDataList; //--- Reactions list with all reactions.

    protected $_sDefault; //--- Default reaction name.

    protected $_bQuickMode; //--- Give 'default' reaction when clicked (a default reaction is set).
    protected $_bSingleMode; //--- Only one reaction is available (Solo mode, or one item in Reactions list).

    protected $_sMode; //--- Reactions mode: solo, few or many.
    protected $_sDefaultReaction; //--- Default reaction name from settings, '' when there is none.
    protected $_iPerUser; //--- How many different reactions one person may give to one object.
    protected $_bSplitCounters; //--- Show a counter per reaction instead of one total.

    public function __construct($sSystem, $iId, $iInit = true, $oTemplate = false)
    {
        parent::__construct($sSystem, $iId, $iInit, $oTemplate);

        $this->_oQuery = new BxDolVoteReactionsQuery($this);
        $this->_sType = BX_DOL_VOTE_TYPE_REACTIONS;

        $this->_sMenuDoVote = 'sys_vote_reactions_do';

        $this->_sDataList = 'sys_vote_reactions';
        $this->_aDataList = [];

        $this->_sDefault = 'default';

        $this->_sMode = getParam('sys_vote_reactions_mode');
        if(!in_array($this->_sMode, [self::$sModeSolo, self::$sModeFew, self::$sModeMany]))
            $this->_sMode = self::$sModeFew;

        $this->_sDefaultReaction = trim((string)getParam('sys_vote_reactions_default'));

        $this->_iPerUser = $this->_sMode == self::$sModeSolo ? 1 : max(1, min(self::$iPerUserMax, (int)getParam('sys_vote_reactions_per_user')));

        $this->_bSplitCounters = getParam('sys_vote_reactions_split_counters') == 'on';
    }

    public function init($iId)
    {
        if(!parent::init($iId))
            return false;

        $aReactions = BxDolFormQuery::getDataItems($this->_sDataList, false, BX_DATA_VALUES_ALL);

        $sPlaceholder = ''; //--- The reaction which carries the 'not voted yet' look in its data.
        foreach($aReactions as $sReaction => $aReaction) {
            $aData = !empty($aReaction['Data']) ? unserialize($aReaction['Data']) : array();

            if(!empty($aData['default']))
                $sPlaceholder = $sReaction;

            $this->_aDataList[$sReaction] = array(
                'name' => $sReaction,
                'title' => $aReaction['LKey'],
                'title_aux' => $aReaction['LKey2'],
                'use' => isset($aData['use']) ? $aData['use'] : 'emoji',
                'icon' => isset($aData['icon']) ? $aData['icon'] : '',
                'emoji' => isset($aData['emoji']) ? $aData['emoji'] : '',
                'image' => isset($aData['image']) ? $aData['image'] : '',
                'color' => isset($aData['color']) ? $aData['color'] : '',
                'weight' => isset($aData['weight']) ? $aData['weight'] : 1,
                'default' => isset($aData['default']) ? $aData['default'] : '',
            );
        }

        //--- The default reaction must be on the list.
        if($this->_sDefaultReaction !== '' && !isset($this->_aDataList[$this->_sDefaultReaction]))
            $this->_sDefaultReaction = '';

        //--- Solo: only the default reaction (or the first one on the list) is available.
        if($this->_sMode == self::$sModeSolo && !empty($this->_aDataList)) {
            if($this->_sDefaultReaction === '')
                $this->_sDefaultReaction = (string)key($this->_aDataList);

            $this->_aDataList = [$this->_sDefaultReaction => $this->_aDataList[$this->_sDefaultReaction]];
        }

        $this->_bSingleMode = count($this->_aDataList) == 1;
        $this->_bQuickMode = $this->_sDefaultReaction !== '';

        //--- The 'default' item is what the do-button shows before a vote: the default
        //--- reaction, or the 'not voted yet' look (e.g. 'React' with a smile) when there is none.
        $sBase = $this->_sDefaultReaction;
        if($sBase === '')
            $sBase = $sPlaceholder !== '' && isset($this->_aDataList[$sPlaceholder]) ? $sPlaceholder : (string)key($this->_aDataList);

        if($sBase !== '' && isset($this->_aDataList[$sBase])) {
            $aDefault = $this->_aDataList[$sBase];
            if(!$this->_bQuickMode && !$this->_bSingleMode && !empty($aDefault['default'])) {
                if(is_array($aDefault['default']))
                    $aDefault = array_merge ($aDefault, $aDefault['default']);
                else
                    $aDefault['icon'] = $aDefault['default'];
            }

            $this->_aDataList[$this->_sDefault] = $aDefault;
        }
    }
    /**
     * Interface functions for outer usage
     */
    public function getValue()
    {
        return (int)$this->_aSystem['min_value'];
    }

    public function getDefault()
    {
        return $this->_sDefault;
    }

    /**
     * Default reaction name from settings, '' when there is none.
     */
    public function getDefaultReaction()
    {
        return $this->_sDefaultReaction;
    }

    public function getMode()
    {
        return $this->_sMode;
    }

    public function getPerUser()
    {
        return $this->_iPerUser;
    }

    public function isSplitCounters()
    {
        return $this->_bSplitCounters;
    }

    /**
     * Any emoji may be given, not only the reactions on the list.
     */
    public function isFreeEmojiAllowed()
    {
        return $this->_sMode == self::$sModeMany;
    }

    public function getReaction($sName)
    {
        if(!empty($this->_aDataList[$sName]))
            return $this->_aDataList[$sName];

        //--- A free-picked emoji (Many mode), stored under its code.
        $sEmoji = self::decodeEmoji($sName);
        if($sEmoji === false)
            return false;

        return [
            'name' => $sName,
            'title' => $sEmoji,
            'title_aux' => '',
            'use' => 'emoji',
            'icon' => '',
            'emoji' => $sEmoji,
            'image' => '',
            'color' => '',
            'weight' => 1,
            'default' => '',
        ];
    }

    public function getReactions($bFullInfo = false)
    {
        return $bFullInfo ? $this->_aDataList : array_keys($this->_aDataList);
    }

    public function getTrackBy($aParams)
    {
        return $this->_oQuery->getTrackBy($aParams);
    }

    /**
     * Reactions which have a counter in the given vote data: the list, then free-picked emoji (Many mode).
     */
    public function getCountedReactions($aVote)
    {
        $aNames = [];
        foreach(array_keys($aVote) as $sKey)
            if(strncmp($sKey, 'count_', 6) === 0)
                $aNames[] = substr($sKey, 6);

        return $aNames;
    }

    /**
     * The author's reactions to the object, oldest first.
     */
    public function getReactionsBy($iObjectId, $iAuthorId)
    {
        return $this->_oQuery->getReactionsBy($iObjectId, $iAuthorId);
    }

    /**
     * Turn a requested reaction into the name it is stored under, or false when it may not be given:
     * a name from the list, or (Many mode) a single emoji, given as is or as its e_<hex> code.
     * An emoji which is on the list is that reaction.
     */
    public function normalizeReaction($sReaction)
    {
        $sReaction = trim((string)$sReaction);
        if($sReaction === '')
            return false;

        if($sReaction === $this->_sDefault)
            return isset($this->_aDataList[$this->_sDefault]) ? $this->_aDataList[$this->_sDefault]['name'] : false;

        if(isset($this->_aDataList[$sReaction]))
            return $sReaction;

        if(!$this->isFreeEmojiAllowed())
            return false;

        $sEmoji = self::decodeEmoji($sReaction);
        if($sEmoji === false)
            $sEmoji = $sReaction;

        if(!self::isEmoji($sEmoji))
            return false;

        $sKey = self::_emojiKey($sEmoji);
        foreach($this->_aDataList as $sName => $aReaction)
            if($sName !== $this->_sDefault && !empty($aReaction['emoji']) && self::_emojiKey($aReaction['emoji']) === $sKey)
                return $sName;

        $sCode = self::encodeEmoji($sEmoji);
        return get_mb_len($sCode) <= self::$_iReactionLengthMax ? $sCode : false;
    }

    /**
     * One emoji: a pictograph (with optional variation selector, skin tone and ZWJ parts),
     * a keycap or a flag.
     */
    public static function isEmoji($s)
    {
        $sPart = '(?:\p{Extended_Pictographic}(?:\x{FE0F}|[\x{1F3FB}-\x{1F3FF}])?)';
        return preg_match('/^(?:' . $sPart . '(?:\x{200D}' . $sPart . ')*|[#*0-9]\x{FE0F}?\x{20E3}|\p{Regional_Indicator}{2})$/u', (string)$s) === 1;
    }

    /**
     * e_<hex code points joined with _>, e.g. e_2764_fe0f. Stored as ASCII because the
     * tables' unicode collation gives every emoji above U+FFFF the same weight.
     */
    public static function encodeEmoji($sEmoji)
    {
        $aCodes = [];
        foreach(mb_str_split($sEmoji, 1, 'UTF-8') as $sChar)
            $aCodes[] = dechex(mb_ord($sChar, 'UTF-8'));

        return self::$_sEmojiCodePrefix . implode('_', $aCodes);
    }

    /**
     * The emoji for an e_<hex> code, or false.
     */
    public static function decodeEmoji($sCode)
    {
        if(!is_string($sCode) || !preg_match('/^e(?:_[0-9a-f]{1,6})+$/', $sCode))
            return false;

        $aHex = explode('_', $sCode);
        array_shift($aHex); //--- the 'e' of the prefix

        $sEmoji = '';
        foreach($aHex as $sHex) {
            $iCode = hexdec($sHex);
            if($iCode > 0x10FFFF || ($iCode >= 0xD800 && $iCode <= 0xDFFF))
                return false;

            $sEmoji .= mb_chr($iCode, 'UTF-8');
        }

        return self::isEmoji($sEmoji) ? $sEmoji : false;
    }

    /**
     * Compare emoji without variation selectors (U+FE0E/U+FE0F).
     */
    protected static function _emojiKey($sEmoji)
    {
        return preg_replace('/[\x{FE0E}\x{FE0F}]/u', '', (string)$sEmoji);
    }

    protected function _getReactionOrDefault($sReaction)
    {
        $aReaction = $this->getReaction($sReaction);
        return $aReaction !== false ? $aReaction : $this->_aDataList[$this->_sDefault];
    }
    
    public function getIcon($sReaction, $bWithColor = true)
    {
        $aReaction = $this->_getReactionOrDefault($sReaction);

    	return $aReaction['icon'] . ($bWithColor && !empty($aReaction['color']) ? ' ' . $aReaction['color'] : '');
    }
    
    public function getEmoji($sReaction, $bWithColor = true)
    {
        $aReaction = $this->_getReactionOrDefault($sReaction);

    	return $aReaction['emoji'];
    }

    public function getImage($sReaction, $bWithColor = true)
    {
        $aReaction = $this->_getReactionOrDefault($sReaction);

        list($sIconFont, $sIconUrl, $sIconA, $sIconHtml) = BxTemplFunctions::getInstanceWithTemplate($this->_oTemplate)->getIcon($aReaction['image']);
        if ($sIconUrl)
            return $this->_oTemplate->parseImage($sIconUrl, ['class' => 'sys-icon-image']);

    	return $sIconHtml;
    }

    /**
     * Actions functions
     */
    public function actionGetDoVotePopup()
    {
        if(!$this->isEnabled())
           return '';

        return $this->_getDoVotePopup((int)bx_get('value'));
    }

    public function actionGetVotedBy()
    {
        if(!$this->isEnabled())
           return '';

        $aParams = array();

        $sReaction = bx_get('reaction');
        if($sReaction !== false) {
            $sReaction = bx_process_input($sReaction);
            if($this->getReaction($sReaction) === false)
                $sReaction = $this->_sDefault;

            $aParams['reaction'] = $sReaction;
        }

        return $this->_getVotedBy($aParams);
    }

    /**
     * Give or take back one reaction. A person may hold up to getPerUser() different reactions;
     * with one allowed, a new reaction replaces the old one. Giving a reaction one already has
     * takes it back.
     */
    public function vote($aVoteData = [], $aRequestParamsData = [])
    {
        $iObjectId = $this->getId();
        $iAuthorId = $this->_getAuthorId();
        $iAuthorIp = $this->_getAuthorIp();

        $sReaction = $this->normalizeReaction(isset($aVoteData['reaction']) ? $aVoteData['reaction'] : '');
        if($sReaction === false)
            return ['code' => BX_DOL_OBJECT_ERR_WRONG_DATE, 'message' => _t('_vote_err_reaction_not_available')];

        $aVoteData = ['reaction' => $sReaction, 'value' => $this->getValue()];

        $bUndo = $this->isUndo();
        $aReactions = $this->getReactionsBy($iObjectId, $iAuthorId);

        //--- Take back a reaction one already has.
        if(in_array($sReaction, $aReactions)) {
            if(!$bUndo)
                return ['code' => BX_DOL_OBJECT_ERR_DUPLICATE, 'message' => _t('_vote_err_duplicate_vote')];

            $aTrack = $this->_oQuery->getTrackReaction($iObjectId, $iAuthorId, $sReaction);
            if(!empty($aTrack['value']))
                $aVoteData['value'] = (int)$aTrack['value'];

            return $this->_vote($iObjectId, $iAuthorId, $iAuthorIp, $aVoteData, true, $aRequestParamsData);
        }

        if(!$this->isAllowedVote())
            return ['code' => BX_DOL_OBJECT_ERR_ACCESS_DENIED, 'message' => $this->msgErrAllowedVote()];

        if(count($aReactions) >= $this->_iPerUser) {
            if(!$bUndo)
                return ['code' => BX_DOL_OBJECT_ERR_DUPLICATE, 'message' => _t('_vote_err_duplicate_vote')];

            if($this->_iPerUser > 1)
                return ['code' => BX_DOL_OBJECT_ERR_DUPLICATE, 'message' => _t('_vote_err_reactions_limit', $this->_iPerUser)];

            //--- One reaction per person: the new one replaces the old one.
            foreach($aReactions as $sReactionOld) {
                $aTrack = $this->_oQuery->getTrackReaction($iObjectId, $iAuthorId, $sReactionOld);
                $aResult = $this->_vote($iObjectId, $iAuthorId, $iAuthorIp, [
                    'reaction' => $sReactionOld,
                    'value' => !empty($aTrack['value']) ? (int)$aTrack['value'] : $this->getValue()
                ], true, $aRequestParamsData);

                if((int)$aResult['code'] != 0)
                    return $aResult;
            }
        }

        return $this->_vote($iObjectId, $iAuthorId, $iAuthorIp, $aVoteData, false, $aRequestParamsData);
    }

    /**
     * Internal functions
     */

    /**
     * The track the do-button reflects: the author's latest reaction.
     */
    protected function _getTrack($iObjectId, $iAuthorId)
    {
        return $this->_oQuery->getTrackLatest($iObjectId, $iAuthorId);
    }

    protected function _isVote($iObjectId = 0, $bForceGet = false)
    {
        $aVote = $this->_getVote($iObjectId, $bForceGet);
        foreach($aVote as $sKey => $iValue)
            if(strpos($sKey, 'count_') !== false && !empty($iValue))
                return true;

        return false;
    }

    protected function _isDuplicate($iObjectId, $iAuthorId, $iAuthorIp, $bVoted)
    {
        return $bVoted && !$this->isUndo();
    }

    protected function _isCount($aVote = array())
    {
        if(empty($aVote))
            $aVote = $this->_getVote();

        foreach($aVote as $sKey => $mixedValue)
            if(substr($sKey, 0, 5) == 'count' && (int)$mixedValue != 0)
                return true;

        return false;
    }

    protected function _getVoteData()
    {
        $aData = parent::_getVoteData();
        if($aData === false)
            return false;

        $sReaction = bx_get('reaction');
        if($sReaction === false)
            return false;

        $sReaction = $this->normalizeReaction(bx_process_input($sReaction));
        if($sReaction === false)
            return false;

        $aData['reaction'] = $sReaction;
        return $aData;
    }

    protected function _returnVoteData($iObjectId, $iAuthorId, $iAuthorIp, $aData, $bVoted, $aParams = [])
    {
        $sReaction = $aData['reaction']; //--- the reaction just given or taken back
        $bUndo = $this->isUndo();

        //--- The author's state after the change: all their reactions, the latest one on the button.
        $aReactionsBy = $this->getReactionsBy($iObjectId, $iAuthorId);
        $bVotedAny = !empty($aReactionsBy);
        $bDisabled = $bVotedAny && !$bUndo && count($aReactionsBy) >= $this->_iPerUser;

        $aTrack = $bVotedAny ? $this->_getTrack($iObjectId, $iAuthorId) : [];
        $sShown = $bVotedAny ? $aTrack['reaction'] : $this->_sDefault;
        $aShown = $this->_getReactionOrDefault($sShown);

        $aVote = $this->_getVote($iObjectId, true);

        $sLabelUse = !empty($aShown['use']) ? $aShown['use'] : 'emoji';
        $sLabelIcon = $this->_getIconDoWithTrack($bVotedAny, $aTrack);
        if(!$bVotedAny && $sLabelUse != 'icon') {
            $sLabelUse = 'icon';
            $sLabelIcon = $this->_oTemplate->parseIcon($sLabelIcon);
        }

        $sJsClick = '';
        if(!$bDisabled)
            $sJsClick = $bVotedAny && $bUndo ? $this->getJsClickDo($sShown) : $this->getJsClick();

        $iTotalC = $iTotalS = 0;
        foreach($aVote as $sKey => $mixedValue)
            if(strncmp($sKey, 'count_', 6) === 0)
                $iTotalC += (int)$mixedValue;
            else if(strncmp($sKey, 'sum_', 4) === 0)
                $iTotalS += (int)$mixedValue;
        $fTotalR = $iTotalC != 0 ? round($iTotalS / $iTotalC, 2) : 0;

        $iCount = isset($aVote['count_' . $sReaction]) ? (int)$aVote['count_' . $sReaction] : 0;
        $aResult = [
            'code' => 0,
            'reaction' => $this->_bIsApi ? $aShown['name'] : $sReaction,
            'rate' => isset($aVote['rate_' . $sReaction]) ? $aVote['rate_' . $sReaction] : 0,
            'count' => $iCount,
            'countf' => $iCount > 0 ? $this->_getCounterLabel($iCount, array('reaction' => $sReaction)) : '',
            'label_use' => $sLabelUse,
            'label_icon' => $sLabelIcon,
            'label_emoji' => $this->_getEmojiDoWithTrack($bVotedAny, $aTrack),
            'label_image' => $this->_getImageDoWithTrack($bVotedAny, $aTrack),
            'label_title' => _t($this->_getTitleDoWithTrack($bVotedAny, $aTrack)),
            'label_click' => $sJsClick,
            'voted' => $bVotedAny,
            'disabled' => $bDisabled,
            'total' => [
                'rate' => $fTotalR,
                'count' => $iTotalC,
                'countf' => $iTotalC > 0 ? $this->_getCounterLabel($iTotalC, ['show_counter_label_icon' => false, 'reaction' => '']) : '',
            ]
        ];

        $aResult['api'] = [
            'performer_id' => $iAuthorId,
            'is_voted' => $bVotedAny,
            'is_disabled' => $bDisabled,
            'reaction' => $bVotedAny ? $sShown : $this->_sDefault,
            'reactions' => $aReactionsBy,
            'default' => $this->_sDefaultReaction,
            'icon' => !empty($aResult['label_emoji']) ? $aResult['label_emoji'] : $aShown['emoji'],
            'title' => !empty($aResult['label_title']) ? $aResult['label_title'] : '',
            'counter' => $aVote
        ];

        return $aResult;
    }

    protected function _returnVoteDataForSocket($aData, $aMask = [])
    {
        return parent::_returnVoteDataForSocket($aData, ['code', 'reaction', 'rate', 'count', 'countf', 'total', 'api']);
    }

    protected function _getIconDoWithTrack($bVoted, $aTrack = [])
    {
        $sReaction = $bVoted ? $aTrack['reaction'] : $this->_sDefault;

    	return $this->getIcon($sReaction);
    }

    protected function _getEmojiDoWithTrack($bVoted, $aTrack = [])
    {
        $sReaction = $bVoted ? $aTrack['reaction'] : $this->_sDefault;

    	return $this->getEmoji($sReaction);
    }

    protected function _getImageDoWithTrack($bVoted, $aTrack = [])
    {
        $sReaction = $bVoted ? $aTrack['reaction'] : $this->_sDefault;

    	return $this->getImage($sReaction);
    }

    protected function _getTitleDoWithTrack($bVoted, $aTrack = [])
    {
        $sReaction = $bVoted ? $aTrack['reaction'] : $this->_sDefault;

    	return $this->_getReactionOrDefault($sReaction)['title'];
    }

    protected function _getTitleDoBy($aParams = [])
    {
        if(isset($aParams['show_counter_style']) && $aParams['show_counter_style'] == self::$_sCounterStyleCompound)
            return _t('_vote_do_by_reactions');

        $sReaction = !empty($aParams['reaction']) ? $aParams['reaction'] : $this->_sDefault;
    	return _t('_vote_do_by_x_reaction', _t($this->_getReactionOrDefault($sReaction)['title']));
    }
}

/** @} */
