<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioForms extends BxDolStudioForms
{
    protected $sSubpageUrl;
    protected $aMenuItems;
    protected $aGridObjects;

    function __construct($sPage = '')
    {
        parent::__construct($sPage);

        $this->sSubpageUrl = BX_DOL_URL_STUDIO . 'builder_forms.php?page=';

        $this->aMenuItems = [
            BX_DOL_STUDIO_FORM_TYPE_FORMS => ['icon' => 'mi-frm-forms.svg'],
            BX_DOL_STUDIO_FORM_TYPE_DISPLAYS => ['icon' => 'mi-frm-displays.svg'],
            BX_DOL_STUDIO_FORM_TYPE_FIELDS => ['icon' => 'mi-frm-fields.svg'],
            BX_DOL_STUDIO_FORM_TYPE_PRE_LISTS => ['icon' => 'mi-frm-plists.svg'],
            BX_DOL_STUDIO_FORM_TYPE_PRE_VALUES => ['icon' => 'mi-frm-pvalues.svg'],
            BX_DOL_STUDIO_FORM_TYPE_SEARCH_FORMS => ['icon' => 'mi-frm-sforms.svg'],
            BX_DOL_STUDIO_FORM_TYPE_SEARCH_FIELDS => ['icon' => 'mi-frm-sfields.svg'],
            BX_DOL_STUDIO_FORM_TYPE_SEARCH_SORTABLE_FIELDS => ['icon' => 'mi-frm-ssfields.svg'],
            BX_DOL_STUDIO_FORM_TYPE_LABELS => ['icon' => 'mi-frm-labels.svg'],
            BX_DOL_STUDIO_FORM_TYPE_CATEGORIES => ['icon' => 'mi-frm-categories.svg'],
            BX_DOL_STUDIO_FORM_TYPE_GROUPS_ROLES => ['icon' => 'mi-frm-groles.svg'],
        ];

        $this->aGridObjects = array(
            'forms' => 'sys_studio_forms',
            'displays' => 'sys_studio_forms_displays',
            'fields' => 'sys_studio_forms_fields',
            'pre_lists' => 'sys_studio_forms_pre_lists',
            'pre_values' => 'sys_studio_forms_pre_values',
            'search_forms' => 'sys_studio_search_forms',
            'search_fields' => 'sys_studio_search_forms_fields',
            'search_sortable_fields' => 'sys_studio_search_forms_sortable_fields',
            'labels' => 'sys_studio_labels',
            'categories' => 'sys_studio_categories',
            'groups_roles' => 'sys_studio_groups_roles',
    	);
    }

    function getPageCss()
    {
        return array_merge(parent::getPageCss(), array('forms.css', 'paginate.css', 'builder_forms.css'));
    }

    function getPageJs()
    {
        return array_merge(parent::getPageJs(), array());
    }

    function getPageJsObject()
    {
        return '';
    }

    function getPageMenu($aMenu = [], $aMarkers = [])
    {
        $sJsObject = $this->getPageJsObject();

        // A page that is a step of a list (a form's displays and their fields, a data list's items, a search form's
        // fields) is reached through that list's breadcrumbs when their grids are drawn by AG Grid, so it is no page of
        // its own in the menu then, and the list stays selected on it. Its URL still works.
        $aMenuItems = $this->aMenuItems;
        $aStepOf = [];
        foreach($this->getListSteps() as $sList => $aSteps) {
            if(!$this->isGridsAg(array_merge([$sList], $aSteps)))
                continue;

            foreach($aSteps as $sStep) {
                unset($aMenuItems[$sStep]);
                $aStepOf[$sStep] = $sList;
            }
        }

        $aMenu = [];
        foreach($aMenuItems as $sMenuItem => $aItem)
            $aMenu[] = [
                'name' => $sMenuItem,
                'icon' => $aItem['icon'],
                'icon_bg' => true,
                'link' => $this->sSubpageUrl . $sMenuItem,
                'title' => _t('_adm_lmi_cpt_' . $sMenuItem),
                'selected' => $sMenuItem == $this->sPage || ($aStepOf[$this->sPage] ?? '') === $sMenuItem
            ];

        return parent::getPageMenu($aMenu);
    }

    /**
     * The lists and the pages that are steps under them, by page name.
     */
    protected function getListSteps()
    {
        return [
            BX_DOL_STUDIO_FORM_TYPE_FORMS => [BX_DOL_STUDIO_FORM_TYPE_DISPLAYS, BX_DOL_STUDIO_FORM_TYPE_FIELDS],
            BX_DOL_STUDIO_FORM_TYPE_PRE_LISTS => [BX_DOL_STUDIO_FORM_TYPE_PRE_VALUES],
            BX_DOL_STUDIO_FORM_TYPE_SEARCH_FORMS => [BX_DOL_STUDIO_FORM_TYPE_SEARCH_FIELDS, BX_DOL_STUDIO_FORM_TYPE_SEARCH_SORTABLE_FIELDS],
        ];
    }

    protected function isGridsAg($aPages)
    {
        foreach($aPages as $sPage)
            if(empty($this->aGridObjects[$sPage]) || BxDolGridQuery::getGridEngine($this->aGridObjects[$sPage]) !== 'ag')
                return false;

        return true;
    }

    function actionGetForms()
    {
        if(($sModule = bx_get('form_module')) === false)
            return array('code' => 2, 'message' => _t('_adm_form_err_missing_params'));

        $sModule = bx_process_input($sModule);
        return array('code' => 0, 'message' => '', 'content' => $this->getDisplaysObject()->getFormsSelector($sModule));
    }

    function actionGetDisplays()
    {
        if(($sModule = bx_get('form_module')) === false)
            return array('code' => 2, 'message' => _t('_adm_form_err_missing_params'));

        $sModule = bx_process_input($sModule);
        return array('code' => 0, 'message' => '', 'content' => $this->getFieldsObject()->getDisplaysSelector($sModule));
    }

    function actionGetLists()
    {
        if(($sModule = bx_get('form_module')) === false)
            return array('code' => 2, 'message' => _t('_adm_form_err_missing_params'));

        $sModule = bx_process_input($sModule);
        return array('code' => 0, 'message' => '', 'content' => $this->getPreValuesObject()->getListsSelector($sModule));
    }
	
    function actionGetSearchForms()
    {
        if(($sModule = bx_get('form_module')) === false)
            return array('code' => 2, 'message' => _t('_adm_form_err_missing_params'));

        $sModule = bx_process_input($sModule);
        return array('code' => 0, 'message' => '', 'content' => $this->getSearchFieldsObject()->getFormsSelector($sModule));
    }
    
    function actionGetSearchSortableForms()
    {
        if(($sModule = bx_get('form_module')) === false)
            return array('code' => 2, 'message' => _t('_adm_form_err_missing_params'));

        $sModule = bx_process_input($sModule);
        return array('code' => 0, 'message' => '', 'content' => $this->getSearchSortableFieldsObject()->getFormsSelector($sModule));
    }

    function actionGetLabels()
    {
        if(($sModule = bx_get('form_module')) === false)
            return array('code' => 2, 'message' => _t('_adm_form_err_missing_params'));

        $sModule = bx_process_input($sModule);
        return array('code' => 0, 'message' => '', 'content' => $this->getLabelsObject()->getFormsSelector($sModule));
    }

    protected function getForms()
    {
        return $this->getGrid($this->aGridObjects['forms']);
    }

    protected function getFormsObject()
    {
        return $this->getGridObject($this->aGridObjects['forms']);
    }

    protected function getDisplays()
    {
        return $this->getGrid($this->aGridObjects['displays']);
    }

    protected function getDisplaysObject()
    {
        return $this->getGridObject($this->aGridObjects['displays']);
    }

    protected function getFields()
    {
        return $this->getGrid($this->aGridObjects['fields']);
    }

    protected function getFieldsObject()
    {
        return $this->getGridObject($this->aGridObjects['fields']);
    }

    protected function getPreLists()
    {
        return $this->getGrid($this->aGridObjects['pre_lists']);
    }

    protected function getPreValues()
    {
        return $this->getGrid($this->aGridObjects['pre_values']);
    }

    protected function getPreValuesObject()
    {
        return $this->getGridObject($this->aGridObjects['pre_values']);
    }

    protected function getSearchForms()
    {
        return $this->getGrid($this->aGridObjects['search_forms']);
    }

    protected function getSearchFormsObject()
    {
        return $this->getGridObject($this->aGridObjects['search_forms']);
    }

    protected function getSearchFields()
    {
        return $this->getGrid($this->aGridObjects['search_fields']);
    }
    
    protected function getSearchSortableFields()
    {
        return $this->getGrid($this->aGridObjects['search_sortable_fields']);
    }

    protected function getSearchFieldsObject()
    {
        return $this->getGridObject($this->aGridObjects['search_fields']);
    }
    
    protected function getSearchSortableFieldsObject()
    {
        return $this->getGridObject($this->aGridObjects['search_sortable_fields']);
    }

    protected function getLabels()
    {
        return $this->getGrid($this->aGridObjects['labels']);
    }

    protected function getLabelsObject()
    {
        return $this->getGridObject($this->aGridObjects['labels']);
    }
    
    protected function getCategories()
    {
        return $this->getGrid($this->aGridObjects['categories']);
    }

    protected function getCategoriesObject()
    {
        return $this->getGridObject($this->aGridObjects['categories']);
    }

    protected function getGroupsRoles()
    {
        return $this->getGrid($this->aGridObjects['groups_roles']);
    }

    protected function getGroupsRolesObject()
    {
        return $this->getGridObject($this->aGridObjects['groups_roles']);
    }

    protected function getGridObject($sObjectName)
    {
        $oGrid = BxDolGrid::getObjectInstance($sObjectName);
        if(!$oGrid)
            return '';

        return $oGrid;
    }

    protected function getGrid($sObjectName)
    {
        $oGrid = BxDolGrid::getObjectInstance($sObjectName);
        if(!$oGrid)
            return '';

        return BxDolStudioTemplate::getInstance()->parseHtmlByName('forms.html', array(
            'js_object' => $this->getPageJsObject(),
            'content' => $oGrid->getCode()
        ));
    }

    protected function actionValuesList()
    {
        if(($sList = bx_get('form_list')) === false)
            return array();

        $sList = bx_process_input($sList);
        $bUseForSets = (int)bx_get('form_use_for_sets') == 1;

        $aValues = BxDolForm::getDataItems(trim($sList, BX_DATA_LISTS_KEY_PREFIX . ' '), $bUseForSets);

        $aTmplVars = array(
            array('value' => '', 'title' => _t('_adm_form_txt_field_value_select_value'))
        );
        foreach($aValues as $mixedValue => $sTitle)
            $aTmplVars[] = array('value' => $mixedValue, 'title' => $sTitle);

        return array('content' => BxDolStudioTemplate::getInstance()->parseHtmlByName('forms_select.html', array('bx_repeat:options' => $aTmplVars)));
    }
}

/** @} */
