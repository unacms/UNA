<?php defined('BX_DOL') or die('hack attempt');
/**
* Copyright (c) UNA, Inc - https://una.io
* MIT License - https://opensource.org/licenses/MIT
*
* @defgroup    MassMailer Mass Mailer
* @ingroup     UnaModules
*
* @{
*/

class BxMassMailerModule extends BxBaseModGeneralModule
{
    private $aSegments = array();
          
    function __construct(&$aModule)
    {
        parent::__construct($aModule);
        $CNF = &$this->_oConfig->CNF;
        $aRv = array('lvl:0' => _t('_bx_massmailer_segments_all'));
        $oAccountQuery = BxDolAclQuery::getInstance();
              
        $aTmp = array();
        $oAccountQuery->getLevels(array('type' => 'all_active_pair'), $aTmp);
        foreach ($aTmp as $sKey => $sTmp){
            if ($sKey != MEMBERSHIP_ID_NON_MEMBER && $sKey != MEMBERSHIP_ID_ACCOUNT)
                $aRv['lvl:' . $sKey] = _t($sTmp);
        };
              
        $aTmp = $this->_oDb->getSegments();
        foreach ($aTmp as $sKey => $sTmp){
            $aRv['cst:' . $sKey] = _t($sTmp);
        };
        $this->aSegments = $aRv;
    }
          
    /**
    * ACTION METHODS
    */
    public function actionTrack($sActionName, $sHash)
    {
        if (isset($sHash) && trim($sHash) != ""){
            switch ($sActionName) {
                case 'click':
                    $sLink = $this->_oDb->updateDateClickForLink($sHash);
                    if (strpos($sLink, '://') === false)
                        $sLink = BX_DOL_URL_ROOT . $sLink;
                    header('Location: ' . $sLink);
                    break;
                    
                case 'seen':
                    header('Content-Type: image/png');
                    $this->_oDb->updateDateSeenForLetter($sHash);
                    break;
            }
        }
    }
    
    public function actionGetReportsData($sReportName, $sReportType, $sDateFrom, $sDateTo, $sSegment)
    {
        if($this->checkAllowed() !== CHECK_ACTION_RESULT_ALLOWED)
            return '';
        
        header('Content-Type: application/json');
        echo json_encode($this->getReportsData($sReportName, $sReportType, $sDateFrom, $sDateTo, $sSegment));
    }

    /**
     * Chart.js 4 config for a report: type, data and options.
     */
    public function getReportsData($sReportName, $sReportType, $sDateFrom, $sDateTo, $sSegment)
    {
        $iDateFrom = strtotime($sDateFrom);
        $iDateTo = strtotime($sDateTo);
        $bIsTimeX = false;

        switch ($sReportName) {
            case "SUBSCRIBERS_INFO":
                $bIsTimeX = true;
                $aReport = $this->getReportSubscribers($sReportType == 'content_total', $iDateFrom, $iDateTo, $sSegment);
                break;

            case "CAMPAIGN_REPORT":
                $aReport = $this->getReportCampaign($sReportType);
                break;

            default:
                $aReport = array(
                    'labels' => array(),
                    'values' => array(array('legend' => '', 'data' => array())),
                    'strings' => array(_t('_bx_massmailer_txt_item'), _t('_bx_massmailer_txt_value')),
                    'max' => 0
                );
        }

        $iMinValueY = 0;
        $iMaxValueY = ceil($aReport['max'] * 1.1);

        return array(
            'type' => $bIsTimeX ? 'line' : 'bar',
            'data' => array(
                'labels' => $aReport['labels'],
                'datasets' => $this->getReportDatasets($aReport['values'])
            ),
            'options' => array(
                'plugins' => array(
                    'legend' => array(
                        'position' => 'bottom',
                        'display' => count($aReport['values']) > 1
                    )
                ),
                'scales' => array(
                    'y' => array(
                        'max' => $iMaxValueY,
                        'min' => $iMinValueY,
                        'ticks' => array(
                            'stepSize' => $this->getReportStep($iMinValueY, $iMaxValueY),
                            'autoSkip' => true
                        )
                    ),
                    'x' => $bIsTimeX ? $this->getReportTimeAxis($iDateFrom, $iDateTo) : array('ticks' => array('autoSkip' => false), 'display' => true)
                )
            ),
            'links' => array(),
            'strings' => $aReport['strings'],
        );
    }

