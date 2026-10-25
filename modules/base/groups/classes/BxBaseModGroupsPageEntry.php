<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    BaseGroups Base classes for groups modules
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Profile create/edit/delete pages.
 */
class BxBaseModGroupsPageEntry extends BxBaseModProfilePageEntry
{
    public function __construct($aObject, $oTemplate = false)
    {
        parent::__construct($aObject, $oTemplate);

        $CNF = &$this->_oModule->_oConfig->CNF;

        $this->_sCoverClass = 'bx-base-group-cover-wrapper ' . $this->_oModule->getName() . '_cover';

        $bLoggedOwner = isset($this->_aContentInfo[$CNF['FIELD_AUTHOR']]) && $this->_aContentInfo[$CNF['FIELD_AUTHOR']] == bx_get_logged_profile_id();
        $bLoggedModerator = $this->_oModule->checkAllowedEditAnyEntry() === CHECK_ACTION_RESULT_ALLOWED;

        if(!empty($CNF['FIELD_CF']) && isset($this->_aContentInfo[$CNF['FIELD_CF']])) {
            $oCf = BxDolContentFilter::getInstance();
            if($oCf->isEnabled() && !$oCf->isAllowed($this->_aContentInfo[$CNF['FIELD_CF']])) {
                $this->setPageCover(false);
                return;
            }
        }

        $aInformers = array ();
        $oInformer = BxDolInformer::getInstance($this->_oTemplate);
        if($oInformer && ($bLoggedOwner || $bLoggedModerator)) {
            $sStatus = isset($CNF['FIELD_STATUS']) && isset($this->_aContentInfo[$CNF['FIELD_STATUS']]) ? $this->_aContentInfo[$CNF['FIELD_STATUS']] : '';
            $sStatusAdmin = isset($CNF['FIELD_STATUS_ADMIN']) && isset($this->_aContentInfo[$CNF['FIELD_STATUS_ADMIN']]) ? $this->_aContentInfo[$CNF['FIELD_STATUS_ADMIN']] : '';

            //--- Display message to context author if context isn't active
            if ($bLoggedOwner && !empty($CNF['INFORMERS']['status'])) {
                $aInformer = $CNF['INFORMERS']['status'];
                if (isset($aInformer['map'][$sStatus]))
                    $aInformers[] = ['name' => $aInformer['name'], 'msg' => _t($aInformer['map'][$sStatus]), 'type' => BX_INFORMER_ALERT];
            }

            //--- Display 'approving' informer.
            if(!empty($sStatusAdmin) && $sStatusAdmin != BX_BASE_MOD_GENERAL_STATUS_ACTIVE) {
                if(!empty($CNF['INFORMERS']['approving']) && isset($CNF['INFORMERS']['approving']['map'][$sStatusAdmin])) {
                    $aInformer = $CNF['INFORMERS']['approving'];
                    $aInformers[] = ['name' => $aInformer['name'], 'msg' => _t($aInformer['map'][$sStatusAdmin]['msg']), 'type' => $aInformer['map'][$sStatusAdmin]['type']];
                }
            }

            //--- Display 'scheduled' informer if an item wasn't published yet.
            if(isset($CNF['FIELD_PUBLISHED'])) {
                if(!empty($CNF['INFORMERS']['scheduled']) && isset($CNF['INFORMERS']['scheduled']['map'][$sStatus])) {
                    $this->addMarkers(array(
                        'date_publish_uf' => bx_time_js((int)$this->_aContentInfo[$CNF['FIELD_PUBLISHED']], BX_FORMAT_DATE, true)
                    ));

                    $aInformer = $CNF['INFORMERS']['scheduled'];
                    $aInformers[] = array ('name' => $aInformer['name'], 'msg' => _t($aInformer['map'][$sStatus]['msg']), 'type' => $aInformer['map'][$sStatus]['type']);
                }
            }

            if($aInformers)
                foreach($aInformers as $aInformer)
                    $oInformer->add($aInformer['name'], $this->_replaceMarkers($aInformer['msg']), $aInformer['type']);
        }
    }

