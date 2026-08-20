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

class BxMassMailerTemplate extends BxBaseModGeneralTemplate
{
    public function __construct(&$oConfig, &$oDb)
    {
        parent::__construct($oConfig, $oDb);
    }

    function getClicks($aData)
    {
        $aList = [];
        foreach($aData as $aItem)
            $aList[] = [
                'title' => $aItem['title'], 
                'link' => $aItem['link'], 
                'last_click' => $this->_bIsApi ? $aItem['last_click'] : ($aItem['last_click'] > 0 ? bx_time_js($aItem['last_click']) : ''),
                'click_count' => $aItem['click_count']
            ];

        if($this->_bIsApi)
            return array_merge([[
                'title' => _t('_bx_massmailer_txt_title_title'),
                'link' => _t('_bx_massmailer_txt_link_title'),
                'last_click' => _t('_bx_massmailer_txt_last_click_title'),
                'click_count' => _t('_bx_massmailer_txt_click_count_title'),
            ]], $aList);

        $this->addJs([BX_DIRECTORY_PATH_MODULES . 'boonex/massmailer/plugins/datatables/|datatables.min.js']);
        $this->addCss(['main.css', BX_DIRECTORY_PATH_MODULES . 'boonex/massmailer/plugins/datatables/|datatables.min.css']);
        return $this->parseHtmlByName('campaign_clicks.html', array(
             'bx_repeat:items' => $aList,
             'title_title' => _t('_bx_massmailer_txt_title_title'),
             'link_title' => _t('_bx_massmailer_txt_link_title'),
             'click_count_title' => _t('_bx_massmailer_txt_click_count_title'),
             'last_click_title' => _t('_bx_massmailer_txt_last_click_title'),
            ));
    }

    function getInfo($CampaignId)
    {
        $CNF = &$this->getModule()->_oConfig->CNF;
        
        $aData = $this->_oModule->_oDb->getCampaignInfoById($CampaignId);
        $aDataStat = $this->_oModule->_oDb->getStatByCampaignId($CampaignId);
        
        $this->addJs(array('chart.min.js', 'chart.js', BX_DIRECTORY_PATH_MODULES . 'boonex/massmailer/plugins/daterangepicker/|daterangepicker.js'));
        $this->addCss(array('main.css', BX_DIRECTORY_PATH_MODULES . 'boonex/massmailer/plugins/daterangepicker/|daterangepicker.css'));
        
        if($this->_bIsApi) {
            $aItems = [
                ['title' => '_bx_massmailer_txt_subject_title', 'value' => $aData[$CNF['FIELD_SUBJECT']]],
                ['title' => '_bx_massmailer_txt_body_title', 'value' => $aData[$CNF['FIELD_BODY']]],
                ['title' => '_bx_massmailer_txt_from_name_title', 'value' => $aData[$CNF['FIELD_FROM_NAME']]],
                ['title' => '_bx_massmailer_txt_reply_title', 'value' => $aData[$CNF['FIELD_REPLY_TO']]],
                ['title' => '_bx_massmailer_txt_created_title', 'value' => $aData[$CNF['FIELD_ADDED']]],
                ['title' => '_bx_massmailer_txt_sent_to_title', 'value' => $aData[$CNF['FIELD_DATE_SENT']]],
                ['title' => '_bx_massmailer_txt_sent_to_title', 'value' => $this->getModule()->getSegments($aData[$CNF['FIELD_SEGMENTS']])]
            ];

            array_walk($aItems, function(&$aItem) {
                $aItem['title'] = trim(_t($aItem['title']), ":");
            });

            return $aItems;
        }

        return $this->getJsCode('chart', array('sChartName' => 'CAMPAIGN_REPORT', 'sReportName' => $CampaignId)) . $this->parseHtmlByName('campaign_info.html', array(
            'created_title' => _t('_bx_massmailer_txt_created_title'),
            'subject_title' => _t('_bx_massmailer_txt_subject_title'),
            'body_title' => _t('_bx_massmailer_txt_body_title'),
            'sent_on_title' => _t('_bx_massmailer_txt_sent_on_title'),
            'sent_to_title' => _t('_bx_massmailer_txt_sent_to_title'),
            'sent_total_title' => _t('_bx_massmailer_txt_sent_total_title'),
            'opened_total_title' => _t('_bx_massmailer_txt_opened_total_title'),
            'unopened_total_title' => _t('_bx_massmailer_txt_unopened_total_title'),
            'clicked_total_title' => _t('_bx_massmailer_txt_clicked_total_title'),
            'reply_title' => _t('_bx_massmailer_txt_reply_title'),
            'subject' => $aData[$CNF['FIELD_SUBJECT']],
            'body' => $aData[$CNF['FIELD_BODY']],
            'sent_on' => bx_time_js($aData[$CNF['FIELD_DATE_SENT']]),
            'created' => bx_time_js($aData[$CNF['FIELD_ADDED']]),
            'sent_to' => $this->getModule()->getSegments($aData[$CNF['FIELD_SEGMENTS']]),
            'sent_total' => $aDataStat['total'],
            'opened_total' => $aDataStat['seen'],
            'unopened_total' => $aDataStat['total'] - $aDataStat['seen'],
            'clicked_total' => $aDataStat['clicked'],
            'bx_if:from_name' => array(
                'condition' => $aData[$CNF['FIELD_FROM_NAME']] != '',
                'content' => array(
                    'from_name_title' => _t('_bx_massmailer_txt_from_name_title'),
                    'from_name' => $aData[$CNF['FIELD_FROM_NAME']],
                )
            ),
           'bx_if:reply' => array(
                'condition' => $aData[$CNF['FIELD_REPLY_TO']] != '',
                'content' => array(
                    'reply_title' => _t('_bx_massmailer_txt_reply_title'),
                    'reply' => $aData[$CNF['FIELD_REPLY_TO']],
                )
            ),
        ));
    }
    