    /**
     * Subscribed and unsubscribed accounts of a segment, a point per day.
     */
    private function getReportSubscribers($bTotal, $iDateFrom, $iDateTo, $sSegment)
    {
        $sSql = $this->getSqlBySegment($sSegment);
        $iMaxValueY = 0;

        $aSubscribed = $this->getReportSeries($this->_oDb->getAccountsByTermsStat($iDateFrom, $iDateTo, $sSql), (int)$this->_oDb->getAccountsByTermsStatInitValue($iDateFrom, $sSql), $bTotal, $iDateFrom, $iDateTo, $iMaxValueY);
        $aUnsubscribed = $this->getReportSeries($this->_oDb->getAccountsByTermsStatUnsubscribe($iDateFrom, $iDateTo, $sSql), (int)$this->_oDb->getAccountsByTermsStatInitValueUnsubscribe($iDateFrom, $sSql), $bTotal, $iDateFrom, $iDateTo, $iMaxValueY);

        return array(
            'labels' => array(),
            'values' => array(
                array('legend' => _t('_bx_massmailer_txt_subscribed'), 'data' => $aSubscribed),
                array('legend' => _t('_bx_massmailer_txt_unsubscribed'), 'data' => $aUnsubscribed)
            ),
            'strings' => array(_t('_bx_massmailer_txt_date'), ''),
            'max' => $iMaxValueY
        );
    }

    /**
     * Points from the per-day counts in $aRows: the running total before the day when $bTotal is set,
     * the day's count otherwise. $iMaxValueY is raised to the largest total or count.
     */
    private function getReportSeries($aRows, $iTotal, $bTotal, $iDateFrom, $iDateTo, &$iMaxValueY)
    {
        $aCounts = array_column($aRows, 'count', 'period');

        $aPoints = array();
        for ($i = $iDateFrom; $i < $iDateTo; $i += 86400) {
            $sX = date('Y-m-d', $i);
            $iCount = isset($aCounts[$sX]) ? (int)$aCounts[$sX] : 0;

            $aPoints[] = array('x' => $sX, 'y' => $bTotal ? $iTotal : $iCount);
            $iTotal += $iCount;

            $iMaxValueY = max($iMaxValueY, $bTotal ? $iTotal : $iCount);
        }

        return $aPoints;
    }

    private function getReportCampaign($iCampaignId)
    {
        $aStat = $this->_oDb->getStatByCampaignId($iCampaignId);
        $iUnopened = $aStat['total'] - $aStat['seen'];

        return array(
            // One category for all bars: a category axis without labels places no bars.
            'labels' => array(''),
            'values' => array(
                array('legend' => _t('_bx_massmailer_txt_sent_total_title', $aStat['total']), 'data' => array($aStat['total'])),
                array('legend' => _t('_bx_massmailer_txt_opened_total_title', $aStat['seen']), 'data' => array($aStat['seen'])),
                array('legend' => _t('_bx_massmailer_txt_unopened_total_title', $iUnopened), 'data' => array($iUnopened)),
                array('legend' => _t('_bx_massmailer_txt_clicked_total_title', $aStat['clicked']), 'data' => array($aStat['clicked'])),
                array('legend' => _t('_bx_massmailer_txt_unsubscribed_total_title', $aStat['unsubscribed']), 'data' => array($aStat['unsubscribed']))
            ),
            'strings' => array(_t('_bx_massmailer_txt_item'), _t('_bx_massmailer_txt_value')),
            'max' => $aStat['total']
        );
    }

    private function getReportTimeAxis($iDateFrom, $iDateTo)
    {
        $iDays = ($iDateTo - $iDateFrom) / 86400;

        $sUnit = 'day';
        if ($iDays > 100)
            $sUnit = 'month';
        else if ($iDays > 50)
            $sUnit = 'week';

        return array(
            'type' => 'time',
            'time' => array(
                'tooltipFormat' => 'DD.MM.YYYY',
                'unit' => $sUnit,
            ),
            'display' => true,
            'ticks' => array(
                'display' => true,
                'autoSkip' => true,
            )
        );
    }

