<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Grid representation.
 * @see BxDolGrid
 */
class BxBaseGrid extends BxDolGrid
{
    protected $_oTemplate;
    protected $_oFunctions;
    protected $_aPopupOptions = false;
    protected $_sPaginateType; // default (empty value), simple, load_more
    protected $_aQueryAppend = [];
    protected $_aQueryAppendExclude = false; // an array of keys which shouldn't be pathed in http requests, but can be stored (used) in 'Query Append' array.
    protected $_aQueryAppendExcludeApi = false;
    protected $_aQueryReset = false;
    protected $_aConfirmMessages = false;
    protected $_bSelectAll = false;
    protected $_isDisplayPopupOnTextOverflow = true;

    /**
     * A text cell (a field with `chars_limit` in `sys_grid_fields`: the characters that fit one line of its column)
     * wraps in its column and shows two lines (css/grid.css, .bx-grid-cell-clamp). Where the two lines don't hold the
     * text, pointing at it shows it in full (its `title`; BxDolGrid.js, markClampedCells). The text itself is cut only
     * past this many lines' worth of characters, far beyond what two lines of any column show.
     */
    protected $_iCharsLimitLinesMax = 6;
    protected $_fTextColumnsScale = null; ///< what the text columns' percent widths are multiplied by, see _getTextColumnsScale
    protected $_sCellClampText = ''; ///< the full text of the cell being built, when it is longer than one line: _getCellDefault wraps it
    protected $_aFilterAreaLabels = []; // filter name => accessible name (lang key or plain text); filter controls are rendered without a visible caption

    public function __construct ($aOptions, $oTemplate)
    {
        parent::__construct ($aOptions);

        if ($oTemplate)
            $this->_oTemplate = $oTemplate;
        else
            $this->_oTemplate = BxDolTemplate::getInstance();

        $this->_oFunctions = BxTemplFunctions::getInstanceWithTemplate($this->_oTemplate);

        $this->_aPopupOptions = [];
        $this->_sPaginateType = '';

        $this->_aQueryAppend = [
            $this->_oTemplate->getCodeKey() => $this->_oTemplate->getCode()
        ];
        $this->_aQueryAppendExclude = [];
        $this->_aQueryAppendExcludeApi = [$this->_oTemplate->getCodeKey()];

        $this->_aQueryReset = [
            $this->_aOptions['filter_get'], 
            $this->_aOptions['order_get_field'], 
            $this->_aOptions['order_get_dir'], 
            $this->_aOptions['paginate_get_start'], 
            $this->_aOptions['paginate_get_per_page']
        ];

        $this->_aConfirmMessages = [];
    }

    public function performActionDisplay()
    {
        if($this->_bIsApi)
            return $this->getCodeAPI();

        require_once(BX_DIRECTORY_PATH_INC . "design.inc.php");

        echoJson([
            'grid' => $this->getCode(false), 
            'total_count' => $this->_iTotalCount,
            'total_count_f' => $this->_getCounter()
        ]);
    }

    /**
     * Rows for an AG Grid (engine 'ag'): the same page, filter and order as the classic grid,
     * cells in the shape decodeDataAPI already returns. The request itself stays a web request.
     */
    public function performActionDataAg()
    {
        echoJson($this->_getDataAg());
    }

    public function performActionLoadMore()
    {
        $this->performActionDisplay();
    }

    public function performActionReorder()
    {
        $this->_replaceMarkers ();

        $aOrder = bx_get($this->_sObject . '_row');
        $iOrder = 0;
        foreach ($aOrder as $mixedId)
            $this->_updateOrder($mixedId, ++$iOrder);

        return $this->_getActionResult([]);
    }

    public function performActionDelete()
    {
        $this->_replaceMarkers ();

        $aResult = [];
        $iAffected = 0;
        $aIds = bx_get('ids');
        if (!$aIds || !is_array($aIds))
            return $this->_getActionResult($aResult);

        foreach ($aIds as $mixedId)
            $iAffected += $this->_delete($mixedId) ? 1 : 0;

        if($iAffected)
            $aResult = !$this->_bIsApi ? ['grid' => $this->getCode(false)] : [];
        else
            $aResult = ['msg' => _t("_sys_grid_delete_failed")];

        return $this->_getActionResult($aResult);
    }

    public function performActionEnable($mixedChecked = null)
    {
        $this->_replaceMarkers ();

        $aIds = bx_get('ids');
        if (!$aIds || !is_array($aIds)) {
            echoJson(array());
            exit;
        }

        $iChecked = (int)($mixedChecked !== null ? $mixedChecked : bx_get('checked'));
        
        $aAffectedIds = array ();
        foreach ($aIds as $mixedId)
            if ($this->_enable($mixedId, $iChecked))
                $aAffectedIds[] = preg_match("/^[\d\w]+$/", $mixedId) ? $mixedId : (int)$mixedId;

        $sAction = $iChecked ? 'enable' : 'disable';

        if($this->_bIsApi)
            return $aAffectedIds;

        echo echoJson(array($sAction => $aAffectedIds));
    }

    /**
     * Show or hide rows in the apps: the 'switcher_api' column turns 'field_active_api' on and off.
     * A grid without that option or without that column refuses it.
     */
    public function performActionEnableApi($mixedChecked = null)
    {
        $this->_replaceMarkers ();

        $aIds = bx_get('ids');
        if (!$this->_isSwitcherApiAvailable() || !$aIds || !is_array($aIds)) {
            if($this->_bIsApi)
                return [];

            echoJson([]);
            return;
        }

        $iChecked = (int)($mixedChecked !== null ? $mixedChecked : bx_get('checked'));

        $aAffectedIds = [];
        foreach ($aIds as $mixedId)
            if ($this->_enableApi($mixedId, $iChecked))
                $aAffectedIds[] = preg_match("/^[\d\w]+$/", $mixedId) ? $mixedId : (int)$mixedId;

        if($this->_bIsApi)
            return $aAffectedIds;

        echoJson([($iChecked ? 'enable_api' : 'disable_api') => $aAffectedIds]);
    }

    public function performActionRevealSecret()
    {
        $this->_replaceMarkers();

        if (!isLogged())
            return $this->_getActionResult(['msg' => _t('_Access denied')]);

        if (!$this->_isCurrentPasswordValid(bx_get('password')))
            return $this->_getActionResult(['msg' => _t('_sys_form_account_input_password_current_error')]);

        $aIds = bx_get('ids');
        $sKey = bx_process_input(bx_get('field'));
        $mixedId = is_array($aIds) && $aIds ? reset($aIds) : false;

        if ($mixedId === false || $sKey === false || $sKey === '' || empty($this->_aOptions['fields'][$sKey]))
            return $this->_getActionResult(['msg' => _t('_sys_txt_error_occured')]);

        $aRow = $this->_getSecretRow($mixedId);
        if (!$aRow)
            return $this->_getActionResult(['msg' => _t('_sys_txt_error_occured')]);

        return $this->_getActionResult([
            'secret' => [
                'id' => $mixedId,
                'field' => $sKey,
                'value' => $this->_getSecretValue($mixedId, $sKey, $aRow),
            ]
        ]);
    }

