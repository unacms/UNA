<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * @see BxDolFavorite
 */
class BxBaseFavorite extends BxDolFavorite
{
    protected $_bCssJsAdded;

    protected $_sJsObjClass;
    protected $_sJsObjName;
    protected $_sStylePrefix;

    protected $_aHtmlIds;

    public function __construct($sSystem, $iId, $iInit = 1, $oTemplate = false)
    {
        parent::__construct($sSystem, $iId, $iInit, $oTemplate);

        $this->_bCssJsAdded = false;

        $this->_sJsObjClass = 'BxDolFavorite';
        $this->_sJsObjName = 'oFavorite' . bx_gen_method_name($sSystem, ['_' , '-']) . $iId;
        $this->_sStylePrefix = 'bx-favorite';

        $sHtmlId = str_replace(['_' , ' '], ['-', '-'], $sSystem) . '-' . $iId;
        $this->_aHtmlIds = [
            'main' => 'bx-favorite-' . $sHtmlId,
            'counter' => 'bx-favorite-counter-' . $sHtmlId,
            'do_link' => 'bx-favorite-do-link-' . $sHtmlId,
            'by_popup' => 'bx-favorite-by-popup-' . $sHtmlId,
            'do_popup' => 'bx-favorite-do-popup-' . $sHtmlId,
            'do_form' => 'bx-favorite-do-form-' . $sHtmlId,
        ];

        $this->_aElementDefaults = [
            'show_do_favorite_as_button' => false,
            'show_do_favorite_as_button_small' => false,
            'show_do_favorite_icon' => true,
            'show_do_favorite_label' => false,
            'show_counter' => true,
            'show_counter_only' => true
        ];

        $this->_aElementDefaultsApi = array_merge($this->_aElementDefaults, [
            'show_do_feature_as_button' => true,
        ]);
        $this->_aElementParamsApi = ['is_favorited'];

        $this->_sTmplContentElementBlock = $this->_oTemplate->getHtml('favorite_element_block.html');
        $this->_sTmplContentElementInline = $this->_oTemplate->getHtml('favorite_element_inline.html');
        $this->_sTmplContentDoActionLabel = $this->_oTemplate->getHtml('favorite_do_favorite_label.html');
    }

    public function getJsObjectName()
    {
        return $this->_sJsObjName;
    }

    public function getJsScript($bDynamicMode = false)
    {
        $aParams = array(
            'sObjName' => $this->_sJsObjName,
            'sSystem' => $this->getSystemName(),
            'iAuthorId' => $this->_getAuthorId(),
            'iObjId' => $this->getId(),
            'sRootUrl' => BX_DOL_URL_ROOT,
            'sStylePrefix' => $this->_sStylePrefix,
            'aHtmlIds' => $this->_aHtmlIds
        );
        $sCode = "var " . $this->_sJsObjName . " = new " . $this->_sJsObjClass . "(" . json_encode($aParams) . ");";

        return $this->_oTemplate->_wrapInTagJsCode($sCode);
    }

    public function getJsClick()
    {
        return $this->getJsObjectName() . '.favorite(this)';
    }

    public function getCounter($aParams = [])
    {
        $aParams = array_merge($this->_aElementDefaults, $aParams);

        $bShowDoFavoriteAsButtonSmall = isset($aParams['show_do_favorite_as_button_small']) && $aParams['show_do_favorite_as_button_small'] == true;
        $bShowDoFavoriteAsButton = !$bShowDoFavoriteAsButtonSmall && isset($aParams['show_do_favorite_as_button']) && $aParams['show_do_favorite_as_button'] == true;

        $aFavorite = $this->_getFavorite();

        $sClass = 'sys-action-counter';
        if(isset($aParams['show_counter_only']) && (bool)$aParams['show_counter_only'] === true)
            $sClass .= ' sys-ac-only';

        $sClass .= ' ' . $this->_sStylePrefix . '-counter';
        if($bShowDoFavoriteAsButtonSmall)
            $sClass .= ' bx-btn-small-height';
        if($bShowDoFavoriteAsButton)
            $sClass .= ' bx-btn-height';

        return $this->_oTemplate->parseLink('javascript:void(0)', (int)$aFavorite['count'] > 0 ? $this->_getCounterLabel($aFavorite['count']) : '', array(
            'title' => _t('_favorite_do_favorite_by'),
            'id' => $this->_aHtmlIds['counter'],
            'class' => $sClass,
            'onclick' => 'javascript:' . $this->getJsObjectName() . '.toggleByPopup(this)'
        ));
    }