    private function getReportDatasets($aValues)
    {
        $aColors = array('#3366CC', '#DC3912', '#FF9900', '#109618', '#990099');

        $aDatasets = array();
        foreach ($aValues as $i => $aValue)
            $aDatasets[] = array(
                'label' => $aValue['legend'],
                'fill' => false,
                'backgroundColor' => $aColors[$i],
                'borderColor' => $aColors[$i],
                'borderWidth' => 1,
                'data' => $aValue['data']
            );

        return $aDatasets;
    }
  
    /**
    * SERVICE METHODS
    */

    public function serviceGetSafeServices()
    {
        return array_merge(parent::serviceGetSafeServices(), [
            'CampagnSubscribers' => ''
        ]);
    }

    /**
    * @page service Service Calls
    * @section bx_massmailer Mass mailer
    * @subsection bx_massmailer-page_blocks Page Blocks
     * @subsubsection bx_massmailer-campagn_subscribers campagn_subscribers
    * 
     * @code bx_srv('bx_massmailer', 'campagn_subscribers', [...]); @endcode
    * 
    * Get page block with the campagn's subscribers list
    *
    * @param $iContentId content ID.
    * @return HTML string with block content to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
    * 
    * @see BxMassMailerModule::serviceCampagnSubscribers
    */
    /** 
    * @ref bx_massmailer-campagn_subscribers "entity_view"
    */
    public function serviceCampagnSubscribers ($iContentId = 0, $iStart = 0, $iPerPage = 20)
    {
        if($this->checkAllowed() !== CHECK_ACTION_RESULT_ALLOWED)
            return $this->_bIsApi ? [] : '';

        if(!$iContentId)
            $iContentId = bx_process_input(bx_get('id'), BX_DATA_INT);
        if(!$iContentId)
            return $this->_bIsApi ? [] : '';
        
        $CNF = &$this->_oConfig->CNF;

        $sGrid = $CNF['OBJECT_GRID_LETTERS'];
        $oGrid = BxDolGrid::getObjectInstance($sGrid);
        if(!$oGrid)
            return $this->_bIsApi ? [] : '';

        if($iContentId)
            $oGrid->setContentId($iContentId);

        if($this->_bIsApi)
            return [
                bx_api_get_block('grid', $oGrid->getCodeAPI())
            ];

        return $oGrid->getCode();
    }
    
    /**
     * @page service Service Calls
     * @section bx_massmailer Mass mailer
     * @subsection bx_massmailer-page_blocks Page Blocks
     * @subsubsection bx_massmailer-campagn_info campagn_info
     * 
     * @code bx_srv('bx_massmailer', 'campagn_info', [...]); @endcode
     * 
     * Get page block with the campagn info
     *
     * @param $iContentId content ID.
     * @return HTML string with block content to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxMassMailerModule::serviceCampagnInfo
     */
    /** 
     * @ref bx_massmailer-campagn_info "campagn_info"
     */
    public function serviceCampagnInfo ($iContentId = 0)
    {
        if(!$iContentId)
            $iContentId = bx_process_input(bx_get('id'), BX_DATA_INT);

        if(!$iContentId)
            return false;
        
        $mixedResult = $this->_oTemplate->getInfo($iContentId);

        if($this->_bIsApi)
            return [bx_api_get_block('simple_list',  $mixedResult)];

        return $mixedResult;
    }
    
    /**
     * @page service Service Calls
     * @section bx_massmailer Mass mailer
     * @subsection bx_massmailer-page_blocks Page Blocks
     * @subsubsection bx_massmailer-campagn_links campagn_links
     * 
     * @code bx_srv('bx_massmailer', 'campagn_links', [...]); @endcode
     * 
     * Get page block with the campagn links list
     *
     * @param $iContentId content ID
     * @return HTML string with block content to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxMassMailerModule::serviceCampagnLinks
     */
    /** 
     * @ref bx_massmailer-campagn_links "campagn_links"
     */
    public function serviceCampagnLinks ($iContentId = 0)
    {
        if(!$iContentId)
            $iContentId = bx_process_input(bx_get('id'), BX_DATA_INT);

        if(!$iContentId)
            return false;
        
        $aData = $this->_oDb->getClicksByCampaignId($iContentId);
        if(!$aData || !is_array($aData))
            return false;

        $mixedResult = $this->_oTemplate->getClicks($aData);

        if($this->_bIsApi)
            return [bx_api_get_block('table',  $mixedResult)];

        return $mixedResult;
    }
    
