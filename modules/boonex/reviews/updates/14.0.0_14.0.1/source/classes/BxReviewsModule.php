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
 * Reviews module
 */
class BxReviewsModule extends BxBaseModTextModule
{
    function __construct(&$aModule)
    {
        parent::__construct($aModule);

        $CNF = &$this->_oConfig->CNF;
        $this->_aSearchableNamesExcept = array_merge($this->_aSearchableNamesExcept, array(
            $CNF['FIELD_ALLOW_COMMENTS']
        ));
    }

    public function serviceGetSearchableFields($aInputsAdd = array())
    {
        $CNF = &$this->_oConfig->CNF;

        $aResult = parent::serviceGetSearchableFields($aInputsAdd);
        unset($aResult[$CNF['FIELD_PRODUCT']]);

        return $aResult;
    }

    public function serviceGetContextModulesOptions() {
        if (!($aModules = BxDolModuleQuery::getInstance()->getModules()))
            return [];

        $aValues = [];
        foreach ($aModules as $aModule) {
            if (!$aModule['enabled'])
                continue;

            if (!BxDolRequest::serviceExists($aModule['name'], 'act_as_profile'))
                continue;

            $aValues[$aModule['name']] = $aModule['title'];
        }

        return $aValues;
    }

    /**
     * Entry post for Timeline module
     */
    public function serviceGetTimelinePost($aEvent, $aBrowseParams = array())
    {
        $aResult = parent::serviceGetTimelinePost($aEvent, $aBrowseParams);
        if(empty($aResult) || !is_array($aResult) || empty($aResult['date']))
            return $aResult;

        return $aResult;
    }

    public function serviceCheckAllowedCommentsPost($iContentId, $sObjectComments) 
    {
        $CNF = &$this->_oConfig->CNF;
        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        if ($aContentInfo && $aContentInfo[$CNF['FIELD_ALLOW_COMMENTS']] == 0)
            return false;

        return parent::serviceCheckAllowedCommentsPost($iContentId, $sObjectComments);
    }
	
	public function serviceCheckAllowedCommentsView($iContentId, $sObjectComments) 
    {
        $CNF = &$this->_oConfig->CNF;
        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        if ($aContentInfo[$CNF['FIELD_ALLOW_COMMENTS']] == 0)
            return false;

        return parent::serviceCheckAllowedCommentsView($iContentId, $sObjectComments);
    }


    /*
     * Rating block for entry view page
     **/
    public function serviceEntityVotingOptions($iContentId = 0) {
        if (!$iContentId) $iContentId = bx_process_input(bx_get('id'), BX_DATA_INT);

        if ($iContentId) {
            $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
            $aOptions = !empty($aContentInfo['voting_options']) ? unserialize($aContentInfo['voting_options']) : array();
            return $this->_oTemplate->getMultiVoting($aOptions, false);
        }
        return '';
    }

    /*
     * Stars Rating block for rate by users
     **/
    public function serviceEntityRating($iContentId = 0) {
        if (!$iContentId) $iContentId = bx_process_input(bx_get('id'), BX_DATA_INT);

        if ($iContentId) {
            $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
            if (!$aContentInfo) return '';
            return $this->_oTemplate->entryRating($aContentInfo);
        }
        return '';
    }


    /*
     * Reviewed content block for module homepage
     **/
    public function serviceBrowseReviewedContent() {
        if ($this->_oDb->getParam($this->_oConfig->CNF['PARAM_CONTEXT_CONTROL_ENABLE']))
            return $this->_oTemplate->browseReviewedContent();
    }

     /*
     * ACTIONS
     */
    public function actionGetReviewRatingDetails($iContentId) {
        $sVoting = $this->serviceEntityVotingOptions($iContentId);

        if (!empty($sVoting))
            echo BxTemplFunctions::getInstance()->transBox('bx_reviews_rating', DesignBoxContent('',$sVoting, BX_DB_PADDING_CONTENT_ONLY), false);
    }

    public function actionSuggestProfileForReview ($sTerm, $iLimit = 20)
    {
        if (!$sTerm && isset($_GET['term'])) $sTerm = bx_get('term');

        $CNF = &$this->_oConfig->CNF;
        $sModules = $this->_oDb->getParam($CNF['PARAM_CONTEXT_MODULES_AVAILABLE']);

        $aResult = array();
        if ($sModules) {
            $aInstalledModules = BxDolModuleQuery::getInstance()->getModules();
            $aEnabledModules = [];
            foreach ($aInstalledModules as $aModule) $aEnabledModules[$aModule['name']] = $aModule['enabled'];

            $aModulesList = explode(',', $sModules);
            foreach ($aModulesList as $sModulename) {
                if (!isset($aEnabledModules[$sModulename]) || !$aEnabledModules[$sModulename]) continue;
                $aResult = array_merge($aResult, BxDolService::call($sModulename, 'profiles_search', array($sTerm, getParam('sys_per_page_search_keyword_single'))));
            }
            // sort result
            usort($aResult, function($r1, $r2) {
                return strcmp($r1['label'], $r2['label']);
            });
        }

        bx_alert('system', 'profiles_search', 0, 0, array(
            'term' => $sTerm,
            'result' => &$aResult,
            'module' => $this->_aModule['name'],
        ));

        header('Content-Type:text/javascript; charset=utf-8');
        echo json_encode(array_slice($aResult, 0, $iLimit));
    }
}

/** @} */