    public function getCode ($isDisplayHeader = true)
    {
        // 'ag' is drawn by AG Grid. Every other engine, including empty, keeps the HTML grid below.
        if ($this->_isAgEngine())
            return $this->_getCodeAg($isDisplayHeader);

        $this->_replaceMarkers ();

        if ($isDisplayHeader && empty($this->_aOptions['paginate_url'])) {
            // reset page query params if grid is just initialized and it uses AJAX paginate
            $this->resetQueryParams();
        }

        $sPaginate = '';
        $aData = array();

        $sIdWrapper = 'bx-grid-wrap-' . $this->_sObject;
        $sIdContainer = 'bx-grid-cont-' . $this->_sObject;
        $sIdTable = 'bx-grid-table-' . $this->_sObject;

        $sFilter = $this->_getFilterValue();
        $sOrderField = $this->_getOrderValue();
        $sOrderDir = 0 === strcasecmp('desc', bx_get($this->_aOptions['order_get_dir'])) ? 'DESC' : 'ASC';

        $iStart = 0;
        if($this->_aOptions['paginate_get_start'] && ($iStartGet = (int)bx_get($this->_aOptions['paginate_get_start'])) >= 0)
            $iStart = $iStartGet;

        $iPerPage = 10;
        if($this->_aOptions['paginate_get_per_page'] && ($iPerPageGet = (int)bx_get($this->_aOptions['paginate_get_per_page'])) > 0)
            $iPerPage = $iPerPageGet;
        else if($this->_aOptions['paginate_per_page'])
            $iPerPage = (int)$this->_aOptions['paginate_per_page'];            

        if ($this->_aOptions['paginate_get_start']) {

            $aData = $this->_getData ($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage + 1);

            $sPageUrl = false;
            if (!empty($this->_aOptions['paginate_url'])) {

                $sPageUrl = $this->_aOptions['paginate_url'];

                $aParamsAppend = array();
                if ($sFilter) {
                    $aParamsAppend['filter'] = bx_process_input(bx_get($this->_aOptions['filter_get']));
                }
                if ($sOrderField) {
                    $aParamsAppend['order_field'] = bx_process_input(bx_get($this->_aOptions['order_get_field']));
                    $aParamsAppend['order_dir'] = bx_process_input(bx_get($this->_aOptions['order_get_dir']));
                }
                if ($aParamsAppend)
                    $sPageUrl = bx_append_url_params($sPageUrl, $aParamsAppend);
            }

            $aPaginateParams = [
                'start' => $iStart,
                'per_page' => $iPerPage,
                'page_url' =>  $sPageUrl ? $sPageUrl : "javascript:glGrids." . $this->_sObject . "." . ($this->_sPaginateType == 'load_more' ? 'loadMore' : 'reload') . "('{start}'); void(0);",
            ];

            $oPaginate = new BxTemplPaginate($aPaginateParams, $this->_oTemplate);
            $oPaginate->setNumFromDataArray($aData);

            if (isset($this->_aOptions['paginate_simple']) && false !== $this->_aOptions['paginate_simple'])
                $sPaginate = $oPaginate->getSimplePaginate($this->_aOptions['paginate_simple']);
            else
                $sPaginate = $oPaginate->{'get' . bx_gen_method_name($this->_sPaginateType) . 'Paginate'}();
        } else {
            $aData = $this->_getData ($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage);
        }

        if((empty($aData) || !is_array($aData)) && isset($this->_aBrowseParams['empty_message']) && !(bool)$this->_aBrowseParams['empty_message'])
            return '';
        
        $sPopupOptions = '{}';
        if (!empty($this->_aPopupOptions) && is_array($this->_aPopupOptions))
            $sPopupOptions = json_encode($this->_aPopupOptions);

        $aQueryAppend = array_merge(is_array($this->_aQueryAppend) ? $this->_aQueryAppend : array(), is_array($this->_aMarkers) ? $this->_aMarkers : array());
        if(!empty($this->_aQueryAppendExclude) && is_array($this->_aQueryAppendExclude))
            $aQueryAppend = array_diff_key($aQueryAppend, array_flip($this->_aQueryAppendExclude));

        $sQueryAppend = '{}';
        if (!empty($aQueryAppend) && is_array($aQueryAppend))
            $sQueryAppend = json_encode($aQueryAppend);

        $sConfirmMessages = '{}';
        if (!empty($this->_aConfirmMessages) && is_array($this->_aConfirmMessages))
            $sConfirmMessages = json_encode($this->_aConfirmMessages);

        $iColumns = count($this->_aOptions['fields']);
        $aVarsHead = $this->_getRowHead();

        $sClassHeader = '';
        if($this->_aOptions['show_total_count'] == 0)
            $sClassHeader .= ' bx-gh-no-counter';

        $aVars = array (
            'object' => $this->_sObject,
            'csrf_token' => BxDolForm::getCsrfToken(),
            'id_table' => $sIdTable,
            'id_cont' => $sIdContainer,
            'id_wrap' => $sIdWrapper,
            'class_table_wrapper' => $this->_aOptions['responsive'] ? 'bx-grid-table-wrapper-responsive' : '',
            'sortable' => empty($this->_aOptions['field_order']) ? 0 : 1,
            'sorting' => empty($this->_getOrderFields()) ? 0 : 1,
            'sorting_field' => $sOrderField,
            'sorting_dir' => $sOrderDir,
        	'bx_if:display_head' => array(
        		'condition' => !empty($aVarsHead),
        		'content' => array(
        			'bx_repeat:row_header' => $aVarsHead,
        			'columns' => $iColumns,
        		)
        	),
            'bx_repeat:rows_data' => $this->_getRowsDataDesign ($aData),
            'paginate_get_start' => $this->_aOptions['paginate_get_start'],
            'paginate_get_per_page' => $this->_aOptions['paginate_get_per_page'],
            'start' => $iStart,
            'per_page' => $iPerPage,
            'filter' => bx_js_string($sFilter, BX_ESCAPE_STR_APOS),
            'filter_get' => bx_js_string($this->_aOptions['filter_get']),
            'order_field' => bx_js_string($sOrderField, BX_ESCAPE_STR_APOS),
            'order_dir' => bx_js_string($sOrderDir, BX_ESCAPE_STR_APOS),
            'order_get_field' => bx_js_string($this->_aOptions['order_get_field']),
            'order_get_dir' => bx_js_string($this->_aOptions['order_get_dir']),
            'popup_options' => $sPopupOptions,
            'query_append' => $sQueryAppend,
            'confirm_messages' => $sConfirmMessages,
            'columns' => $iColumns,
            'bx_if:display_footer' => array(
        		'condition' => !empty($this->_aOptions['actions_bulk']) || !empty($sPaginate),
        		'content' => array(
		            'bx_if:actions_bulk' => array (
		                'condition' => !empty($this->_aOptions['actions_bulk']),
		                'content' => array(
		                    'actions_bulk' => $this->_getActions ('bulk'),
		                ),
		            ),
		            'paginate' => $sPaginate,
				)
			),
            'bx_if:display_header' => array (
                'condition' => $isDisplayHeader,
                'content' => array (
                    'class' => $sClassHeader,
                    'bx_if:actions_independent' => array (
                        'condition' => !empty($this->_aOptions['actions_independent']),
                        'content' => array(
                            'actions_independent' => $this->_getActions ('independent'),
                        ),
                    ),
                    'bx_if:filter' => array (
                        'condition' => !empty($this->_aOptions['filter_fields']) || !empty($this->_aOptions['filter_fields_translatable']),
                        'content' => array(
                            'controls' => $this->_getFilterControls(),
                        ),
                    ),
                    'bx_if:counter' => array (
                        'condition' => $this->_aOptions['show_total_count'] == 1,
                        'content' => array(
                            'counter' => $this->_getCounter(),
                        ),
                    ),
                ),
            ),
        );

        $this->_addJsCss();

        return $this->_oTemplate->parseHtmlByName('grid.html', $aVars);
    }

    protected function _getJsCodeVars()
    {
        $sFilter = $this->_getFilterValue();
        $sOrderField = $this->_getOrderValue();
        $sOrderDir = 0 === strcasecmp('desc', bx_get($this->_aOptions['order_get_dir'])) ? 'DESC' : 'ASC';

        $iStart = 0;
        if($this->_aOptions['paginate_get_start'] && ($iStartGet = (int)bx_get($this->_aOptions['paginate_get_start'])) >= 0)
            $iStart = $iStartGet;

        $iPerPage = 10;
        if($this->_aOptions['paginate_get_per_page'] && ($iPerPageGet = (int)bx_get($this->_aOptions['paginate_get_per_page'])) > 0)
            $iPerPage = $iPerPageGet;
        else if($this->_aOptions['paginate_per_page'])
            $iPerPage = (int)$this->_aOptions['paginate_per_page'];

        $sPopupOptions = '{}';
        if (!empty($this->_aPopupOptions) && is_array($this->_aPopupOptions))
            $sPopupOptions = json_encode($this->_aPopupOptions);

        $aQueryAppend = array_merge(is_array($this->_aQueryAppend) ? $this->_aQueryAppend : array(), is_array($this->_aMarkers) ? $this->_aMarkers : array());
        if(!empty($this->_aQueryAppendExclude) && is_array($this->_aQueryAppendExclude))
            $aQueryAppend = array_diff_key($aQueryAppend, array_flip($this->_aQueryAppendExclude));

        $sQueryAppend = '{}';
        if (!empty($aQueryAppend) && is_array($aQueryAppend))
            $sQueryAppend = json_encode($aQueryAppend);

        $sConfirmMessages = '{}';
        if (!empty($this->_aConfirmMessages) && is_array($this->_aConfirmMessages))
            $sConfirmMessages = json_encode($this->_aConfirmMessages);

        return [
            'object' => $this->_sObject,
            'csrf_token' => BxDolForm::getCsrfToken(),
            'sortable' => empty($this->_aOptions['field_order']) ? 0 : 1,
            'sorting' => empty($this->_getOrderFields()) ? 0 : 1,
            'paginate_get_start' => $this->_aOptions['paginate_get_start'],
            'paginate_get_per_page' => $this->_aOptions['paginate_get_per_page'],
            'start' => $iStart,
            'per_page' => $iPerPage,
            'filter' => bx_js_string($sFilter, BX_ESCAPE_STR_APOS),
            'filter_get' => bx_js_string($this->_aOptions['filter_get']),
            'order_field' => bx_js_string($sOrderField, BX_ESCAPE_STR_APOS),
            'order_dir' => bx_js_string($sOrderDir, BX_ESCAPE_STR_APOS),
            'order_get_field' => bx_js_string($this->_aOptions['order_get_field']),
            'order_get_dir' => bx_js_string($this->_aOptions['order_get_dir']),
            'popup_options' => $sPopupOptions,
            'query_append' => $sQueryAppend,
            'confirm_messages' => $sConfirmMessages,
            'columns' => count($this->_aOptions['fields']),
        ];
    }

    /**
     * Init grid JS class without rendering grid HTML.
     * @return string
     */
    public function getCodeJs()
    {
        $this->_replaceMarkers();
        $this->_addJsCss();

        return $this->_oTemplate->parseHtmlByName('grid_js.html', $this->_getJsCodeVars());
    }

