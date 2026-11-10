<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Reviews Reviews
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Create/Edit entry form
 */
class BxReviewsFormEntry extends BxBaseModTextFormEntry
{
    protected $_sGhostTemplateCover = 'form_ghost_template_cover.html';
	
    public function __construct($aInfo, $oTemplate = false)
    {
        $this->MODULE = 'bx_reviews';

        parent::__construct($aInfo, $oTemplate);

        $CNF = &$this->_oModule->_oConfig->CNF;

        if ($this->_oModule->_oDb->getParam($CNF['PARAM_CONTEXT_CONTROL_ENABLE'])) {
            unset($this->aInputs[$CNF['FIELD_ALLOW_VIEW_TO']]);
        } else {
            unset($this->aInputs[$CNF['FIELD_REVIEWED_PROFILE']]);
        }
    }

    public function insert ($aValsToAdd = [], $isIgnore = false)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if (($iReviewFor = $this->safeCustomPostToContext()))
            $aValsToAdd[$CNF['FIELD_ALLOW_VIEW_TO']] = $iReviewFor;

        $this->calcAvgVoting($aValsToAdd);

        $aValsToAdd[$CNF['FIELD_STATUS']] = 'active';
        
        return parent::insert ($aValsToAdd, $isIgnore);
    }

    public function update ($iContentId, $aValsToAdd = [], &$aTrackTextFieldsChanges = null)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if (($iReviewFor = $this->safeCustomPostToContext()))
            $aValsToAdd[$CNF['FIELD_ALLOW_VIEW_TO']] = $iReviewFor;

        $this->calcAvgVoting($aValsToAdd);

        return parent::update ($iContentId, $aValsToAdd, $aTrackTextFieldsChanges);
    }

    protected function calcAvgVoting(&$aValsToAdd) {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if (isset($this->aInputs[$CNF['FIELD_VOTING_OPTIONS']]) && !bx_is_empty_array($this->aInputs[$CNF['FIELD_VOTING_OPTIONS']]['value'])) {
            $iCount = 0;
            $iSum = 0;
            foreach ($this->aInputs[$CNF['FIELD_VOTING_OPTIONS']]['value'] as $iRating) {
                if ($iRating) {
                    $iSum += $iRating;
                    $iCount++;
                }
            }
            if (!$iCount) return '';
            $fRate = $iSum/$iCount;

            //need to scale it to 5 stars only
            $iMaxValue = $this->_oModule->_oDb->getParam($CNF['PARAM_MAX_STARS']);
            $fRate /= $iMaxValue / 5;

            $aValsToAdd[$CNF['FIELD_VOTING_AVG']] = $fRate;
        }
    }

    protected function safeCustomPostToContext() {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if ($this->_oModule->_oDb->getParam($CNF['PARAM_CONTEXT_CONTROL_ENABLE'])) {
            $mixedFieldValue = $this->getCleanValue($CNF['FIELD_REVIEWED_PROFILE']);
            $iProfile = is_array($mixedFieldValue) ? intval($mixedFieldValue[0]) : intval($mixedFieldValue);
            if (!$iProfile)
                return BX_DOL_PG_ALL;

            $oProfile = BxDolProfile::getInstance($iProfile);

            $sModules = $this->_oModule->_oDb->getParam($CNF['PARAM_CONTEXT_MODULES_AVAILABLE']);
            $aModulesList = explode(',', $sModules);
            if (!in_array($oProfile->getModule(), $aModulesList))
                return BX_DOL_PG_ALL;

            return -$iProfile;
        } else return false;
    }

    protected function genCustomInputVotingOptions ($aInput)
    {
        return $this->_oModule->_oTemplate->getMultiVoting(isset($aInput['value']) ? $aInput['value'] : array(), true);
    }

    protected function genCustomInputReviewedProfile ($aInput)
    {
        $aInput['ajax_get_suggestions'] = BX_DOL_URL_ROOT . $this->_oModule->_oConfig->getBaseUri() . 'suggest_profile_for_review/';
        $aInput['custom']['only_once'] = true;
        if (isset($aInput['value']) && !is_array($aInput['value'])) $aInput['value'] = [$aInput['value']];
        return $this->genCustomInputUsernamesSuggestions($aInput);
    }

    protected function genCustomViewRowValueProduct($aInput) {
        if (empty($aInput['value']))
            return null;

        $sProduct = bx_process_output($aInput['value']);
        $sProductUrlEncoded = $aInput['value'];
        $sProductSearchUrl = BX_DOL_URL_ROOT . $this->_oModule->_oConfig->CNF['URI_SEARCH_PRODUCT'];
        $sProductSearchUrl = bx_append_url_params($sProductSearchUrl, ['keyword' => $sProductUrlEncoded]);
        return '<a href="'.$sProductSearchUrl.'">'.$sProduct.'</a>';
    }

    protected function genCustomViewRowValueReviewedProfile($aInput) {
        $oProfile = BxDolProfile::getInstance($aInput['value']);
        if (!$oProfile)
            return null;

        return '<a href="'.$oProfile->getUrl().'">'.$oProfile->getDisplayName().'</a>';
    }
}

class BxReviewsFormEntryCheckerHelper extends BxDolFormCheckerHelper {
    public function passVotingOptions ($s) {
        if (!is_array($s))
            return false;

        /*
         * Ratings are rendered into HTML attributes later, so keep only
         * integer option ids mapped to integer ratings within the allowed range.
         */
        $iMax = (int)getParam('bx_reviews_voting_max_stars');
        if ($iMax < 1)
            $iMax = 5;

        $aClean = [];
        foreach ($s as $mixedId => $mixedRate) {
            if (!is_scalar($mixedId) || !is_numeric($mixedId) || !is_scalar($mixedRate) || !is_numeric($mixedRate))
                continue;

            $aClean[(int)$mixedId] = max(0, min($iMax, (int)$mixedRate));
        }

        return serialize($aClean);
    }

    public function passOneIntArray ($s) {
        if (is_array($s)) return intval($s[0]);
        else return intval($s);
    }

    public function displayVotingOptions ($s) {
        return unserialize($s);
    }
}

/** @} */