    public function getCounterAPI($aParams = [])
    {
        $aParams = array_merge($this->_aElementDefaultsApi, $aParams);

        return $this->_getFavorite();
    }

    public function getElementBlock($aParams = array())
    {
        $aParams['usage'] = BX_DOL_FAVORITE_USAGE_BLOCK;

        return $this->getElement($aParams);
    }

    public function getElementInline($aParams = array())
    {
        $aParams['usage'] = BX_DOL_FAVORITE_USAGE_INLINE;

        return $this->getElement($aParams);
    }

    public function getElement($aParams = array())
    {
    	$aParams = array_merge($this->_aElementDefaults, $aParams);
    	$bDynamicMode = isset($aParams['dynamic_mode']) && $aParams['dynamic_mode'] === true;

        $bShowDoFavoriteAsButtonSmall = isset($aParams['show_do_favorite_as_button_small']) && $aParams['show_do_favorite_as_button_small'] == true;
        $bShowDoFavoriteAsButton = !$bShowDoFavoriteAsButtonSmall && isset($aParams['show_do_favorite_as_button']) && $aParams['show_do_favorite_as_button'] == true;
        $bShowCounter = isset($aParams['show_counter']) && $aParams['show_counter'] === true && $this->isAllowedFavoriteView();

        $iObjectId = $this->getId();
        $iAuthorId = $this->_getAuthorId();
        $aFavorite = $this->_oQuery->getFavorite($iObjectId);
        $bCount = (int)$aFavorite['count'] != 0;

        $bAllowedFavorite = $this->isAllowedFavorite();
        if(!$bAllowedFavorite && (!$this->isAllowedFavoriteView() || !$bCount))
            return '';

        $aParams['is_favorited'] = $this->isPerformed($iObjectId, $iAuthorId) ? true : false;

        $sTmplName = $this->{'_getTmplContentElement' . bx_gen_method_name(!empty($aParams['usage']) ? $aParams['usage'] : BX_DOL_FAVORITE_USAGE_DEFAULT)}();
        return $this->_oTemplate->parseHtmlByContent($sTmplName, array(
            'style_prefix' => $this->_sStylePrefix,
            'html_id' => $this->_aHtmlIds['main'],
            'class' => $this->_sStylePrefix . ($bShowDoFavoriteAsButton ? '-button' : '-link') . ($bShowDoFavoriteAsButtonSmall ? '-button-small' : ''),
            'count' => $aFavorite['count'],
            'do_favorite' => $this->_getDoFavorite($aParams, $bAllowedFavorite),
            'bx_if:show_counter' => array(
                'condition' => $bShowCounter,
                'content' => array(
                    'style_prefix' => $this->_sStylePrefix,
                    'bx_if:show_hidden' => array(
                        'condition' => !$bCount,
                        'content' => array()
                    ),
                    'counter' => $this->getCounter(array_merge($aParams, [
                        'show_counter_only' => false
                    ]))
                )
            ),
            'script' => $this->getJsScript($bDynamicMode)
        ));
    }

    public function getElementAPI($aParams = [])
    {
        if(!($this->_bIsApi = bx_is_api()))
            return;

        if(!$this->isEnabled())
            return bx_api_get_msg('_favorite_err_not_enabled');

        $aParams = array_merge($this->_aElementDefaultsApi, $aParams);

        $iObjectId = $this->getId();
        $iAuthorId = $this->_getAuthorId();

        $aFavorite = $this->_oQuery->getFavorite($iObjectId);

        $bCount = (int)$aFavorite['count'] != 0;
        $isAllowedFavorite = $this->isAllowedFavorite();
        $isAllowedFavoriteView = $this->isAllowedFavoriteView();
        $aParams['is_favorited'] = $this->isPerformed($iObjectId, $iAuthorId) ? true : false;

        //--- Do Favorite
        $bDoFavorite = $this->_isShowDoFavorite($aParams, $isAllowedFavorite, $bCount);
        $aDoFavorite = $bDoFavorite ? $this->_getDoFavorite($aParams, $isAllowedFavorite) : [];

        //--- Counter
        $bCounter = $this->_isShowCounter($aParams, $isAllowedFavorite, $isAllowedFavoriteView, $bCount);
        $aCounter = $bCounter ? $this->getCounterAPI(array_merge($aParams, [
            'show_counter_only' => false, 
            'show_script' => false
        ])) : [];

        if(!$bDoFavorite && !$bCounter)
            return bx_api_get_msg('');

        return [
            'type' => $this->_sType,
            'system' => $this->_sSystem,
            'object_id' => $this->_iId,
            'params' => array_intersect_key($aParams, array_flip($this->_aElementParamsApi)),
            'action' => $aDoFavorite,
            'counter' => $aCounter
        ];
    }