    /**
     * Get raw actions list (name, title, icon, confirm) without HTML.
     * Custom `_getAction[Name]` methods that return empty hide the action, same as in the grid.
     * @param string $sType action type: single, bulk, independent
     * @param mixed $sActionData row id for single actions
     * @param array $aRow row data, used by custom action methods
     * @return array
     */
    public function getActionsRaw($sType, $sActionData = false, $aRow = [])
    {
        $sActionsType = 'actions_' . $sType;
        if (empty($this->_aOptions[$sActionsType]) || !is_array($this->_aOptions[$sActionsType]))
            return [];

        $aResult = [];
        foreach ($this->_aOptions[$sActionsType] as $sKey => $a) {
            if(!$a['active'] || (!$a['title'] && !$a['icon']))
                continue;

            $sFunc = '_getAction' . $this->_genMethodName($sKey);
            if (method_exists($this, $sFunc)) {
                if (!isset($a['attr']))
                    $a['attr'] = [];
                $mixed = $this->$sFunc($sType, $sKey, $a, false, false, $aRow);
                if ($mixed === '' || $mixed === false)
                    continue;
            }

            $aResult[] = [
                'name' => $sKey,
                'title' => $a['title'],
                'icon' => !empty($a['icon']) ? $a['icon'] : '',
                'confirm' => !empty($a['confirm']) ? 1 : 0,
                'reset_paginate' => false === strpos($sKey, 'delete') ? 0 : 1,
            ];
        }

        return $aResult;
    }

    /**
     * Get grid code API.
     * @return array
     */
    public function getCodeAPI($bForceReturn = false)
    {
        $this->_replaceMarkers();

        $sFilter = bx_unicode_urldecode(bx_process_input(bx_get($this->_aOptions['filter_get'])));
        $sOrderField = bx_unicode_urldecode(bx_process_input(bx_get($this->_aOptions['order_get_field'])));
        $sOrderDir = 0 === strcasecmp('desc', bx_get($this->_aOptions['order_get_dir'])) ? 'DESC' : 'ASC';

        $iStart = 0;
        if($this->_aOptions['paginate_get_start'] && ($iStartGet = (int)bx_get($this->_aOptions['paginate_get_start'])) >= 0)
            $iStart = $iStartGet;

        $iPerPage = 10;
        if($this->_aOptions['paginate_get_per_page'] && ($iPerPageGet = (int)bx_get($this->_aOptions['paginate_get_per_page'])) > 0)
            $iPerPage = $iPerPageGet;
        else if($this->_aOptions['paginate_per_page'])
            $iPerPage = (int)$this->_aOptions['paginate_per_page']; 

        $aData = $this->_getData($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage);
        if(!empty($aData) && is_array($aData))
            $aData = $this->decodeDataAPI($aData);

        $aQueryAppend = [];
        if(!empty($this->_aQueryAppend) && is_array($this->_aQueryAppend))
            $aQueryAppend = array_merge($aQueryAppend, $this->_aQueryAppend);
        if(!empty($this->_aMarkers) && is_array($this->_aMarkers))
            $aQueryAppend = array_merge($aQueryAppend, $this->_aMarkers);
        if(!empty($this->_aQueryAppendExclude) && is_array($this->_aQueryAppendExclude))
            $aQueryAppend = array_diff_key($aQueryAppend, array_flip($this->_aQueryAppendExclude));
        if(!empty($this->_aQueryAppendExcludeApi) && is_array($this->_aQueryAppendExcludeApi))
            $aQueryAppend = array_diff_key($aQueryAppend, array_flip($this->_aQueryAppendExcludeApi));       

        return [
            'settings' => [
                'object' => $this->_aOptions['object'], 
                'field_id' => $this->_aOptions['field_id'], 
                'start' => $iStart, 
                'per_page' => $iPerPage,
                'filters' => $this->_getFilterControlsAPI(),
                'query_append' => $aQueryAppend
            ],
            'header' => $this->_getRowHeadAPI(),
            'data' => defined('BX_API_PAGE') && !$bForceReturn ? [] : $aData,
            'actions' => [
                'independent' => $this->_getActionsAPI('independent'), 
                'bulk' => $this->_getActionsAPI('bulk')
            ]
        ];
    }

    public function decodeDataAPI($aData)
    {
        $sKeyId = $this->_aOptions['field_id'];
        $sMethodDefault = '_getCellDefault';

        $aDataRv = [];
        foreach($aData as $iKey => $aRow) {
            $aDataRv[$iKey] = [$sKeyId => $aData[$iKey][$sKeyId]];

            foreach($this->_aOptions['fields'] as $sKey => $aField) {
                $sMethod = '_getCell' . $this->_genMethodName($sKey);
                if(!method_exists($this, $sMethod))
                    $sMethod = !empty($aField['secret']) ? '_getCellSecret' : $sMethodDefault;

                if(($aCell = $this->$sMethod(isset($aData[$iKey][$sKey]) ? $aData[$iKey][$sKey] : _t('_undefined'), $sKey, $aField, $aRow)))
                    $aDataRv[$iKey][$sKey] = $aCell;
            }
        }

        return $aDataRv;
    }

    public function getFormBlockAPI($oForm, $sAction, $iId = 0)
    {
        return [
            bx_api_get_block('form', $oForm->getCodeAPI(), [
                'ext' => [
                    'name' => $this->_oModule->getName(), 
                    'title' => $this->getFormBlockTitleAPI($sAction, $iId),
                    'request' => ['url' => $this->getFormCallBackUrlAPI($sAction, $iId), 'immutable' => true]]
                ]
            )
        ];
    }

    public function getFormBlockTitleAPI($sAction, $iId)
    {
        return '';
    }

    public function getFormCallBackUrlAPI($sAction, $iId)
    {
        return '';
    }

    /**
     * Reset query params, like filter and page number
     */
    public function resetQueryParams()
    {
        foreach ($this->_aQueryReset as $sKey) {
            unset($_GET[$sKey]);
            unset($_POST[$sKey]);
        }
    }

    protected function _getRowHead()
    {
        $aRet = array();
        foreach ($this->_aOptions['fields'] as $sKey => $a) {

            $sMethod = '_getCellHeaderDefault';
            $sCustomMethod = '_getCellHeader' . $this->_genMethodName($sKey);
            if (method_exists($this, $sCustomMethod))
                $sMethod = $sCustomMethod;

            $aRet[] = array('header_cell' => $this->$sMethod($sKey, $a));
        }
        return $aRet;
    }

    protected function _getRowHeadAPI()
    {
        $bResize = false;
        $aHeader = [];

        foreach($this->_aOptions['fields'] as $sKey => $aField) {
            if($sKey == 'checkbox' && (int)$aField['width'] < 8)
                $bResize = true;

            $sMethod = '_getCellHeader' . $this->_genMethodName($sKey);
            if(($aHeaderItem = $this->{method_exists($this, $sMethod) ? $sMethod : '_getCellHeaderDefault'}($sKey, $aField)))
                $aHeader[] = $aHeaderItem;
        }

        if(($sKey = 'checkbox') && $bResize)
            $this->_resizeCellAPI($sKey, $this->_aOptions['fields'][$sKey], $aHeader);

        return $aHeader;
    }

    protected function _resizeCellAPI($sKey, $aField, &$aHeader)
    {
        $iMin = 8;
        $iAdd = $iMin - (int)$aField['width'];
        $iThreshold = $iMin + $iAdd;

        $iReduce = 0;
        array_walk($aHeader, function($aItem) use ($iThreshold, &$iReduce) {
            if((int)$aItem['width'] >= $iThreshold)
                $iReduce += 1;
        });

        $fSub = round($iAdd / $iReduce, 2);
        array_walk($aHeader, function(&$aItem) use ($sKey, $iThreshold, $iAdd, $fSub) {
            if($aItem['name'] == $sKey)
                $aItem['width'] = (float)$aItem['width'] + $iAdd;
            else if((int)$aItem['width'] >= $iThreshold)
                $aItem['width'] = (float)$aItem['width'] - $fSub;
            else
                return;

            $aItem['width'] .= '%';
        });
    }

    protected function _getCellHeaderDefault ($sKey, $aField)
    {
        if($this->_bIsApi)
            return [
                'name' => bx_process_output($aField['name']),
                'title' => bx_process_output($aField['title']),
                'width' => $aField['width']
            ];

        $sHeader = bx_process_output($aField['title']);
        if ($sHeader === '') // a column with no visible title (switcher, actions, order) still needs one for assistive tech
            $sHeader = '<span class="sr-only">' . bx_process_output($this->_getCellHeaderFallbackTitle($sKey)) . '</span>';

        if (($aSortingFields = $this->_getOrderFields()) && in_array($sKey, $aSortingFields)) {
            $sHeader = '<a href="javascript:void(0);" class="bx-grid-sort-handle" role="button">' . $sHeader . '</a><span class="bx-grid-sort-indi"></span>';
            $aField['attr_head']['bx_grid_sort_head'] = $sKey;
        }

        $sAttr = $this->_convertAttrs(
            $aField, 'attr_head',
            'bx-def-padding-sec-bottom bx-def-padding-sec-top bx-grid-header-' . $sKey . $this->_getCellHugClass($sKey), // add default classes
            $this->_getCellWidthStyle($sKey, $aField) // add default styles
        );

        return $this->_getCellHeaderWrapper ($sKey, $aField, $sHeader, $sAttr);
    }

