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

require_once('BxInvGrid.php');

define('BX_INV_FILTER_STATUS_ACCEPTED', 1);
define('BX_INV_FILTER_STATUS_NOT_ACCEPTED', 2);

class BxInvGridInvites extends BxInvGrid
{    
    public function __construct ($aOptions, $oTemplate = false)
    {
        parent::__construct ($aOptions, $oTemplate);

        $this->_sDefaultSortingOrder = 'DESC';

        $this->_sFilter1Name = 'filter1';
        $this->_aFilter1Values = array(
            '' => _t('_bx_invites_invites_status_for_filter_all'),
            BX_INV_FILTER_STATUS_ACCEPTED => _t('_bx_invites_invites_status_for_filter_accepted'),
            BX_INV_FILTER_STATUS_NOT_ACCEPTED => _t('_bx_invites_invites_status_for_filter_not_accepted'),
        );
        
        $sFilter1 = bx_get($this->_sFilter1Name);
        if(!empty($sFilter1)) {
            $this->_sFilter1Value = bx_process_input($sFilter1);
            $this->_aQueryAppend['filter1'] = $this->_sFilter1Value;
        }
    }
    
    public function performActionDelete($aParams = array())
    {
        $iProfileId = $this->_oModule->getProfileId();

        $mixedAllowed = $this->_oModule->isAllowedDeleteInvite($iProfileId);
        if($mixedAllowed !== true) {
            echoJson(array('msg' => $mixedAllowed));
            exit;
        }

        $iAffected = 0;
        $aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds)) {
            echoJson(array());
            exit;
        }

        $aIdsAffected = array ();
        foreach($aIds as $iId) {
            if(!$this->_oModule->_oDb->deleteInvites(array('id' => $iId)))
                continue;

            $this->_oModule->isAllowedDeleteInvite($iProfileId, true);

            $aIdsAffected[] = $iId;
            $iAffected++;
        }

        echoJson($iAffected ? array('grid' => $this->getCode(false), 'blink' => $aIdsAffected) : array('msg' => _t('_bx_invites_err_delete_invite')));
    }

    protected function _getCellEmail($mixedValue, $sKey, $aField, $aRow)
    {
        if((int)$aRow['email_use'] != 0) {
            $sTitle = bx_html_attribute(_t('_bx_invites_txt_email_use'));

            $mixedValue .= $this->_oModule->_oTemplate->parseIconInline('ui-alert.svg', ['alt' => $sTitle, 'title' => $sTitle]);
        }

        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellMulti($mixedValue, $sKey, $aField, $aRow)
    {
        return parent::_getCellDefault(_t((int)$mixedValue != 0 ? '_Yes' : '_No'), $sKey, $aField, $aRow);
    }

    protected function _getCellAj($mixedValue, $sKey, $aField, $aRow)
    {
        switch($aRow['aj_action']) {
            case 'redirect':
                $mixedValue = $this->_getAjLink($aRow['aj_action'], BxDolPermalinks::getInstance()->permalink($aRow['aj_params']));
                break;

            case 'invite_to_context':
                $mixedValue = '#';
                if(($oContext = BxDolProfile::getInstanceMagic((int)$aRow['aj_params'])) !== false)
                    $mixedValue = $oContext->getUrl();

                $mixedValue = $this->_getAjLink($aRow['aj_action'], $mixedValue);
                break;

            default:
                $mixedValue = '';
        }

        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }
    
    protected function _getCellDate($mixedValue, $sKey, $aField, $aRow)
    {
        if($this->_bIsApi)
            return ['type' => 'time', 'data' => (int)$mixedValue];

        return parent::_getCellDefault($mixedValue && $mixedValue != 'undefined' ? bx_time_js($mixedValue) : '', $sKey, $aField, $aRow);
    }

    protected function _getCellDateSeen($mixedValue, $sKey, $aField, $aRow)
    {
        return $this->_getCellDate($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellDateJoined($mixedValue, $sKey, $aField, $aRow)
    {
        return $this->_getCellDate($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellWhoSend($mixedValue, $sKey, $aField, $aRow)
    {
        if(($oProfile = BxDolProfile::getInstanceMagic($aRow['profile_id'])) !== false) {
            if ($this->_bIsApi)
                return ['type' => 'profile', 'data' => BxDolProfile::getData($aRow['profile_id'])];

            return $this->_getProfileCell($oProfile, $sKey, $aField, $aRow);
        }

        return parent::_getCellDefault('', $sKey, $aField, $aRow);
    }
    
    protected function _getCellJoinedAccount($mixedValue, $sKey, $aField, $aRow)
    {
        if(($iAccountId = (int)$aRow['joined_account_id']) != 0 && ($oProfile = BxDolProfile::getInstanceAccountProfile($iAccountId)) !== false) {
            if($this->_bIsApi)
                return ['type' => 'profile', 'data' => BxDolProfile::getData($oProfile)];

            return $this->_getProfileCell($oProfile, $sKey, $aField, $aRow);
        }

        return parent::_getCellDefault('', $sKey, $aField, $aRow);
    }
    
    protected function _getCellRequest($mixedValue, $sKey, $aField, $aRow)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if($aRow['request_id'] == '')
            return parent::_getCellDefault('', $sKey, $aField, $aRow);
        
        $aRequest = $this->_oModule->_oDb->getRequests(['type' => 'by_id', 'value' => $aRow['request_id']]);
        if(!empty($aRequest) && is_array($aRequest)) {
            $sTitle = _t('_bx_invites_grid_txt_view_request');
            $sLink = bx_absolute_url(BxDolPermalinks::getInstance()->permalink($CNF['URL_REQUESTS'], ['filter' => $aRequest['email']]));

            if($this->_bIsApi)
                return ['type' => 'link', 'data' => ['url' => bx_api_get_relative_url($sLink), 'text' => $sTitle]];

            $sAddon = $this->_oTemplate->parseHtmlByName('account_link.html', [
                'href' => $sLink,
                'title' => bx_html_attribute($sTitle),
                'content' => $sTitle,
                'class' => ''
            ]);

            return parent::_getCellDefault($sAddon, $sKey, $aField, $aRow);
        }

        return parent::_getCellDefault('', $sKey, $aField, $aRow);
    }
    
    protected function _getProfileCell($oProfile, $sKey, $aField, $aRow)
    {
    	$sAccountEmail = '';
    	$sManageAccountUrl = '';
    	if(bx_acl_is_administrator() && $oProfile && $oProfile instanceof BxDolProfile && ($oAccount = $oProfile->getAccountObject())) {
            $sAccountEmail = $oAccount->getEmail();
            $sManageAccountUrl = $this->_getManageAccountUrl($sAccountEmail);
    	}

        $sAddon = '';
        if(!empty($sManageAccountUrl))
            $sAddon = $this->_oTemplate->parseHtmlByName('account_link.html', array(
                'href' => $sManageAccountUrl,
                'title' => _t('_bx_invites_grid_txt_account_manager'),
                'content' => $sAccountEmail,
                'class' => 'bx-def-font-grayed'
            ));

        $mixedValue = $oProfile->getUnit(0, array('template' => array('vars' => array('addon' => $sAddon))));

        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getManageAccountUrl($sFilter = '')
    {
    	$sModuleAccounts = 'bx_accounts';
    	if(!BxDolModuleQuery::getInstance()->isEnabledByName($sModuleAccounts))
            return '';

        $oModuleAccounts = BxDolModule::getInstance($sModuleAccounts);
        if(!$oModuleAccounts || empty($oModuleAccounts->_oConfig->CNF['URL_MANAGE_ADMINISTRATION']))
            return 'cccc';

        $sLink = $oModuleAccounts->_oConfig->CNF['URL_MANAGE_ADMINISTRATION'];

        $sLink = bx_absolute_url(BxDolPermalinks::getInstance()->permalink($sLink));

        if(!empty($sFilter))
            $sLink = bx_append_url_params($sLink, array('filter' => $sFilter));

        return $sLink;
    }

    protected function _getAjLink($sAction, $sLink)
    {
        return $this->_oModule->_oTemplate->parseHtmlByName('invite_aj_link.html', [
            'href' => $sLink,
            'content' => _t('_bx_invites_invites_aj_' . $sAction)
        ]);
    }

    protected function _getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage)
    {
        $CNF = $this->_oModule->_oConfig->CNF;
        $sTableInvites = $CNF['TABLE_INVITES'];
        
        if(strpos($sFilter, $this->_sParamsDivider) !== false)
            list($this->_sFilter1Value, $sFilter) = explode($this->_sParamsDivider, $sFilter);
        
        $sFilterSql = "";
        if(isset($this->_sFilter1Value) && $this->_sFilter1Value != ''){
            if ($this->_sFilter1Value == BX_INV_FILTER_STATUS_ACCEPTED){
                $sFilterSql = " AND " . $sTableInvites . ".`joined_account_id` IS NOT NULL";
            }
            else{
                $sFilterSql = " AND " . $sTableInvites . ".`joined_account_id` IS NULL";
            }
        }
        $this->_aOptions['source'] .= $this->_oModule->_oDb->prepareAsString($sFilterSql);
        return parent::_getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage);
    }
}

/** @} */