    public function getPerformedByAPI($aParams = [])
    {
        $aValues = $this->_oQuery->getPerformedBy($this->getId());

        $aTmplUsers = [];
        foreach($aValues as $mValue) {
            $mValue = is_array($mValue) ? $mValue : ['author_id' => (int)$mValue, 'reaction' => ''];

            $aTmplUsers[] = BxDolProfile::getData($mValue['author_id']);
        }

        return [
            'performed_by' => $aTmplUsers
        ];
    }

    protected function _getDoFavorite($aParams = array(), $bAllowedFavorite = true)
    {
        $bFavorited = isset($aParams['is_favorited']) && $aParams['is_favorited'] === true;
        $bShowDoFavoriteAsButtonSmall = isset($aParams['show_do_favorite_as_button_small']) && $aParams['show_do_favorite_as_button_small'] == true;
        $bShowDoFavoriteAsButton = !$bShowDoFavoriteAsButtonSmall && isset($aParams['show_do_favorite_as_button']) && $aParams['show_do_favorite_as_button'] == true;
        $bDisabled = !$bAllowedFavorite || ($bFavorited  && !$this->isUndo());

        $sClass = '';
        if($bShowDoFavoriteAsButton)
            $sClass = 'bx-btn';
        else if ($bShowDoFavoriteAsButtonSmall)
            $sClass = 'bx-btn bx-btn-small';

        if($bDisabled)
            $sClass .= $bShowDoFavoriteAsButton || $bShowDoFavoriteAsButtonSmall ? ' bx-btn-disabled' : 'bx-favorite-disabled';

        if($this->_bIsApi)
            return [
                'is_undo' => $this->isUndo(),
                'is_favorited' => $bFavorited,
                'is_disabled' => $bDisabled,
                'title' => _t($this->_getTitleDoFavorite($bFavorited)),
            ];

        return $this->_oTemplate->parseLink('javascript:void(0)', $this->_getLabelDoFavorite($aParams), [
            'id' => $this->_aHtmlIds['do_link'],
            'class' => $this->_sStylePrefix . '-do-favorite ' . $sClass,
            'title' => _t($this->_getTitleDoFavorite($bFavorited)),
            'onclick' => !$bDisabled ? $this->getJsClick() : ''
        ]);
    }

    protected function _getCounterLabel($iCount)
    {
        return _t('_favorite_counter', $iCount);
    }

    protected function _getLabelDoFavorite($aParams = array())
    {
    	$bFavorited = isset($aParams['is_favorited']) && $aParams['is_favorited'] === true;
        return $this->_oTemplate->parseHtmlByContent($this->_getTmplContentDoActionLabel(), array(
            'style_prefix' => $this->_sStylePrefix,
            'bx_if:show_icon' => array(
                'condition' => isset($aParams['show_do_favorite_icon']) && $aParams['show_do_favorite_icon'] == true,
                'content' => array(
                    'style_prefix' => $this->_sStylePrefix,
                    'icon' => $this->_oTemplate->getImageAuto($this->_getIconDoFavorite($bFavorited))
                )
            ),
            'bx_if:show_text' => array(
                'condition' => isset($aParams['show_do_favorite_label']) && $aParams['show_do_favorite_label'] == true,
                'content' => array(
                    'style_prefix' => $this->_sStylePrefix,
                    'text' => _t($this->_getTitleDoFavorite($bFavorited))
                )
            )
        ));
    }
    
