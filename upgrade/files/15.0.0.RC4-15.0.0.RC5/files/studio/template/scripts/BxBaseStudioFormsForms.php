<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioFormsForms extends BxDolStudioFormsForms
{
    protected $_bFilterModuleInUrl = true;
    protected $_sFilter;

    protected $sUrlViewDisplays;

    function __construct($aOptions, $oTemplate = false)
    {
        parent::__construct($aOptions, $oTemplate);

        $this->_aOptions['actions_single']['edit']['attr']['title'] = _t('_adm_form_btn_forms_edit');

        $this->_sFilter = '';
        if(($sFilter = $this->_getFilterValue()))
            $this->_sFilter = $sFilter;

        $this->sUrlViewDisplays = BX_DOL_URL_STUDIO . 'builder_forms.php?page=displays&module=%s&object=%s';
    }

    public function performActionEdit()
    {
        $sAction = 'edit';

        $aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds)) {
            $iId = (int)bx_get('id');
            if(!$iId) {
                echoJson(array());
                exit;
            }

            $aIds = array($iId);
        }

        $iId = $aIds[0];

        $aFormData = array();
        $iFormData = $this->oDb->getForms(array('type' => 'by_id', 'value' => $iId), $aFormData);
        if($iFormData != 1 || empty($aFormData)){
            echoJson(array());
            exit;
        }

        bx_import('BxTemplStudioFormView');

        $aForm = array(
            'form_attrs' => array(
                'id' => 'adm-form-form-edit',
                'action' => BX_DOL_URL_ROOT . bx_append_url_params('grid.php', [
                    'o' => $this->_sObject, 
                    'a' => $sAction, 
                    $this->_aOptions['filter_get'] => $this->_sFilter
                ]),
                'method' => BX_DOL_STUDIO_METHOD_DEFAULT
            ),
            'params' => array (
                'db' => array(
                    'table' => 'sys_objects_form',
                    'key' => 'id',
                    'uri' => '',
                    'uri_title' => '',
                    'submit_name' => 'do_submit'
                ),
            ),
            'inputs' => array (
                'id' => array(
                    'type' => 'hidden',
                    'name' => 'id',
                    'value' => $iId,
                    'db' => array (
                        'pass' => 'Int',
                    ),
                ),
                'title' => array(
                    'type' => 'text_translatable',
                    'name' => 'title',
                    'caption' => _t('_adm_form_txt_forms_title'),
                    'info' => _t('_adm_form_dsc_forms_title'),
                    'value' => $aFormData['title'],
                    'required' => '1',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                    'checker' => array (
                        'func' => 'LengthTranslatable',
                        'params' => array(3,100, 'title'),
                        'error' => _t('_adm_form_err_forms_title'),
                    ),
                ),
                'controls' => array(
                    'name' => 'controls',
                    'type' => 'input_set',
                    array(
                        'type' => 'submit',
                        'name' => 'do_submit',
                        'value' => _t('_adm_form_btn_forms_save'),
                    ),
                    array (
                        'type' => 'reset',
                        'name' => 'close',
                        'value' => _t('_adm_form_btn_forms_cancel'),
                        'attrs' => array(
                            'onclick' => "$('.bx-popup-applied:visible').dolPopupHide()",
                            'class' => 'bx-def-margin-sec-left',
                        ),
                    )
                )
            )
        );

        $oForm = new BxTemplStudioFormView($aForm);
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            if($oForm->update($iId) !== false)
                $aRes = array('grid' => $this->getCode(false), 'blink' => $iId);
            else
                $aRes = array('msg' => _t('_adm_form_err_forms_edit'));

            echoJson($aRes);
        }
        else {
            $sContent = BxTemplStudioFunctions::getInstance()->popupBox('adm-form-forms-edit-popup', _t('_adm_form_txt_forms_edit_popup', _t($aFormData['title'])), $this->_oTemplate->parseHtmlByName('form_add_form.html', array(
                'form_id' => $aForm['form_attrs']['id'],
                'form' => $oForm->getCode(true),
                'object' => $this->_sObject,
                'action' => $sAction
            )));

            echoJson(array('popup' => array('html' => $sContent, 'options' => array('closeOnOuterClick' => false))));
        }
    }

    function getJsObject()
    {
        return 'oBxDolStudioFormsForms';
    }

    protected $_sAgDisplaysObject = 'sys_studio_forms_displays'; ///< the grid whose rows an opened form row lists
    protected $_sAgFieldsObject = 'sys_studio_forms_fields'; ///< the grid whose rows an opened display lists
    protected $_aAgExpands = null; ///< which levels open, once asked (_agExpands)

    function getCode($isDisplayHeader = true)
    {
        $aExpands = $this->_agExpands();

        return $this->_oTemplate->parseHtmlByName('forms_forms.html', array(
            'content' => parent::getCode($isDisplayHeader),
            'js_object' => $this->getJsObject(),
            'grid_object' => $this->_sObject,
            'params_divider' => $this->sParamsDivider,
            // The opened rows' actions run the scripts of the displays' and the fields' own pages.
            'bx_if:expand_displays' => array(
                'condition' => $aExpands['displays'],
                'content' => array(
                    'displays_grid_object' => $this->_sAgDisplaysObject,
                    'params_divider' => $this->sParamsDivider,
                ),
            ),
            'bx_if:expand_fields' => array(
                'condition' => $aExpands['fields'],
                'content' => array(
                    'fields_grid_object' => $this->_sAgFieldsObject,
                    'params_divider' => $this->sParamsDivider,
                ),
            ),
        ));
    }

    /**
     * A form row opens onto its displays, and a display onto its fields, only while the grids are drawn by AG Grid:
     * the opened rows are drawn with the columns of the displays' and the fields' grids.
     */
    protected function _agExpands()
    {
        if($this->_aAgExpands === null) {
            $fAg = function($sObject) {
                return BxDolGridQuery::getGridEngine($sObject) === 'ag';
            };

            $bDisplays = $this->_isAgEngine() && $fAg($this->_sAgDisplaysObject);
            $this->_aAgExpands = [
                'displays' => $bDisplays,
                'fields' => $bDisplays && $fAg($this->_sAgFieldsObject),
            ];
        }

        return $this->_aAgExpands;
    }

    protected function _agRowMeta($aRow)
    {
        return [
            'object' => isset($aRow['object']) ? (string)$aRow['object'] : '',
            'module' => isset($aRow['module']) ? (string)$aRow['module'] : '',
        ];
    }

    protected function _agExtraConfig()
    {
        $aExpands = $this->_agExpands();
        if(!$aExpands['displays'])
            return [];

        // Inside a form the module and the form are known: their columns are left out.
        $fColumns = function($sObject, $aSkip) {
            $oGrid = BxDolGrid::getObjectInstance($sObject, $this->_oTemplate);
            $aColumns = $oGrid && method_exists($oGrid, 'getAgColumns') ? $oGrid->getAgColumns() : [];

            return array_values(array_filter($aColumns, function($aColumn) use($aSkip) {
                return !in_array($aColumn['name'] ?? '', $aSkip);
            }));
        };

        $aExpand = [
            'object' => $this->_sAgDisplaysObject,
            'field_id' => '_id', // _agRow
            'params' => ['module' => 'module', 'object' => 'object'],
            'require' => 'object',
            'columns' => $fColumns($this->_sAgDisplaysObject, ['module', 'form_title']),
        ];

        if($aExpands['fields'])
            $aExpand['expand'] = [
                'object' => $this->_sAgFieldsObject,
                'field_id' => '_id', // _agRow
                'params' => ['module' => 'module', 'object' => 'object', 'display' => 'display_name'],
                'require' => 'display_name',
                'columns' => $fColumns($this->_sAgFieldsObject, ['module']),
            ];

        return ['expand' => $aExpand];
    }

    protected function _addJsCss()
    {
        parent::_addJsCss();
        $this->_oTemplate->addJs(array('jquery.form.min.js', 'forms_forms.js'));

        $aExpands = $this->_agExpands();
        if($aExpands['displays'])
            $this->_oTemplate->addJs('forms_displays.js');
        if($aExpands['fields']) {
            $this->_oTemplate->addCss('menu.css');
            $this->_oTemplate->addJs('forms_fields.js');
        }

        $oForm = new BxTemplStudioFormView(array());
        $oForm->addCssJs();
    }

    protected function _getCellModule($mixedValue, $sKey, $aField, $aRow)
    {
        $mixedValue = $this->_limitMaxLength($this->getModuleTitle($aRow['module']), $sKey, $aField, $aRow, $this->_isDisplayPopupOnTextOverflow);
        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellDisplays ($mixedValue, $sKey, $aField, $aRow)
    {
        $aDisplayes = array();
        $this->oDb->getDisplays(array('type' => 'by_object', 'value' => $aRow['object']), $aDisplayes, false);

        $sLink = sprintf($this->sUrlViewDisplays, $aRow['module'], $aRow['object']);
        $mixedValue = $this->_oTemplate->parseLink($sLink, _t('_adm_form_txt_forms_n_displays', count($aDisplayes)), array(
            'title' => _t('_adm_form_txt_forms_manage_displays') 
        ));

        return parent::_getCellDefault ($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getFilterControls ()
    {
        parent::_getFilterControls();

        $sModule = $this->_getFilterModule();

        // Forms > module > form: a form leads to its displays.
        $aNext = [];
        if($sModule !== '')
            $aNext[] = ['label' => _t('_adm_form_txt_displays_gl_form'), 'control' => $this->_getCrumbGoSelect('form', '', $this->_getCrumbForms($sModule), BX_DOL_URL_STUDIO . 'builder_forms.php?page=displays&module=' . rawurlencode($sModule) . '&object=')];

        return $this->getCrumbsOfList(BX_DOL_URL_STUDIO . 'builder_forms.php?page=forms', $sModule, $this->_getCrumbModules('getForms', '_adm_form_txt_all_modules', false), $aNext) . $this->getSearchInput();
    }
}

/** @} */
