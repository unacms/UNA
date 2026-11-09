<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolCronAccount extends BxDolCron
{
    protected $_aParseParams;

    public function __construct()
    {
        parent::__construct();

        $this->_aParseParams = array(
            'site_title' => getParam('site_title')
        );
    }

    public function processing()
    {
        set_time_limit(0);
        ignore_user_abort();

        /* password expired soon email */
        bx_import('BxTemplAcl');

        $oAclDb = BxDolAclQuery::getInstance();

        $aEmails = [];
        $aMemberships = [];
        $oAclDb->getLevels(['type' => 'password_expired_notify'], $aMemberships, false);

        foreach($aMemberships as $aMembership) {
            $aProfiles = $oAclDb->getProfilesByMembership([$aMembership['id']], [
                'password_expired' => $aMembership['password_expired'], 
                'password_expired_notify' => $aMembership['password_expired_notify']
            ]);

            foreach($aProfiles as $aProfile) {
                if(in_array($aProfile['email'], $aEmails))
                    continue;

                $aTemplate = BxDolEmailTemplates::getInstance()->parseTemplate('t_AccountPasswordExpired', [
                    'expired_date' => date('d.m.Y', $aProfile['password_expired'])
                ]);

                sendMail($aProfile['email'], $aTemplate['Subject'], $aTemplate['Body'], $aProfile['id']);
                $aEmails[] = $aProfile['email'];                
            }
        }

        /* new accounts email */
        if(getParam('enable_notification_account') != 'on')
            return;

        $this->processNewlyJoined();

        if(empty($this->_aParseParams['account_count']) || empty($this->_aParseParams['account_output']))
			return;

        $aTemplate = BxDolEmailTemplates::getInstance()->parseTemplate('t_Account', $this->_aParseParams);
        if(empty($aTemplate))
        	return;

        $aSent = array();
        $aProfiles = BxDolAclQuery::getInstance()->getProfilesByMembership(array(MEMBERSHIP_ID_MODERATOR, MEMBERSHIP_ID_ADMINISTRATOR));
        foreach($aProfiles as $aProfile) {
            $oProfile = BxDolProfile::getInstance($aProfile['id']);
            if(!$oProfile)
                continue;
        	
        	$oAccount = $oProfile->getAccountObject();
        	if(!$oAccount || !$oAccount->isConfirmed())
        		continue;

        	// It's a notification for site staff, not a newsletter.
        	$aAccount = $oAccount->getInfo();
        	if((int)$aAccount['receive_updates'] != 1)
        		continue;

        	if(in_array($aAccount['email'], $aSent))
        		continue;

            if(sendMail($aAccount['email'], $aTemplate['Subject'], $aTemplate['Body'], $aProfile['id']))
            	$aSent[] = $aAccount['email'];
        }
       
        
    }

    protected function processNewlyJoined()
    {
        $aAccounts = BxDolAccountQuery::getInstance()->getAccounts(array('type' => 'by_join_date', 'date' => time() - 86400));
        if(empty($aAccounts) || !is_array($aAccounts))
            return;

        $iAccounts = 0;
        $aTmplVarsItems = array();
        foreach($aAccounts as $aAccount) {
            $oProfile = BxDolProfile::getInstance($aAccount['profile_id']);
            if(!$oProfile)
                continue;

            $iId = $oProfile->id();
            $sUrl = $oProfile->getUrl();
            $bUrl = $oProfile->getModule() != 'system';

            $sTitle = $oProfile->getDisplayName();
            $sTitleAttr = bx_html_attribute($sTitle);

            $sThumbUrl = $oProfile->getThumb();
            $bThumbUrl = $oProfile->hasImage();

            $aTmplVarsItems[] = array(
                'bx_if:show_thumb_image' => array(
                    'condition' => $bThumbUrl,
                    'content' => array(
                        'thumb_url' => $sThumbUrl
                    )
                ),
                'bx_if:show_thumb_letter' => array(
                    'condition' => !$bThumbUrl,
                    'content' => array(
                        'color' => implode(', ', BxDolTemplate::getColorCode($iId, 1.0)),
                        'letter' => mb_strtoupper(mb_substr($sTitle, 0, 1))
                    )
                ),
                'bx_if:show_title_link' => array(
                    'condition' => $bUrl,
                    'content' => array(
                        'content_url' => $sUrl,
                        'content_title' => $sTitle,
                        'content_title_attr' => $sTitleAttr
                    )
                ),
                'bx_if:show_title_text' => array(
                    'condition' => !$bUrl,
                    'content' => array(
                        'content_title' => $sTitle,
                        'content_title_attr' => $sTitleAttr
                    )
                ),
                'email' => $aAccount['email']
            );

            $iAccounts += 1;
        }

        if(empty($aTmplVarsItems))
            return;

        $this->_aParseParams['account_count'] = $iAccounts;
        $this->_aParseParams['account_output'] = BxDolTemplate::getInstance()->parseHtmlByName('et_account.html', array(
            'bx_repeat:items' => $aTmplVarsItems
        ));
    }
}

/** @} */
