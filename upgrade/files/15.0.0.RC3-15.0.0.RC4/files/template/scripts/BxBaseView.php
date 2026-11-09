<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * @see BxDolView
 */
class BxBaseView extends BxDolView
{
    protected $_sTmplNameByList;
    protected $_sTmplContentDoViewLabel;

    protected $_bCssJsAdded;
    protected $_sStylePrefix;
    protected $_sJsObjName;
    protected $_aHtmlIds;

    protected $_aElementDefaults;  

    public function __construct($sSystem, $iId, $iInit = 1)
    {
        parent::__construct($sSystem, $iId, $iInit);

        $this->_bCssJsAdded = false;

        $this->_sStylePrefix = 'bx-view';
        $this->_sJsObjName = 'oView' . bx_gen_method_name($sSystem, array('_' , '-')) . $iId;

        $sHtmlId = str_replace(array('_' , ' '), array('-', '-'), $sSystem) . '-' . $iId;
        $this->_aHtmlIds = array(
            'main' => 'bx-view-' . $sHtmlId,
            'counter' => 'bx-view-counter-' . $sHtmlId,
            'by_popup' => 'bx-view-by-popup-' . $sHtmlId
        );

        $this->_aElementDefaults = array(
            'show_do_view_as_button' => false,
            'show_do_view_as_button_small' => false,
            'show_do_view_icon' => true,
            'show_do_view_label' => false,
            'show_counter' => true,
            'show_counter_only' => true,
            'show_counter_label_icon' => false,
            'show_counter_label_text' => true,
            'show_script' => true
        );

        $this->_sTmplNameByList = 'view_by_list.html';
        $this->_sTmplContentElementBlock = $this->_oTemplate->getHtml('view_element_block.html');
        $this->_sTmplContentElementInline = $this->_oTemplate->getHtml('view_element_inline.html');
        $this->_sTmplContentCounter = $this->_oTemplate->getHtml('view_counter.html');
        $this->_sTmplContentCounterLabel = $this->_oTemplate->getHtml('view_counter_label.html');
        $this->_sTmplContentDoViewLabel = $this->_oTemplate->getHtml('view_do_view_label.html');
    }

    public function getJsObjectName()
    {
        return $this->_sJsObjName;
    }

    public function getJsScript($bDynamicMode = false)
    {
        $sJsObjName = $this->getJsObjectName();

        $aParams = array(
            'sObjName' => $sJsObjName,
            'sSystem' => $this->getSystemName(),
            'iAuthorId' => $this->_getAuthorId(),
            'iObjId' => $this->getId(),
            'sRootUrl' => BX_DOL_URL_ROOT,
            'sStylePrefix' => $this->_sStylePrefix,
            'aHtmlIds' => $this->_aHtmlIds
        );
        $sCode = "if(window['" . $sJsObjName . "'] == undefined) var " . $sJsObjName . " = new BxDolView(" . json_encode($aParams) . ");";

        return $this->_oTemplate->_wrapInTagJsCode($sCode);
    }

    public function getCounter($aParams = [])
    {
        $aParams = array_merge($this->_aElementDefaults, $aParams);

        $bDynamicMode = isset($aParams['dynamic_mode']) && $aParams['dynamic_mode'] === true;
        $bShowDoViewAsButtonSmall = isset($aParams['show_do_view_as_button_small']) && $aParams['show_do_view_as_button_small'] == true;
        $bShowDoViewAsButton = !$bShowDoViewAsButtonSmall && isset($aParams['show_do_view_as_button']) && $aParams['show_do_view_as_button'] == true;
        $bShowScript = !isset($aParams['show_script']) || $aParams['show_script'] == true;

        $bAllowedViewViewViewers = $this->isAllowedViewViewViewers();

        $sClass = 'sys-action-counter';
        if(isset($aParams['show_counter_only']) && (bool)$aParams['show_counter_only'] === true)
            $sClass .= ' sys-ac-only';

        $sClass .= ' ' . $this->_sStylePrefix . '-counter';
        if($bShowDoViewAsButtonSmall)
            $sClass .= ' bx-btn-small-height';
        if($bShowDoViewAsButton)
            $sClass .= ' bx-btn-height';

        $sContent = '';
        $aView = $this->_oQuery->getView($this->getId());
        if((int)$aView['count'] > 0)
            $sContent = $this->_getCounterLabel($aView['count'], $aParams);

        return $this->_oTemplate->parseHtmlByContent($this->_getTmplContentCounter(), array(
            'html_id' => $this->_aHtmlIds['counter'],
            'style_prefix' => $this->_sStylePrefix,
            'bx_if:show_text' => array(
                'condition' => !$bAllowedViewViewViewers,
                'content' => array(
                    'class' => $sClass,
                    'bx_repeat:attrs' => array(
                        array('key' => 'id', 'value' => $this->_aHtmlIds['counter']),
                    ),
                    'content' => $sContent
                )
            ),
            'bx_if:show_link' => array(
                'condition' => $bAllowedViewViewViewers,
                'content' => array(
                    'class' => $sClass,
                    'bx_repeat:attrs' => array(
                        array('key' => 'id', 'value' => $this->_aHtmlIds['counter']),
                        array('key' => 'href', 'value' => 'javascript:void(0)'),
                        array('key' => 'role', 'value' => 'button'),
                        array('key' => 'onclick', 'value' => 'javascript:' . $this->getJsObjectName() . '.toggleByPopup(this)'),
                        array('key' => 'title', 'value' => _t('_view_do_view_by'))
                    ),
                    'content' => $sContent
                )
            ),
            'script' => $bShowScript ? $this->getJsScript($bDynamicMode) : ''
        ));
    }

