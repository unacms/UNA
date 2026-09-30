<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioRolesActions extends BxDolStudioRolesActions
{
    protected $sUrlPage;

    function __construct($aOptions, $oTemplate = false)
    {
        parent::__construct($aOptions, $oTemplate);

        $this->sUrlPage = BX_DOL_URL_STUDIO . 'builder_roles.php?page=ractions';
    }

    public function performActionEnable($mixedChecked = null)
    {
        if($this->iRole == BX_DOL_STUDIO_ROLE_MASTER)
            return echoJson([]);

        $aIds = bx_get('ids');
        $bEnable = (int)bx_get('checked');

        if(!$aIds || !is_array($aIds))
            return echoJson([]);

        $aResultIds = [];
        foreach($aIds as $mixedId) {
            if(strpos($mixedId, $this->sParamsDivider) !== false)
                list($this->iRole, $iId) = explode($this->sParamsDivider, urldecode($mixedId));

            if($this->oDb->switchAction($this->iRole, $iId, $bEnable))
                $aResultIds[] = $iId;
        }

        $sAction = $bEnable ? 'enable' : 'disable';
        return echoJson([
            $sAction => $aResultIds,
        ]);
    }

    function getJsObject()
    {
        return 'oBxDolStudioRolesActions';
    }

    function getCode($isDisplayHeader = true)
    {
        return $this->_oTemplate->parseHtmlByName('rl_roles_actions.html', array(
            'content' => parent::getCode($isDisplayHeader),
            'js_object' => $this->getJsObject(),
            'page_url' => $this->sUrlPage,
            'grid_object' => $this->_sObject,
            'params_divider' => $this->sParamsDivider
        ));
    }

    protected function _addJsCss()
    {
        parent::_addJsCss();
        $this->_oTemplate->addJs(array('jquery.form.min.js', 'roles_actions.js'));

        $oForm = new BxTemplStudioFormView(array());
        $oForm->addCssJs();
    }

    protected function _getCellSwitcher($mixedValue, $sKey, $aField, $aRow)
    {
        if(in_array($this->iRole, [0, BX_DOL_STUDIO_ROLE_MASTER]))
            return parent::_getCellDefault('', $sKey, $aField, $aRow);

        $aRow[$this->_aOptions['field_id']] = urlencode($this->iRole . $this->sParamsDivider . $aRow[$this->_aOptions['field_id']]);
        return parent::_getCellSwitcher($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getFilterControls ()
    {
        parent::_getFilterControls();

        $sContent = "";

        $sJsObject = $this->getJsObject();
        $oForm = new BxTemplStudioFormView(array());

        $aInputRoles = array(
            'type' => 'select',
            'name' => 'role',
            'attrs' => array(
                'id' => 'bx-grid-role-' . $this->_sObject,
                'onChange' => 'javascript:' . $this->getJsObject() . '.onChangeRole()'
            ),
            'value' => 'id-' . $this->iRole,
            'values' => array()
        );

        $aRoles = $this->oDb->getRoles(array('type' => 'all'));
        $aCounter = $this->oDb->getActions(array('type' => 'counter_by_roles'));
        foreach($aRoles as $aRole)
            $aInputRoles['values']['id-' . $aRole['id']] = _t($aRole['title']) . " (" . (isset($aCounter[$aRole['id']]) ? $aCounter[$aRole['id']] : "0") . ")";

        asort($aInputRoles['values']);
        $aInputRoles['values'] = array_merge(array('id-0' => _t('_adm_rl_txt_select_role')), $aInputRoles['values']);

        $sContent .= $oForm->genRow($aInputRoles);
        if($this->iRole == 0)
            return $sContent;

        $aInputSearch = array(
            'type' => 'text',
            'name' => 'keyword',
            'attrs' => array(
                'id' => 'bx-grid-search-' . $this->_sObject,
                'aria-label' => _t('_adm_grid_lbl_search'),
                'onKeyup' => 'javascript:$(this).off(\'keyup\'); ' . $this->getJsObject() . '.onChangeFilter()'
            )
        );
        $sContent .= $oForm->genRow($aInputSearch);

        return  $sContent;
    }
}

/** @} */
