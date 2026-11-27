<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Polls Polls
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Polls module
 */
class BxPollsModule extends BxBaseModTextModule
{
    function __construct(&$aModule)
    {
        parent::__construct($aModule);

        $CNF = &$this->_oConfig->CNF;
        $this->_aSearchableNamesExcept = array_merge($this->_aSearchableNamesExcept, array(
             $CNF['FIELD_ANONYMOUS_VOTING'],
             $CNF['FIELD_HIDDEN_RESULTS']
        ));
    }

    /**
     * ACTION METHODS
     */
    public function actionGetBlock()
    {
        $iContentId = (int)bx_get('content_id');
        $sBlock = bx_process_input(bx_get('block'));

        $sMethod = 'serviceGetBlock' . bx_gen_method_name($sBlock);
        if(!method_exists($this, $sMethod))
            return echoJson(array());

        $aBlock = $this->$sMethod($iContentId, true);
        if(empty($aBlock) || !is_array($aBlock))
            return echoJson(array());

        return echoJson(array(
        	'content' => $aBlock['content']
        ));
    }
    
    public function actionEmbed($iContentId, $sUnitTemplate = '', $sAddCode = '')
    {
        $this->_oTemplate->addJs(array('entry.js'));
        $this->_oTemplate->addCss(array('entry.css'));
        return parent::actionEmbed($iContentId, 'unit_embed_common.html', $this->_oTemplate->getJsCode('entry'));
    }

    public function actionEmbedEntry($iId = 0)
    {
        list($iContentId, $aContentInfo) = $this->_getContent($iId);
        if($iContentId === false)
            return;

        $aParams = bx_get_with_prefix('param');
        array_walk($aParams, function(&$sValue) {
            $sValue = bx_process_input($sValue);
        });
        
        $this->_oTemplate->embedEntry($aContentInfo, $aParams);
    }


    /**
     * SERVICE METHODS
     */
    public function serviceGetSafeServices()
    {
        return array_merge(parent::serviceGetSafeServices(), [
            'GetBlockSubentries' => '',
            'GetBlockResults' => '',
        ]);
    }

    /**
     * @page service Service Calls
     * @section bx_polls Polls
     * @subsection bx_polls-page_blocks Page Blocks
     * @subsubsection bx_polls-get_results_search_extended get_results_search_extended
     * 
     * @code bx_srv('bx_polls', 'get_results_search_extended', [...]); @endcode
     * 
     * Get page block with the results of Extended Search.
     *
     * @param $aParams an array with search params.
     * @return HTML string with block content to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxPollsModule::serviceGetResultsSearchExtended
     */
    /** 
     * @ref bx_polls-get_results_search_extended "get_results_search_extended"
     */
    public function serviceGetResultsSearchExtended($aParams)
    {
        $this->_oTemplate->addJs(array('entry.js'));
        $this->_oTemplate->addCss(array('entry.css'));
        return $this->_oTemplate->getJsCode('entry') . BxDolService::call('system', 'get_results', array($aParams), 'TemplSearchExtendedServices');
    }

    /**
     * @page service Service Calls
     * @section bx_polls Polls
     * @subsection bx_polls-page_blocks Page Blocks
     * @subsubsection bx_polls-get_block_subentries get_block_subentries
     * 
     * @code bx_srv('bx_polls', 'get_block_subentries', [...]); @endcode
     * 
     * Get page block with poll questions.
     *
     * @param $iContentId (optional) poll's ID. If empty value is provided, an attempt to get it from GET/POST arrays will be performed.
     * @param $bForceDisplay (optional) if true is passed then the block will be displayed as is (without checking whether user answered the poll or not).
     * @return HTML string with block content to display on the site or false if there is no enough input data. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxPollsModule::serviceGetBlockSubentries
     */
    /** 
     * @ref bx_polls-get_block_subentries "get_block_subentries"
     */
    public function serviceGetBlockSubentries($iContentId = 0, $bForceDisplay = false)
    {
        if (!$iContentId)
            $iContentId = bx_process_input(bx_get('id'), BX_DATA_INT);
        if (!$iContentId)
            return false;

        if(!$bForceDisplay && $this->isPerformed($iContentId))
            return $this->serviceGetBlockResults($iContentId);

        return $this->_serviceTemplateFunc('entrySubentries', $iContentId);
    }

    /**
     * @page service Service Calls
     * @section bx_polls Polls
     * @subsection bx_polls-page_blocks Page Blocks
     * @subsubsection bx_polls-get_block_results get_block_results
     * 
     * @code bx_srv('bx_polls', 'get_block_results', [...]); @endcode
     * 
     * Get page block with poll results.
     *
     * @param $iContentId (optional) poll's ID. If empty value is provided, an attempt to get it from GET/POST arrays will be performed.
     * @return HTML string with block content to display on the site or false if there is no enough input data. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxPollsModule::serviceGetBlockResults
     */
    /** 
     * @ref bx_polls-get_block_results "get_block_results"
     */
    public function serviceGetBlockResults($iContentId = 0)
    {
        return $this->_serviceTemplateFunc('entryResults', $iContentId);
    }