    public function favorite()
    {
        if(!$this->isEnabled())
           return array('code' => 1, 'message' => _t('_favorite_err_not_enabled'));

        $iAuthorId = $this->_getAuthorId();
        $iObjectId = $this->getId();
        $iObjectAuthorId = $this->_oQuery->getObjectAuthorId($iObjectId);

        if(!isset($this->_aSystem['table_lists']) || $this->_aSystem['table_lists'] == '')
            return $this->doFavorite();

        $oForm = $this->_getFormObject($this->_sFormDisplayAdd);
        $oForm->setId($this->_aHtmlIds['do_form']);
        $oForm->setName($this->_aHtmlIds['do_form']);
        $oForm->aParams['db']['table'] = $this->_aSystem['table_track'];
        $oForm->aInputs['sys']['value'] = $this->_sSystem;
        $oForm->aInputs['object_id']['value'] = $iObjectId;

        $oForm->aInputs['action']['value'] = 'Favorite';
        
        $aListsValues = [];
        $aLists = $this->_oQuery->getList(array('type' => 'all', 'author_id' => $iAuthorId, 'need_default' => true));
        foreach($aLists as $aList)
            $aListsValues[$aList['id']] = $this->_oTemplate->parseHtmlByName('favorite_do_favorite_privacy_item.html', [
                'title' => $aList['title'],
                'icon' => BxDolPrivacy::getIcon($aList['allow_view_favorite_list_to'])
            ]);

        $oForm->aInputs['list']['values'] = $aListsValues;
        $oForm->aInputs['list']['value'] = $this->_oQuery->getList(array('type' => 'object_and_author', 'object_id' => $iObjectId, 'author_id' => $iAuthorId));
        $oForm->aInputs['list']['label_as_html'] = true;

        $oModule = BxDolModule::getInstance($this->_aSystem["name"]);
        $CNF = $oModule->_oConfig->CNF;    

        $oPrivacy = BxDolPrivacy::getObjectInstance($CNF["OBJECT_PRIVACY_LIST_VIEW"]);
        if (!$oPrivacy) 
            return array('code' => 5, 'message' => _t('_favorite_err_cannot_perform_action'));

        $aSave = array('db' => array('pass' => 'Xss'));
        $aGroupChooser = $oPrivacy->getGroupChooser($CNF["OBJECT_PRIVACY_LIST_VIEW"]);
        $oForm->aInputs["allow_view_favorite_list_to"] = array_merge($oForm->aInputs["allow_view_favorite_list_to"], $aGroupChooser, $aSave);
        
        if ($oForm->isSubmittedAndValid()) {
            $mList = $oForm->getCleanValue('list');
            $aList = is_array($mList) ? $mList : array();

            $sTitle = $oForm->getCleanValue('title');
            if ($sTitle) {
                 $sAllowViewTo = $oForm->getCleanValue('allow_view_favorite_list_to');
                 $iAddList = $this->_oQuery->addList($iAuthorId, $sTitle, $sAllowViewTo);
                 array_push($aList, $iAddList);
            }

            $this->_oQuery->clearFavorite($iObjectId, $iAuthorId);
            foreach ($aList as $iList) {
                $this->_oQuery->doFavorite($iObjectId, $iAuthorId, $iList);
            }

            $this->_trigger();

            bx_alert($this->_sSystem, 'favorite', $iObjectId, $iAuthorId, array('favorite_author_id' => $iAuthorId, 'object_author_id' => $iObjectAuthorId, 'list_ids' => $aList));
            /**
             * @hooks
             * @hookdef hook-report-do 'favorite', 'favorite' - hook on add new object to  favorites lists
             * - $unit_name - equals `favorite`
             * - $action - equals `favorite` 
             * - $object_id - favorited object id 
             * - $sender_id - profile_id for favorite's author
             * - $extra_params - array of additional params with the following array keys:
             *      - `object_system` - [string] system name, ex: bx_posts
             *      - `object_id` - [int] reported object id 
             *      - `object_author_id` - [int] author's profile_id for reported object_id 
             *      - `list_ids` - [array] array of id's list 
             * @hook @ref hook-favorite-do
             */
            bx_alert('favorite', 'do', 0, $iAuthorId, array('object_system' => $this->_sSystem, 'object_id' => $iObjectId, 'object_author_id' => $iObjectAuthorId, 'list_ids' => $aList));

            $bPerformed = count($aList) > 0;
            $aFavorite = $this->_oQuery->getFavorite($iObjectId);
            return array(
                'eval' => $this->getJsObjectName() . '.onFavorite(oData, oElement)',
                'code' => 0, 
                'count' => $aFavorite['count'],
                'countf' => (int)$aFavorite['count'] > 0 ? $this->_getCounterLabel($aFavorite['count']) : '',
                'label_icon' => $this->_getIconDoFavorite($bPerformed), 
                'label_title' => _t($this->_getTitleDoFavorite($bPerformed)), 
                'disabled' => false
            );
        }

        $sPopupId = $this->_aHtmlIds['do_popup'];
        $sPopupContent = BxTemplFunctions::getInstance()->transBox($sPopupId, $this->_oTemplate->parseHtmlByName('favorite_do_favorite_popup.html', array(
            'style_prefix' => $this->_sStylePrefix,
            'js_object' => $this->getJsObjectName(),
            'form' => str_replace('{js_object}', $this->getJsObjectName(), $oForm->getCode()),
            'form_id' => $oForm->id,
        )));

        return array('popup' => $sPopupContent, 'popup_id' => $sPopupId);
    }
    
