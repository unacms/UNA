<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * What the grids of the signed-in account's personal access tokens (BxDolApiTokens) share: the site's
 * (account settings > Connectors, BxDolGridApiTokens) and Studio's (Agents > Connectors,
 * BxDolStudioAgentsConnectors). Only the account's own rows are listed and revoked; a new token is
 * shown once, in the popup that follows the form (in a message in the apps).
 *
 * A grid that uses it calls _initApiTokens() in its constructor, and may draw its form and popups
 * its own way (_getApiTokensFormView(), _getApiTokensPopup(), $_sApiTokensFormTemplate).
 */
trait BxDolApiTokensGrid
{
    protected $_iAccountId = 0;

    /** The template file of the add form's popup: the form and the script that sends it. */
    protected $_sApiTokensFormTemplate = 'api_token_form.html';

    protected function _initApiTokens()
    {
        $this->_iAccountId = (int)getLoggedId();
        $this->addMarkers(['account_id' => $this->_iAccountId]);
        // the account is the signed-in one, never one a request names
        $this->_aQueryAppendExclude[] = 'account_id';
    }

    public function getCode ($isDisplayHeader = true)
    {
        if (!$this->_iAccountId)
            return '';

        return parent::getCode($isDisplayHeader);
    }

    public function performActionAdd()
    {
        if (!$this->_iAccountId)
            return $this->_getActionResult(['msg' => _t('_sys_txt_access_denied')]);

        $sAction = 'add';

        $oForm = $this->_getApiTokensFormView($this->_getApiTokensForm($sAction));
        $oForm->initChecker();

        if ($oForm->isSubmittedAndValid()) {
            $mixedResult = BxDolApiTokens::create($this->_iAccountId, $oForm->getCleanValue('title'), (int)$oForm->getCleanValue('expires'));
            if (!is_array($mixedResult))
                return $this->_bIsApi ? [bx_api_get_block('msg', $mixedResult)] : $this->_getActionResult(['msg' => $mixedResult]);

            // the apps show the token in a message: it is shown once, here
            if ($this->_bIsApi)
                return [bx_api_get_block('msg', _t('_sys_api_tokens_txt_created', $mixedResult['token'], BxDolApiTokens::getMcpUrl()))];

            $sContent = $this->_getApiTokensPopup('sys-api-token-created', _t('_sys_api_tokens_popup_created'), $this->_oTemplate->parseHtmlByName('api_token_created.html', [
                'token' => bx_html_attribute($mixedResult['token']),
                'mcp_url' => bx_html_attribute(BxDolApiTokens::getMcpUrl()),
                'txt_once' => _t('_sys_api_tokens_txt_once'),
                'txt_token' => _t('_sys_api_tokens_txt_token'),
                'txt_mcp_url' => _t('_sys_api_tokens_txt_mcp_url'),
                'txt_header' => _t('_sys_api_tokens_txt_header'),
                'txt_copy' => _t('_sys_api_tokens_btn_copy'),
            ]));

            return $this->_getActionResult([
                'grid' => $this->getCode(false),
                'blink' => $mixedResult['id'],
                'popup' => ['html' => $sContent, 'options' => ['closeOnOuterClick' => false]],
            ]);
        }

        if ($this->_bIsApi)
            return $this->getFormBlockAPI($oForm, $sAction);

        $sContent = $this->_getApiTokensPopup('sys-api-token-add', _t('_sys_api_tokens_popup_add'), $this->_oTemplate->parseHtmlByName($this->_sApiTokensFormTemplate, [
            'form_id' => $oForm->getId(),
            'form' => $oForm->getCode(true),
            'object' => $this->_sObject,
            'action' => $sAction,
        ]));

        return $this->_getActionResult(['popup' => ['html' => $sContent, 'options' => ['closeOnOuterClick' => false]]]);
    }

    public function getFormBlockAPI($oForm, $sAction, $iId = 0)
    {
        return [
            bx_api_get_block('form', $oForm->getCodeAPI(), [
                'ext' => [
                    'name' => 'system',
                    'title' => $this->getFormBlockTitleAPI($sAction, $iId),
                    'request' => ['url' => $this->getFormCallBackUrlAPI($sAction, $iId), 'immutable' => true],
                ],
            ]),
        ];
    }

    public function getFormBlockTitleAPI($sAction, $iId = 0)
    {
        return _t('_sys_api_tokens_popup_add');
    }

    public function getFormCallBackUrlAPI($sAction, $iId = 0)
    {
        return '/api.php?r=system/perfom_action_api/TemplServiceGrid/&params[]=&o=' . $this->_sObject . '&a=' . $sAction;
    }

    protected function _getApiTokensFormView($aForm)
    {
        return new BxTemplFormView($aForm);
    }

