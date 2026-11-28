<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    NewComments New Comments
 * @ingroup     UnaModules
 *
 * @{
 */

class BxNewCommentsAlertsResponse extends BxDolAlertsResponse
{
    public function __construct()
    {
        parent::__construct();
    }
    
    public function response($oAlert)
    {
        if ($oAlert->sAction == 'menu_custom_item'){
            if($oAlert->aExtras['item']['module'] == 'bx_new_comments' && $oAlert->aExtras['item']['name'] == 'new-comment'){
                if ($oAlert->aExtras['content_data']['cmt_time'] > $this->getPrevSession()){
                    $oModule = BxDolModule::getInstance('bx_new_comments');
                    $oAlert->aExtras['res'] = $oModule->_oTemplate->parseHtmlByName('label.html', array('title' => _t('_bx_new_comments_txt_new')));
                }
                else{
                    $oAlert->aExtras['res'] = '';
                }
                $this->setLastVisit();
            }
        }
    }
    
    private function setLastVisit()
    {
        $iCookieTime = time() + 24 * 3600;
        $iLastVistit = time();
        if ($iLastVistit - $this->getPrevSession() > 60 * getParam('bx_new_comments_session_interval')){
            bx_setcookie("bxNewCommentsPrevSession", $iLastVistit, $iCookieTime);
        }
        bx_setcookie("bxNewCommentsCurrentSession", $iLastVistit, $iCookieTime);
    }
    
    private function getPrevSession()
    {
        $iLastVistit = isset($_COOKIE['bxNewCommentsPrevSession']) ? $_COOKIE['bxNewCommentsPrevSession'] : 0;
        return $iLastVistit;
    }
}

/** @} */