    protected function _getCellHeaderCheckbox ($sKey, $aField)
    {
        if($this->_bIsApi)
            return $this->_getCellHeaderDefault($sKey, $aField);
        
    	$aAttr = array(
            'type' => 'checkbox',
            'id' => $this->_sObject . '_check_all',
            'name' => $this->_sObject . '_check_all',
            'aria-label' => _t('_sys_grid_lbl_select_all'),
            'onclick' => "$('input[name=" . $this->_sObject . "_check]:not([disabled])').attr('checked', this.checked)"
    	);
    	if($this->_bSelectAll)
            $aAttr['checked'] = 'checked';

    	$aField['attr'] = isset($aField['attr']) && is_array($aField['attr']) ? array_merge($aAttr, $aField['attr']) : $aAttr;

        $sAttrHead = $this->_convertAttrs(
            $aField, 'attr_head',
            'bx-def-padding-sec-bottom bx-def-padding-sec-top bx-grid-header-' . $sKey . $this->_getCellHugClass($sKey), // add default classes
            $this->_getCellWidthStyle($sKey, $aField) // add default styles
        );
        return $this->_getCellHeaderWrapper ($sKey, $aField, ' <input ' . $this->_convertAttrs($aField, 'attr') . ' /> ', $sAttrHead);
    }

    protected function _getCellHeaderWrapper ($sKey, $aField, $sHeader, $sAttr)
    {
        return '<th scope="col" ' . $sAttr . '>' . $sHeader . '</th>';
    }

    /**
     * The title read out for a column whose header is empty: the conventional columns by name, the key as words otherwise.
     */
    protected function _getCellHeaderFallbackTitle ($sKey)
    {
        $aTitles = array('switcher' => '_sys_active', 'switcher_api' => '_sys_grid_lbl_show_in_apps', 'actions' => '_sys_grid_lbl_actions', 'order' => '_sys_grid_lbl_order', 'checkbox' => '_sys_grid_lbl_select');
        if (isset($aTitles[$sKey]))
            return _t($aTitles[$sKey]);

        return ucfirst(str_replace('_', ' ', $sKey));
    }

    /**
     * Check if the whole row is disabled.
     * When row is disabled - checkbox is not selectable, actions aren't clickable and text is grayed out.
     * By default all rows aren't disabled.
     * @param $aRow row array
     * @return boolean
     */
    protected function _isRowDisabled($aRow)
    {
        if (isset($aRow[$this->_aOptions['field_active']]) && !$this->_switcherState2Checked($aRow[$this->_aOptions['field_active']])) {
            // a row which is still shown in the apps is not disabled
            $sFieldActiveApi = $this->_getFieldActiveApi();
            if ($sFieldActiveApi !== '' && isset($aRow[$sFieldActiveApi]) && $this->_switcherState2Checked($aRow[$sFieldActiveApi]))
                return false;

            return true;
        }
        return false;
    }

    /**
     * Name of the field which shows the row in the apps ('field_active_api' option), an empty string when the grid has none.
     */
    protected function _getFieldActiveApi()
    {
        $sField = isset($this->_aOptions['field_active_api']) ? (string)$this->_aOptions['field_active_api'] : '';

        return preg_match('/^[A-Za-z0-9_]+$/', $sField) ? $sField : '';
    }

    /**
     * The 'enable_api' action works only in a grid which has the 'field_active_api' option and the 'switcher_api' column.
     */
    protected function _isSwitcherApiAvailable()
    {
        return $this->_getFieldActiveApi() !== '' && isset($this->_aOptions['fields']['switcher_api']);
    }

    /**
     * Determine how actions are disabled when whole row is disabled.
     * @param $aRow row array
     * @return null - disable/enable actions when row is disabled/enabled, true - actions are always disabled, false - actions are always enabled
     */
    protected function _getActionsDisabledBehavior($aRow)
    {
        return null;
    }

    /**
     * Check if the checkbox is disabled.
     * @param $aRow row array
     * @return boolean
     */
    protected function _isCheckboxDisabled($aRow)
    {
        return $this->_isRowDisabled($aRow);
    }

    /**
     * Is checkbox checked by default ?
     * By default no one checkbox is selected.
     * @return boolean
     */
    protected function _isCheckboxSelected($mixedValue, $sKey, $aField, $aRow)
    {
        return $this->_bSelectAll;
    }

    /**
     * Is switcher on by default ?
     * By default no one switcher is on.
     * @return boolean
     */
    protected function _isSwitcherOn($mixedValue, $sKey, $aField, $aRow)
    {
        return $this->_switcherState2Checked($mixedValue);
    }

    /**
     * Convert switcher checked status to the actual value ?
     * @return boolean
     */
    protected function _switcherChecked2State($isChecked)
    {
        return $isChecked ? 1 : 0;
    }

    /**
     * Convert switcher value to checked(boolean) value ?
     * @return boolean
     */
    protected function _switcherState2Checked($mixedState)
    {
        return $mixedState ? true : false;
    }

    protected function _getRowsDataDesign (&$aData)
    {
        $aGrid = array();

        if(empty($aData))
            $aGrid[] = array(
                'id_row' => 0,
                'row_class' => 'bx-grid-table-row-empty',
                'row' => '<td class="bx-def-padding-sec-topbottom" colspan="' . count($this->_aOptions['fields']) . '">' . MsgBox(_t('_Empty')) . '</td>'
            );
        else
            foreach ($aData as $aRow)
                $aGrid[] = array(
                    'id_row' => $this->_getRowId($aRow),
                    'row_class' => $this->_isRowDisabled($aRow) ? 'bx-grid-table-row-disabled bx-def-font-grayed' : '',
                    'row' => $this->_getRowDesign($aRow)
                );

        return $aGrid;
    }

    protected function _getRowId($mixedRow)
    {
        if(is_string($mixedRow))
            $sId = rand(1, getrandmax());
        else
            $sId = $mixedRow[$this->_aOptions['field_id']];

        return $this->_sObject . '_row_' . $sId;
    }

    protected function _getRowDesign($mixedRow)
    {
        $sRow = '';
        if(is_string($mixedRow))
            $sRow = '<td class="bx-grid-cell bx-gc-string bx-def-padding-sec-topbottom bx-def-font-bold" colspan="' . count($this->_aOptions['fields']) . '">' . $mixedRow . '</td>';
        else
            foreach($this->_aOptions['fields'] as $sKey => $aField)
                $sRow .= $this->_getCellDesign($sKey, $aField, $mixedRow);

        return $sRow;
    }

