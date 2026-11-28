<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Courses Courses
 * @ingroup     UnaModules
 *
 * @{
 */

class BxCoursesMenuSnippetMeta extends BxBaseModGroupsMenuSnippetMeta
{
    public function __construct($aObject, $oTemplate = false)
    {
        $this->_sModule = 'bx_courses';

        parent::__construct($aObject, $oTemplate);

        unset($this->_aConnectionToFunctionCheck['sys_profiles_friends']);
    }

    protected function _getMenuItemReports($aItem, $aParams = [])
    {
        $bShowAsObject = isset($aParams['show_as_object']) && (bool)$aParams['show_as_object'] === true;

        if($bShowAsObject || $this->_bIsApi)  //--- API: Object base votes are used by default
            return $this->_getMenuItemReportObject($aItem, $aParams);

        $CNF = &$this->_oModule->_oConfig->CNF;

        if(empty($CNF['FIELD_REPORTS']) || (empty($this->_aContentInfo[$CNF['FIELD_REPORTS']]) && !$this->_bShowZeros))
            return false;

        $sTitle = _tn('_report_n_reports', $this->_aContentInfo[$CNF['FIELD_REPORTS']]);

        if($this->_bIsApi)
            return $this->_getMenuItemAPI($aItem, 'text', [
                'title' => $sTitle
            ]);

        return $this->getUnitMetaItemText($sTitle);
    }

    protected function _getMenuItemReportObject($aItem, $aParams = [])
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(empty($CNF['OBJECT_REPORTS']))
            return false;

        $oObject = BxDolReport::getObjectInstance($CNF['OBJECT_REPORTS'], $this->_aContentInfo[$CNF['FIELD_ID']]);
        if(!$oObject || !$oObject->isEnabled())
            return false;

        $aObjectOptions = [
            'show_do_report_as_button' => true,
            'show_do_report_label' => true,
            'show_counter' => true
        ];
        if(!empty($aParams['object_options']) && is_array($aParams['object_options']))
            $aObjectOptions = array_merge($aObjectOptions, $aParams['object_options']);

        if($this->_bIsApi)
            return $this->_getMenuItemElementAPI($aItem, $oObject->getElementApi($aObjectOptions));

        return $this->getUnitMetaItemCustom($oObject->getElementInline($aObjectOptions));
    }

    protected function _getMenuItemPass($aItem, $aParams = [])
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $iProfileId = bx_get_logged_profile_id();
        if(!$this->_oContentProfile || !$this->_oModule->serviceIsFan($this->_oContentProfile->id(), $iProfileId))
            return false;

        list($iPassPercent, $aPassDetails, $sPassStatus, $sPassTitle) = $this->_oModule->getEntryPass($iProfileId, $this->_iContentId);
        if(empty($sPassTitle))
            return false;

        $sLink = bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY'], [
            'id' => $this->_iContentId
        ]));

        if($this->_bIsApi)
            return $this->_getMenuItemAPI($aItem, ['display' => 'button'], [
                'title' => $sPassTitle,
                'link' => bx_api_get_relative_url($sLink)
            ]);

        return [
            $this->getUnitMetaItemButton($sPassTitle, [
                'class' => !empty($aItem['primary']) ? 'bx-btn-primary' : '',
                'href' => $sLink
            ]),
            'bx-menu-item-button'
        ];
    }
}

/** @} */