    public function getElementBlock($aParams = array())
    {
        $aParams['usage'] = BX_DOL_VIEW_USAGE_BLOCK;

        return $this->getElement($aParams);
    }

    public function getElementInline($aParams = array())
    {
        $aParams['usage'] = BX_DOL_VIEW_USAGE_INLINE;

        return $this->getElement($aParams);
    }

    public function getElement($aParams = array())
    {
    	$aParams = array_merge($this->_aElementDefaults, $aParams);
    	$bDynamicMode = isset($aParams['dynamic_mode']) && $aParams['dynamic_mode'] === true;

    	$bAllowedView = $this->isAllowedView();
    	$bAllowedViewView = $this->isAllowedViewView();

        $bShowDoView = !isset($aParams['show_do_view']) || $aParams['show_do_view'] == true;
        $bShowDoViewAsButtonSmall = isset($aParams['show_do_view_as_button_small']) && $aParams['show_do_view_as_button_small'] == true;
        $bShowDoViewAsButton = !$bShowDoViewAsButtonSmall && isset($aParams['show_do_view_as_button']) && $aParams['show_do_view_as_button'] == true;
        $bShowCounter = isset($aParams['show_counter']) && $aParams['show_counter'] === true && $bAllowedViewView;

        $iObjectId = $this->getId();
        $iAuthorId = $this->_getAuthorId();
        $aView = $this->_oQuery->getView($iObjectId);
        $bCount = (int)$aView['count'] != 0;

        if(!$bAllowedView && (!$bAllowedViewView || !$bCount))
            return '';

        //--- Do View
        $bTmplVarsDoView = $bShowDoView && ($bCount || $bAllowedView);
        $aTmplVarsDoView = array();
        if($bTmplVarsDoView)
            $aTmplVarsDoView = array(
                'style_prefix' => $this->_sStylePrefix,
                'do_view' => $this->_getDoView($aParams, $bAllowedView),
            );

        //--- Counter
        $bTmplVarsCounter = $bShowCounter && ($bCount || $bAllowedView);
        $aTmplVarsCounter = array();
        if($bTmplVarsCounter)
            $aTmplVarsCounter = array(
                'style_prefix' => $this->_sStylePrefix,
                'bx_if:show_hidden' => array(
                    'condition' => !$bCount,
                    'content' => array()
                ),
                'counter' => $this->getCounter(array_merge($aParams, [
                    'show_counter_only' => false,
                    'show_script' => false
                ]))
            );

        if(!$bTmplVarsDoView && !$bTmplVarsCounter)
            return '';

        $sTmplName = $this->{'_getTmplContentElement' . bx_gen_method_name(!empty($aParams['usage']) ? $aParams['usage'] : BX_DOL_VIEW_USAGE_DEFAULT)}();
        return $this->_oTemplate->parseHtmlByContent($sTmplName, array(
            'style_prefix' => $this->_sStylePrefix,
            'html_id' => $this->_aHtmlIds['main'],
            'class' => $this->_sStylePrefix . ($bShowDoViewAsButton ? '-button' : '') . ($bShowDoViewAsButtonSmall ? '-button-small' : ''),
            'count' => $aView['count'],
        	'bx_if:show_do_view' => array(
                    'condition' => $bTmplVarsDoView,
                    'content' => $aTmplVarsDoView
        	),
        	'bx_if:show_counter' => array(
                    'condition' => $bTmplVarsCounter,
                    'content' => $aTmplVarsCounter
                ),
            'script' => $this->getJsScript($bDynamicMode)
        ));
    }

