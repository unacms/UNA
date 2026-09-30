<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

define('BX_METATAGS_KEYWORDS_IN_CLOUD', 32); ///< default number of tags in tags cloud

/**
 * System services for metatags functionality.
 */
class BxBaseServiceMetatags extends BxDol
{
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-metatags Metatags
     * @subsubsection bx_system_general-keywords_cloud keywords_cloud
     * 
     * @code bx_srv('system', 'keywords_cloud', ["bx_posts", "bx_posts"], 'TemplServiceMetatags'); @endcode
     * @code {{~system:keywords_cloud:TemplServiceMetatags["bx_posts", "bx_posts"]~}} @endcode
     * 
     * Get keywords cloud.
     * @param $sObject metatags object to get keywords cloud for
     * @param $mixedSection search section to refer when keyword is clicked, 
     *          set the same as $sObject to show content withing the module only, 
     *          it can be one value or array of values, leave empty to show 
     *          all possible content upon keyword click
     * @param $aParams additional params:
     *          - max_count: number of tags in keywords cloud, 
     *                  by default BX_METATAGS_KEYWORDS_IN_CLOUD
     *          - show_empty: show empty message or not when no data available
     *          
     * @return tags cloud HTML string
     * 
     * @see BxBaseServiceMetatags::serviceKeywordsCloud
     */
    /** 
     * @ref bx_system_general-keywords_cloud "keywords_cloud"
     */
    public function serviceKeywordsCloud($sObject, $mixedSection, $aParams = array())
    {
    	$iMaxCount = isset($aParams['max_count']) ? (int)$aParams['max_count'] : BX_METATAGS_KEYWORDS_IN_CLOUD;
    	$bShowEmpty = isset($aParams['show_empty']) ? (bool)$aParams['show_empty'] : false;
        $bMenuView = isset($aParams['menu_view']) ? (bool)$aParams['menu_view'] : false;
        
        $aContextInfo = bx_get_page_info();
        
        $aParams = ['menu_view' => $bMenuView];
        if ($aContextInfo !== false)
            $aParams['context_id'] = $aContextInfo['context_profile_id'];

        $sResult = BxDolMetatags::getObjectInstance($sObject)->getKeywordsCloud($mixedSection, $iMaxCount, false, $aParams);

        if(empty($sResult))
            return $bShowEmpty ? MsgBox(_t('_Empty')) : '';

        return $sResult;
    }

    public function serviceBrowseLabels($aParams = array())
    {
        return BxDolLabel::getInstance()->getLabelsBrowse($aParams);
    }

    /**
     * Get location map.
     * @param $sObject metatgs object to get keywords cloud for
     * @param $iId content id
     * @return map HTML string
     */
    public function serviceLocationsMap($sObject, $iId, $aParams = array())
    {
        $oMetatags = BxDolMetatags::getObjectInstance($sObject);
        if($oMetatags === false)
            return false;

        $sModule = $oMetatags->getModule();

        $aContentInfo = bx_srv($sModule, 'get_info', [$iId, false]);
        if(empty($aContentInfo) || !is_array($aContentInfo))
            return false;

        $oFormsHelper = bx_srv($sModule, 'forms_helper');
        $oFormView = $oFormsHelper->getObjectFormView();
        if(!$oFormView)
            return false;

        $CNF = &BxDolModule::getInstance($sModule)->_oConfig->CNF;

        $oFormView->initChecker($aContentInfo);
        if(empty($CNF['FIELD_LOCATION']) || !$oFormView->isInputVisible($CNF['FIELD_LOCATION']))
            return false;

        return $oMetatags->getLocationsMap($iId, $aParams);
    }

    /**
     * Get notification data for Notifications module - action Mention. 
     */
    public function serviceGetNotificationsPostMention($aEvent)
    {
        $iProfile = (int)$aEvent['object_owner_id'];
        $oProfile = BxDolProfile::getInstance($iProfile);
        if(!$oProfile)
            return [];

        $sEntrySample = $sEntryCaption = '';
        $sEntryUrl = $sEntryUrlApi = '';
        if (($sModule = $aEvent['content']['module'] ?? false) && ($iContentId = $aEvent['content']['content_id'] ?? false)) {
            if ($sModule == 'sys_cmts') {
                $oCmts = BxDolCmts::getObjectInstanceByUniqId($iContentId);
                $aCmt = BxDolCmtsQuery::getCommentExtendedByUniqId($iContentId);
                if ($oCmts && $aCmt) {
                    $sEntrySample = '_cmt_txt_sample_comment_single';
                    $sEntryCaption = $oCmts->getViewSnippet($aCmt);

                    $sEntryUrl = $oCmts->getItemUrl($aCmt['cmt_id'], '{bx_url_root}');
                    $sEntryUrlApi = $oCmts->getItemUrlApi($aCmt['cmt_id'], '{bx_url_root}');
                }
            }
            else {
                if (bx_is_srv($sModule, 'module_sample'))
                    $sEntrySample = bx_srv($sModule, 'module_sample', []);

                if (bx_is_srv($sModule, 'get_title'))
                    $sEntryCaption = bx_srv($sModule, 'get_title', [$iContentId]);

                if (bx_is_srv($sModule, 'get_link') && ($sLink = bx_srv($sModule, 'get_link', [$iContentId])))
                    $sEntryUrl = str_replace(BX_DOL_URL_ROOT, '{bx_url_root}', $sLink);
            }
        }

        if(!$sEntryUrl)
            $sEntryUrl = '{bx_url_root}' . bx_append_url_params('searchKeyword.php', ['type' => 'mention', 'keyword' => $iProfile]);

        return [
            'entry_sample' => '_sys_profile_sample_single',
            'entry_url' => $sEntryUrl,
            'entry_url_api' => $sEntryUrlApi,
            'entry_caption' => $oProfile->getDisplayName(),
            'subentry_sample' => $sEntrySample,
            'subentry_caption' => $sEntryCaption,
            'entry_author' => $iProfile,
            'lang_key' => '_sys_metatags_mention_added',
        ];
    }
}

/** @} */