    protected function _getInvitationCode($aParams = [])
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(empty($CNF['TABLE_INVITES']) || !$this->_oProfile)
            return '';

        $iProfileId = bx_get_logged_profile_id();
        $iGroupProfileId = $this->_oProfile->id();
        if(!$this->_oModule->serviceIsInvited($iGroupProfileId, $iProfileId)) 
            return '';

        $sId = $this->_oModule->getName() . '_popup_invite';
        $sKey = $this->_oModule->serviceGetInvitedKey($iGroupProfileId, $iProfileId);

        $sCode = $this->_oModule->_oTemplate->getJsCode('invite_popup', array(
            'sPopupId' => $sId,
            'sKey' => $sKey,
            'sAcceptUrl' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY'] . '&id=' . $this->_aProfileInfo['content_id'])),
            'sDeclineUrl' => BX_DOL_URL_ROOT,
            'iGroupProfileId' => $this->_oProfile->id(),
        ));

        if(!isset($aParams['use_invitation_popup']) || $aParams['use_invitation_popup'] === true)
            $sCode .= BxTemplFunctions::getInstance()->popupBox($sId, _t($CNF['T']['txt_invitation_popup_title']), $this->_oModule->_oTemplate->parseHtmlByName('popup_invite.html', array(
                'popup_id' => $sId,
                'text' => _t($CNF['T']['txt_invitation_popup_text']),
                'button_accept' => _t($CNF['T']['txt_invitation_popup_accept_button']),
                'button_decline' => _t($CNF['T']['txt_invitation_popup_decline_button']),
            )), true);

        $this->_oTemplate->addJs([
            'modules/base/groups/js/|invite_popup.js', 
            'invite_popup.js'
        ]);
        return $sCode;
    }

    public function getCode ()
    {
        return $this->_getInvitationCode() . parent::getCode();
    }

    protected function _getPageMetaType()
    {
        return 'website';
    }

    protected function _isAvailablePage($a)
    {
        if(!$this->_aContentInfo || !$this->_oModule->isEntryActive($this->_aContentInfo))
            return false;
        
        return parent::_isAvailablePage($a);
    }

    protected function _isVisiblePage ($a)
    {
        
        $CNF = &$this->_oModule->_oConfig->CNF;
        
        if(!$this->_aContentInfo)
            return false;

        if(($mixedAllowView = $this->_oModule->checkAllowedView($this->_aContentInfo)) !== CHECK_ACTION_RESULT_ALLOWED) {
            $bPartiallyVisible = false;
            if(!empty($CNF['OBJECT_PRIVACY_VIEW']) && ($oPrivacy = BxDolPrivacy::getObjectInstance($CNF['OBJECT_PRIVACY_VIEW'])) !== false)
                $bPartiallyVisible = $oPrivacy->isPartiallyVisible($this->_aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']]);
            /*
             * If partially visible, replace current page with different set of blocks.
             */

            $bJoinPage = isset($CNF['OBJECT_PAGE_JOINED_ENTRY']) && $this->_sObject === $CNF['OBJECT_PAGE_JOINED_ENTRY'];
            if($bPartiallyVisible && ($this->_sObject === $CNF['OBJECT_PAGE_VIEW_ENTRY'] || $bJoinPage)) {
                $sPage = $bJoinPage ? $CNF['OBJECT_PAGE_JOINED_ENTRY'] : $CNF['OBJECT_PAGE_VIEW_ENTRY_CLOSED'];
                $aObject = BxDolPageQuery::getPageObject($sPage);
                $this->_sObject = $aObject['object'];
                $this->_aObject = $aObject;
                $this->_oQuery = new BxDolPageQuery($this->_aObject);
            }
            else
                return $mixedAllowView;
        }

        if(!BxDolPage::_isVisiblePage($a))
            return false;

        $this->_oModule->checkAllowedView($this->_aContentInfo, true);

        return true;
    }
}

/** @} */
