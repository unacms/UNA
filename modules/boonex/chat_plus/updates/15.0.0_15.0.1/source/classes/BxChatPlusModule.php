<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    RocketChat Rocket.Chat integration module
 * @ingroup     UnaModules
 *
 * @{
 */

class BxChatPlusModule extends BxDolModule
{
    function __construct(&$aModule)
    {
        parent::__construct($aModule);
    }

    function actionRedirect ()
    {
        if (!getParam('bx_chat_plus_url')) {
            $this->_oTemplate->displayMsg(_t('_bx_chat_plus_not_configured'));
            return;
        }

        header("Location:" . getParam('bx_chat_plus_url'), true, 302);
    }

    function actionLogo ()
    {
        if (!($sLogoUrl = BxTemplFunctions::getInstance()->getMainLogoUrl())) {
            header("HTTP/1.0 404 Not Found");
            echo '404 Not Found';
            return;
        }

        header("Location:" . $sLogoUrl);
    }

    public function serviceGetActions($aWidget)
    {
        $oInformer = BxDolInformer::getInstance(BxDolStudioTemplate::getInstance());
        $oInformer->add('sys-module-discontinued', _t('_adm_txt_modules_discontinued', BX_DOL_URL_STUDIO . 'module.php?name=bx_chat_plus', _t('_bx_chat_plus_adm_stg_cpt_type')), BX_INFORMER_ALERT);

        return bx_srv('system', 'get_actions', [$aWidget], 'TemplStudioModules');
    }

    function serviceChatBlock ()
    {
        if (!getParam('bx_chat_plus_url'))
           return MsgBox(_t('_bx_chat_plus_not_configured'));
       
        $this->_oTemplate->addCss('main.css');
        $s = $this->_oTemplate->parseHtmlByName('chat_block.html', array('chat_url' => getParam('bx_chat_plus_url')));
       
        return array(
            'content' => $s, 
            'menu' => array (
                array (
                    'title' => _t('_bx_chat_plus_open_in_separate_window'),
                    'link' => getParam('bx_chat_plus_url'),
                    'target' => '_blank',
                ),
            ),
        );
    }

    function serviceHelpdeskCode ()
    {
        $sChatUrl = getParam('bx_chat_plus_url');
        if (!getParam('bx_chat_plus_helpdesk') || !$sChatUrl)
            return '';

        if (getParam('bx_chat_plus_helpdesk_guest_only') && isLogged())
            return '';

        $aUrl = parse_url($sChatUrl);
        $sChatUrl = $aUrl['scheme'] . '://' . $aUrl['host'] . ($aUrl['port'] ? ':' . $aUrl['port'] : '');

        return <<<EOS

<!-- Start of Helpdesk Livechat Script -->
<script language="javascript">
(function(w, d, s, u) {
	w.RocketChat = function(c) { w.RocketChat._.push(c) }; w.RocketChat._ = []; w.RocketChat.url = u;
	var h = d.getElementsByTagName(s)[0], j = d.createElement(s);
	j.async = true; j.src = '{$sChatUrl}/packages/rocketchat_livechat/assets/rocket-livechat.js';
	h.parentNode.insertBefore(j, h);
})(window, document, 'script', '{$sChatUrl}/livechat');
</script>
<!-- End of Helpdesk Livechat Script -->

EOS;

    }
}

/** @} */
