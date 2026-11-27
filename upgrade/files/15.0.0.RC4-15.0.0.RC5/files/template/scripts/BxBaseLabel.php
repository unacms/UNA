<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Labels objects representation.
 * 
 * @see BxDolLabel
 */
class BxBaseLabel extends BxDolLabel
{
    protected $_oTemplate;

    protected $_sJsObjClass;
    protected $_sJsObjName;
    protected $_aHtmlIds;

    public function __construct($oTemplate = false)
    {
        parent::__construct();

        if($oTemplate)
            $this->_oTemplate = $oTemplate;
        else
            $this->_oTemplate = BxDolTemplate::getInstance();

        $this->_sJsObjClass = 'BxDolLabel';
        $this->_sJsObjName = 'oBxDolLabel';

        $this->_aHtmlIds = array(
            'labels_element' => 'sys-labels-',
            'labels_select_popup' => 'sys-labels-select-popup',
        );
    }

    public function getJsObjectName()
    {
        return $this->_sJsObjName;
    }

    public function getJsCodeForm($bDynamicMode = false)
    {
        return $this->getJsCode('form', $bDynamicMode);
    }

    public function getJsCodeView($bDynamicMode = false)
    {
        return $this->getJsCode('view', $bDynamicMode);
    }

    public function getJsCode($sType, $bDynamicMode = false)
    {
        if(!$bDynamicMode && bx_is_dynamic_request())
            $bDynamicMode = true;

        $sCodeObject = $this->_sJsObjName . " = new " . $this->_sJsObjClass . "(" . json_encode(array(
            'sObjName' => $this->_sJsObjName,
            'sRootUrl' => BX_DOL_URL_ROOT,
            'aHtmlIds' => $this->_aHtmlIds
        )) . ");";

        if($bDynamicMode) {
            $sCode = "var " . $this->_sJsObjName . " = null;";

            if($sType == 'form')
                $sCode .= "if(typeof(jQuery.ui.sortable) == 'undefined')
                    $.getScript('" . bx_js_string($this->_oTemplate->getJsUrl('jquery-ui/jquery-ui.min.js'), BX_ESCAPE_STR_APOS) . "');";

            $sCode .= "if(window['" . $this->_sJsObjName . "'] === null)
                $.getScript('" . bx_js_string($this->_oTemplate->getJsUrl('BxDolLabel.js'), BX_ESCAPE_STR_APOS) . "', function(data, textStatus, jqxhr) {
                    " . $sCodeObject . "
                });";
        }
        else
            $sCode = "if(window['" . $this->_sJsObjName . "'] == undefined) var " . $sCodeObject;

        return $this->addCssJs($sType, $bDynamicMode) . $this->_oTemplate->_wrapInTagJsCode($sCode);
    }

    protected function selectLabels($aValues = array())
    {
        $sJsObject = $this->getJsObjectName();

        $oForm = BxDolForm::getObjectInstance($this->_sForm, $this->_sFormDisplaySelect);
        $oForm->initChecker($aValues);

        if($oForm->isSubmittedAndValid()) {
            $sName = $oForm->getCleanValue('name');

            $aLabels = array();
            if(($aLabelsSearch = $oForm->getCleanValue('search')) !== false)
                $aLabels = array_merge($aLabels, $aLabelsSearch);

            if(($aLabelsList = $oForm->getCleanValue('list')) !== false)
                $aLabels = array_merge($aLabels, $aLabelsList);
            
            if(($aLabelsList = $oForm->getCleanValue('list_context')) !== false)
                $aLabels = array_merge($aLabels, $aLabelsList);

            $aLabels = array_unique($aLabels);

            $sLabels = '';
            if(!empty($aLabels) && is_array($aLabels))
                foreach($aLabels as $sLabel)
                    $sLabels .= $this->getLabel($sName, $sLabel);
        
            return array('eval' => $sJsObject . '.onSelectLabels(oData);', 'name' => $sName, 'content' => $sLabels);
        }

        $sContent = BxTemplFunctions::getInstance()->popupBox($this->_aHtmlIds['labels_select_popup'], _t('_sys_form_labels'), $this->_oTemplate->parseHtmlByName('label_select_popup.html', array(
            'js_object' => $sJsObject,
            'form' => $oForm->getCode(),
            'form_id' => $oForm->getId()
        )));

        return array('popup' => array('html' => $sContent, 'options' => array('closeOnOuterClick' => false)));
    }