    /**
     * @page service Service Calls
     * @section bx_massmailer Mass mailer
     * @subsection bx_massmailer-page_blocks Page Blocks
     * @subsubsection bx_massmailer-total_subscribers total_subscribers
     * 
     * @code bx_srv('bx_massmailer', 'total_subscribers', [...]); @endcode
     * 
     * Get page block with subscribers charts
     *
     * @param $aParams an array with search params.
     * @return HTML string with block content to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxMassMailerModule::serviceTotalSubscribers
     */
    /** 
     * @ref bx_massmailer-total_subscribers "total_subscribers"
     */
    public function serviceTotalSubscribers ()
    {
        if($this->checkAllowed() !== CHECK_ACTION_RESULT_ALLOWED)
            return '';
        
        return $this->_oTemplate->getTotalSubscribers();
    }
    
    /**
     * @page service Service Calls
     * @section bx_massmailer Mass mailer
     * @subsection bx_massmailer-page_blocks Page Blocks
     * @subsubsection bx_massmailer-entity_breadcrumb entity_breadcrumb
     * 
     * @code bx_srv('bx_massmailer', 'entity_breadcrumb', [...]); @endcode
     * 
     * Get page block with page's breadcrumbs
     *
     * @param $iContentId content ID
     * @return HTML string with block content to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxMassMailerModule::serviceEntityBreadcrumb
     */
    /** 
     * @ref bx_massmailer-entity_breadcrumb "entity_breadcrumb"
     */
    public function serviceEntityBreadcrumb ($iContentId = 0)
    {
        $CNF = &$this->_oConfig->CNF;
        $oPermalink = BxDolPermalinks::getInstance();
        if (!$iContentId)
            $iContentId = bx_process_input(bx_get('id'), BX_DATA_INT);
        if (!$iContentId){
            $aContentInfo[$CNF['FIELD_TITLE']] = _t('_bx_massmailer_txt_breadcrumb_title_new_campaign');
            $aContentInfo['url'] = $oPermalink->permalink('page.php?i=' . $CNF['URI_ADD_CAMPAIGN']);
        }
        else{
            $aContentInfo = $this->_oDb->getCampaignInfoById($iContentId);
            if (!$aContentInfo)
                return false;
            $aContentInfo['url'] = $oPermalink->permalink('page.php?i=' . $CNF['URI_VIEW_CAMPAIGN'] . '&id=' . $aContentInfo[$CNF['FIELD_ID']]);
        }
        return $this->_oTemplate->entryBreadcrumb($aContentInfo);
    }
    
    /**
     * @page service Service Calls
     * @section bx_massmailer Mass mailer
     * @subsection bx_massmailer-page_blocks Page Blocks
     * @subsubsection bx_massmailer-attributes attributes
     * 
     * @code bx_srv('bx_massmailer', 'attributes', [...]); @endcode
     * 
     * Get page block with attributes list
     *
     * @return HTML string with block content to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxMassMailerModule::serviceAttributes
     */
    /** 
     * @ref bx_massmailer-attributes "attributes"
     */
    public function serviceAttributes ()
    {
        $aAttributesParts = array();
        $aAttributesParts['account'] = array(
            _t('_bx_massmailer_txt_attribute_global'), 
            array(
                'email' => _t('_bx_massmailer_txt_attribute_email'), 
                'account_name' => _t('_bx_massmailer_txt_attribute_account_name'), 
                'account_id' => _t('_bx_massmailer_txt_attribute_account_id'), 
                'reset_password_url' => _t('_bx_massmailer_txt_attribute_reset_password_url'),
                'unsubscribe_url' => _t('_bx_massmailer_txt_attribute_unsubscribe_url')
            )
        );
        $BxDolModuleQuery = BxDolModuleQuery::getInstance();
        $aModules = $BxDolModuleQuery->getModulesBy(array('type' => 'modules', 'active' => 1));
        foreach($aModules as $aModule){
            if(BxDolRequest::serviceExists($aModule['name'], 'act_as_profile') && BxDolService::call($aModule['name'], 'act_as_profile') == true){
                $oModule = BxDolModule::getInstance($aModule['name']);
                $aTmp2 = array();
                $aTmp = $oModule->serviceGetSearchableFieldsExtended('view');
                foreach($aTmp as $sKey => $aField){
                    $aTmp2[$sKey] = _t($aField['caption']);
                }
                $aAttributesParts[$aModule['name']] = array($aModule['title'], $aTmp2);
            }
        }

        return $this->_oTemplate->getAttributes($aAttributesParts);
    }
    
