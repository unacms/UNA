<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    BaseGeneral Base classes for modules
 * @ingroup     UnaModules
 *
 * @{
 */

bx_import('BxDolPrivacy');

/**
 * View entry social actions menu
 */
class BxBaseModGeneralMenuViewActions extends BxTemplMenuCustom
{
    protected $_sModule;
    protected $_oModule;

    protected $_oMenuActions;
    protected $_oMenuActionsMore;
    protected $_oMenuSocialSharing;

    protected $_iContentId;
    protected $_aContentInfo;

    protected $_bDynamicMode;
    protected $_bShowAsButton;
    protected $_bShowTitle;
    protected $_sClassMiSa; // Separate class for Social Actions (View, Vote, Comment, Report, etc) menu items.

    public function __construct($aObject, $oTemplate = false)
    {
        parent::__construct($aObject, $oTemplate);

        $this->_oModule = BxDolModule::getInstance($this->_sModule);

        $this->setContentId(bx_process_input(bx_get('id'), BX_DATA_INT));

        $this->_oMenuActions = null;
        $this->_oMenuActionsMore = null;
        $this->_oMenuSocialSharing = null;

        $this->_sTmplContent = $this->_oTemplate->getHtml($this->getTemplateName('menu_custom_actions.html'));
        $this->_sTmplContentItem = $this->_oTemplate->getHtml($this->getTemplateNameItem('menu_custom_item_actions.html'));
        $this->_bShowAsButton = true;
        $this->_bShowTitle = true;
        $this->_sClassMiSa = 'bx-base-general-ea-sa';

        $this->addMarkers(array(
            'module' => $this->_oModule->_oConfig->getName(),
            'module_uri' => $this->_oModule->_oConfig->getUri(),
        ));
    }

    public function addMarkers($a)
    {
        $bResult = parent::addMarkers($a);
        if($bResult) {
            if(empty($this->_oMenuSocialSharing))
                $this->_initMenuSocialSharing();

            //it still may be false in case the sys_social_sharing menu is turned off
            if (!empty($this->_oMenuSocialSharing)) {
                $this->_oMenuSocialSharing->addMarkers($a);
                parent::addMarkers($this->_oMenuSocialSharing->getMarkers());
            }
        }

        return $bResult;
    }

    public function setContentId($iContentId)
    {
        $this->_iContentId = (int)$iContentId;

        $this->_aContentInfo = $this->_oModule->_oDb->getContentInfoById($this->_iContentId);
        if($this->_aContentInfo)
            $this->addMarkers(array('content_id' => (int)$this->_iContentId));
    }

    public function setShowAsButton($bShowAsButton)
    {
        $this->_bShowAsButton = $bShowAsButton;
    }

    /**
     * Check if menu items is visible with extended checking linked to "allow*" method of particular module
     * Associated "allow*" method with particular menu item is stored in module config in MENU_ITEM_TO_METHOD array.
     * @param $a menu item array
     * @return boolean
     */
    protected function _isVisible($a)
    {
        if(!parent::_isVisible($a))
            return false;

        return $this->_oModule->isMenuItemVisible($this->_sObject, $a, $this->_aContentInfo);
    }

    protected function _isContentPublic($iContentId, $aPublicGroups = [])
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(empty($CNF['FIELD_ALLOW_VIEW_TO'])) 
            return true;

        $aContentInfo = $iContentId == $this->_iContentId ? $this->_aContentInfo : $this->_oModule->_oDb->getContentInfoById($iContentId);
        if(!isset($aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']]))
            return true;

        if(empty($aPublicGroups))
            $aPublicGroups = [BX_DOL_PG_ALL, BX_DOL_PG_MEMBERS];

        return in_array($aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']], $aPublicGroups);
    }

    protected function _initMenuSocialSharing()
    {
        $this->_oMenuSocialSharing = BxDolMenu::getObjectInstance('sys_social_sharing');
        if(!$this->_oMenuSocialSharing)
            return false;

        /**
         * Adding current markers to social sharing menu object to force it to generate its own markers.
         * Getting generated social sharing markers back and adding all of them to current menu object. So, now these markers can be parsed for any menu item.
         */
        $this->_oMenuSocialSharing->addMarkers($this->_aMarkers); 
        $this->addMarkers($this->_oMenuSocialSharing->getMarkers());

        return true;
    }

    protected function _getMenuItemDefault($aItem)
    {
        if(empty($this->_oMenuSocialSharing)) 
            $this->_initMenuSocialSharing();

        if(($mixedResult = $this->_rewriteMenuItem($aItem)) !== false)
            return $mixedResult;

        if($this->_bIsApi)
            return $aItem;

        $aItem['class_wrp'] = 'bx-base-general-entity-action' . (!empty($aItem['class_wrp']) ? ' ' . $aItem['class_wrp'] : '');

        if($this->_bShowAsButton)
            $aItem['class_link'] = 'bx-btn' . (isset($aItem['primary']) && (int)$aItem['primary'] == 1 ? ' bx-btn-primary' : '') . (!empty($aItem['class_link']) ? ' ' . $aItem['class_link'] : '');

        if(!$this->_bShowTitle)
            $aItem['bx_if:title']['condition'] = false;

        return parent::_getMenuItemDefault ($aItem);
    }

    protected function _getMenuItemDefaultApi($aItem)
    {
        if(($mixedResult = $this->_rewriteMenuItem($aItem)) !== false)
            return $mixedResult;

        return parent::_getMenuItemDefaultApi($aItem);
    }

    protected function _getMenuItemView($aItem, $aParams = array())
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $sObject = !empty($aParams['object']) ? $aParams['object'] : '';
        if(empty($sObject) && !empty($CNF['OBJECT_VIEWS']))
            $sObject = $CNF['OBJECT_VIEWS'];

        $iId = !empty($aParams['id']) ? (int)$aParams['id'] : '';
        if(empty($iId))
            $iId = $this->_iContentId;

        $oObject = !empty($sObject) ? BxDolView::getObjectInstance($sObject, $iId) : false;
        if(!$oObject || !$oObject->isEnabled())
            return '';

        $aObjectOptions = array(
            'dynamic_mode' => $this->_bDynamicMode,
            'show_do_view_as_button' => $this->_bShowAsButton,
            'show_do_view_label' => $this->_bShowTitle
        );
        if(!empty($aParams['object_options']) && is_array($aParams['object_options']))
            $aObjectOptions = array_merge($aObjectOptions, $aParams['object_options']);

        if($this->_bIsApi)
            return $oObject->getElementApi($aObjectOptions);

        $sResult = $oObject->getElementBlock($aObjectOptions);
        if(empty($sResult))
            return '';

    	return array($sResult, $this->_sClassMiSa);
    }

    protected function _getMenuItemComment($aItem, $aParams = array())
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $sObject = !empty($aParams['object']) ? $aParams['object'] : '';
        if(empty($sObject) && !empty($CNF['OBJECT_COMMENTS']))
            $sObject = $CNF['OBJECT_COMMENTS'];

        $iId = !empty($aParams['id']) ? (int)$aParams['id'] : '';
        if(empty($iId))
            $iId = $this->_iContentId;

        $oObject = !empty($sObject) ? BxTemplCmts::getObjectInstance($sObject, $iId) : false;
        if(!$oObject || !$oObject->isEnabled())
            return '';

        $aObjectOptions = array(
            'dynamic_mode' => $this->_bDynamicMode,
            'show_do_comment_as_button' => $this->_bShowAsButton,
            'show_do_comment_label' => $this->_bShowTitle,
            'show_counter' => false
        );
        if(!empty($aParams['object_options']) && is_array($aParams['object_options']))
            $aObjectOptions = array_merge($aObjectOptions, $aParams['object_options']);

        if($this->_bIsApi)
            return $oObject->getElementApi($aObjectOptions);

        $sResult = $oObject->getElementBlock($aObjectOptions);
        if(empty($sResult))
            return '';

        return array($sResult, $this->_sClassMiSa);
    }

    protected function _getMenuItemVote($aItem, $aParams = [])
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(empty($aParams['object']) && !empty($CNF['OBJECT_VOTES']))
            $aParams['object'] = $CNF['OBJECT_VOTES'];

        return $this->__getMenuItemVote($aItem, $aParams);
    }

    protected function _getMenuItemReaction($aItem, $aParams = [])
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(empty($aParams['object']) && !empty($CNF['OBJECT_REACTIONS']))
            $aParams['object'] = $CNF['OBJECT_REACTIONS'];

        return $this->__getMenuItemVote($aItem, $aParams);
    }

    protected function _getMenuItemScore($aItem, $aParams = [])
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aParams['class'] = 'BxDolScore';
                
        if(empty($aParams['object']) && !empty($CNF['OBJECT_SCORES']))
            $aParams['object'] = $CNF['OBJECT_SCORES'];

        return $this->__getMenuItemVote($aItem, $aParams);
    }

    protected function __getMenuItemVote($aItem, $aParams = [])
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $iId = !empty($aParams['id']) ? (int)$aParams['id'] : '';
        if(empty($iId))
            $iId = $this->_iContentId;

        $sClass = $aParams['class'] ?? 'BxDolVote';
        $oObject = ($sObject = $aParams['object'] ?? '') ? $sClass::getObjectInstance($sObject, $iId) : false;
        if(!$oObject || !$oObject->isEnabled())
            return '';

        $aObjectOptions = array(
            'dynamic_mode' => $this->_bDynamicMode,
            'show_do_vote_as_button' => $this->_bShowAsButton,
            'show_do_vote_label' => $this->_bShowTitle
        );
        if(!empty($aParams['object_options']) && is_array($aParams['object_options']))
            $aObjectOptions = array_merge($aObjectOptions, $aParams['object_options']);

        if($this->_bIsApi)
            return [
                'id' => $aItem['id'],
                'name' => $aItem['name'],
                'display_type' => 'element',
                'data' => $oObject->getElementApi($aObjectOptions)
            ];

        $sResult = $oObject->getElementBlock($aObjectOptions);
        if(empty($sResult))
            return '';

    	return array($sResult, $this->_sClassMiSa);
    }

    protected function _getMenuItemFavorite($aItem, $aParams = array())
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $sObject = !empty($aParams['object']) ? $aParams['object'] : '';
        if(empty($sObject) && !empty($CNF['OBJECT_FAVORITES']))
            $sObject = $CNF['OBJECT_FAVORITES'];

        $iId = !empty($aParams['id']) ? (int)$aParams['id'] : '';
        if(empty($iId))
            $iId = $this->_iContentId;

        $oObject = !empty($sObject) ? BxDolFavorite::getObjectInstance($sObject, $iId) : false;
        if(!$oObject || !$oObject->isEnabled())
            return '';

        $aObjectOptions = array(
            'dynamic_mode' => $this->_bDynamicMode,
            'show_do_favorite_as_button' => $this->_bShowAsButton,
            'show_do_favorite_label' => $this->_bShowTitle
        );
        if(!empty($aParams['object_options']) && is_array($aParams['object_options']))
            $aObjectOptions = array_merge($aObjectOptions, $aParams['object_options']);

        if($this->_bIsApi)
            return [
                'id' => $aItem['id'],
                'name' => $aItem['name'],
                'display_type' => 'element',
                'data' => $oObject->getElementApi($aObjectOptions)
            ];

        $sResult = $oObject->getElementBlock($aObjectOptions);
        if(empty($sResult))
            return '';

    	return array($sResult, $this->_sClassMiSa);
    }

    protected function _getMenuItemFeature($aItem, $aParams = array())
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $sObject = !empty($aParams['object']) ? $aParams['object'] : '';
        if(empty($sObject) && !empty($CNF['OBJECT_FEATURED']))
            $sObject = $CNF['OBJECT_FEATURED'];

        $iId = !empty($aParams['id']) ? (int)$aParams['id'] : '';
        if(empty($iId))
            $iId = $this->_iContentId;

        if(!$this->_isContentPublic($iId))
            return '';

        $oObject = !empty($sObject) ? BxDolFeature::getObjectInstance($sObject, $iId) : false;
        if(!$oObject || !$oObject->isEnabled())
            return '';

        $aObjectOptions = array(
            'dynamic_mode' => $this->_bDynamicMode,
            'show_do_feature_as_button' => $this->_bShowAsButton,
            'show_do_feature_label' => $this->_bShowTitle
        );
        if(!empty($aParams['object_options']) && is_array($aParams['object_options']))
            $aObjectOptions = array_merge($aObjectOptions, $aParams['object_options']);

        if($this->_bIsApi)
            return [
                'id' => $aItem['id'],
                'name' => $aItem['name'],
                'display_type' => 'element',
                'data' => $oObject->getElementApi($aObjectOptions)
            ];

        $sResult = $oObject->getElementBlock($aObjectOptions);
        if(empty($sResult))
            return '';

    	return array($sResult, $this->_sClassMiSa);
    }

    protected function _getMenuItemRepost($aItem, $aParams = array())
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $sAction = !empty($aParams['action']) ? $aParams['action'] : '';
        if(empty($sAction))
            $sAction = 'added';

        $iId = !empty($aParams['id']) ? (int)$aParams['id'] : '';
        if(empty($iId))
            $iId = $this->_iContentId;

        $aContentInfo = $this->_oModule->_oDb->getContentInfoById($iId);
        if(!empty($CNF['FIELD_PUBLISHED']) && isset($aContentInfo[$CNF['FIELD_PUBLISHED']]) && (int)$aContentInfo[$CNF['FIELD_PUBLISHED']] > time())
            return '';

        if(!empty($CNF['FIELD_ALLOW_VIEW_TO']) && isset($aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']]) && (int)$aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']] > 0 && !in_array((int)$aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']], array(BX_DOL_PG_ALL, BX_DOL_PG_MEMBERS)))
            return '';

        $sStatus = 'active';
        if(!empty($CNF['FIELD_STATUS']) && isset($aContentInfo[$CNF['FIELD_STATUS']]) && $aContentInfo[$CNF['FIELD_STATUS']] != $sStatus)
            return '';
        if(!empty($CNF['FIELD_STATUS_ADMIN']) && isset($aContentInfo[$CNF['FIELD_STATUS_ADMIN']]) && $aContentInfo[$CNF['FIELD_STATUS_ADMIN']] != $sStatus)
            return '';

        $sRepostDo = !empty($aParams['do']) ? $aParams['do'] : 'repost';
        $aRepostParams = [
            'do' => $sRepostDo,
            'show_do_repost_as_button' => $this->_bShowAsButton,
            'show_do_repost_text' => $this->_bShowTitle
        ];
        if(!empty($aItem['title']))
            $aRepostParams['text_do_' . $sRepostDo] = $aItem['title'];
        if(!empty($aItem['icon']))
            $aRepostParams['icon_do_' . $sRepostDo] = $aItem['icon'];

        $aSrvParams = [bx_get_logged_profile_id(), $this->_oModule->_oConfig->getName(), $sAction, $iId, $aRepostParams];

        if($this->_bIsApi && bx_is_srv('bx_timeline', 'get_repost_element_block_api'))
            return [
                'id' => $aItem['id'],
                'name' => $aItem['name'],
                'display_type' => 'element',
                'data' => bx_srv('bx_timeline', 'get_repost_element_block_api', $aSrvParams)
            ];

        if(!bx_is_srv('bx_timeline', 'get_repost_element_block'))
            return '';

        $sResult = bx_srv('bx_timeline', 'get_repost_element_block', $aSrvParams);
        if(empty($sResult))
            return '';

    	return array($sResult, $this->_sClassMiSa);
    }

    protected function _getMenuItemRepostWithText($aItem, $aParams = [])
    {
        return $this->_getMenuItemRepost($aItem, array_merge($aParams, [
            'do' => 'repost_with'
        ]));
    }

    protected function _getMenuItemRepostToContext($aItem, $aParams = [])
    {
        return $this->_getMenuItemRepost($aItem, array_merge($aParams, [
            'do' => 'repost_to'
        ]));
    }

    protected function _getMenuItemReport($aItem, $aParams = array())
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $sObject = !empty($aParams['object']) ? $aParams['object'] : '';
        if(empty($sObject) && !empty($CNF['OBJECT_REPORTS']))
            $sObject = $CNF['OBJECT_REPORTS'];

        $iId = !empty($aParams['id']) ? (int)$aParams['id'] : '';
        if(empty($iId))
            $iId = $this->_iContentId;

        $oObject = !empty($sObject) ? BxDolReport::getObjectInstance($sObject, $iId) : false;
        if(!$oObject || !$oObject->isEnabled())
            return '';

        $aObjectOptions = array(
            'dynamic_mode' => $this->_bDynamicMode,
            'show_do_report_as_button' => $this->_bShowAsButton,
            'show_do_report_label' => $this->_bShowTitle
        );
        if(!empty($aParams['object_options']) && is_array($aParams['object_options']))
            $aObjectOptions = array_merge($aObjectOptions, $aParams['object_options']);

        if($this->_bIsApi)
            return [
                'id' => $aItem['id'],
                'name' => $aItem['name'],
                'display_type' => 'element',
                'data' => $oObject->getElementApi($aObjectOptions)
            ];

        $sResult = $oObject->getElementBlock($aObjectOptions);
        if(empty($sResult))
            return '';

    	return array($sResult, $this->_sClassMiSa);
    }

    protected function _getMenuItemSocialSharing($aItem, $aParams = array())
    {
        if(!$this->_bIsApi)
            return true;

        if(empty($this->_oMenuSocialSharing) && !$this->_initMenuSocialSharing())
            return [];

        return [
            'id' => $aItem['id'],
            'name' => $aItem['name'],
            'display_type' => 'element',
            'data' => [
                'type' => 'shares',
                'system' => $this->_sModule,
                'object_id' => $this->_iContentId,
                'params' => [],
                'action' => [
                    'url' => bx_api_get_relative_url(bx_replace_markers('{url}', $this->_aMarkers))
                ]
            ]
        ];
    }

    protected function _getMenuItemNotes($aItem, $aParams = array())
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $sObject = !empty($aParams['object']) ? $aParams['object'] : '';
        if(empty($sObject) && !empty($CNF['OBJECT_NOTES']))
            $sObject = $CNF['OBJECT_NOTES'];

        $iId = !empty($aParams['id']) ? (int)$aParams['id'] : '';
        if(empty($iId))
            $iId = $this->_iContentId;

        if(!$this->_oModule->_isModerator())
            return false;

        $this->addMarkers(array(
            'content_id' => $iId
        ));

        return true;
    }
    
    protected function _getMenuItemByNameActions($aItem, $aParams = array())
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(empty($this->_oMenuActions)) {
            $sObjectMenu = !empty($aParams['object_menu']) ? $aParams['object_menu'] : '';
            if(empty($sObjectMenu) && !empty($CNF['OBJECT_MENU_ACTIONS_VIEW_ENTRY']))
                $sObjectMenu = $CNF['OBJECT_MENU_ACTIONS_VIEW_ENTRY'];

            if(empty($sObjectMenu))
                return '';

            $this->_oMenuActions = BxDolMenu::getObjectInstance($sObjectMenu);
            if(!$this->_oMenuActions)
                return '';

            $this->_oMenuActions->setContentId($this->_iContentId);
            $this->_oMenuActions->addMarkers($this->getMarkers());

            $this->addMarkers($this->_oMenuActions->getMarkers());
        }

        $aItem = $this->_oMenuActions->getMenuItem($aItem['name']);
        if(empty($aItem) || !is_array($aItem))
            return false;

        if($this->_bIsApi)
            return $aItem;
        else
            return $this->_getMenuItemDefault($aItem);
    }

    protected function _getMenuItemByNameSocialSharing($aItem, $aParams = array())
    {
        if(empty($this->_oMenuSocialSharing) && !$this->_initMenuSocialSharing())
            return false;

        $aItem = $this->_oMenuSocialSharing->getMenuItem($aItem['name']);
        if(empty($aItem) || !is_array($aItem))
            return false;

        if($this->_bIsApi)
            return $aItem;
        else
            return $this->_getMenuItemDefault($aItem);
    }

    protected function _getMenuItemByNameActionDelete($aItem)
    {
        $oProfile = $this->_oModule->getProfileObject(($this->_iContentId));
        if (!$this->_oModule->isAllowDeleteOrDisable(bx_get_logged_profile_id(), $oProfile->id()))
            return false;
        
        return $this->_getMenuItemByNameActionsMore($aItem);
    }
    
    protected function _getMenuItemByNameActionsMore($aItem)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(empty($this->_oMenuActionsMore)) {
            if(empty($CNF['OBJECT_MENU_ACTIONS_VIEW_ENTRY_MORE']))
                return '';

            $this->_oMenuActionsMore = BxDolMenu::getObjectInstance($CNF['OBJECT_MENU_ACTIONS_VIEW_ENTRY_MORE']);
            if(!$this->_oMenuActionsMore)
                return '';

            $this->_oMenuActionsMore->setContentId($this->_iContentId);
            
            $this->addMarkers($this->_oMenuActionsMore->getMarkers());
        }

        $aItem = $this->_oMenuActionsMore->getMenuItem($aItem['name']);
        if(empty($aItem) || !is_array($aItem))
            return false;

        if($this->_bIsApi)
            return $aItem;
        else
            return $this->_getMenuItemDefault($aItem);
    }

    protected function _rewriteMenuItem($aItem, $aExtrasAddon = [])
    {
        return parent::_rewriteMenuItem($aItem, [
            'module' => $this->_sModule,
            'content_id' => $this->_iContentId,
            'content_data' => $this->_aContentInfo,
        ]);
    }
}

/** @} */