    /**
     * @page service Service Calls
     * @section bx_polls Polls
     * @subsection bx_polls-page_blocks Page Blocks
     * @subsubsection bx_polls-get_block_text_and_subentries get_block_text_and_subentries
     * 
     * @code bx_srv('bx_polls', 'get_block_text_and_subentries', [...]); @endcode
     * 
     * Get page block with poll question and answers with possibility to switch to results.
     *
     * @param $iContentId (optional) poll's ID. If empty value is provided, an attempt to get it from GET/POST arrays will be performed.
     * @param $bForceDisplay (optional) if true is passed then the block will be displayed as is (without checking whether user answered the poll or not).
     * @return HTML string with block content to display on the site or false if there is no enough input data. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxPollsModule::serviceGetBlockTextAndSubentries
     */
    /** 
     * @ref bx_polls-get_block_text_and_subentries "get_block_text_and_subentries"
     */
    public function serviceGetBlockTextAndSubentries($iContentId = 0, $bForceDisplaySubentries = false)
    {
        if (!$iContentId)
            $iContentId = bx_process_input(bx_get('id'), BX_DATA_INT);
        if (!$iContentId)
            return false;

        $mixedContent = $this->_getContent($iContentId);
        if($mixedContent === false)
            return false;

        list($iContentId, $aContentInfo) = $mixedContent;

        $mixedResult = $this->_oTemplate->entryTextAndSubentries($aContentInfo, $bForceDisplaySubentries);

        return $this->_bIsApi ? [bx_api_get_block('entity_poll', $mixedResult)] : $mixedResult;
    }
    
    /**
     * @see BxBaseModTextModule::primeTimelinePosts; and the polls' answers, their votes and
     * whether the viewer answered each.
     */
    public function primeTimelinePosts($aContentIds)
    {
        $aIds = parent::primeTimelinePosts($aContentIds);

        $CNF = &$this->_oConfig->CNF;
        $this->_oDb->primeSubentriesByEntries($aIds, bx_get_logged_profile_id());

        $aSubentries = [];
        foreach($aIds as $iId)
            $aSubentries = array_merge($aSubentries, array_keys($this->_oDb->getSubentries(['type' => 'entry_id_pairs', 'entry_id' => (int)$iId])));
        // the votes object of an answer (primed above) reads the votes of all of them
        if($aSubentries && !empty($CNF['OBJECT_VOTES_SUBENTRIES']) && ($oVotes = BxDolVote::getObjectInstance($CNF['OBJECT_VOTES_SUBENTRIES'], (int)$aSubentries[0])))
            $oVotes->getQueryObject()->primeVotes($aSubentries);

        return $aIds;
    }

    /**
     * PERMISSION METHODS
     */
    public function isAllowedVote($isPerformAction = false)
    {
        $aCheck = checkActionModule($this->_iProfileId, 'vote entry', $this->getName(), false);
        if ($aCheck[CHECK_ACTION_RESULT] !== CHECK_ACTION_RESULT_ALLOWED)
            return $aCheck[CHECK_ACTION_MESSAGE];

        return CHECK_ACTION_RESULT_ALLOWED;
    }

    public function isPerformed($iObjectId, $iAuthorId = 0, $iAuthorIp = 0)
    {
        if(empty($iAuthorId)) {
            $iAuthorId = bx_get_logged_profile_id();
            $iAuthorIp = bx_get_ip_hash(getVisitorIP());
        }

        return $this->_oDb->isPerformed($iObjectId, $iAuthorId, $iAuthorIp);
    }
    
    public function getPerformedValue($iObjectId, $iAuthorId = 0)
    {
        if(empty($iAuthorId))
            $iAuthorId = bx_get_logged_profile_id();

        return $this->_oDb->getPerformedValue($iObjectId, $iAuthorId);
    }


    /**
     * INTERNAL METHODS
     */
    protected function _getContent($iContentId = 0, $sFuncGetContent = 'getContentInfoById')
    {
        $mixedResult = parent::_getContent($iContentId, $sFuncGetContent);
        if(empty($mixedResult) || !is_array($mixedResult)) 
            return $mixedResult;

        list($iContentId, $aContentInfo) = $mixedResult;

        if(bx_get('salt') !== false)
            $aContentInfo['salt'] = bx_process_input(bx_get('salt'));
    
        return array($iContentId, $aContentInfo);
    }

    protected function _getContentForTimelinePost($aEvent, $aContentInfo, $aBrowseParams = array())
    {
        $aResult = parent::_getContentForTimelinePost($aEvent, $aContentInfo, $aBrowseParams);

        if($this->_bIsApi) 
            return array_merge($aResult, $this->_oTemplate->entryTextAndSubentries($aContentInfo));

        $CNF = &$this->_oConfig->CNF;
        $bDynamic = isset($aBrowseParams['dynamic_mode']) && $aBrowseParams['dynamic_mode'] === true;

        $sInclude = '';
        $sInclude .= $this->_oTemplate->addCss(array('main.css'), $bDynamic);

        $aBlock = $this->_oTemplate->{$this->isPerformed($aContentInfo[$CNF['FIELD_ID']]) ? 'entryResults' : 'entrySubentries'}($aContentInfo, $bDynamic);

        $aResult['title'] = $this->_oConfig->getTitle($aContentInfo);
        $aResult['text'] = '';
        $aResult['raw'] = ($bDynamic ? $sInclude : '') . $this->_oTemplate->parseHtmlByName('unit_embed.html', array(
            'html_id' => $this->_oConfig->getHtmlIds('embed') . (int)$aContentInfo[$CNF['FIELD_ID']],
            'embed_url' => BX_DOL_URL_ROOT . bx_append_url_params($this->_oConfig->getBaseUri() . 'embed_entry/', array(
                'id' => (int)$aContentInfo[$CNF['FIELD_ID']]
            ))
        ));

        return $aResult;
    }
    
    public function decodeDataAPI($aData, $aParams = [])
    {
        $CNF = $this->_oConfig->CNF;

        $aResult = parent::decodeDataAPI($aData, $aParams);
        if(is_array($aResult))
            $aResult = array_merge($aResult, [
                'title' => strip_tags($aData[$CNF['FIELD_TEXT']]),
            ]);

        return $aResult;
    }
}

/** @} */