    function getTotalSubscribers()
    {
        $CNF = &$this->getModule()->_oConfig->CNF;
        
        $this->addJs(array('chart.min.js', 'chart.js', BX_DIRECTORY_PATH_MODULES . 'boonex/massmailer/plugins/daterangepicker/|daterangepicker.js'));
        $this->addCss(array('main.css', BX_DIRECTORY_PATH_MODULES . 'boonex/massmailer/plugins/daterangepicker/|daterangepicker.css'));
        $sDate = date('d/m/Y', time() - 90 * 86400) . ' - ' . date('d/m/Y');
        
        $aSegments = $this->_oModule->getSegments();
        $aTmp = array();
        foreach($aSegments as $sKey => $aSegment){
            $aTmp[$sKey] = $aSegment;
        }
        
        $oForm = new BxTemplFormView(array());
        
        $aInputReport = array(
            'type' => 'select',
            'name' => 'report',
            'attrs' => ['class' => 'bx_massmailer_report_selector'],
            'value' => 'content_total',
            'values' => [
                'content_total' => _t('_bx_massmailer_txt_title_content_total'), 
                'content_speed' => _t('_bx_massmailer_txt_title_content_speed')
            ]
        );
        
        $aInputSegments = array(
            'type' => 'select',
            'name' => 'segments',
            'attrs' => ['class' => 'bx_massmailer_report_selector'],
            'value' => 'content_total',
            'values' => $aTmp
        );
        
        $aInputInterval = array(
            'type' => 'text',
            'name' => 'interval',
            'attrs' => ['class' => 'bx_massmailer_date_picker'],
            'value' => $sDate
        );
        

        return $this->getJsCode('chart', array('sChartName' => 'SUBSCRIBERS_INFO')) . $this->parseHtmlByName('subscribers_info.html', array(
            'report' => $oForm->genInput($aInputReport),
            'segments' => $oForm->genInput($aInputSegments),
            'interval' => $oForm->genInput($aInputInterval),
        ));
    }
    
    public function entryBreadcrumb($aContentInfo, $aTmplVarsItems = array())
    {
        $CNF = &$this->getModule()->_oConfig->CNF;
        $aTmplVarsItems = array(array(
            'url' => $aContentInfo['url'],
            'title' => bx_process_output($aContentInfo[$CNF['FIELD_TITLE']])
        ));

        return $this->parseHtmlByName('breadcrumb.html', array(
            'url_home' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink($CNF['URL_MANAGE_CAMPAIGNS'])),
            'icon_home' => $CNF['ICON'],
            'bx_repeat:items' => $aTmplVarsItems
        ));
    }
    
    public function getAttributes($aAttributesParts)
    {
        $aList2 = array();
        foreach($aAttributesParts as $aPart){
            $aList = array();
            foreach($aPart[1] as $sKey => $sItem){
                $aList[] = array('title' => $sItem, 'attribute' => $sKey);
            }
            $aList2[] = array('title' => $aPart[0], 'list' => $this->parseHtmlByName('attributes_part.html', array('bx_repeat:items' => $aList)));
        }
        return $this->parseHtmlByName('attributes.html', array('bx_repeat:items' => $aList2));
    }
}

/** @} */