    /**
     * @return CHECK_ACTION_RESULT_ALLOWED if access is granted or error message if access is forbidden. So make sure to make strict(===) checking.
     */
    public function checkAllowedAdd ($isPerformAction = false)
    {
        return $this->checkAllowed($isPerformAction);
    }
    
    /**
     * @return CHECK_ACTION_RESULT_ALLOWED if access is granted or error message if access is forbidden. So make sure to make strict(===) checking.
     */
    public function checkAllowedEdit ($aDataEntry, $isPerformAction = false)
    {
        return $this->checkAllowed($isPerformAction);
    }
    
    /**
     * @return CHECK_ACTION_RESULT_ALLOWED if access is granted or error message if access is forbidden. So make sure to make strict(===) checking.
     */
    public function checkAllowedEditAnyEntryForProfile ($isPerformAction = false, $iProfileId = false)
    {
        return $this->checkAllowed($isPerformAction);
    }

    /**
     * @return CHECK_ACTION_RESULT_ALLOWED if access is granted or error message if access is forbidden. So make sure to make strict(===) checking.
     */
    public function checkAllowedDelete (&$aDataEntry, $isPerformAction = false)
    {
        return $this->checkAllowed($isPerformAction);
    }
          
    public function getSegments($sKey = "")
    {
        if ($sKey == ""){
            return $this->aSegments;
        }
        else{
            if (isset($this->aSegments[$sKey]))
                return $this->aSegments[$sKey];
            return false;
        }
    }
          
    public function sendTest($sEmail, $iCampaignId)
    {
        $aTmp = $this->getDataForCampaign($iCampaignId);
        $aTemplate = $aTmp[0];
        $aCustomHeaders = $aTmp[1];
        $aCampaign = $aTmp[2];
              
        if (!$aTemplate)
            return false;
        
        return $this->sendLetter($sEmail, $iCampaignId, $aCustomHeaders, getLoggedId(), $aTemplate, false, $aCampaign['is_track_links']);
    }
          
    public function sendAll($iCampaignId)
    {
        $aTmp = $this->getDataForCampaign($iCampaignId);
        $aTemplate = $aTmp[0];
        $aCustomHeaders = $aTmp[1];
        $aCampaign = $aTmp[2];
              
        if (!$aTemplate)
            return false;
        
        $GLOBALS['bx_profiler_disable'] = true;
        unset($GLOBALS['bx_profiler']);

        $this->_oDb->deleteCampaignData($iCampaignId);
        $aAccounts = $this->getEmailsBySegment($aCampaign['segments'], $aCampaign['is_one_per_account']);
        foreach ($aAccounts as $aAccountInfo){
            $this->sendLetter($aAccountInfo['email'], $iCampaignId, $aCustomHeaders, $aAccountInfo['account_id'], $aTemplate, true, $aCampaign['is_track_links']);
            $this->_oDb->addEmailToSentListForCampaign($iCampaignId, $aAccountInfo['email']);

            if (1 == rand(1, 300)) {
                BxDolDb::getInstance()->cleanMemoryAll();
                unset($GLOBALS['bxDolClasses']);
            }
        }

        $this->_oDb->sendCampaign($iCampaignId);
        return true;
    }
    