    protected function _getCellDesign($sKey, $aField, $aRow)
    {
        $sMethod = '_getCellDefault';
        if ($this->_aOptions['field_order'] == $sKey)
            $sMethod = '_getCellOrder';

        $sCustomMethod = '_getCell' . $this->_genMethodName($sKey);
        if (method_exists($this, $sCustomMethod))
            $sMethod = $sCustomMethod;
        else if (!empty($aField['secret']))
            $sMethod = '_getCellSecret';

        $mixedValue = $this->_getCellData($sKey, $aField, $aRow);

        if ($aField['translatable'])
            $mixedValue = _t($mixedValue);

        if ($sMethod != '_getCellSecret')
            $mixedValue = $this->_limitMaxLength($mixedValue, $sKey, $aField, $aRow, $this->_isDisplayPopupOnTextOverflow);

        return $this->$sMethod($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellCheckbox ($mixedValue, $sKey, $aField, $aRow)
    {
        if($this->_bIsApi)
            return ['type' => 'checkbox', 'data' => $aRow[$this->_aOptions['field_id']]];

        $sAttr = $this->_convertAttrs(
            $aField, 'attr_cell',
            $this->_getControlsCellClasses($sKey), // add default classes
            $this->_getCellWidthStyle($sKey, $aField)  // add default styles
        );
        $sDisabled = ($this->_isCheckboxDisabled($aRow) ? 'disabled="disabled"' : '');
        $sSelected = ($this->_isCheckboxSelected($mixedValue, $sKey, $aField, $aRow) ? 'checked="checked"' : '');
        $sVal = $aRow[$this->_aOptions['field_id']];
        return '<td ' . $sAttr . '><input type="checkbox" name="'. $this->_sObject . '_check" value="' . $sVal . '" aria-label="' . bx_html_attribute($this->_getCheckboxLabel($aRow)) . '" ' . $sDisabled . ' ' . $sSelected . '/></td>';
    }

    /**
     * Name of a row's checkbox for screen readers; the row's other cells give its context.
     */
    protected function _getCheckboxLabel ($aRow)
    {
        return _t('_sys_grid_lbl_select');
    }

    protected function _getCellSwitcher ($mixedValue, $sKey, $aField, $aRow)
    {
        return $this->_getCellSwitcherFor($this->_aOptions['field_active'], 'enable', $this->_getSwitcherLabel($sKey, $aField), $sKey, $aField, $aRow);
    }

    /**
     * The switch which shows the row in the apps ('field_active_api'); the cell is empty in a grid without that option.
     */
    protected function _getCellSwitcherApi ($mixedValue, $sKey, $aField, $aRow)
    {
        $sFieldActiveApi = $this->_getFieldActiveApi();
        if ($sFieldActiveApi === '')
            return $this->_bIsApi ? ['type' => 'text', 'data' => ''] : $this->_getCellDefault('', $sKey, $aField, $aRow);

        return $this->_getCellSwitcherFor($sFieldActiveApi, 'enable_api', $this->_getSwitcherLabel($sKey, $aField), $sKey, $aField, $aRow);
    }

    /**
     * Name of a column's switch for assistive tech, also its tooltip, before the row's title. In a grid with both switches
     * they say where they show the row; otherwise the switch has the column's title (Active when the column has none).
     */
    protected function _getSwitcherLabel ($sKey, $aField)
    {
        if ($sKey == 'switcher_api')
            return _t('_sys_grid_lbl_show_in_apps');

        if ($this->_isSwitcherApiAvailable())
            return _t('_sys_grid_lbl_show_on_site');

        return !empty($aField['title']) ? _t($aField['title']) : _t('_sys_active');
    }

    /**
     * A switch bound to a field of the row: the action is sent with the row's id and 'checked' when it is turned.
     */
    protected function _getCellSwitcherFor ($sFieldActive, $sAction, $sLabel, $sKey, $aField, $aRow)
    {
        if($this->_bIsApi)
            return ['type' => 'switcher', 'data' => isset($aRow[$sFieldActive]) ? $aRow[$sFieldActive] : 0, 'fld' => $sFieldActive, 'action' => $sAction];

        $sAttr = $this->_convertAttrs(
            $aField, 'attr_cell',
            $this->_getControlsCellClasses($sKey), // add default classes
            $this->_getCellWidthStyle($sKey, $aField)  // add default styles
        );

        $oForm = new BxTemplFormView(array(), $this->_oTemplate);
        $oForm->addCssJs();

        // the switch's name for assistive tech: the column's label and the row's title
        foreach (array('title', 'name', 'caption') as $sTitleKey)
            if (!empty($aRow[$sTitleKey]) && is_string($aRow[$sTitleKey])) {
                $sLabel .= ': ' . strip_tags(_t($aRow[$sTitleKey]));
                break;
            }

        $aInput = array(
            'type' => 'switcher',
            'name' => $this->_sObject . '_switch' . ($sAction != 'enable' ? '_' . $sAction : '') . '_' . $aRow[$this->_aOptions['field_id']],
            'caption' => '',
            'attrs' => array (
                'aria-label' => $sLabel,
                'bx_grid_action_single' => $sAction,
                'bx_grid_action_confirm' => '',
                'bx_grid_action_data' => $aRow[$this->_aOptions['field_id']],
            ),
            'value' => $aRow[$this->_aOptions['field_id']],
            'checked' => $this->_isSwitcherOn(isset($aRow[$sFieldActive]) ? $aRow[$sFieldActive] : false, $sKey, $aField, $aRow),
        );
        $sSwitcher = $oForm->genInput($aInput);
        return '<td ' . $sAttr . ' title="' . bx_html_attribute($sLabel) . '">' . $sSwitcher . '</td>';
    }

    protected function _getCellOrder ($mixedValue, $sKey, $aField, $aRow)
    {
        if($this->_bIsApi)
            return ['type' => 'order', 'data'=> $mixedValue];    

        $sAttr = $this->_convertAttrs(
            $aField, 'attr_cell',
            $this->_getControlsCellClasses($sKey), // add default classes
            $this->_getCellWidthStyle($sKey, $aField)  // add default styles
        );

        return '<td ' . $sAttr . '><div id="' . $this->_sObject . '_cell_' . $aRow[$this->_aOptions['field_id']] . '" class="bx-grid-drag-handle"><i class="sys-icon grip-vertical"></i></div></td>';
    }

    protected function _getCellActions ($mixedValue, $sKey, $aField, $aRow)
    {
        $sAttr = $this->_convertAttrs(
            $aField, 'attr_cell',
            $this->_getControlsCellClasses($sKey), // add default classes
            $this->_getCellWidthStyle($sKey, $aField)  // add default styles
        );

        $mixedDisabledBehavior = $this->_getActionsDisabledBehavior($aRow);
        $mixedActions = $this->_getActions('single', $aRow[$this->_aOptions['field_id']], false, null === $mixedDisabledBehavior ? $this->_isRowDisabled($aRow) : $mixedDisabledBehavior, null !== $mixedDisabledBehavior, $aRow);

        if($this->_bIsApi)
            return ['type' => 'actions', 'data' => $mixedActions];

        return '<td ' . $sAttr . '><div class="bx-grid-cell-single-actions-wrapper bx-def-margin-thd-neg">' . $mixedActions . '</div></td>';
    }

    protected function _getCellDefault ($mixedValue, $sKey, $aField, $aRow)
    {
        if($this->_bIsApi) {
            $sType = $mixedValue['type'] ?? 'text';
            if(isset($mixedValue['type']))
                unset($mixedValue['type']);

            return [
                'type' =>  $sType, 
                'value'=> (int)$aField['translatable'] ? _t($mixedValue) : $mixedValue
            ];
        }

        $sAttr = $this->_convertAttrs(
            $aField, 'attr_cell',
            'bx-grid-cell' . (!empty($aField['name']) ? ' bx-gc-' . $aField['name'] : '') . ' bx-def-padding-sec-bottom bx-def-padding-sec-top', // add default classes
            $this->_getCellWidthStyle($sKey, $aField) // add default styles
        );

        // Text longer than one line of its column (_limitMaxLength): two lines, and all of it when pointed at.
        $sClampText = $this->_sCellClampText;
        $this->_sCellClampText = '';
        if($sClampText !== '' && is_string($mixedValue)) {
            $mixedValue = '<div class="bx-grid-cell-clamp" data-full-text="' . bx_html_attribute($sClampText) . '">' . $mixedValue . '</div>';
        }

        return '<td ' . $sAttr . '>' . $mixedValue . '</td>';
    }

    /**
     * Display a cell as a masked secret with an eye icon to reveal it after password confirmation.
     * @see BxDolGrid grid_display_secret_cell
     */
    protected function _getCellSecret ($mixedValue, $sKey, $aField, $aRow)
    {
        $sRaw = '';
        if (isset($aRow[$sKey]) && $aRow[$sKey] !== '' && $aRow[$sKey] !== null)
            $sRaw = (string)$aRow[$sKey];
        else if ($mixedValue !== '' && $mixedValue !== null && $mixedValue !== false)
            $sRaw = (string)$mixedValue;

        $sMasked = $sRaw !== '' ? bx_gen_secret($sRaw) : '';

        if ($this->_bIsApi)
            return ['type' => 'secret', 'value' => $sMasked];

        $sAttr = $this->_convertAttrs(
            $aField, 'attr_cell',
            'bx-grid-cell' . (!empty($aField['name']) ? ' bx-gc-' . $aField['name'] : '') . ' bx-def-padding-sec-bottom bx-def-padding-sec-top',
            $this->_getCellWidthStyle($sKey, $aField)
        );

        $sToggle = '';
        if ($sRaw !== '' && isLogged()) {
            $mixedId = $aRow[$this->_aOptions['field_id']];
            $sToggle = '<a href="javascript:void(0);" class="bx-grid-secret-toggle" title="' . bx_html_attribute(_t('_sys_grid_secret_reveal')) . '" bx_grid_secret_id="' . bx_html_attribute($mixedId) . '" bx_grid_secret_field="' . bx_html_attribute($sKey) . '"><i class="sys-icon eye"></i></a>';
        }

        return '<td ' . $sAttr . '><div class="bx-grid-secret"><span class="bx-grid-secret-value" data-masked="' . bx_html_attribute($sMasked) . '">' . bx_process_output($sMasked) . '</span>' . $sToggle . '</div></td>';
    }

    protected function _getSecretRow($mixedId)
    {
        $aRows = $this->_getDataUpdated([$mixedId]);
        if (!$aRows || !is_array($aRows))
            return false;

        $sFieldId = $this->_aOptions['field_id'];
        foreach ($aRows as $aRow) {
            if (isset($aRow[$sFieldId]) && (string)$aRow[$sFieldId] === (string)$mixedId)
                return $aRow;
        }

        return reset($aRows);
    }

    /**
     * Return the secret value for a revealed cell. Override when the value is encrypted or computed.
     */
    protected function _getSecretValue($mixedId, $sKey, $aRow)
    {
        return isset($aRow[$sKey]) ? $aRow[$sKey] : '';
    }

    protected function _isCurrentPasswordValid($sPassword)
    {
        if ($sPassword === false || $sPassword === '')
            return false;

        if (!class_exists('BxFormAccountCheckerHelper'))
            bx_import('BxBaseFormAccount');

        $oChecker = new BxFormAccountCheckerHelper();
        return true === $oChecker->checkPasswordCurrent($sPassword);
    }

    protected function _getActions ($sType, $sActionData = false, $isSmall = false, $isDisabled = false, $isPermanentState = false, $aRow = array())
    {
        $sActionsType = 'actions_' . $sType;
        if (empty($this->_aOptions[$sActionsType]) || !is_array($this->_aOptions[$sActionsType]))
            return '';

        $mixedResult = $this->_bIsApi ? [] : '';
        foreach ($this->_aOptions[$sActionsType] as $sKey => $a) {
            if(!$a['active'] || (!$a['title'] && !$a['icon']))
                continue;

            $sFunc = '_getAction' . $this->_genMethodName($sKey);
            if (!method_exists($this, $sFunc))
                $sFunc = empty($a) ? '_getActionDivider' : '_getActionDefault';

            if (!isset($a['attr']['bx_grid_action'])) {
                $a['attr']['bx_grid_action_' . $sType] = $sKey;
                if (!empty($sActionData))
                    $a['attr']['bx_grid_action_data'] = $sActionData;
                if (isset($a['confirm']))
                    $a['attr']['bx_grid_action_confirm'] = $a['confirm'] ? 1 : 0;
                $a['attr']['bx_grid_action_reset_paginate'] = false === strpos($sKey, 'delete') ? 0 : 1; // reset paginate after deleting row 
            }

            if ($isPermanentState && !isset($a['attr']['bx_grid_permanent_state']))
                $a['attr']['bx_grid_permanent_state'] = 1;

            if ($this->_bIsApi)
                $mixedResult[] = $this->$sFunc($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
            else
                $mixedResult .= $this->$sFunc($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
        }

        return $mixedResult;
    }

    protected function _getActionsAPI ($sType)
    {
        $sActionsType = 'actions_' . $sType;
        if(empty($this->_aOptions[$sActionsType]) || !is_array($this->_aOptions[$sActionsType]))
            return [];

        foreach ($this->_aOptions[$sActionsType] as $sKey => $aAction) {
            $sMethod = '_getAction' . $this->_genMethodName($sKey);
            if(!method_exists($this, $sMethod))
                $sMethod = '_getActionDefault';

            if(!isset($aAction['attr']))
                $aAction['attr'] = [];

            if(($_aAction = $this->$sMethod($sType, $sKey, $aAction)))
                $this->_aOptions[$sActionsType][$sKey] = $_aAction;
        }

        return $this->_aOptions[$sActionsType];
    }

    protected function _getActionDelete($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        if($this->_bIsApi)
            return array_merge($a, ['name' => $sKey, 'type' => 'callback', 'on_callback' => 'hide_row']);

    	return $this->_getActionDefault($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    protected function _getActionDefault ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        if ($a['icon_only'] && empty($a['attr']['title']) && !empty($a['title']))
            $a['attr']['title'] = $a['title'];
        if ($a['icon_only'] && empty($a['attr']['aria-label']) && !empty($a['title']))
            $a['attr']['aria-label'] = $a['title'];

        if ($this->_bIsApi) {
            $sParams = '';
            if($sType == 'single' && ($sFieldId = $this->_aOptions['field_id']) && isset($aRow[$sFieldId]))
                $sParams = '&id=' . $aRow[$sFieldId];

            return array_merge($a, ['name' => $sKey, 'type' => 'modal', 'action' => $sKey, 'params' => $sParams]);
        }

        $sAttr = $this->_convertAttrs(
            $a, 'attr',
            'bx-btn bx-def-margin-thd' . ($isSmall ? ' bx-btn-small' : '') . ($isDisabled ? ' bx-btn-disabled' : '') // add default classes
        );

        $sIcon = '';
        $sImage = '';
        if (!empty($a['icon'])) {
            list($sIconFont, $sIconUrl, $sIconA, $sIconHtml) = $this->_oFunctions->getIcon($a['icon']);

            if ($sIconFont)
                $sIcon = '<i class="sys-icon ' . $sIconFont . '"></i>';
            else if($sIconUrl)
                $sImage = '<img style="background-image:url(' . $sIconUrl . ');" src="' . $this->_oTemplate->getIconUrl('spacer.gif') .'" />';
            else if($sIconHtml)
                $sImage = $sIconHtml;
        }

        return '<button ' . $sAttr . '>' . $sIcon . $sImage . ($a['icon_only'] || empty($a['title']) ? '' : '<u>' . $a['title'] . '</u>') . '</button>';
    }

    protected function _getActionDivider ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        return '<div class="bx-grid-actions-divider bx-def-margin-sec-left"> | </div>';
    }

    protected function _getActionResult($aResult)
    {
        return $this->_bIsApi ? $aResult : echoJson($aResult);
    }

    protected function _getFilterControls ()
    {
        $oForm = new BxTemplFormView([]);

        $aInput = array(
            'type' => 'text',
            'name' => 'keyword',
            'attrs' => array(
                'id' => 'bx-grid-search-' . $this->_sObject,
                'aria-label' => _t('_Search')
            )
        );

        $this->_oTemplate->addCss('forms.css');
        return $oForm->genRow($aInput);
    }

    protected function _getFilterControlsAPI($aFilters = [])
    {
        if(!empty($this->_aOptions['filter_fields']) || !empty($this->_aOptions['filter_fields_translatable']))
            $aFilters['search'] = [];

        return $aFilters;
    }

    protected function _getFilterOnChange()
    {
        return '';
    }

    /**
     * Grid filter controls are rendered without a visible caption, so each one needs its own accessible name:
     * the name the grid declares in $_aFilterAreaLabels, else the "unfiltered" option the filter starts with
     * ("All", "Any status", "Select one..."), else the generic "Filters".
     */
    protected function _getFilterAreaLabel($sFilterName, $aInputValues = [])
    {
        if(!empty($this->_aFilterAreaLabels[$sFilterName]))
            return $this->_aFilterAreaLabels[$sFilterName];

        if(!empty($aInputValues['']) && is_string($aInputValues['']))
            return $aInputValues[''];

        return '_Filters';
    }

    protected function _getFilterSelectOne($sFilterName, $sFilterValue, $aFilterValues, $mixedAddSelectOne = true, $bAsArray = false)
    {
        if(empty($sFilterName))
            return '';

        $aInputValues = [];
        if(($mixedAddSelectOne === true && ($sKey = '_Select_one')) || (is_string($mixedAddSelectOne) && ($sKey = $mixedAddSelectOne)))
            $aInputValues[''] = _t($sKey);

        foreach($aFilterValues as $mixedKey => $mixedValue)
            if(is_array($mixedValue) && isset($mixedValue['key'], $mixedValue['value']))
                $aInputValues[$mixedValue['key']] = _t($mixedValue['value']);
            else
                $aInputValues[$mixedKey] = _t($mixedValue);

        $aInputSelect = [
            'type' => 'select',
            'name' => $sFilterName,
            'attrs' => [
                'id' => 'bx-grid-' . $sFilterName . '-' . $this->_sObject,
                'onChange' => ($sOnChange = $this->_getFilterOnChange()) ? 'javascript:' . $sOnChange : '',
            ],
            'area_label' => $this->_getFilterAreaLabel($sFilterName, $aInputValues),
            'value' => $sFilterValue,
            'values' => $aInputValues
        ];

        if($bAsArray)
            return $aInputSelect;

        $oForm = new BxTemplFormView([]);
        return $oForm->genRow($aInputSelect);
    }

    protected function _getFilterDatePicker($sFilterName, $sFilterValue, $bAsArray = false)
    {
        if(empty($sFilterName))
            return '';

        $aInputDatePicker = [
            'type' => 'datepicker',
            'name' => $sFilterName,
            'attrs' => [
                'id' => 'bx-grid-' . $sFilterName . '-' . $this->_sObject,
                'onChange' => ($sOnChange = $this->_getFilterOnChange()) ? 'javascript:' . $sOnChange : '',
            ],
            'area_label' => $this->_getFilterAreaLabel($sFilterName),
            'value' => $sFilterValue,
        ];

        if($bAsArray)
            return $aInputDatePicker;

        $oForm = new BxTemplFormView([]);
        return $oForm->genRow($aInputDatePicker);
    }

    protected function _getFilterButton($bAsArray = false)
    {
        $sOnChange = $this->_getFilterOnChange();

        $aInputButton = [
            'type' => 'button',
            'name' => 'button',
            'attrs' => [
                'id' => 'bx-grid-button-' . $this->_sObject,
                'onClick' => 'javascript:' . $sOnChange,
            ],
            'value' => _t('_Search'),
        ];

        if($bAsArray)
            return $aInputButton;

        $oForm = new BxTemplFormView([]);
        return $oForm->genRow($aInputButton);
    }

    protected function _getFilterLabel($sFilterValue, $bAsArray = false)
    {
        $aInputLabel = [
            'type' => 'value',
            'value' => $sFilterValue,
            'tr_attrs' => ['class' => 'bx-grid-controls-filter-label'],
        ];

        if($bAsArray)
            return $aInputLabel;

        $oForm = new BxTemplFormView([]);
        return $oForm->genRow($aInputLabel);
    }

    protected function _getSearchInput($bAsArray = false)
    {
        $sOnChange = $this->_getFilterOnChange();

        $aInputSearch = [
            'type' => 'text',
            'name' => 'search',
            'attrs' => [
                'id' => 'bx-grid-search-' . $this->_sObject,
                'aria-label' => _t('_Search'),
                'onKeyup' => 'javascript:$(this).off(\'keyup focusout\'); ' . $sOnChange,
                'onBlur' => 'javascript:' . $sOnChange,
            ]
        ];

        if($bAsArray)
            return $aInputSearch;

        $oForm = new BxTemplFormView([]);
        return $oForm->genRow($aInputSearch);
    }

    protected function _getCounter()
    {
        return _t('_sys_grid_total_count', $this->_iTotalCount);
    }

    /**
     * A column of controls (the row's checkbox, drag handle, switch and action buttons) is as wide as what is in it:
     * its width in `sys_grid_fields` is left out and its cells get this class (css/grid.css). Text columns share the
     * room that is left by their widths.
     */
    protected function _isControlsColumn ($sKey)
    {
        return in_array($sKey, ['checkbox', 'switcher', 'switcher_api', 'actions']) || (!empty($this->_aOptions['field_order']) && $this->_aOptions['field_order'] == $sKey);
    }

    /**
     * Default classes of a cell of controls (checkbox, drag handle, switch, action buttons).
     */
    protected function _getControlsCellClasses ($sKey)
    {
        return 'bx-def-padding-sec-bottom bx-def-padding-sec-top' . $this->_getCellHugClass($sKey);
    }

    protected function _getCellHugClass ($sKey)
    {
        return $this->_isControlsColumn($sKey) ? ' bx-grid-cell-hug' : '';
    }

    protected function _getCellWidthStyle ($sKey, $aField)
    {
        if(!isset($aField['width']) || $this->_isControlsColumn($sKey)) {
            return false;
        }

        $sWidth = $aField['width'];
        $fScale = $this->_getTextColumnsScale();
        if($fScale != 1.0) {
            $sWidth = round((float)$sWidth * $fScale, 2) . '%';
        }

        return 'width:' . $sWidth;
    }

    /**
     * The text columns' widths are percents of the table that left room for the columns of controls. Those take only
     * what is in them now, so the text columns' percents are scaled to fill the table: room they don't claim would go
     * to the columns of controls. 1 when a text column's width is not a percent.
     */
    protected function _getTextColumnsScale ()
    {
        if($this->_fTextColumnsScale !== null) {
            return $this->_fTextColumnsScale;
        }

        $fSum = 0;
        $aFields = !empty($this->_aOptions['fields']) && is_array($this->_aOptions['fields']) ? $this->_aOptions['fields'] : [];
        foreach($aFields as $sKey => $aField) {
            if($this->_isControlsColumn($sKey)) {
                continue;
            }

            if(!isset($aField['width']) || !preg_match('/^\s*[0-9.]+\s*%\s*$/', (string)$aField['width'])) {
                $fSum = 0;
                break;
            }

            $fSum += (float)$aField['width'];
        }

        return $this->_fTextColumnsScale = $fSum > 0 ? 100 / $fSum : 1.0;
    }

    protected function _limitMaxLength ($mixedValue, $sKey, $aField, $aRow, $isDisplayPopupOnTextOverflow, $bReturnString = true)
    {
        $iLimit = (int)$aField['chars_limit'];
        if($iLimit <= 0) {
            return $mixedValue;
        }

        // Text that fits one line of the column: as it is. A grid that shows no text in full cuts it there, as before.
        $sPlain = strip_tags($mixedValue);
        if(!$isDisplayPopupOnTextOverflow || mb_strlen($sPlain, 'UTF-8') <= $iLimit) {
            $sResult = $this->_oFunctions->getStringWithLimitedLength($sPlain, $iLimit);
            return $bReturnString ? $sResult : [$sResult];
        }

        // Longer text goes out whole (to a generous cap): the cell shows two lines of it, and all of it when pointed at.
        $this->_sCellClampText = $sPlain;
        $sResult = $this->_oFunctions->getStringWithLimitedLength($sPlain, $iLimit * $this->_iCharsLimitLinesMax);

        return $bReturnString ? $sResult : [$sResult];
    }

    protected function _convertAttrs ($aField, $sAttrName, $sClasses = false, $sStyles = false)
    {
        if (!empty($aField['hidden_on'])) {
            $aHiddenOn = array(
                pow(2, BX_DB_HIDDEN_PHONE - 1) => 'bx-def-media-phone-hide',
                pow(2, BX_DB_HIDDEN_TABLET - 1) => 'bx-def-media-tablet-hide',
                pow(2, BX_DB_HIDDEN_DESKTOP - 1) => 'bx-def-media-desktop-hide',
                pow(2, BX_DB_HIDDEN_MOBILE - 1) => 'bx-def-mobile-app-hide'
            );
            foreach ($aHiddenOn as $iHiddenOn => $sClass)
                if ((int)$aField['hidden_on'] & $iHiddenOn)
                    $sClasses .= ' ' . $sClass;
        }
            
        return bx_convert_array2attrs(
            isset($aField[$sAttrName]) && is_array($aField[$sAttrName]) ? $aField[$sAttrName] : array(),
            $sClasses,
            $sStyles
        );
    }

    protected function _updateOrder($mixedId, $iOrder)
    {
        $oDb = BxDolDb::getInstance();
        $sTable = $this->_aOptions['table'];
        $sFieldId = $this->_aOptions['field_id'];
        $sFieldOrder = $this->_aOptions['field_order'];
        $sQuery = $oDb->prepare("UPDATE `{$sTable}` SET `{$sFieldOrder}` = ? WHERE `{$sFieldId}` = ?", $iOrder, $mixedId);
        return $oDb->query($sQuery);
    }

    protected function _delete ($mixedId)
    {
        $oDb = BxDolDb::getInstance();
        $sTable = $this->_aOptions['table'];
        $sFieldId = $this->_aOptions['field_id'];
        $sQuery = $oDb->prepare("DELETE FROM `{$sTable}` WHERE `{$sFieldId}` = ?", $mixedId);
        return $oDb->query($sQuery);
    }

    protected function _enable ($mixedId, $isChecked)
    {
        $oDb = BxDolDb::getInstance();
        $sTable = $this->_aOptions['table'];
        $sFieldId = $this->_aOptions['field_id'];
        $sFieldActive = $this->_aOptions['field_active'];
        $sQuery = $oDb->prepare("UPDATE `{$sTable}` SET `$sFieldActive` = ? WHERE `{$sFieldId}` = ?", $this->_switcherChecked2State($isChecked), $mixedId);
        return $oDb->query($sQuery);
    }

    protected function _enableApi ($mixedId, $isChecked)
    {
        $sFieldActiveApi = $this->_getFieldActiveApi();
        if ($sFieldActiveApi === '' || empty($this->_aOptions['table']))
            return false;

        $oDb = BxDolDb::getInstance();
        $sTable = $this->_aOptions['table'];
        $sFieldId = $this->_aOptions['field_id'];
        $sQuery = $oDb->prepare("UPDATE `{$sTable}` SET `{$sFieldActiveApi}` = ? WHERE `{$sFieldId}` = ?", $this->_switcherChecked2State($isChecked), $mixedId);
        return $oDb->query($sQuery);
    }

    protected function _isAgEngine()
    {
        return isset($this->_aOptions['engine']) && $this->_aOptions['engine'] === 'ag';
    }

    /**
     * Window the infinite grid asks for. A grid with no paginate GET names still scrolls:
     * the data action then reads start and per_page.
     */
    protected function _agWindow()
    {
        $sStart = !empty($this->_aOptions['paginate_get_start']) ? (string)$this->_aOptions['paginate_get_start'] : 'start';
        $sPer = !empty($this->_aOptions['paginate_get_per_page']) ? (string)$this->_aOptions['paginate_get_per_page'] : 'per_page';

        $iStart = 0;
        if (bx_get($sStart) !== false && ($iStartGet = (int)bx_get($sStart)) >= 0)
            $iStart = $iStartGet;

        $iPerPage = 10;
        if (bx_get($sPer) !== false && ($iPerPageGet = (int)bx_get($sPer)) > 0)
            $iPerPage = $iPerPageGet;
        else if (!empty($this->_aOptions['paginate_per_page']))
            $iPerPage = (int)$this->_aOptions['paginate_per_page'];

        return [$sStart, $sPer, $iStart, $iPerPage];
    }

    /**
     * Page of rows for AG Grid. _bIsApi is on only while the cells are built, then put back,
     * so a web action does not start returning API blocks.
     */
    protected function _getDataAg()
    {
        if (!$this->_isAgEngine())
            return ['data' => [], 'total' => 0];

        $this->_replaceMarkers();

        $bWasApi = $this->_bIsApi;
        $iShowTotal = isset($this->_aOptions['show_total_count']) ? $this->_aOptions['show_total_count'] : 0;
        $this->_bIsApi = true;
        // The total is counted only when this option is on. Infinite row model needs it either way.
        $this->_aOptions['show_total_count'] = 1;

        try {
            $sFilter = $this->_getFilterValue();
            $sOrderField = $this->_getOrderValue();
            $sOrderDir = 0 === strcasecmp('desc', (string)bx_get($this->_aOptions['order_get_dir'])) ? 'DESC' : 'ASC';

            list(, , $iStart, $iPerPage) = $this->_agWindow();

            $aData = $this->_getData($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage);
            if (!is_array($aData))
                $aData = [];

            $aDecoded = array_values($this->decodeDataAPI($aData));
            $aSource = array_values($aData);
            foreach ($aDecoded as $iIndex => $aOut) {
                $aMeta = $this->_agRowMeta(isset($aSource[$iIndex]) && is_array($aSource[$iIndex]) ? $aSource[$iIndex] : []);
                if ($aMeta)
                    $aDecoded[$iIndex]['_meta'] = $aMeta;

                foreach ($aOut as $sKey => $mixedCell) {
                    if (!is_array($mixedCell) || !isset($mixedCell['type']) || $mixedCell['type'] !== 'actions' || empty($mixedCell['data']) || !is_array($mixedCell['data']))
                        continue;

                    foreach ($mixedCell['data'] as $iAction => $aAction) {
                        if (is_array($aAction) && !empty($aAction['icon']))
                            $aDecoded[$iIndex][$sKey]['data'][$iAction]['icon'] = $this->_agActionIcon($aAction['icon']);
                    }
                }
            }

            $aResult = [
                'data' => $aDecoded,
                'total' => (int)$this->_iTotalCount,
            ];
            if ((int)$iShowTotal === 1)
                $aResult['total_f'] = $this->_getCounter();

            return $aResult;
        } finally {
            $this->_bIsApi = $bWasApi;
            $this->_aOptions['show_total_count'] = $iShowTotal;
        }
    }

    protected function _getCodeAg($isDisplayHeader = true)
    {
        $this->_replaceMarkers();

        if ($isDisplayHeader && empty($this->_aOptions['paginate_url']))
            $this->resetQueryParams();

        $sFilter = $this->_getFilterValue();
        $sOrderField = $this->_getOrderValue();
        $sOrderDir = 0 === strcasecmp('desc', (string)bx_get($this->_aOptions['order_get_dir'])) ? 'DESC' : 'ASC';

        list($sStartName, $sPerName, $iStart, $iPerPage) = $this->_agWindow();

        $aQueryAppend = array_merge(is_array($this->_aQueryAppend) ? $this->_aQueryAppend : [], is_array($this->_aMarkers) ? $this->_aMarkers : []);
        if (!empty($this->_aQueryAppendExclude) && is_array($this->_aQueryAppendExclude))
            $aQueryAppend = array_diff_key($aQueryAppend, array_flip($this->_aQueryAppendExclude));

        $aOrderFields = $this->_getOrderFields();
        $aFields = !empty($this->_aOptions['fields']) && is_array($this->_aOptions['fields']) ? $this->_aOptions['fields'] : [];
        $aColumns = [];
        foreach ($aFields as $sKey => $aField) {
            $sTitle = isset($aField['title']) ? $aField['title'] : '';
            if ($sTitle === '')
                $sTitle = $this->_getCellHeaderFallbackTitle($sKey);

            $aColumns[] = [
                'name' => $sKey,
                'title' => $sTitle,
                'width' => isset($aField['width']) ? $aField['width'] : '',
                'sortable' => in_array($sKey, $aOrderFields) ? 1 : 0,
                'controls' => $this->_isControlsColumn($sKey) ? 1 : 0,
                'kind' => $this->_agCellKind($sKey, $aField),
            ];
        }

        $bReorder = false;
        foreach ($aColumns as $aColumn) {
            if ($aColumn['kind'] === 'order')
                $bReorder = true;
        }
        $sClassHeader = empty($this->_aOptions['show_total_count']) ? ' bx-gh-no-counter' : '';

        $aConfig = [
            'object' => $this->_sObject,
            'field_id' => $this->_aOptions['field_id'],
            'sortable' => $bReorder ? 1 : 0,
            'sorting' => empty($aOrderFields) ? 0 : 1,
            'sorting_field' => $sOrderField,
            'sorting_dir' => $sOrderDir,
            'start' => $iStart,
            'per_page' => $iPerPage,
            'show_total_count' => empty($this->_aOptions['show_total_count']) ? 0 : 1,
            'empty' => _t('_Empty'),
            'columns' => $aColumns,
            'bx' => [
                'csrf_token' => (string)BxDolForm::getCsrfToken(),
                'sortable' => 0,
                'sorting' => 0,
                'paginate_get_start' => $sStartName,
                'paginate_get_per_page' => $sPerName,
                'start' => $iStart,
                'per_page' => $iPerPage,
                'filter' => $sFilter,
                'filter_get' => (string)$this->_aOptions['filter_get'],
                'order_field' => $sOrderField,
                'order_dir' => $sOrderDir,
                'order_get_field' => (string)$this->_aOptions['order_get_field'],
                'order_get_dir' => (string)$this->_aOptions['order_get_dir'],
                'text_search_input' => _t('_sys_grid_search'),
                'popup_options' => $this->_agMap($this->_aPopupOptions),
                'query_append' => $this->_agMap($aQueryAppend),
                'confirm_messages' => $this->_agMap($this->_aConfirmMessages),
                'columns' => count($aFields),
            ],
        ];

        $aExtra = $this->_agExtraConfig();
        if ($aExtra)
            $aConfig = array_merge($aConfig, $aExtra);

        $aVars = [
            'object' => $this->_sObject,
            'id_table' => 'bx-grid-table-' . $this->_sObject,
            'id_cont' => 'bx-grid-cont-' . $this->_sObject,
            'id_wrap' => 'bx-grid-wrap-' . $this->_sObject,
            'id_grid' => 'bx-grid-ag-' . $this->_sObject,
            'config' => json_encode($aConfig, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE),
            'bx_if:display_header' => [
                'condition' => $isDisplayHeader,
                'content' => [
                    'class' => $sClassHeader,
                    'bx_if:actions_independent' => [
                        'condition' => !empty($this->_aOptions['actions_independent']),
                        'content' => [
                            'actions_independent' => $this->_getActions('independent'),
                        ],
                    ],
                    'bx_if:filter' => [
                        'condition' => !empty($this->_aOptions['filter_fields']) || !empty($this->_aOptions['filter_fields_translatable']),
                        'content' => [
                            'controls' => $this->_getFilterControls(),
                        ],
                    ],
                    'bx_if:counter' => [
                        'condition' => !empty($this->_aOptions['show_total_count']),
                        'content' => [
                            'counter' => '',
                        ],
                    ],
                ],
            ],
            'bx_if:display_footer' => [
                'condition' => !empty($this->_aOptions['actions_bulk']),
                'content' => [
                    'bx_if:actions_bulk' => [
                        'condition' => !empty($this->_aOptions['actions_bulk']),
                        'content' => [
                            'actions_bulk' => $this->_getActions('bulk'),
                        ],
                    ],
                ],
            ],
        ];

        // Subclasses add their own scripts here (navigation items, for one). AG files come after.
        $this->_addJsCss();
        $this->_addJsCssAg();

        return $this->_oTemplate->parseHtmlByName('grid_ag.html', $aVars);
    }

    /**
     * checkbox and the drag handle are not data columns. A field that shares its name with
     * field_order but has its own cell method (a date, for one) stays a data column.
     */
    protected function _agCellKind($sKey, $aField)
    {
        if ($sKey === 'checkbox')
            return 'checkbox';

        $sMethod = '_getCellDefault';
        if (!empty($this->_aOptions['field_order']) && $this->_aOptions['field_order'] == $sKey)
            $sMethod = '_getCellOrder';

        $sCustomMethod = '_getCell' . $this->_genMethodName($sKey);
        if (method_exists($this, $sCustomMethod))
            $sMethod = $sCustomMethod;
        else if (!empty($aField['secret']))
            $sMethod = '_getCellSecret';

        return $sMethod === '_getCellOrder' ? 'order' : '';
    }

    /**
     * Values the row needs that are not grid columns. A menu row carries its set, so the
     * expanded line can ask the items grid for that set.
     */
    protected function _agRowMeta($aRow)
    {
        return [];
    }

    /**
     * Icon of a row action in AG data. The cells are built in API mode, which keeps the raw icon
     * name, so a grid that draws its classic actions with other icons maps them here too.
     */
    protected function _agActionIcon($sIcon)
    {
        return $sIcon;
    }

    /**
     * Extra keys merged into the AG config. A grid that expands its rows returns `expand`.
     */
    protected function _agExtraConfig()
    {
        return [];
    }

    /**
     * json_encode turns an empty array into [], which the classic grid script treats as a list.
     * Query append, popups and confirm texts are maps.
     */
    protected function _agMap($mixed)
    {
        if (empty($mixed) || !is_array($mixed))
            return new stdClass();

        return $mixed;
    }

    protected function _addJsCssAg()
    {
        $this->_oTemplate->addCss([
            BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'ag-grid/|ag-grid.min.css',
            BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'ag-grid/|ag-theme-quartz.min.css',
            'grid_ag.css',
        ]);
        $this->_oTemplate->addJs([
            'ag-grid/ag-grid.min.js',
            'BxDolGridAg.js',
        ]);
    }

    protected function _addJsCss()
    {
        if ($this->_aOptions['field_order']) {            
            $this->_oTemplate->addJs(array(
                'jquery-ui/jquery-ui.min.js',
                'URI.min.js',
            ));
        }

        $this->_oTemplate->addJs('BxDolGrid.js');
        $this->_oTemplate->addCss('grid.css');

        $this->_oTemplate->addJsTranslation([
            '_sys_grid_confirmation',
            '_sys_grid_secret_reveal',
            '_sys_grid_secret_hide',
            '_sys_grid_secret_password_prompt',
        ]);
    }
}

/** @} */