    protected function _getEditList($aData)
    {
        if (!$this->isEnabled())
            return array('code' => 1, 'message' => _t('_favorite_err_not_enabled'));
        
        $oForm = $this->_getFormObject($this->_sFormDisplayListEdit);
        $oForm->setId($this->_aHtmlIds['do_form']);
        $oForm->setName($this->_aHtmlIds['do_form']);
        $oForm->aParams['db']['table'] = $this->_aSystem['table_track'];
        $oForm->aInputs['sys']['value'] = $this->_sSystem;
        $oForm->aInputs['list_id']['value'] = $aData['id'];
        $oForm->aInputs['object_id']['value'] = 0;
        $oForm->aInputs['action']['value'] = 'EditList';
        $oModule = BxDolModule::getInstance($this->_aSystem["name"]);
        $CNF = $oModule->_oConfig->CNF;    
        
        $oPrivacy = BxDolPrivacy::getObjectInstance($CNF["OBJECT_PRIVACY_LIST_VIEW"]);
        if(!$oPrivacy) 
            return;
        
        $aSave = array('db' => array('pass' => 'Xss'));
        $aGroupChooser = $oPrivacy->getGroupChooser($CNF["OBJECT_PRIVACY_LIST_VIEW"]);
        $oForm->aInputs["allow_view_favorite_list_to"] = array_merge($oForm->aInputs["allow_view_favorite_list_to"], $aGroupChooser, $aSave);
        
        $oForm->aInputs['title']['value'] = $aData['title'];
        $oForm->aInputs['allow_view_favorite_list_to']['value'] = $aData['allow_view_favorite_list_to'];

        if($oForm->isSubmittedAndValid()) {
            
            $sTitle = $oForm->getCleanValue('title');
            if ($sTitle){
                $sAllowViewTo = $oForm->getCleanValue('allow_view_favorite_list_to');
                $this->_oQuery->editList($aData['id'], $sTitle, $sAllowViewTo);
            }
            return array(
        	    'eval' => $this->getJsObjectName() . '.onEditFavoriteList(oData, oElement)',
        	    'code' => 0, 
            );
        }
         
        $sPopupId = $this->_aHtmlIds['do_popup'];
        $sPopupContent = BxTemplFunctions::getInstance()->transBox($sPopupId, $this->_oTemplate->parseHtmlByName('favorite_edit_favorite_list.html', array(
            'style_prefix' => $this->_sStylePrefix,
                'js_object' => $this->getJsObjectName(),
                'form' => str_replace('{js_object}', $this->getJsObjectName(), $oForm->getCode()),
                'form_id' => $oForm->id,
        )));

        return array('popup' => $sPopupContent, 'popup_id' => $sPopupId);
    }

	protected function _getFavoritedBy()
    {
        $aTmplFavorites = array();

        $aFavorites = $this->_oQuery->getPerformedBy($this->getId());
        foreach($aFavorites as $aFavorite) {
            list($sUserName, $sUserUrl, $sUserIcon, $sUserUnit) = $this->_getAuthorInfo($aFavorite['author_id']);

            $aTmplFavorites[] = array(
                'style_prefix' => $this->_sStylePrefix,
                'user_unit' => $sUserUnit,
            );
        }

        if(empty($aTmplFavorites))
            $aTmplFavorites = MsgBox(_t('_Empty'));

        return $this->_oTemplate->parseHtmlByName('favorite_by_list.html', array(
            'style_prefix' => $this->_sStylePrefix,
            'bx_repeat:list' => $aTmplFavorites
        ));
    }

    protected function _isShowDoFavorite($aParams, $isAllowedFavorite, $bCount)
    {
        return (!isset($aParams['show_do_favorite']) || (bool)$aParams['show_do_favorite'] === true) && $isAllowedFavorite;
    }

    protected function _isShowCounter($aParams, $isAllowedFavorite, $isAllowedFavoriteView, $bCount)
    {
        return isset($aParams['show_counter']) && (bool)$aParams['show_counter'] === true && $isAllowedFavoriteView && ($isAllowedFavorite || $bCount);
    }
}

/** @} */