    private function sendLetter($sEmail, $iCampaignId, $aCustomHeaders, $iAccountId, $aTemplate, $bAddToQueue, $bTrackKinks)
    {
        $sLetterCode = $this->_oDb->addLetter($iCampaignId, $sEmail);
        
        $aMarkers = $this->addMarkers($iAccountId, $sLetterCode);
        bx_alert($this->_aModule['name'], 'user_fields', $iCampaignId, $iAccountId, array('email' => $sEmail, 'markers' => &$aMarkers, 'markers_ref' => &$aMarkers));
        if ($bTrackKinks){
            $regexp = "<a\s[^>]*href=(\"??)([^\" >]*?)\\1[^>]*>(.*)<\/a>";
            $aTemplate['Body'] = preg_replace_callback("/$regexp/siU",
                function ($aMatch) use ($iCampaignId, $sLetterCode, $aMarkers) {
                    if ($aMatch[2] != '{unsubscribe_url}'){
                        $sUrl = bx_replace_markers($aMatch[2], $aMarkers);
                        $sLinkCode = $this->_oDb->addLink($sLetterCode, $sUrl, $aMatch[3], $iCampaignId);
                        return str_replace($sUrl, BX_DOL_URL_ROOT . $this->_oConfig->getBaseUri() . 'track/click/' . $sLinkCode . "/", $aMatch[0]);
                    }
                    else{
                        return $aMatch[0];
                    }
                },
                $aTemplate['Body']);
        }
        $aMarkersInLetter = [];
        preg_match_all("/\{[^\}]*\}/i", $aTemplate['Body'], $aMarkersInLetter);
        if ($aMarkersInLetter[0]>0){
            foreach ($aMarkersInLetter[0] as $sMarker){
                $sMarker = str_replace(['{', '}'], '', $sMarker);
                if (!array_key_exists($sMarker, $aMarkers)) {
                    $aMarkers[$sMarker] = '';
                }
            }
        }
        
        return sendMail($sEmail, $aTemplate['Subject'], $aTemplate['Body'], 0, $aMarkers, BX_EMAIL_MASS, 'html', false, $aCustomHeaders, $bAddToQueue);
    }

    public function getEmailCountInSegment($iCampaignId)
    {
        $aTmp = $this->getDataForCampaign($iCampaignId);
        $aCampaign = $aTmp[2];
        $aAccounts = $this->getEmailsBySegment($aCampaign['segments'], $aCampaign['is_one_per_account']);
        return count($aAccounts);
    }
          
    private function getEmailsBySegment($sSegment, $bIsOnePerAccount)
    {
        $sTerms = $this->getSqlBySegment($sSegment);
        if ($bIsOnePerAccount){
            $sTerms .= "AND `tp`.`id` = `ta`.`profile_id` ";
        }
        return $this->_oDb->getAccountsByTerms($sTerms);
    }
    
    public function checkAllowed($isPerformAction = false)
    {
        $aCheck = checkActionModule($this->_iProfileId, 'use massmailer', $this->getName(), $isPerformAction);
        if ($aCheck[CHECK_ACTION_RESULT] !== CHECK_ACTION_RESULT_ALLOWED)
             return _t('_sys_txt_access_denied');
        return CHECK_ACTION_RESULT_ALLOWED;
    }
    
    private function getSqlBySegment($sSegment)
    {
        $sRv = '';
        $sJoin = ' INNER ';
        $aMatches = array();
        if (strpos($sSegment, 'lvl:') !== false){
            $sLvl = str_replace('lvl:', '', $sSegment);
            switch ($sLvl) {
                case 0:
                    $sRv = '';
                    $sJoin = ' LEFT ';
                    break;
                case MEMBERSHIP_ID_UNCONFIRMED:
                    $sRv = " AND `ta`.`email_confirmed` = 0 AND `ta`.`phone_confirmed` = 0 ";
                    break;
                case MEMBERSHIP_ID_SUSPENDED:
                    $sRv = " AND `tp`.`status` = 'suspended' ";
                    break;
                case MEMBERSHIP_ID_PENDING:
                    $sRv = " AND `tp`.`status` = 'pending' ";
                    break;
                case MEMBERSHIP_ID_STANDARD:
                    $sRv = " AND `tp`.`id` NOT IN (SELECT `IDMember` FROM `sys_acl_levels_members`) ";
                    break;
                default:
                    $sRv = $this->_oDb->prepareAsString(" AND `tp`.`id` IN (SELECT `IDMember` FROM `sys_acl_levels_members` WHERE IDLevel = ?) ", $sLvl);
                    break;
            }
            $sRv .= $this->_oDb->getTermsByProfileTypes($this->getProfileModules());
        }
        else if (preg_match('/^cst:(\d+)$/', $sSegment, $aMatches)){
            //--- A custom segment is a list of emails: only the accounts with one of them.
            $sRv = $this->_oDb->getTermsByEmails($this->_oDb->getSegmentEmails((int)$aMatches[1]));
            $sRv .= $this->_oDb->getTermsByProfileTypes($this->getProfileModules());
        }
        return $sJoin . " JOIN `sys_profiles` AS `tp` ON `tp`.`account_id`=`ta`.`id` " . $sRv;
    }
    