    protected function _getDoView($aParams = array(), $bAllowedView = true)
    {
        $bShowDoViewAsButtonSmall = isset($aParams['show_do_view_as_button_small']) && $aParams['show_do_view_as_button_small'] == true;
        $bShowDoViewAsButton = !$bShowDoViewAsButtonSmall && isset($aParams['show_do_view_as_button']) && $aParams['show_do_view_as_button'] == true;
        $bDisabled = !$bAllowedView;

        $sClass = '';
        if($bShowDoViewAsButton)
            $sClass = 'bx-btn';
        else if ($bShowDoViewAsButtonSmall)
            $sClass = 'bx-btn bx-btn-small';

        if($bDisabled)
            $sClass .= $bShowDoViewAsButton || $bShowDoViewAsButtonSmall ? ' bx-btn-disabled' : 'bx-view-disabled';

        return $this->_oTemplate->parseLink('javascript:void(0)', $this->_getLabelDo($aParams), array(
            'class' => $this->_sStylePrefix . '-do-view ' . $sClass,
            'title' => _t('_view_do_view')
        ));
    }

    protected function _getCounterLabel($iCount, $aParams = array())
    {
        return $this->_oTemplate->parseHtmlByContent($this->_getTmplContentCounterLabel(), array(
            'style_prefix' => $this->_sStylePrefix,
            'bx_if:show_icon' => array(
                'condition' => !isset($aParams['show_counter_label_icon']) || $aParams['show_counter_label_icon'] === true,
                'content' => array(
                    'style_prefix' => $this->_sStylePrefix,
                    'icon' => isset($aParams['custom_icon']) && $aParams['custom_icon'] != '' ? $aParams['custom_icon'] : $this->_oTemplate->getImageAuto($this->_getIconDo())
                )
            ),
            'bx_if:show_text' => array(
                'condition' => !isset($aParams['show_counter_label_text']) || $aParams['show_counter_label_text'] === true,
                'content' => array(
                    'style_prefix' => $this->_sStylePrefix,
                    'text' => _t(isset($aParams['caption']) ? $aParams['caption'] : '_view_counter', $iCount)
                )
            )
        ));
    }

    protected function _getLabelDo($aParams = array())
    {
        return $this->_oTemplate->parseHtmlByContent($this->_sTmplContentDoViewLabel, array(
            'style_prefix' => $this->_sStylePrefix,
            'bx_if:show_icon' => array(
                'condition' => isset($aParams['show_do_view_icon']) && $aParams['show_do_view_icon'] == true,
                'content' => array(
                    'style_prefix' => $this->_sStylePrefix,
                    'icon' => $this->_oTemplate->getImageAuto($this->_getIconDo())
                )
            ),
            'bx_if:show_text' => array(
                'condition' => isset($aParams['show_do_view_label']) && $aParams['show_do_view_label'] == true,
                'content' => array(
                    'style_prefix' => $this->_sStylePrefix,
                    'text' => _t($this->_getTitleDo())
                )
            )
        ));
    }

    protected function _getViewedBy($iStart = 0, $iPerPage = 0)
    {
        if(empty($iPerPage))
            $iPerPage = $this->_aSystem['per_page_default'];

        $aUsers = $this->_oQuery->getPerformedBy($this->getId(), $iStart, $iPerPage + 1);

        $oPaginate = new BxTemplPaginate(array(
            'on_change_page' => $this->getJsObjectName() . '.getUsers(this, {start}, {per_page})',
            'start' => $iStart,
            'per_page' => $iPerPage,
        ));
        $oPaginate->setNumFromDataArray($aUsers);

        $aTmplUsers = array();
        foreach($aUsers as $aUser) {
            list($sUserName, $sUserUrl, $sUserIcon, $sUserUnit, $sUserUnitWoInfo) = $this->_getAuthorInfo($aUser['id']);

            $aTmplUsers[] = array(
                'style_prefix' => $this->_sStylePrefix,
                'user_unit' => $sUserUnitWoInfo,
                'user_url' => $sUserUrl,
            	'user_title' => bx_html_attribute($sUserName),
            	'user_name' => $sUserName,
                'bx_if:show_user_info' => array(
                    'condition' => (int)$aUser['id'] == 0 && (int)$aUser['count'] > 0,
                    'content' => array(
                        'style_prefix' => $this->_sStylePrefix,
                        'user_info' => _t('_view_do_view_by_counter', $aUser['count'])
                    )
                )
            );
        }

        if(empty($aTmplUsers))
            $aTmplUsers = MsgBox(_t('_Empty'));

        return $this->_oTemplate->parseHtmlByName($this->_sTmplNameByList, array(
            'style_prefix' => $this->_sStylePrefix,
            'bx_repeat:list' => $aTmplUsers,
            'paginate' => $oPaginate->getSimplePaginate()
        ));
    }
}

/** @} */