    public function getLabel($sField, $sLabel)
    {
        return $this->_oTemplate->parseHtmlByName('label_select_field_item.html', [
            'class' => '',
            'bx_if:show_icon' => [
                'condition' => false,
                'content' => []
            ],
            'label' => $sLabel,
            'bx_if:show_input' => [
                'condition' => true,
                'content' => [
                    'label' => $sLabel,
                    'field' => $sField,
                ]
            ]
        ]);
    }

    public function getLabelPlaceholder($sPlaceholder)
    {
        return $this->_oTemplate->parseHtmlByName('label_select_field_item.html', [
            'class' => 'val-placeholder',
            'bx_if:show_icon' => [
                'condition' => true,
                'content' => []
            ],
            'label' => _t($sPlaceholder),
            'bx_if:show_input' => [
                'condition' => false,
                'content' => []
            ]
        ]);
    }

    /**
     * Get 'Browse Labels' block.
     */
    public function getLabelsBrowse($aParams = array())
    {
        $bShowEmpty = isset($aParams['show_empty']) ? (bool)$aParams['show_empty'] : false;

        $iParentId = $iLevel = 0;
        $sContent = $this->_getLabelsBrowse($iParentId, $iLevel);

        if(empty($sContent))
            return $bShowEmpty ? MsgBox(_t('_Empty')) : '';

        return $this->_oTemplate->parseHtmlByName('label_browse.html', array(
            'js_code' => $this->getJsCodeView(),
            'content' => $sContent
        ));
    }

    protected function _getLabelsBrowse($iParentId, $iLevel)
    {
        $aLabels = $this->getLabels(array('type' => 'parent', 'parent' => $iParentId));
        if(empty($aLabels) || !is_array($aLabels))
            return '';

        $sJsObject = $this->getJsObjectName();

        $aTmplVarsLabels = array();
        foreach($aLabels as $aLabel) {
            $sSublist = $this->_getLabelsBrowse($aLabel['id'], $iLevel + 1);
            $bSublist = !empty($sSublist);

            $aTmplVarsLabels[] = array(
                'href' => $this->getLabelUrl($aLabel['value']),
                'title' => $aLabel['value'],
                'title_attr' => bx_html_attribute($aLabel['value']),
                'bx_if:show_sublist_link' => array(
                    'condition' => $bSublist,
                    'content' => array(
                        'js_object' => $sJsObject,
                    )
                ),
                'bx_if:show_sublist' => array(
                    'condition' => $bSublist,
                    'content' => array(
                        'js_object' => $sJsObject,
                        'content' => $sSublist
                    ),
                )
            );
        }

        return $this->_oTemplate->parseHtmlByName('label_browse_level.html', array(
            'level' => $iLevel,
            'bx_repeat:labels' => $aTmplVarsLabels
        ));
    }

    /**
     * Get 'List' custom form element.
     */
    public function getLabelsList(&$aInput, &$oForm)
    {
        $bOpened = false;
        $iParentId = $iLevel = 0;
        $sContent = $this->_getLabelsList($iParentId, $iLevel, $bOpened, $aInput, $oForm);

        if(empty($sContent))
            $sContent = MsgBox(_t('_Empty'));

        return $this->_oTemplate->parseHtmlByName('label_select_list.html', array(
            'content' => $sContent
        ));
    }

