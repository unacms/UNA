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

    function __construct($sType = '', $mixedCategory = '')
    {
        parent::__construct('settings');

        $this->oDb = new BxDolStudioSettingsQuery();

        $this->oOptions = new BxTemplStudioOptions($this->getTypeOfCategory($sType, $mixedCategory), $mixedCategory);
    }

    public function checkAction()
    {
        return $this->oOptions->checkAction();
    }

    /**
     * A link to one category opens the settings group the category is in now. Categories were moved
     * between groups (for example "account" from "system" to "system_members"), and links such as
     * settings.php?page=system&category=account must keep working.
     */
    protected function getTypeOfCategory($sType, $mixedCategory)
    {
        if(!is_string($mixedCategory) || $mixedCategory === '' || strpos($mixedCategory, ',') !== false)
            return $sType;

        $aCategory = [];
        (new BxDolStudioOptionsQuery())->getCategories(['type' => 'by_name', 'value' => $mixedCategory], $aCategory, false);
        if(empty($aCategory['type_name']) || $aCategory['type_name'] == $sType || $aCategory['type_group'] == BX_DOL_STUDIO_STG_GROUP_TEMPLATES)
            return $sType;

        return $aCategory['type_name'];
    }
}

/** @} */
