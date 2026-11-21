<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

class BxDolStudioSettings extends BxTemplStudioWidget
{
    protected $oOptions;
    protected $sParamPrefix;

    function __construct($sType = '', $mixedCategory = '')
    {
        parent::__construct('settings');

        $this->oDb = new BxDolStudioSettingsQuery();

        $this->sParamPrefix = 'stg';

        $this->oOptions = new BxTemplStudioOptions($this->getTypeOfCategory($sType, $mixedCategory), $mixedCategory);
    }

    public function checkAction()
    {
        $sAction = bx_get($this->sParamPrefix . '_action');
        if($sAction !== false && bx_process_input($sAction) == 'get-page-by-type') {
            $sValue = bx_get($this->sParamPrefix . '_value');

            return $this->getPageByType($sValue !== false ? bx_process_input($sValue) : '');
        }

        return $this->oOptions->checkAction();
    }

    /**
     * One settings group for the side menu's in-place switch (studio/js/settings.js): the group's block as the full page
     * shows it. A type the menu doesn't list (unknown, or a template's, which Designer shows) is refused like a missing page.
     */
    public function getPageByType($sType)
    {
        $aType = [];
        if(!is_string($sType) || $sType === '' || !$this->oDb->getTypes(['type' => 'by_name', 'value' => $sType], $aType, false) || $aType['group'] == BX_DOL_STUDIO_STG_GROUP_TEMPLATES)
            return ['code' => 1, 'message' => _t('_sys_request_page_not_found_cpt')];

        if(!empty($this->aPage['wid_type']) && !BxDolStudioRolesUtils::getInstance()->isActionAllowed('use ' . $this->aPage['wid_type']))
            return ['code' => 2, 'message' => _t('_Access denied')];

        $this->oOptions = new BxTemplStudioOptions($sType);

        return [
            'code' => 0,
            'type' => $sType,
            'content' => $this->getOptionsBlock()
        ];
    }

    protected function getOptionsBlock()
    {
        return '';
    }

    /**
     * A link to one category opens the settings group the category is in now. Categories were moved
     * between groups (for example "account" from "system" to "system_members"), and links such as
     * settings.php?page=system&category=account must keep working.
     */
    protected function getTypeOfCategory($sType, $mixedCategory)
    {
        if(!is_string($mixedCategory) || $mixedCategory === '' || str_contains($mixedCategory, ','))
            return $sType;

        $aCategory = [];
        (new BxDolStudioOptionsQuery())->getCategories(['type' => 'by_name', 'value' => $mixedCategory], $aCategory, false);
        if(empty($aCategory['type_name']) || $aCategory['type_name'] == $sType || $aCategory['type_group'] == BX_DOL_STUDIO_STG_GROUP_TEMPLATES)
            return $sType;

        return $aCategory['type_name'];
    }
}

/** @} */