    protected function _getLabelsList($iParentId, $iLevel, &$bOpened, &$aInput, &$oForm)
    {
        $aLabels = $this->getLabels(array('type' => 'parent', 'parent' => $iParentId));
        if(empty($aLabels) || !is_array($aLabels))
            return '';

        $sJsObject = $this->getJsObjectName();

        $bInputValue = !empty($aInput['value']) && is_array($aInput['value']);

        $aCheckbox = $aInput;
        $aCheckbox['type'] = 'checkbox';
        $aCheckbox['name'] .= '[]';

        $aTmplVarsLabels = array();
        foreach($aLabels as $aLabel) {
            $sHtmlId = 'sys_label_' . $aLabel['value'];
            $bChecked = $bInputValue && in_array($aLabel['value'], $aInput['value']);
            if($bChecked)
                $bOpened = true;

            $aCheckbox['value'] = $aLabel['value'];
            $aCheckbox['checked'] = $bChecked ? 1 : 0;
            $aCheckbox['attrs']['id'] = $sHtmlId;

            $bSublistOpened = false;
            $sSublist = $this->_getLabelsList($aLabel['id'], $iLevel + 1, $bSublistOpened, $aInput, $oForm);
            $bSublist = !empty($sSublist);

            if($bSublistOpened)
                $bOpened = true;

            $aTmplVarsLabels[] = array(
                'checkbox' => $oForm->genInputCheckbox($aCheckbox, true),
                'html_id_label' => $sHtmlId,
                'title' => $aLabel['value'],
                'title_attr' => bx_html_attribute($aLabel['value']),
                'bx_if:show_sublist_link' => array(
                    'condition' => $bSublist,
                    'content' => array(
                        'js_object' => $sJsObject,
                        'bx_if:show_class_opened' => array(
                            'condition' => $bSublistOpened,
                            'content' => array()
                        ), 
                        'bx_if:show_class_closed' => array(
                            'condition' => !$bSublistOpened,
                            'content' => array()
                        )
                    )
                ),
                'bx_if:show_sublist' => array(
                    'condition' => $bSublist,
                    'content' => array(
                        'js_object' => $sJsObject,
                        'bx_if:show_class_opened' => array(
                            'condition' => $bSublistOpened,
                            'content' => array()
                        ),
                        'content' => $sSublist
                    ),
                )
            );
        }

        return $this->_oTemplate->parseHtmlByName('label_select_list_level.html', array(
            'level' => $iLevel,
            'bx_repeat:labels' => $aTmplVarsLabels
        ));
    }
    
    /**
     * Get "Contexts' List" custom form element.
     */
    public function getLabelsListContext(&$aInput, &$oForm)
    {
        $iProfileId = bx_get_logged_profile_id();
        $sJsObject = $this->getJsObjectName();

        $bInputValue = !empty($aInput['value']) && is_array($aInput['value']);

        $aCheckbox = $aInput;
        $aCheckbox['type'] = 'checkbox';
        $aCheckbox['name'] .= '[]';

        $aLabels = $this->getLabelsContext($iProfileId);

        $aTmplVarsLabels = [];
        foreach($aLabels as $aLabel) {
            $sLabelValue = $aLabel['value'];

            $sHtmlId = 'sys_label_' . $sLabelValue;
            $bChecked = $bInputValue && in_array($sLabelValue, $aInput['value']);

            $aCheckbox['value'] = $sLabelValue;
            $aCheckbox['checked'] = $bChecked ? 1 : 0;
            $aCheckbox['attrs']['id'] = $sHtmlId;

            $aTmplVarsLabels[] = [
                'checkbox' => $oForm->genInput($aCheckbox),
                'html_id_label' => $sHtmlId,
                'title' => $sLabelValue,
                'title_attr' => bx_html_attribute($sLabelValue),
                'bx_if:show_sublist_link' => [
                    'condition' => false,
                    'content' => []
                ],
                'bx_if:show_sublist' => [
                    'condition' => false,
                    'content' => [],
                ]
            ];
        }

        $sContent = $this->_oTemplate->parseHtmlByName('label_select_list_level.html', [
            'level' => 0,
            'bx_repeat:labels' => $aTmplVarsLabels
        ]);

        if(empty($sContent))
            $sContent = MsgBox(_t('_Empty'));

        return $this->_oTemplate->parseHtmlByName('label_select_list.html', [
            'content' => $sContent
        ]);
    }
    

    public function addCssJs($sType, $bDynamicMode = false)
    {
        if(!$bDynamicMode && bx_is_dynamic_request())
            $bDynamicMode = true;

        $sInclude = '';
        $bTypeForm = $sType == 'form';

        if(!$bDynamicMode) {
            if($bTypeForm)
                $this->_oTemplate->addJs(array(
                    'jquery-ui/jquery-ui.min.js',
                ));

            $this->_oTemplate->addJs(array(
                'BxDolLabel.js'
            ));
        }

        if($bTypeForm)
            $sInclude .= $this->_oTemplate->addCss(array(
                'forms.css', 
            ), $bDynamicMode);

        $sInclude .= $this->_oTemplate->addCss(array(
            'label.css'
        ), $bDynamicMode);

        return $bDynamicMode ? $sInclude : '';
    }
}

/** @} */
