<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */



/**
 * Reviews for any content
 */
class BxDolCmtsReviews extends BxTemplCmts
{
    protected $_iMoodMinValue;
    protected $_iMoodMaxValue;
    protected $_sMoodLegendId;

    protected $_sRatingLegendId;

    /*
     * Determines whether an object author is allowed 
     * to post review to his own content.
     */
    protected $_bOaPostAllowed;

    /*
     * Determines whether an object author is allowed 
     * to reply to somebody's review.
     */
    protected $_bOaReplyAllowed;

    /*
     * Determines whether a review author is allowed 
     * to reply to his own review or to somebody's reply 
     * to his own review.
     */
    protected $_bRaReplyAllowed;

    public function __construct($sSystem, $iId, $iInit = true, $oTemplate = false)
    {
        parent::__construct($sSystem, $iId, $iInit, $oTemplate);

        $this->_sType = BX_DOL_CMT_TYPE_REVIEWS;
        $this->_oQuery = new BxDolCmtsReviewsQuery($this);

        $this->_sFormObject = 'sys_review';
        $this->_sFormDisplayPost = 'sys_review_post';
        $this->_sFormDisplayEdit = 'sys_review_edit';

        $this->_aT = array(
            'block_comments_title' => '_cmt_rvw_block_reviews_title',
            'block_rating_title' => '_cmt_rvw_block_rating_title',
            'txt_sample_single' => '_cmt_rvw_txt_sample_review_single',
            'txt_sample_vote_single' => '_cmt_rvw_txt_sample_vote_single',
            'txt_sample_reaction_single' => '_cmt_rvw_txt_sample_reaction_single',
            'txt_sample_score_up_single' => '_cmt_rvw_txt_sample_score_up_single',
            'txt_sample_score_down_single' => '_cmt_rvw_txt_sample_score_down_single',
            'txt_min_form_placeholder' => '_cmt_rvw_txt_min_form_placeholder'
        );

        $this->_iMoodMinValue = 1;
        $this->_iMoodMaxValue = 5;
        $this->_sMoodLegendId = "cmt-legend-%s-%d-%d";

        $this->_sRatingLegendId = "cmt-legend-%s-%d";

        $this->_bOaPostAllowed = true;
        $this->_bOaReplyAllowed = true;
        $this->_bRaReplyAllowed = true;
    }

    public function isPostAllowed($isPerformAction = false)
    {
        $iUsrId = $this->_getAuthorId();
        $iObjAthrId = $this->getObjectAuthorId();

        if($iUsrId == $iObjAthrId && !$this->_bOaPostAllowed)
            return false;

        if($this->isReviewed($iUsrId))
            return false;

        if($this->isPostAllowedCustom($isPerformAction) === false)
            return false;

        return parent::isPostAllowed($isPerformAction);
    }

    public function isReplyAllowed ($mixedCmt, $isPerformAction = false)
    {
        $iUsrId = $this->_getAuthorId();
        $iObjAthrId = $this->getObjectAuthorId();
        $iRvwAthrId = $this->getReviewAuthorId($mixedCmt);

        if(!in_array($iUsrId, array($iObjAthrId, $iRvwAthrId)))
            return false;

        if($iUsrId == $iObjAthrId && $iUsrId != $iRvwAthrId && !$this->_bOaReplyAllowed)
            return false;

        if($iUsrId == $iRvwAthrId && !$this->_bRaReplyAllowed)
            return false;

        return parent::isPostAllowed($isPerformAction);
    }

    /**
     * Can be overwritten if some custom check is needed.
     * @param boolean $isPerformAction
     * @return boolean
     */
    public function isPostAllowedCustom($isPerformAction = false)
    {
        return true;
    }

    public function isReviewed($mixedCmt)
    {
        return $this->_oQuery->isReviewed($this->getId(), $mixedCmt);
    }

    public function getMoodMinValue()
    {
        return $this->_iMoodMinValue;
    }

    public function getMoodMaxValue()
    {
        return $this->_iMoodMaxValue;
    }

    public function getMoodLegendId($iItemId)
    {
        return sprintf($this->_sMoodLegendId, str_replace('_', '-', $this->getSystemName()), $this->getId(), $iItemId);
    }

    public function getRatingLegendId()
    {
        return sprintf($this->_sRatingLegendId, str_replace('_', '-', $this->getSystemName()), $this->getId());
    }

    public function getReviewAuthorId($mixedCmt)
    {
        return $this->_oQuery->getReviewAuthorId($this->getId(), $mixedCmt);
    }

    public function onEditAfter($iCmtId, $aDp = [])
    {
        $mixedResult = parent::onEditAfter($iCmtId, $aDp);
        if($mixedResult === false)
            return $mixedResult;

        $aCmt = $this->getCommentSimple($iCmtId);

        return array_merge($mixedResult, [
            'mood' => (int)$aCmt['cmt_mood'],
            'mood_legend_id' => $this->getMoodLegendId($iCmtId)
        ]);
    }

    protected function _triggerComment()
    {
        if(!$this->_aSystem['trigger_table'])
            return false;

        $iId = $this->getId();
        if(!$iId)
            return false;

        $aStats = $this->_oQuery->getReviewsStats($iId);
        return $this->_oQuery->updateTriggerTable($iId, (int)$aStats['count']) !== false && $this->_oQuery->updateTriggerTableAvg($iId, (float)$aStats['avg']) !== false;
    }

    protected function _getIconDo()
    {
    	return 'message-square-dashed';
    }

    protected function _getTitleDo()
    {
    	return '_cmt_rvw_txt_do';
    }
}

/** @} */
