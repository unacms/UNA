<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Invites Invites
 * @ingroup     UnaModules
 *
 * @{
 */

class BxInvTemplate extends BxBaseModGeneralTemplate
{
    function __construct(&$oConfig, &$oDb)
    {
        parent::__construct($oConfig, $oDb);
    }

    public function getCssJs()
    {
        $this->addCss(array(
            'main.css',
        ));

        $this->addJs(array(
            'clipboard.min.js',
            'jquery.form.min.js',
            'jquery.anim.js',
            'main.js'
        ));
    }

    public function getInclude()
    {
        $this->getCssJs();
        return $this->getJsCode('main');
    }

    public function getBlockRequestText($aRequest)
    {
        $sText = bx_process_output(nl2br($aRequest['text']), BX_DATA_TEXT_MULTILINE);
        if($this->_bIsApi)
            return [['text' => $sText]];

        return $this->parseHtmlByName('request_text.html', array(
            'style_prefix' => $this->_oConfig->getPrefix('style'),
            'text' => $sText
        ));
    }
    
    public function getBlockInviteInfo($aRequest)
    {
        $aVars = array(
            'date_sent_title' => _t('_bx_invites_title_date_invite_sent'),
            'date_seen_title' => _t('_bx_invites_title_date_invite_seen'),
            'bx_repeat:items' => array()
        );
        foreach ($aRequest as $r) {
            $aVars['bx_repeat:items'][] = array (
                 'date_sent' => bx_time_js($r['date'], BX_FORMAT_DATE_TIME, true),
                 'date_seen' => ($r['date_seen'] != '' ? bx_time_js($r['date_seen'], BX_FORMAT_DATE_TIME, true) : ' - ')
            );
        }
        return $this->parseHtmlByName('invite_info.html', $aVars);
    }
    
    public function getBlockInvite($iAccountId, $iProfileId, $aParams = [])
    {
        $aRequestParams = [];

        $sInviteUrl = BxDolPermalinks::getInstance()->permalink($this->_oConfig->CNF['URL_INVITE']);

        //-- Process 'redirect to URL'.
        if(isset($aParams['redirect']) && $aParams['redirect'] === true) {
            list($sPageLink, $aPageParams) = bx_get_base_url_inline();

            if(!$this->_bIsApi) {
                if(isset($aPageParams['_q']))
                    unset($aPageParams['_q']);

                $sRedirect = bx_append_url_params($sPageLink, $aPageParams);
            }
            else
                $sRedirect = $aPageParams['params'][0];

            $aParamsAdd = [
                'aja' => 'redirect', 
                'ajp' => $this->_oConfig->urlEncode($sRedirect)
            ];

            $sInviteUrl = bx_append_url_params($sInviteUrl, $aParamsAdd);
            $aRequestParams = array_merge($aRequestParams, $aParamsAdd);
        }

        $sJsObject = $this->_oConfig->getJsObject('main');
        $mInvitesRemain = $this->_oConfig->getCountPerUser();

        $aTmplVarsShowByCode = isAdmin($iAccountId) ? ['js_object' => $sJsObject] : [];

        //-- Process 'invite to context'.
        if(isset($aParams['context']) && ($iContext = (int)$aParams['context']) != 0) {
            $sContext = BxDolProfile::getInstance($iContext)->getModule();
            if(!$aTmplVarsShowByCode && bx_srv($sContext, 'is_admin', [$iContext, $iProfileId])) {
                $mInvitesRemain = true;

                $aTmplVarsShowByCode = ['js_object' => $sJsObject];
            }

            $aParamsAdd = [
                'aja' => 'invite_to_context', 
                'ajp' => $iContext
            ];

            $sInviteUrl = bx_append_url_params($sInviteUrl, $aParamsAdd);
            $aRequestParams = array_merge($aRequestParams, $aParamsAdd);
        }

        if($mInvitesRemain === true)
            $mInvitesRemain = _t('_bx_invites_txt_unlimited');

        if($this->_bIsApi)
            return [bx_api_get_block('invite', ['remain' => $mInvitesRemain, 'request_url' => 'bx_invites/get_link/'])];

        $this->getCssJs();
        return $this->parseHtmlByName('block_invite.html', [
            'style_prefix' => $this->_oConfig->getPrefix('style'),
            'js_object' => $sJsObject,
            'text' => _t('_bx_invites_txt_invite_block_text', $mInvitesRemain),
            'url' => bx_absolute_url($sInviteUrl),
            'bx_if:show_by_code' => [
                'condition' => !empty($aTmplVarsShowByCode),
                'content' => $aTmplVarsShowByCode
            ],
            'js_code' => $this->getJsCode('main', [
                'oRequestParams' => $aRequestParams
            ])
        ]);
    }

    public function getBlockAcceptByCode()
    {
        $CNF = &$this->_oConfig->CNF;

        $oModule = $this->getModule();
        $sJsObject = $this->_oConfig->getJsObject('main');

        $oForm = $oModule->getFormObjectInvite($this->_oConfig->getObject('form_display_invite_accept_by_code'));
        $sFormId = $oForm->getId();

        $oForm->initChecker();
        if(!$oForm->isSubmittedAndValid()) {
            $sForm = $oForm->getCode();

            if(!$oForm->isSubmitted()) {
                $this->getCssJs();
                return $this->_bIsApi ? [bx_api_get_block('form', $oForm->getCodeAPI(), ['ext' => ['request' => ['url' => '/api.php?r=' . $this->_oModule->getName() . '/get_block_accept_by_code', 'immutable' => true]]])] : $this->parseHtmlByName('block_accept_form.html', [
                    'style_prefix' => $this->_oConfig->getPrefix('style'),
                    'js_object' => $sJsObject,
                    'js_code' => $this->getJsCode('main'),
                    'form' => $sForm,
                    'form_id' => $sFormId,
                ]);
            }

            if(!$oForm->isValid())
                return $this->_bIsApi ? [bx_api_get_block('form', $oForm->getCodeAPI(), ['ext' => ['request' => ['url' => '/api.php?r=' . $this->_oModule->getName() . '/get_block_accept_by_code', 'immutable' => true]]])] : ['form' => $sForm, 'form_id' => $sFormId];
        }

        $sKey = $oForm->getCleanValue('key');

        $aInvite = $this->_oDb->getInvites(['type' => 'by_key', 'key' => $sKey]);
        if(empty($aInvite) || !is_array($aInvite))
            return ($sMsg = _t('_bx_invites_err_code_not_found')) && $this->_bIsApi ? [bx_api_get_msg($sMsg)] : ['msg' => $sMsg];

        if(!isLogged())
            return ($sJoinLink = $oModule->getJoinLink($sKey)) && $this->_bIsApi ? [bx_api_get_msg('TODO: Need redirect to join.')] : ['redirect' => $sJoinLink];

        $iProfileId = bx_get_logged_profile_id();

        $sRedirectUrl = '';
        if(!empty($aInvite['aj_action']))
            switch($aInvite['aj_action']) {
                case 'redirect':
                    $sRedirectUrl = $aInvite['aj_params'];
                    break;

                case 'invite_to_context':
                    if(($iContextPid = (int)$aInvite['aj_params']) && ($oContext = BxDolProfile::getInstanceMagic($iContextPid)) && $oModule->processInviteToContext($iProfileId, $iContextPid))
                        $sRedirectUrl = $oContext->getUrl();
                    break;
            }

        if(!$sRedirectUrl)
            return ($sMsg = _t('_bx_invites_err_code_not_applicable')) && $this->_bIsApi ? [bx_api_get_msg($sMsg)] : ['msg' => $sMsg];

        return $this->_bIsApi ? [bx_api_get_msg('TODO: Need redirect to ' . $sRedirectUrl)] : ['redirect' => $sRedirectUrl];
    }

    public function getBlockRequest()
    {
        $sUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink($this->_oConfig->CNF['URL_REQUEST']));

        $this->getCssJs();
        return $this->parseHtmlByName('block_request.html', array(
            'style_prefix' => $this->_oConfig->getPrefix('style'),
            'text' => _t('_bx_invites_txt_request_block_text'),
            'bx_if:show_button_request' => array(
                'condition' => $this->_oConfig->isRequestInvite(),
                'content' => array(
                    'url' => $sUrl
                )
            )
        ));
    }

    /**
     * API version of the join form replacement: the message and, when registration is by invitation only and requests are on, the request form.
     * @param string $sText the message from BxInvModule::serviceAccountAddFormCheck
     */
    public function getBlockRequestAPI($sText)
    {
        $aResult = [bx_api_get_msg($sText)];
        if($this->_oConfig->isRegistrationByInvitation() && $this->_oConfig->isRequestInvite())
            $aResult = array_merge($aResult, $this->getBlockFormRequest());

        return $aResult;
    }

    public function getBlockFormRequest()
    {
        if(!$this->_oConfig->isRequestInvite())
            return $this->_bIsApi ? [bx_api_get_msg(_t('_bx_invites_err_not_available'))] : MsgBox(_t('_bx_invites_err_not_available'));

        $mixedAllowed = $this->getModule()->isAllowedRequest(0);
        if($mixedAllowed !== true)
            return $this->_bIsApi ? [bx_api_get_msg($mixedAllowed)] : MsgBox($mixedAllowed);

        $CNF = &$this->_oConfig->CNF;

        $sJsObject = $this->_oConfig->getJsObject('main');
        $oPermalink = BxDolPermalinks::getInstance();

        $oForm = BxDolForm::getObjectInstance($this->_oConfig->getObject('form_request'), $this->_oConfig->getObject('form_display_request_send'));
        $oForm->aFormAttrs['action'] = bx_absolute_url($oPermalink->permalink($CNF['URL_REQUEST']));

        $sFormId = $oForm->getId();
        $sEval = $sJsObject . '.onRequestFormSubmit(oData)';

        $oForm->initChecker();
        if(!$oForm->isSubmittedAndValid()) {
            $sForm = $oForm->getCode();
            if(!$oForm->isSubmitted()) {
                $this->getCssJs();
                return $this->_bIsApi ? [bx_api_get_block('form', $oForm->getCodeAPI(), ['ext' => ['request' => ['url' => '/api.php?r=' . $this->_oModule->getName() . '/get_block_form_request', 'immutable' => true]]])] : $this->parseHtmlByName('block_request_form.html', array(
                    'style_prefix' => $this->_oConfig->getPrefix('style'),
                    'js_object' => $sJsObject,
                    'js_code' => $this->getJsCode('main'),
                    'form' => $sForm,
                    'form_id' => $sFormId,
                ));
            }

            if(!$oForm->isValid())
                return $this->_bIsApi ? [bx_api_get_block('form', $oForm->getCodeAPI(), ['ext' => ['request' => ['url' => '/api.php?r=' . $this->_oModule->getName() . '/get_block_form_request', 'immutable' => true]]])] : array('content' => $sForm, 'content_id' => $sFormId, 'eval' => $sEval);
        }
        
        $sEmail = $oForm->getCleanValue('email');
        $oAccountQuery = BxDolAccountQuery::getInstance();
        $iAccount = $oAccountQuery->getIdByEmail($sEmail);
        if ($iAccount > 0)
            return $this->_bIsApi ? [bx_api_get_msg(_t('_bx_invites_err_already_registed', bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=forgot-password'))))] : array('content' => MsgBox(_t('_bx_invites_err_already_registed', bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=forgot-password')))), 'content_id' => $sFormId, 'eval' => $sEval);
        $iCountByEmail = $this->_oDb->getRequests(array('type' => 'count_by_email', 'value' => $sEmail));
        if ($iCountByEmail > 0)
            return  $this->_bIsApi ? [bx_api_get_msg(_t('_bx_invites_err_already_send'))] : array('content' => MsgBox(_t('_bx_invites_err_already_send')), 'content_id' => $sFormId, 'eval' => $sEval);
       
        $sIp = getVisitorIP();
        $iId = (int)$oForm->insert(array('nip' => ip2long($sIp),'date' => time()));
        if(!$iId)
            return $this->_bIsApi ? [bx_api_get_msg(_t('_bx_invites_err_cannot_perform'))] : array('content' => MsgBox(_t('_bx_invites_err_cannot_perform')), 'content_id' => $sFormId, 'eval' => $sEval);
        $this->getModule()->onRequest($iId);
        $sRequestsEmail = $this->_oConfig->getRequestsEmail();
        if(!empty($sRequestsEmail)) {
            $sManageUrl = bx_absolute_url($oPermalink->permalink($CNF['URL_REQUESTS']));

            $aMessage = BxDolEmailTemplates::getInstance()->parseTemplate('bx_invites_request_form_message', array(
                'sender_name' => bx_process_output($oForm->getCleanValue('name')),
                'sender_email' => bx_process_output($oForm->getCleanValue('email')),
                'sender_ip' => $sIp,
                'manage_url' => $sManageUrl
            ));
            
            $aRequestsEmails = explode(',', $sRequestsEmail);
            foreach ($aRequestsEmails as $s) {
                sendMail(trim($s), $aMessage['Subject'], $aMessage['Body'], 0, array(), BX_EMAIL_SYSTEM);
            }
        }

        return $this->_bIsApi ? [bx_api_get_msg(_t('_bx_invites_msg_request_sent'))] : array('content' => MsgBox(_t('_bx_invites_msg_request_sent')), 'content_id' => $sFormId, 'eval' => $sEval);
    }

    public function getCodePopup($sKey, $sLink)
    {
        $sId = $this->_oConfig->getHtmlIds('code_popup');
        $sTitle = _t('_bx_invites_txt_code_popup_title');
        $sContent = $this->parseHtmlByName('popup_code.html', [
            'style_prefix' => $this->_oConfig->getPrefix('style'),
            'html_id_code' => $this->_oConfig->getHtmlIds('code_input'),
            'html_id_code_link' => $this->_oConfig->getHtmlIds('code_link_input'),
            'code' => $sKey,
            'link' => $sLink
        ]);

        return BxTemplFunctions::getInstance()->popupBox($sId, $sTitle, $sContent, true);
    }

    public function getLinkPopup($sLink)
    {
        $sId = $this->_oConfig->getHtmlIds('link_popup');
        $sTitle = _t('_bx_invites_txt_link_popup_title');
        $sContent = $this->parseHtmlByName('popup_link.html', array(
            'style_prefix' => $this->_oConfig->getPrefix('style'),
            'html_id_link' => $this->_oConfig->getHtmlIds('link_input'),
            'link' => $sLink
        ));

        return BxTemplFunctions::getInstance()->popupBox($sId, $sTitle, $sContent, true);
    }
    
    public function getJsCode($sType, $aParams = array(), $mixedWrap = true)
    {
        $sGrid = 'requests';
        if(!empty($aParams['grid'])) {
            $sGrid = $aParams['grid'];
            unset($aParams['grid']);
        }

        $aParams = array_merge(array(
            'aHtmlIds' => $this->_oConfig->getHtmlIds(),
            'sObjNameGrid' => $this->_oConfig->getObject('grid_' . $sGrid),
        ), $aParams);

        return parent::getJsCode($sType, $aParams);
    }

    public function getMenuForManageBlocks($sType)
    {
        $CNF = &$this->_oConfig->CNF;
        
        $sMenu = '';
		$oPermalink = BxDolPermalinks::getInstance();

		$aMenuItems = array();
		$aMenuItems[] = array('id' => 'invites-requests', 'name' => 'invites-requests', 'class' => '', 'link' => $oPermalink->permalink($CNF['URL_REQUESTS']), 'target' => '_self', 'title' => _t('_bx_invites_menu_item_title_manage_requests'), 'active' => 1);
		$aMenuItems[] = array('id' => 'invites-invites', 'name' => 'invites-invites', 'class' => '', 'link' => $oPermalink->permalink($CNF['URL_INVITES']), 'target' => '_self', 'title' => _t('_bx_invites_menu_item_title_manage_invites'), 'active' => 1);

		if(count($aMenuItems) > 1) {
	        $oMenu = new BxTemplMenu(array(
	            'template' => 'menu_vertical.html', 
	            'menu_items' => $aMenuItems
	        ), $this);
	        $oMenu->setSelected($this->getModule()->_aModule['name'], 'invites-' . $sType);
	        $sMenu = $oMenu->getCode();
		}
        return $sMenu;
    }
    
    public function getProfilesByAccount($iAccountId, $iMaxVisible = 2)
    {
        $aProfiles = BxDolAccount::getInstance($iAccountId)->getProfiles();
        $iProfiles = count($aProfiles);

        $aTmplVars = array (
            'class_cnt' => '',
            'bx_repeat:profiles' => array(),
            'bx_if:profiles_more' => array(
                'condition' => $iProfiles > $iMaxVisible,
                'content' => array(
                    'html_id' => $this->_oConfig->getHtmlIds('profile_more_popup') . $iAccountId,
                    'more' => _t('_bx_accnt_txt_more', $iProfiles - $iMaxVisible),
                    'more_attr' => bx_html_attribute(_t('_bx_accnt_txt_see_more')),
                    'popup' => '',
                ),
            ),
        );

        $aTmplVarsPopup = array (
            'class_cnt' => ' bx-def-padding',
            'bx_repeat:profiles' => array(),
            'bx_if:profiles_more' => array(
                'condition' => false,
                'content' => array(),
            ),
        );

        $i = 0;
        foreach ($aProfiles as $iProfileId => $aProfile) {
            $oProfile = BxDolProfile::getInstance($iProfileId);
            if(!$oProfile)
                continue;

            $sName = $oProfile->getDisplayName();
            $aTmplVarsProfile = array (
                'html_id' => $this->_oConfig->getHtmlIds('profile') . $aProfile['id'],
                'id' => $oProfile->id(),
                'url' => $oProfile->getUrl(),
                'name' => $sName,
                'name_attr' => bx_html_attribute($sName)
            );

            if($i < $iMaxVisible)
                $aTmplVars['bx_repeat:profiles'][] = $aTmplVarsProfile;
            if($i >= $iMaxVisible)
                $aTmplVarsPopup['bx_repeat:profiles'][] = $aTmplVarsProfile;

            ++$i;
        }

        if($aTmplVarsPopup['bx_repeat:profiles']) {
            $aTmplVars['bx_if:profiles_more']['content']['popup'] = BxTemplFunctions::getInstance()->transBox('', $this->parseHtmlByName('profiles.html', $aTmplVarsPopup));
        }

        return $this->parseHtmlByName('profiles.html', $aTmplVars);
    }
}

/** @} */
