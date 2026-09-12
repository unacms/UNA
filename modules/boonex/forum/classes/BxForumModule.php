<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Forum Forum
 * @ingroup     UnaModules
 *
 * @{
 */

class BxForumModule extends BxBaseModTextModule
{
    function __construct(&$aModule)
    {
        parent::__construct($aModule);
    }

    public function decodeDataApi ($aData, $bExtended = false)
    {
        $CNF = $this->_oConfig->CNF;
        
        $aResult = parent::decodeDataApi($aData, $bExtended);
        
        $oCategory = BxDolCategory::getObjectInstance($CNF['OBJECT_CATEGORY']);
        if(!$oCategory)
            return false;

        $aCategoryData = $this->_oDb->getCategories(['type' => 'by_category', 'category' => $aData[$CNF['FIELD_CATEGORY']]]);
        if(!empty($aCategoryData) &&is_array($aCategoryData))
            $aResult['category'] = [
                'name' => $oCategory->getCategoryTitle($aData[$CNF['FIELD_CATEGORY']]), 
                'icon' => $aCategoryData['icon']
            ];

        return $aResult;
    }
    
    public function sortParticipants ($aParticipants, $iProfileIdLastComment, $iProfileIdAuthor, $iProfileIdCurrent = 0)
    {
        if (!$iProfileIdCurrent)
            $iProfileIdCurrent = bx_get_logged_profile_id();

        $aMoveUp = array($iProfileIdCurrent, $iProfileIdLastComment, $iProfileIdAuthor);

        asort($aParticipants, SORT_NUMERIC);

        foreach ($aMoveUp as $iProfileId) {
            if (!isset($aParticipants[$iProfileId]))
                continue;

            $a = array($iProfileId => $aParticipants[$iProfileId]);
            unset($aParticipants[$iProfileId]);
            $aParticipants = $a + $aParticipants;
        }

        return $aParticipants;
    }

    /**
     * The share card of a discussion, @see BxDolShareCard.
     *
     * A discussion shares as the conversation itself: who opened it and where, what it is called,
     * how it begins, the faces taking part in it and how busy it is. Every value is read out of the
     * stored row, so the spec share_card.php rebuilds later, with no page render around it and
     * nobody logged in, is the same array and hashes to the same picture.
     *
     * @param $aContentInfo - stored discussion row
     * @param $aParams - producer parameters, passed straight through to the parent
     * @return card spec array, or a `private` spec when an anonymous visitor may not see the entry
     */
    public function getShareCard($aContentInfo, $aParams = [])
    {
        //--- one snapshot of this module's own configuration, taken by value and taken first. A card
        //--- is a public picture behind a privacy gate, and the gate below has to be decided by the
        //--- forum's configuration and nothing else - producing it walks through other modules'
        //--- code (the author's profile module, for one), and none of that may be able to reach in
        //--- and change what is read here.
        $CNF = $this->_oConfig->CNF;

        $aCard = parent::getShareCard($aContentInfo, $aParams);

        //--- a private entry is answered with the generic site card, so nothing may be added to it:
        //--- every key filled in below would end up drawn into a picture with a public URL
        if(!is_array($aCard) || !empty($aCard['private']))
            return $aCard;

        if(!$this->_isDiscussionCardCategoryVisible($aContentInfo, $CNF))
            return ['private' => true, 'module' => $this->getName(), 'id' => (int)($aContentInfo[$CNF['FIELD_ID']] ?? 0)];

        $aCard['layout'] = 'discussion';

        //--- the opening post of a discussion is the row's own text column; everything said after it
        //--- lives in bx_forum_cmts and none of it belongs on the card, which shows how a
        //--- conversation begins rather than the last thing somebody happened to say in it. A
        //--- discussion gets more of that opening post than the plain summary an article is cut to.
        $aCard['description'] = BxDolShareCard::cleanText($this->_oTemplate->getText($aContentInfo, false), 280);

        //--- extra.category is left exactly as the parent resolved it, through BxDolCategory and the
        //--- very call decodeDataApi() makes: one producer, so it is not resolved a second time here
        $aExtra = !empty($aCard['extra']) && is_array($aCard['extra']) ? $aCard['extra'] : [];

        $aExtra['badges'] = $this->_getDiscussionCardBadges($aContentInfo, $CNF);

        //--- a trigger maintained column of the row itself, so the card costs no counting query.
        //--- FIELD_VIEWS is deliberately NOT on the card: the whole spec is hashed, so a view count
        //--- would retire a URL advertised as immutable for a year every single time somebody opened
        //--- the discussion, and re-render, re-store and supersede-delete the picture on the next
        //--- scrape. Replies say more and move far less often.
        $aCounters = !empty($aExtra['counters']) && is_array($aExtra['counters']) ? $aExtra['counters'] : [];
        $aExtra['counters'] = array_merge($aCounters, [
            'replies' => (int)($aContentInfo[$CNF['FIELD_COMMENTS']] ?? 0),
        ]);

        $aExtra = array_merge($aExtra, $this->_getDiscussionCardParticipants($aContentInfo, $CNF));

        //--- a reply moves a discussion on without touching `changed`
        $aExtra['updated'] = max((int)($aContentInfo[$CNF['FIELD_CHANGED']] ?? 0), (int)($aContentInfo[$CNF['FIELD_LR_ADDED']] ?? 0));

        $aCard['extra'] = $aExtra;

        return $aCard;
    }

    /**
     * Is the discussion's category open to a visitor who is not logged in?
     *
     * This is the check BxForumPageEntry::getCode() makes before it renders the entry page, made
     * without a viewer: the membership level is named as a value, because
     * BxDolAcl::isMemberLevelInSet() reads its second argument as a profile id and answers for the
     * logged in profile when it is 0 - which would let whoever rendered the page first decide what
     * an anonymous visitor gets to see. The entry page is not the only way in: share_card.php asks
     * the module for this card with no page around it at all, so the gate has to live here.
     * @param $aContentInfo - stored discussion row
     * @param $CNF - this module's configuration, as read by the caller
     */
    protected function _isDiscussionCardCategoryVisible($aContentInfo, $CNF)
    {
        if(empty($CNF['FIELD_CATEGORY']) || !isset($aContentInfo[$CNF['FIELD_CATEGORY']]))
            return true;

        $aCategory = $this->_oDb->getCategories(['type' => 'by_category', 'category' => $aContentInfo[$CNF['FIELD_CATEGORY']]]);
        if(empty($aCategory['visible_for_levels']))
            return true;

        return BxDolShareCard::isLevelInSet($aCategory['visible_for_levels'], MEMBERSHIP_ID_NON_MEMBER);
    }

    /**
     * The states of a discussion worth putting on a card. Only the states which say something are
     * drawn: a card is an invitation, and "Unresolved" is not one.
     * @param $aContentInfo - stored discussion row
     * @param $CNF - this module's configuration, as read by the caller
     */
    protected function _getDiscussionCardBadges($aContentInfo, $CNF)
    {
        $aKeys = [];

        //--- every read goes through $sField(), because a CNF key a future forum build stops
        //--- declaring must cost a badge, not raise a warning on every scrape of every discussion
        $sField = function($sKey) use ($aContentInfo, $CNF) {
            return !empty($CNF[$sKey]) && isset($aContentInfo[$CNF[$sKey]]) ? $aContentInfo[$CNF[$sKey]] : null;
        };

        if(!empty($sField('FIELD_RESOLVABLE')) && !empty($sField('FIELD_RESOLVE')))
            $aKeys[] = '_bx_forum_grid_filter_resolved_resolved';

        if(!empty($sField('FIELD_STICK')))
            $aKeys[] = '_bx_forum_menu_item_title_sm_sticked';

        if(!empty($sField('FIELD_LOCK')))
            $aKeys[] = '_bx_forum_menu_item_title_sm_locked';

        $aResult = [];
        foreach($aKeys as $sKey) {
            //--- _t() echoes an untranslated key back, and a raw language key drawn on a picture
            //--- which is cached for a year looks like a bug to everybody who is shown it
            $s = _t($sKey);
            if($s != '' && $s != $sKey)
                $aResult[] = $s;
        }

        return $aResult;
    }

    /**
     * The people taking part in a discussion: the author plus everybody who replied, in the order
     * the discussion itself shows them, with the faces which may not be shown reduced to initials.
     * @param $aContentInfo - stored discussion row
     * @param $CNF - this module's configuration, as read by the caller
     */
    protected function _getDiscussionCardParticipants($aContentInfo, $CNF)
    {
        $iId = (int)($aContentInfo[$CNF['FIELD_ID']] ?? 0);
        $iAuthor = (int)($aContentInfo[$CNF['FIELD_AUTHOR']] ?? 0);

        $aParticipants = $this->_oDb->getComments(['type' => 'author_comments', 'object_id' => $iId]);
        if(!is_array($aParticipants))
            $aParticipants = [];

        $aParticipants[$iAuthor] = !empty($aParticipants[$iAuthor]) ? $aParticipants[$iAuthor] + 1 : 1;

        //--- the query behind those counts groups without ordering, so the order it hands them back
        //--- in is the server's business; sorting by profile id first makes the ties sortParticipants()
        //--- leaves alone come out the same way on every run, and this order is part of the hash
        ksort($aParticipants, SORT_NUMERIC);

        //--- the author stands in for the current profile on purpose: sortParticipants() falls back
        //--- to the logged in one, and faces ordered by who is looking would give one discussion a
        //--- different card for every visitor
        //--- ?: -1 matters: sortParticipants() treats a FALSY 4th argument as "use the logged in
        //--- profile", and an imported or anonymous discussion has author 0. -1 is truthy, so the
        //--- fallback never runs, and it can never match a real participant id either
        $aParticipants = $this->sortParticipants($aParticipants, (int)($aContentInfo[$CNF['FIELD_LR_AUTHOR']] ?? 0), $iAuthor, $iAuthor ?: -1);

        $aResult = [];
        $iTotal = 0;
        foreach($aParticipants as $iProfileId => $iComments) {
            //--- an anonymous or a deleted poster is stored as a zero or a negative id and has no face
            if(($iProfileId = (int)$iProfileId) <= 0)
                continue;

            $iTotal++;

            //--- four faces is what the card has room for; the rest are counted into the "+N"
            if(count($aResult) < 4)
                $aResult[] = $this->_getDiscussionCardParticipant($iProfileId);
        }

        return ['participants' => $aResult, 'participants_total' => $iTotal];
    }

    /**
     * One participant, described for an anonymous audience.
     *
     * Taking part in a public discussion is public, but a profile is not: a profile an anonymous
     * visitor cannot open contributes neither its name nor its picture, and is drawn as a plain
     * lettered circle instead - present in the conversation, unnamed on the card.
     */
    protected function _getDiscussionCardParticipant($iProfileId)
    {
        $aResult = ['id' => $iProfileId, 'name' => _t('_uknown'), 'avatar' => null];

        //--- getInstance(), not getInstanceMagic(): the stand-in objects the magic one hands back for
        //--- an anonymous or a deleted profile describe themselves out of the current viewer's
        //--- permissions, which is exactly what may not decide what a public picture says
        $oProfile = BxDolProfile::getInstance($iProfileId);

        //--- the gate and the face of the author, @see BxBaseModGeneralModule::_getShareCardAuthor,
        //--- applied to everybody else in the conversation: one rule decides who may be named on a
        //--- card, and every face on it is resolved by one helper
        if(!$oProfile || !$this->_isShareCardProfileGuestVisible($oProfile))
            return $aResult;

        $aResult['name'] = BxDolShareCard::cleanText($oProfile->getDisplayName(), 64);
        $aResult['avatar'] = $this->_getShareCardAvatar($oProfile);

        return $aResult;
    }

    /**
     * Action methods
     */
    public function actionUpdateStatus($sAction = '', $iContentId = 0)
    {
        if(empty($sAction) && bx_get('action') !== false)
            $sAction = bx_process_input(bx_get('action'));

        if(empty($iContentId) && bx_get('id') !== false)
            $iContentId = (int)bx_get('id');

        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        if(empty($aContentInfo) || !is_array($aContentInfo))
            return echoJson(array('code' => 1, 'message' => _t('_bx_forum_err_not_found')));

        $sMethodCheck = 'checkAllowed' . bx_gen_method_name($sAction) . 'AnyEntry';
        $sResult = $this->$sMethodCheck($aContentInfo);
        if($sResult !== CHECK_ACTION_RESULT_ALLOWED)
            return echoJson(array('code' => 2, 'message' => $sResult));

        bx_audit(
            $iContentId, 
            $this->getName(), 
            '_sys_audit_action_' . $sAction,  
            $this->_prepareAuditParams($aContentInfo, false)
        );
        
        if(!$this->_oDb->updateStatus($sAction, $aContentInfo))
            return echoJson(array('code' => 3, 'message' => _t('_error occured')));

        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        $this->alertAfterEdit($aContentInfo);

        echoJson(array('code' => 0, 'id' => $iContentId, 'reload' => 1));
    }

    public function actionAjaxGetAuthors()
    {
        $aResult = BxDolService::call('system', 'profiles_search', array(bx_get('term')), 'TemplServiceProfiles');

        header('Content-Type:text/javascript; charset=utf-8');
        echo json_encode($aResult);
    }

    /**
     * Service methods
     */

    public function serviceGetSafeServices()
    {
        $a = parent::serviceGetSafeServices();
        return array_merge($a, array (
            'BrowseNew' => '',
            'BrowseLatest' => '',
            'BrowseTop' => '',
            'BrowsePopular' => '',
            'BrowseUpdated' => '',
            'BrowsePartaken' => '',
            'BrowseIndex' => '',
            'Search' => '',
        ));
    }

    /**
     * @page service Service Calls
     * @section bx_forum Discussions
     * @subsection bx_forum-other Other
     * @subsubsection bx_forum-get_searchable_fields get_searchable_fields
     * 
     * @code bx_srv('bx_forum', 'get_searchable_fields', [...]); @endcode
     * 
     * Get searchable fields for Studio settings.
     * 
     * @return an array with key-value pairs to be used in settings dropdown field.
     * 
     * @see BxForumModule::serviceGetSearchableFields
     */
    /** 
     * @ref bx_forum-get_searchable_fields "get_searchable_fields"
     */
    public function serviceGetSearchableFields ($aInputsAdd = array())
    {
        $CNF = &$this->_oConfig->CNF;

        $aResult = parent::serviceGetSearchableFields($aInputsAdd);
        $aResult[$CNF['FIELD_TEXT_COMMENTS']] = _t('_bx_forum_form_entry_input_text_comments');

        return $aResult;
    }

    /**
     * Service methods
     */
    /**
     * @page service Service Calls
     * @section bx_forum Discussions
     * @subsection bx_forum-other Other
     * @subsubsection bx_forum-get_info get_info
     * 
     * @code bx_srv('bx_forum', 'get_info', [...]); @endcode
     * 
     * Get content info by content ID. Is used in "Content Info Objects" system.
     * 
     * @param $iContentId integer value with content ID.
     * @param $bSearchableFieldsOnly (optional) boolean value determining all info or "searchable fields" only will be returned.
     * @return an array with content info. Empty array is returned if something is wrong.
     * 
     * @see BxForumModule::serviceGetInfo
     */
    /** 
     * @ref bx_forum-get_info "get_info"
     */
    public function serviceGetInfo ($iContentId, $bSearchableFieldsOnly = true)
    {
        $aContentInfo = $this->_getFields($iContentId);
        if(empty($aContentInfo))
            return array();

        return $aContentInfo;
    }
    
    /**
     * @page service Service Calls
     * @section bx_forum Discussions
     * @subsection bx_forum-page_blocks Page Blocks
     * @subsubsection bx_forum-browse_new browse_new
     * 
     * @code bx_srv('bx_forum', 'browse_new', [...]); @endcode
     * 
     * Get page block with a list of items ordered by newness and represented as table.
     * 
     * @param $sUnitView (optional) string with unit view type.
     * @param $bEmptyMessage (optional) boolean value determining whether an "Empty" message should be returned or not.
     * @param $bAjaxPaginate (optional) boolean value determining whether an Ajax based pagination should be used or not.
     * @return HTML string with block content to display on the site or false if something is wrong. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxForumModule::serviceBrowseNew
     */
    /** 
     * @ref bx_forum-browse_new "browse_new"
     */
	public function serviceBrowseNew ($sUnitView = false, $bEmptyMessage = true, $bAjaxPaginate = true, $bShowHeader = false)
    {
    	$sType = 'new';

    	if($sUnitView != 'table')   
        	return $this->_serviceBrowse($sType, $sUnitView ? array('unit_view' => $sUnitView) : false, BX_DB_PADDING_DEF, $bEmptyMessage, $bAjaxPaginate);

        return $this->_serviceBrowseTable(array(
            'type' => $sType,
            'empty_message' => $bEmptyMessage,
            'ajax_paginate' => $bAjaxPaginate
        ), $bShowHeader);
    }

    /**
     * @page service Service Calls
     * @section bx_forum Discussions
     * @subsection bx_forum-page_blocks Page Blocks
     * @subsubsection bx_forum-browse_latest browse_latest
     * 
     * @code bx_srv('bx_forum', 'browse_latest', [...]); @endcode
     * 
     * Get page block with a list of items ordered by Recent Posts in them and represented as table.
     * 
     * @param $sUnitView (optional) string with unit view type.
     * @param $bEmptyMessage (optional) boolean value determining whether an "Empty" message should be returned or not.
     * @param $bAjaxPaginate (optional) boolean value determining whether an Ajax based pagination should be used or not.
     * @param $bShowHeader (optional) boolean value determining whether a resulting table should have Header section or not.
     * @return HTML string with block content to display on the site or false if something is wrong. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxForumModule::serviceBrowseNew
     */
    /** 
     * @ref bx_forum-browse_latest "browse_latest"
     */
    public function serviceBrowseLatest($sUnitView = false, $bEmptyMessage = true, $bAjaxPaginate = true, $bShowHeader = true)
    {
        $sType = 'latest';

        if($sUnitView != 'table')
            return $this->_serviceBrowse($sType, $sUnitView ? array('unit_view' => $sUnitView) : false, BX_DB_PADDING_DEF, $bEmptyMessage, $bAjaxPaginate);

        return $this->_serviceBrowseTable(array(
            'type' => $sType,
            'empty_message' => $bEmptyMessage, 
            'ajax_paginate' => $bAjaxPaginate
        ), $bShowHeader);
    }

    /**
     * @page service Service Calls
     * @section bx_forum Discussions
     * @subsection bx_forum-page_blocks Page Blocks
     * @subsubsection bx_forum-browse_featured browse_featured
     * 
     * @code bx_srv('bx_forum', 'browse_featured', [...]); @endcode
     * 
     * Get page block with a list of featured items represented as table.
     * 
     * @param $sUnitView (optional) string with unit view type.
     * @param $bEmptyMessage (optional) boolean value determining whether an "Empty" message should be returned or not.
     * @param $bAjaxPaginate (optional) boolean value determining whether an Ajax based pagination should be used or not.
     * @param $bShowHeader (optional) boolean value determining whether a resulting table should have Header section or not.
     * @return HTML string with block content to display on the site or false if something is wrong. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxForumModule::serviceBrowseFeatured
     */
    /** 
     * @ref bx_forum-browse_featured "browse_featured"
     */
    public function serviceBrowseFeatured($sUnitView = false, $bEmptyMessage = false, $bAjaxPaginate = true, $bShowHeader = false)
    {
        $CNF = &$this->_oConfig->CNF;

    	$sType = 'featured';

    	if($sUnitView != 'table')
            return $this->_serviceBrowse($sType, $sUnitView ? array('unit_view' => $sUnitView) : false, BX_DB_PADDING_DEF, $bEmptyMessage, $bAjaxPaginate);

        return $this->_serviceBrowseTable(array(
            'type' => $sType, 
            'empty_message' => $bEmptyMessage,
            'ajax_paginate' => $bAjaxPaginate
        ), $bShowHeader);
    }

    /**
     * @page service Service Calls
     * @section bx_forum Discussions
     * @subsection bx_forum-page_blocks Page Blocks
     * @subsubsection bx_forum-browse_top browse_top
     * 
     * @code bx_srv('bx_forum', 'browse_top', [...]); @endcode
     * 
     * Get page block with a list of items ordered by a number of comments and represented as table.
     * 
     * @param $sUnitView (optional) string with unit view type.
     * @param $bEmptyMessage (optional) boolean value determining whether an "Empty" message should be returned or not.
     * @param $bAjaxPaginate (optional) boolean value determining whether an Ajax based pagination should be used or not.
     * @return HTML string with block content to display on the site or false if something is wrong. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxForumModule::serviceBrowseTop
     */
    /** 
     * @ref bx_forum-browse_top "browse_top"
     */
    public function serviceBrowseTop($sUnitView = false, $bEmptyMessage = true, $bAjaxPaginate = true, $bShowHeader = true)
    {
        $sType = 'top';

        if($sUnitView != 'table')
            return $this->_serviceBrowse($sType, $sUnitView ? array('unit_view' => $sUnitView) : false, BX_DB_PADDING_DEF, $bEmptyMessage, $bAjaxPaginate);

        return $this->_serviceBrowseTable(array(
            'type' => $sType,
            'empty_message' => $bEmptyMessage,
            'ajax_paginate' => $bAjaxPaginate
        ), $bShowHeader);
    }

    /**
     * @page service Service Calls
     * @section bx_forum Discussions
     * @subsection bx_forum-page_blocks Page Blocks
     * @subsubsection bx_forum-browse_popular browse_popular
     * 
     * @code bx_srv('bx_forum', 'browse_popular', [...]); @endcode
     * 
     * Get page block with a list of items ordered by a number of views and represented as table.
     * 
     * @param $sUnitView (optional) string with unit view type.
     * @param $bEmptyMessage (optional) boolean value determining whether an "Empty" message should be returned or not.
     * @param $bAjaxPaginate (optional) boolean value determining whether an Ajax based pagination should be used or not.
     * @return HTML string with block content to display on the site or false if something is wrong. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxForumModule::serviceBrowsePopular
     */
    /** 
     * @ref bx_forum-browse_popular "browse_popular"
     */
    public function serviceBrowsePopular ($sUnitView = false, $bEmptyMessage = true, $bAjaxPaginate = true, $bShowHeader = false)
    {
        $sType = 'popular';

        if($sUnitView != 'table')
            return $this->_serviceBrowse($sType, $sUnitView ? array('unit_view' => $sUnitView) : false, BX_DB_PADDING_DEF, $bEmptyMessage, $bAjaxPaginate);

        return $this->_serviceBrowseTable(array(
            'type' => $sType,
            'empty_message' => $bEmptyMessage,
            'ajax_paginate' => $bAjaxPaginate
        ), $bShowHeader);
    }

    /**
     * @page service Service Calls
     * @section bx_forum Discussions
     * @subsection bx_forum-page_blocks Page Blocks
     * @subsubsection bx_forum-browse_updated browse_updated
     * 
     * @code bx_srv('bx_forum', 'browse_updated', [...]); @endcode
     * 
     * Get page block with a list of updated items represented as table.
     * 
     * @param $sUnitView (optional) string with unit view type.
     * @param $bEmptyMessage (optional) boolean value determining whether an "Empty" message should be returned or not.
     * @param $bAjaxPaginate (optional) boolean value determining whether an Ajax based pagination should be used or not.
     * @return HTML string with block content to display on the site or false if something is wrong. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxForumModule::serviceBrowseUpdated
     */
    /** 
     * @ref bx_forum-browse_updated "browse_updated"
     */
    public function serviceBrowseUpdated ($sUnitView = false, $bEmptyMessage = true, $bAjaxPaginate = true, $bShowHeader = false)
    {
        $sType = 'updated';

        if($sUnitView != 'table')
            return $this->_serviceBrowse($sType, $sUnitView ? array('unit_view' => $sUnitView) : false, BX_DB_PADDING_DEF, $bEmptyMessage, $bAjaxPaginate);

        return $this->_serviceBrowseTable(array(
            'type' => $sType,
            'empty_message' => $bEmptyMessage,
            'ajax_paginate' => $bAjaxPaginate
        ), $bShowHeader);
    }

        /**
     * @page service Service Calls
     * @section bx_forum Discussions
     * @subsection bx_forum-page_blocks Page Blocks
     * @subsubsection bx_forum-browse_partaken browse_partaken
     * 
     * @code bx_srv('bx_forum', 'browse_partaken', [...]); @endcode
     * 
     * Get page block with a list of partaken items represented as table.
     * 
     * @param $sUnitView (optional) string with unit view type.
     * @param $bEmptyMessage (optional) boolean value determining whether an "Empty" message should be returned or not.
     * @param $bAjaxPaginate (optional) boolean value determining whether an Ajax based pagination should be used or not.
     * @return HTML string with block content to display on the site or false if something is wrong. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxForumModule::serviceBrowsePartaken
     */
    /** 
     * @ref bx_forum-browse_partaken "browse_partaken"
     */
    public function serviceBrowsePartaken ($iProfileId = 0, $aParams = [])
    {
        $sType = 'partaken';

        if(!$iProfileId)
            $iProfileId = bx_process_input(bx_get('profile_id'), BX_DATA_INT);
        if(!$iProfileId)
            $iProfileId = bx_get_logged_profile_id();

        $bEmptyMessage = true;
        if(isset($aParams['empty_message'])) {
            $bEmptyMessage = (bool)$aParams['empty_message'];
            unset($aParams['empty_message']);
        }

        $bAjaxPaginate = true;
        if(isset($aParams['ajax_paginate'])) {
            $bAjaxPaginate = (bool)$aParams['ajax_paginate'];
            unset($aParams['ajax_paginate']);
        }
        
        $bShowHeader = false;
        if(isset($aParams['show_header'])) {
            $bShowHeader = (bool)$aParams['show_header'];
            unset($aParams['show_header']);
        }

        if(isset($aParams['unit_view']) && $aParams['unit_view'] != 'table')
            return $this->_serviceBrowse($sType, array_merge(['author' => $iProfileId], $aParams), BX_DB_PADDING_DEF, $bEmptyMessage, $bAjaxPaginate);

        return $this->_serviceBrowseTable([
            'type' => $sType,
            'author' => $iProfileId,
            'include_contexts' => isset($aParams['include_contexts']) && $aParams['include_contexts'],
            'empty_message' => $bEmptyMessage,
            'ajax_paginate' => $bAjaxPaginate
        ], $bShowHeader);
    }

    /**
     * @page service Service Calls
     * @section bx_forum Discussions
     * @subsection bx_forum-page_blocks Page Blocks
     * @subsubsection bx_forum-browse_index browse_index
     * 
     * @code bx_srv('bx_forum', 'browse_index', [...]); @endcode
     * 
     * Get page block for Site's Home page with a list of items ordered by newness and represented as table.
     * 
     * @param $sUnitView (optional) string with unit view type.
     * @param $bEmptyMessage (optional) boolean value determining whether an "Empty" message should be returned or not.
     * @param $bAjaxPaginate (optional) boolean value determining whether an Ajax based pagination should be used or not.
     * @param $bShowHeader (optional) boolean value determining whether a resulting table should have Header section or not.
     * @return HTML string with block content to display on the site or false if something is wrong. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxForumModule::serviceBrowseIndex
     */
    /** 
     * @ref bx_forum-browse_index "browse_index"
     */
    public function serviceBrowseIndex($sUnitView = false, $bEmptyMessage = true, $bAjaxPaginate = true, $bShowHeader = false)
    {
    	$sType = 'index';

    	if($sUnitView != 'table')
            return $this->_serviceBrowse($sType, $sUnitView ? array('unit_view' => $sUnitView) : false, BX_DB_PADDING_DEF, $bEmptyMessage, $bAjaxPaginate);

        return $this->_serviceBrowseTable(array(
            'type' => $sType,
            'per_page' => (int)$this->_oDb->getParam('bx_forum_per_page_index'),
            'empty_message' => $bEmptyMessage,
            'ajax_paginate' => $bAjaxPaginate
        ), $bShowHeader);
    }

    /**
     * @page service Service Calls
     * @section bx_forum Discussions
     * @subsection bx_forum-page_blocks Page Blocks
     * @subsubsection bx_forum-browse_author browse_author
     * 
     * @code bx_srv('bx_forum', 'browse_author', [...]); @endcode
     * 
     * Get page block with a list of items filtered by Author and represented as table.
     * 
     * @param $iProfileId (optional) integer value with author ID. If empty value is provided, an attempt to get it from GET/POST arrays will be performed.
     * @param $aParams (optional) an array of additional params. It's not used for now.
     * @return HTML string with block content to display on the site or false if something is wrong. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxForumModule::serviceBrowseAuthor
     */
    /** 
     * @ref bx_forum-browse_author "browse_author"
     */
	public function serviceBrowseAuthor ($iProfileId = 0, $aParams = array())
    {
        if(!$iProfileId)
            $iProfileId = bx_process_input(bx_get('profile_id'), BX_DATA_INT);

        if(!$iProfileId)
            return '';

        $bEmptyMessage = true;
        if(isset($aParams['empty_message'])) {
            $bEmptyMessage = (bool)$aParams['empty_message'];
            unset($aParams['empty_message']);
        }

        $bAjaxPaginate = true;
        if(isset($aParams['ajax_paginate'])) {
            $bAjaxPaginate = (bool)$aParams['ajax_paginate'];
            unset($aParams['ajax_paginate']);
        }
        
        if($this->_bIsApi || (isset($aParams['unit_view']) && $aParams['unit_view'] != 'table'))
            return $this->_serviceBrowse('author', array_merge(array('author' => $iProfileId), $aParams), BX_DB_PADDING_DEF, $bEmptyMessage, $bAjaxPaginate);

        return $this->_serviceBrowseTable(array(
        	'type' => 'author', 
        	'author' => $iProfileId, 
        	'where' => array('fld' => 'author', 'val' => $iProfileId, 'opr' => '='), 
        	'per_page' => (int)$this->_oDb->getParam('bx_forum_per_page_profile'),
        	'empty_message' => $bEmptyMessage,
        	'ajax_paginate' => $bAjaxPaginate
        ), false);
    }

    /**
     * @page service Service Calls
     * @section bx_forum Discussions
     * @subsection bx_forum-page_blocks Page Blocks
     * @subsubsection bx_forum-browse_category browse_category
     * 
     * @code bx_srv('bx_forum', 'browse_category', [...]); @endcode
     * 
     * Get page block with a list of items filter by some category and represented as table.
     * 
     * @param $sUnitView (optional) string with unit view type.
     * @param $bEmptyMessage (optional) boolean value determining whether an "Empty" message should be returned or not.
     * @param $bAjaxPaginate (optional) boolean value determining whether an Ajax based pagination should be used or not.
     * @return HTML string with block content to display on the site or false if something is wrong. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxForumModule::serviceBrowseCategory
     */
    /** 
     * @ref bx_forum-browse_category "browse_category"
     */
    public function serviceBrowseCategory($sUnitView = false, $bEmptyMessage = true, $bAjaxPaginate = true, $aParams = [])
    {
        if (bx_is_api()){
            return parent::serviceBrowseCategory($sUnitView, $bEmptyMessage, $bAjaxPaginate, []);
        }
        
        $sType = 'category';
        $iCategory = bx_process_input(bx_get('category'), BX_DATA_INT);

        $aCategory = $this->_oDb->getCategories(array('type' => 'by_category', 'category' => $iCategory));
        if(!empty($aCategory['visible_for_levels']) && !BxDolAcl::getInstance()->isMemberLevelInSet($aCategory['visible_for_levels']))
            return $bEmptyMessage ? MsgBox(_t('_sys_txt_access_denied')) : '';

        if($sUnitView != 'table') {
            $aParams = array_merge(['category' => $iCategory], $aParams);
            if($sUnitView)
                $aParams['unit_view'] = $sUnitView;

            return $this->_serviceBrowse($sType, $aParams, BX_DB_PADDING_DEF, $bEmptyMessage, $bAjaxPaginate);
        }

        return $this->_serviceBrowseTable(array(
            'type' => $sType, 
            'where' => array('fld' => 'cat', 'val' => $iCategory, 'opr' => '='),
            'empty_message' => $bEmptyMessage,
            'ajax_paginate' => $bAjaxPaginate
        ), !isset($aParams['show_header']) || (bool)$aParams['show_header'] === true);
    }

    /**
     * @page service Service Calls
     * @section bx_forum Discussions
     * @subsection bx_forum-page_blocks Page Blocks
     * @subsubsection bx_forum-browse_keyword browse_keyword
     * 
     * @code bx_srv('bx_forum', 'browse_keyword', [...]); @endcode
     * 
     * Get page block with a list of items filter by some keyword and represented as table.
     * 
     * @param $sUnitView (optional) string with unit view type.
     * @param $bEmptyMessage (optional) boolean value determining whether an "Empty" message should be returned or not.
     * @param $bAjaxPaginate (optional) boolean value determining whether an Ajax based pagination should be used or not.
     * @return HTML string with block content to display on the site or false if something is wrong. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxForumModule::serviceBrowseKeyword
     */
    /** 
     * @ref bx_forum-browse_keyword "browse_keyword"
     */
    public function serviceBrowseKeyword($sUnitView = false, $bEmptyMessage = true, $bAjaxPaginate = true, $bShowHeader = false)
    {
        $sType = 'keyword';
        $sKeyword = bx_process_input(bx_get('keyword'));

        if($sUnitView != 'table')   
            return $this->_serviceBrowse($sType, $sUnitView ? array('unit_view' => $sUnitView) : false, BX_DB_PADDING_DEF, $bEmptyMessage, $bAjaxPaginate);

        return $this->_serviceBrowseTable(array(
            'type' => $sType, 
            'where' => $this->_getSearchKeywordDescriptor('#' . $sKeyword),
            'empty_message' => $bEmptyMessage,
            'ajax_paginate' => $bAjaxPaginate
        ), $bShowHeader);
    }

    /**
     * @page service Service Calls
     * @section bx_forum Discussions
     * @subsection bx_forum-page_blocks Page Blocks
     * @subsubsection bx_forum-browse_search_results browse_search_results
     * 
     * @code bx_srv('bx_forum', 'browse_search_results', [...]); @endcode
     * 
     * Get page block with search results by Author(s), Category, Keyword represented as table.
     * 
     * @param $sUnitView (optional) string with unit view type.
     * @param $bEmptyMessage (optional) boolean value determining whether an "Empty" message should be returned or not.
     * @param $bAjaxPaginate (optional) boolean value determining whether an Ajax based pagination should be used or not.
     * @return HTML string with block content to display on the site or false if something is wrong. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxForumModule::serviceBrowseSearchResults
     */
    /** 
     * @ref bx_forum-browse_search_results "browse_search_results"
     */
    public function serviceBrowseSearchResults($sUnitView = false, $bEmptyMessage = true, $bAjaxPaginate = true)
    {
        $sType = 'search';

        $aAuthors = bx_process_input(bx_get('author'));
        $iCategory = bx_process_input(bx_get('category'), BX_DATA_INT);
        $sKeyword = bx_process_input(bx_get('keyword'));

        $aCategory = $this->_oDb->getCategories(array('type' => 'by_category', 'category' => $iCategory));
        if(!empty($aCategory['visible_for_levels']) && !BxDolAcl::getInstance()->isMemberLevelInSet($aCategory['visible_for_levels']))
            return $bEmptyMessage ? MsgBox(_t('_sys_txt_access_denied')) : '';

        if($sUnitView != 'table')   
            return $this->_serviceBrowse('', $sUnitView ? array('unit_view' => $sUnitView) : false, BX_DB_PADDING_DEF, $bEmptyMessage, $bAjaxPaginate);

        $aWhereGroupAnd = array('grp' => true, 'opr' => 'AND', 'cnds' => array());
        if(!empty($aAuthors) && is_array($aAuthors))
            $aWhereGroupAnd['cnds'][] = $this->_getSearchAuthorDescriptor($aAuthors);

        if(!empty($iCategory))
            $aWhereGroupAnd['cnds'][] = array('fld' => 'cat', 'val' => $iCategory, 'opr' => '=');

        if(!empty($sKeyword))
            $aWhereGroupAnd['cnds'][] = $this->_getSearchKeywordDescriptor($sKeyword);

        return $this->_serviceBrowseTable(array(
            'type' => $sType, 
            'where' => $aWhereGroupAnd,
            'empty_message' => $bEmptyMessage,
            'ajax_paginate' => $bAjaxPaginate
        ), false);
    }

    /**
     * @page service Service Calls
     * @section bx_forum Discussions
     * @subsection bx_forum-other Other
     * @subsubsection bx_forum-get_discussions_num get_discussions_num
     * 
     * @code bx_srv('bx_forum', 'get_discussions_num', [...]); @endcode
     * 
     * Get number of discussions for some profile.
     * 
     * @param $iProfileId (optional) profile to get discussions for, if omitted then currently logged in profile is used.
     * @return integer value with a number of discussions.
     * 
     * @see BxForumModule::serviceGetDiscussionsNum
     */
    /** 
     * @ref bx_forum-get_discussions_num "get_discussions_num"
     */
    public function serviceGetDiscussionsNum ($iProfileId = 0)
    {
        if (!$iProfileId)
            $iProfileId = bx_get_logged_profile_id();

        return $this->_oDb->getEntriesNumByAuthor((int)$iProfileId);
    }

    /**
     * @page service Service Calls
     * @section bx_forum Discussions
     * @subsection bx_forum-other Other
     * @subsubsection bx_forum-get_unreplied_discussions_num get_unreplied_discussions_num
     * 
     * @code bx_srv('bx_forum', 'get_unreplied_discussions_num', [...]); @endcode
     * 
     * Get number of unreplied discussions for some profile.
     * 
     * @param $iProfileId (optional) profile to get unreplied discussions for, if omitted then currently logged is profile is used.
     * @return integer value with a number of discussions.
     * 
     * @see BxForumModule::serviceGetUnrepliedDiscussionsNum
     */
    /** 
     * @ref bx_forum-get_unreplied_discussions_num "get_unreplied_discussions_num"
     */
    public function serviceGetUnrepliedDiscussionsNum ($iProfileId = 0)
    {
        if (!$iProfileId)
            $iProfileId = bx_get_logged_profile_id();

        return $this->_oDb->getUnrepliedDiscussionsNum((int)$iProfileId);
    }

    /**
     * 
     */
    /**
     * @page service Service Calls
     * @section bx_forum Discussions
     * @subsection bx_forum-other Other
     * @subsubsection bx_forum-trigger_comment_post trigger_comment_post
     * 
     * @code bx_srv('bx_forum', 'trigger_comment_post', [...]); @endcode
     * 
     * Update last comment time and author when new comment was added in the discussion.
     * 
     * @param $iContentId integer value with content ID.
     * @param $iProfileId integer value with profile ID.
     * @param $iCommentId integer value with comment ID.
     * @param $iTimestamp (optional) date in UNIX Timestamp format, if omitted then current date is used.
     * @param $sCommentText (optional) string value with text of comment.
     * @return boolean value determining where the operation is successful or not.
     * 
     * @see BxForumModule::serviceTriggerCommentPost
     */
    /** 
     * @ref bx_forum-trigger_comment_post "trigger_comment_post"
     */
    public function serviceTriggerCommentPost ($iContentId, $iProfileId, $iCommentId, $iTimestamp = 0, $sCommentText = '')
    {
    	$CNF = $this->_oConfig->CNF;

    	$iContentId = (int)$iContentId;
        if(!$iContentId)
            return false;

        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        if(!$aContentInfo)
			return false;

        $oCmts = BxDolCmts::getObjectInstance($CNF['OBJECT_COMMENTS'], $iContentId);
        if(!$oCmts)
            return false;

        if(!$iTimestamp)
			$iTimestamp = time();

        if(!$this->_oDb->updateLastCommentTimeProfile((int)$iContentId, (int)$iProfileId, $iCommentId, $iTimestamp))
			return false;

        // send notification to author
        if($iProfileId != $aContentInfo[$CNF['FIELD_AUTHOR']]) {
	        $oProfile = BxDolProfile::getInstanceMagic($iProfileId);
	        if($oProfile) 
                sendMailTemplate('bx_forum_new_reply', 0, $aContentInfo[$CNF['FIELD_AUTHOR']], array(
                    'SenderDisplayName' => $oProfile->getDisplayName(),
                    'SenderUrl' => $oProfile->getUrl(),
                    'PageUrl' => $oCmts->getItemUrl($iCommentId),
                    'PageTitle' => $oCmts->getObjectTitle(),
                    'Message' => $sCommentText,
                ), BX_EMAIL_NOTIFY);
        }

        return true;
    }
    
    
    /**
     * @page service Service Calls
     * @section bx_forum Discussions
     * @subsection bx_forum-page_blocks Page Blocks
     * @subsubsection bx_forum-entity_author entity_author
     * 
     * @code bx_srv('bx_forum', 'entity_author', [...]); @endcode
     * 
     * Get page block with author.
     * 
     * @param $iContentId (optional) content ID. If empty value is provided, an attempt to get it from GET/POST arrays will be performed.
     * @return HTML string with block content to display on the site or false if something is wrong. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxForumModule::serviceEntityAuthor
     */
    /** 
     * @ref bx_forum-entity_author "entity_author"
     */
    public function serviceEntityAuthor ($iContentId = 0)
    {
        if (bx_is_api())
            return $this->_serviceTemplateFunc ('entryAuthor', $iContentId);
        
        return bx_srv('system', 'get_block_author', ['bx_forum', $iContentId], 'TemplServices');
    }

    /**
     * @page service Service Calls
     * @section bx_forum Discussions
     * @subsection bx_forum-page_blocks Page Blocks
     * @subsubsection bx_forum-entity_participants entity_participants
     * 
     * @code bx_srv('bx_forum', 'entity_participants', [...]); @endcode
     * 
     * Get page block with discussion's collaborators.
     * 
     * @param $iContentId (optional) content ID. If empty value is provided, an attempt to get it from GET/POST arrays will be performed.
     * @return HTML string with block content to display on the site or false if something is wrong. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxForumModule::serviceEntityParticipants
     */
    /** 
     * @ref bx_forum-entity_participants "entity_participants"
     */
    public function serviceEntityParticipants ($iContentId = 0)
    {
        if (!$iContentId)
            $iContentId = bx_process_input(bx_get('id'), BX_DATA_INT);
        if (!$iContentId)
            return false;
        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        if (!$aContentInfo)
            return false;

        return $this->_oTemplate->entryParticipants ($aContentInfo, 5, 'right');
    }

    /**
     * @page service Service Calls
     * @section bx_forum Discussions
     * @subsection bx_forum-page_blocks Page Blocks
     * @subsubsection bx_forum-search search
     * 
     * @code bx_srv('bx_forum', 'search', [...]); @endcode
     * 
     * Get page block with search form.
     * 
     * @return HTML string with block content to display on the site or false if something is wrong. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxForumModule::serviceSearch
     */
    /** 
     * @ref bx_forum-search "search"
     */
	public function serviceSearch()
    {
    	$CNF = $this->_oConfig->CNF;
    	$oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_SEARCH'], $CNF['OBJECT_FORM_SEARCH_DISPLAY_FULL'], $this->_oTemplate);
    	$oForm->initChecker();

        return $oForm->getCode();
    }

    public function checkAllowedSubscribe(&$aDataEntry, $isPerformAction = false)
    {
        $CNF = &$this->_oConfig->CNF;

        $sMsg = $this->checkAllowedView($aDataEntry);
        if($sMsg !== CHECK_ACTION_RESULT_ALLOWED)
            return $sMsg;

        return $this->_checkAllowedConnect ($aDataEntry, $isPerformAction, $CNF['OBJECT_CONNECTION_SUBSCRIBERS'], false, false);
    }

    public function checkAllowedUnsubscribe(&$aDataEntry, $isPerformAction = false)
    {
        $CNF = &$this->_oConfig->CNF;

        return $this->_checkAllowedConnect ($aDataEntry, $isPerformAction, $CNF['OBJECT_CONNECTION_SUBSCRIBERS'], false, true);
    }

    public function checkAllowedStickAnyEntry($aDataEntry, $isPerformAction = false)
    {
    	$CNF = &$this->_oConfig->CNF;

    	if((int)$aDataEntry[$CNF['FIELD_STICK']] != 0)
    		return false;

		return $this->_checkAllowedAction('stick any entry', $aDataEntry, $isPerformAction);
    }

    public function checkAllowedUnstickAnyEntry($aDataEntry, $isPerformAction = false)
    {
    	$CNF = $this->_oConfig->CNF;

    	if((int)$aDataEntry[$CNF['FIELD_STICK']] != 1)
			return false;

    	return $this->_checkAllowedAction('stick any entry', $aDataEntry, $isPerformAction);
    }
    
    public function checkAllowedResolveAnyEntry($aDataEntry, $isPerformAction = false)
    {
    	$CNF = &$this->_oConfig->CNF;

    	if((int)$aDataEntry[$CNF['FIELD_RESOLVABLE']] != 1 || (int)$aDataEntry[$CNF['FIELD_RESOLVE']] != 0)
    		return false;

        if($aDataEntry[$CNF['FIELD_AUTHOR']] == bx_get_logged_profile_id())
            return CHECK_ACTION_RESULT_ALLOWED;
        
		return $this->_checkAllowedAction('resolve any entry', $aDataEntry, $isPerformAction);
    }

    public function checkAllowedUnresolveAnyEntry($aDataEntry, $isPerformAction = false)
    {
    	$CNF = $this->_oConfig->CNF;
        
    	if((int)$aDataEntry[$CNF['FIELD_RESOLVABLE']] != 1 || (int)$aDataEntry[$CNF['FIELD_RESOLVE']] != 1)
			return false;
        
        if($aDataEntry[$CNF['FIELD_AUTHOR']] == bx_get_logged_profile_id())
            return CHECK_ACTION_RESULT_ALLOWED;

    	return $this->_checkAllowedAction('resolve any entry', $aDataEntry, $isPerformAction);
    }

    public function checkAllowedLockAnyEntry($aDataEntry, $isPerformAction = false)
    {
    	$CNF = $this->_oConfig->CNF;

    	if((int)$aDataEntry[$CNF['FIELD_LOCK']] != 0)
    		return false;

		return $this->_checkAllowedAction('lock any entry', $aDataEntry, $isPerformAction);
    }

	public function checkAllowedUnlockAnyEntry($aDataEntry, $isPerformAction = false)
    {
    	$CNF = $this->_oConfig->CNF;

    	if((int)$aDataEntry[$CNF['FIELD_LOCK']] != 1)
    		return false;

		return $this->_checkAllowedAction('lock any entry', $aDataEntry, $isPerformAction);
    }

    public function checkAllowedHideAnyEntry($aDataEntry, $isPerformAction = false)
    {
    	$CNF = $this->_oConfig->CNF;

    	if($aDataEntry[$CNF['FIELD_STATUS_ADMIN']] == 'hidden')
    		return false;

		return $this->_checkAllowedAction('hide any entry', $aDataEntry, $isPerformAction);
    }

	public function checkAllowedUnhideAnyEntry($aDataEntry, $isPerformAction = false)
    {
    	$CNF = &$this->_oConfig->CNF;

    	if($aDataEntry[$CNF['FIELD_STATUS_ADMIN']] != 'hidden')
    		return false;

		return $this->_checkAllowedAction('hide any entry', $aDataEntry, $isPerformAction);
    }

    protected function _checkAllowedConnect (&$aDataEntry, $isPerformAction, $sObjConnection, $isMutual, $isInvertResult)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!$this->_iProfileId)
            return _t('_sys_txt_access_denied');

        $isConnected = BxDolConnection::getObjectInstance($sObjConnection)->isConnected($this->_iProfileId, $aDataEntry[$CNF['FIELD_ID']], $isMutual);
        if($isInvertResult)
            $isConnected = !$isConnected;

        return $isConnected ? _t('_sys_txt_access_denied') : CHECK_ACTION_RESULT_ALLOWED;
    }

	/**
     * @return CHECK_ACTION_RESULT_ALLOWED if access is granted or error message if access is forbidden. So make sure to make strict(===) checking.
     */
    protected function _checkAllowedAction($sAction, $aDataEntry, $isPerformAction = false)
    {
        if($this->_isModerator($isPerformAction))
			return CHECK_ACTION_RESULT_ALLOWED;

		$aCheck = checkActionModule($this->_iProfileId, $sAction, $this->getName(), $isPerformAction);
    	if($aCheck[CHECK_ACTION_RESULT] === CHECK_ACTION_RESULT_ALLOWED)
    		return CHECK_ACTION_RESULT_ALLOWED;

        return _t('_sys_txt_access_denied');
    }

    protected function _serviceBrowseTable($aParams, $isDisplayHeader = true)
    {
        $sGrid = $this->_oConfig->CNF['OBJECT_GRID'];
        if(!empty($aParams['grid'])) {
            $sGrid = $aParams['grid'];
            unset($aParams['grid']);
        }

        $oGrid = BxDolGrid::getObjectInstance($sGrid);
        if(!$oGrid)
            return false;
        
        $oGrid->setBrowseParams($aParams);
        
        $this->_oTemplate->addJsTranslation(array('_sys_grid_search'));
        $this->_oTemplate->addCss(array('grid_tools.css'));
       
        return $oGrid->getCode($isDisplayHeader);
    }

    protected function _getSearchAuthorDescriptor($aAutor)
    {
        return array('grp' => true, 'opr' => 'OR', 'cnds' => array(
            array('fld' => 'author', 'val' => $aAutor, 'opr' => 'IN'),
            array('fld' => 'author_comment', 'val' => $aAutor, 'opr' => 'IN'),
        ));
    }

    protected function _getSearchKeywordDescriptor($sKeyword)
    {
        return array('grp' => true, 'opr' => 'OR', 'cnds' => array(
            array('fld' => 'title', 'val' => $sKeyword, 'opr' => 'LIKE'),
            array('fld' => 'text', 'val' => $sKeyword, 'opr' => 'LIKE'),
            array('fld' => 'text_comments', 'val' => $sKeyword, 'opr' => 'LIKE')
        ));
    }
}

/** @} */