    protected function _getApiTokensPopup($sId, $sTitle, $sContent)
    {
        return $this->_oFunctions->popupBox($sId, $sTitle, $sContent);
    }

    protected function _getApiTokensForm($sAction)
    {
        $aLifetimes = [];
        foreach (BxDolApiTokens::LIFETIMES as $iDays)
            $aLifetimes[$iDays] = $iDays ? _t('_sys_api_tokens_txt_days', $iDays) : _t('_sys_api_tokens_txt_never');

        return [
            'form_attrs' => [
                'id' => 'sys_api_tokens_' . $sAction,
                'action' => BX_DOL_URL_ROOT . bx_append_url_params('grid.php', [
                    'o' => $this->_sObject,
                    'a' => $sAction,
                    $this->_oTemplate->getCodeKey() => $this->_oTemplate->getCode(),
                ]),
                'method' => 'post',
            ],
            'params' => [
                'db' => [
                    'submit_name' => 'do_submit',
                ],
            ],
            'inputs' => [
                'title' => [
                    'type' => 'text',
                    'name' => 'title',
                    'caption' => _t('_sys_api_tokens_txt_title'),
                    'info' => _t('_sys_api_tokens_txt_title_info'),
                    'required' => true,
                    'value' => '',
                    'checker' => [
                        'func' => 'Length',
                        'params' => [1, BxDolApiTokens::TITLE_MAX],
                        'error' => _t('_sys_api_tokens_err_title', BxDolApiTokens::TITLE_MAX),
                    ],
                    'db' => ['pass' => 'Xss'],
                ],
                'expires' => [
                    'type' => 'select',
                    'name' => 'expires',
                    'caption' => _t('_sys_api_tokens_txt_expires'),
                    'values' => $aLifetimes,
                    'value' => 90,
                    'db' => ['pass' => 'Int'],
                ],
                'controls' => [
                    'type' => 'input_set',
                    [
                        'type' => 'submit',
                        'name' => 'do_submit',
                        'value' => _t('_sys_api_tokens_btn_create'),
                    ],
                    [
                        'type' => 'reset',
                        'name' => 'close',
                        'value' => _t('_sys_close'),
                        'attrs' => [
                            'class' => 'bx-def-margin-sec-left',
                            'onclick' => '$(\'.bx-popup-applied:visible\').dolPopupHide();',
                        ],
                    ],
                ],
            ],
        ];
    }

    protected function _delete ($mixedId)
    {
        return $this->_iAccountId && BxDolApiTokens::revoke((int)$mixedId, $this->_iAccountId);
    }

    protected function _getDataSqlOrderClause ($sOrderByFilter, $sOrderField, $sOrderDir, $bFieldsOnly = false)
    {
        $s = parent::_getDataSqlOrderClause($sOrderByFilter, $sOrderField, $sOrderDir, $bFieldsOnly);
        if ($s !== '')
            return $s;

        return $bFieldsOnly ? '`added` DESC' : ' ORDER BY `added` DESC';
    }

    protected function _getCellTitle ($mixedValue, $sKey, $aField, $aRow)
    {
        return parent::_getCellDefault(bx_process_output($mixedValue), $sKey, $aField, $aRow);
    }

    protected function _getCellHint ($mixedValue, $sKey, $aField, $aRow)
    {
        return parent::_getCellDefault(bx_process_output(BxDolApiTokens::PREFIX . '...' . $mixedValue), $sKey, $aField, $aRow);
    }

    protected function _getCellAdded ($mixedValue, $sKey, $aField, $aRow)
    {
        if ($this->_bIsApi)
            return ['type' => 'time', 'data' => (int)$mixedValue];

        return parent::_getCellDefault(bx_time_js($mixedValue), $sKey, $aField, $aRow);
    }

    protected function _getCellLastUsed ($mixedValue, $sKey, $aField, $aRow)
    {
        if ($this->_bIsApi && (int)$mixedValue)
            return ['type' => 'time', 'data' => (int)$mixedValue];

        return parent::_getCellDefault((int)$mixedValue ? bx_time_js($mixedValue) : _t('_sys_api_tokens_txt_never_used'), $sKey, $aField, $aRow);
    }

    protected function _getCellExpires ($mixedValue, $sKey, $aField, $aRow)
    {
        if ($this->_bIsApi && (int)$mixedValue > time())
            return ['type' => 'time', 'data' => (int)$mixedValue];

        if (!(int)$mixedValue)
            $s = _t('_sys_api_tokens_txt_never');
        elseif ((int)$mixedValue <= time())
            $s = _t('_sys_api_tokens_txt_expired');
        else
            $s = bx_time_js($mixedValue);

        return parent::_getCellDefault($s, $sKey, $aField, $aRow);
    }
}

/** @} */