    private function getProfileModules()
    {
        $aResult = array();
        $BxDolModuleQuery = BxDolModuleQuery::getInstance();
        $aModules = $BxDolModuleQuery->getModulesBy(array('type' => 'modules', 'active' => 1));
        foreach($aModules as $aModule){
            if(BxDolRequest::serviceExists($aModule['name'], 'act_as_profile') && BxDolService::call($aModule['name'], 'act_as_profile') == true){
                array_push($aResult, $aModule['name']);
            }
        }
        return $aResult;
    }
          
    private function getDataForCampaign($iCampaignId)
    {
        $aCampaign = $this->_oDb->getCampaignInfoById($iCampaignId);
        $oEmailTemplates = BxDolEmailTemplates::getInstance();
        $aTemplate = $oEmailTemplates->parseTemplate('bx_massmailer_email', array('content' => $aCampaign['body']));
        $aTemplate['Subject'] = $aCampaign['subject'];
              
        $aCustomHeaders = array();
        $sFrom = $aCampaign['from_name'] != '' ? $aCampaign['from_name'] : getParam('site_title');
        $aCustomHeaders['From'] = "=?UTF-8?B?" . base64_encode($sFrom) . "?= <" . getParam('site_email_notify') . ">" ;
        if ($aCampaign['reply_to'] != ''){
            $sFrom = $aCampaign['from_name'] != '' ? $aCampaign['from_name'] : getParam('site_title');
            $aCustomHeaders['Reply-To'] = "=?UTF-8?B?" . base64_encode($sFrom) . '?= <' . bx_process_output($aCampaign['reply_to']) . '>';
            $aCustomHeaders['X-Original-From'] = "=?UTF-8?B?" . base64_encode($sFrom) . '?= <' . bx_process_output($aCampaign['reply_to']) . '>';
        }
              
        return array($aTemplate, $aCustomHeaders, $aCampaign);
    }
          
    private function addMarkers($iAccountId, $sLetterCode)
    {
        $CNF = &$this->_oConfig->CNF;
        $aMarkers = array();
        
        $oAccount = BxDolAccount::getInstance($iAccountId);
        $aAccountInfo = $oAccount->getInfo();
        $sAccountEmail = $oAccount->getEmail();
        
        $aMarkers['email'] = $sAccountEmail;
        $aMarkers['account_name'] = $oAccount->getDisplayName();
        $aMarkers['account_id'] = $oAccount->id();
        
        if ($aAccountInfo['profile_id'] > 0){
            $oProfile = BxDolProfile::getInstance($aAccountInfo['profile_id']);
            $sModule = $oProfile->getModule();
            if (BxDolRequest::serviceExists($sModule, 'get_info')) {
                $aProfileInfo = bx_srv($sModule, 'get_info', array($oProfile->getContentId(), false));
                foreach ($aProfileInfo as $sKey => $sValue)
                    if(!isset($aMarkers[$sKey]))
                        $aMarkers[$sKey] = $sValue;
            }
        }    

        $aMarkers['seen_image_url'] = BX_DOL_URL_ROOT . $this->_oConfig->getBaseUri() . 'track/seen/' . $sLetterCode . "/";
        $aMarkers['unsubscribe_url'] = BX_DOL_URL_ROOT . $oAccount->getUnsubscribeLink(BX_EMAIL_MASS) . "&lhash=" . $sLetterCode;

        $aMarkers['reset_password_url'] = '';
        if(($sResetPasswordUrl = bx_get_reset_password_link($sAccountEmail)) !== false)
            $aMarkers['reset_password_url'] = $sResetPasswordUrl . "&lhash=" . $sLetterCode;

        return $aMarkers;
    }
    
    private function getReportStep($iMin, $iMax)
    {
        $iCount = 10;
        return ceil(($iMax - $iMin) / $iCount);
    }

    public function checkAllowedDeleteAnyEntryForProfile ($isPerformAction = false, $iProfileId = false)
    {
        return _t('_sys_txt_access_denied');
    }
}

/** @} */
