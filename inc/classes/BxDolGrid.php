<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Grid for any content.
 *
 * It allows to display some data as grid with ready to use features:
 * - paginate
 * - reordering
 * - sorting
 * - search
 * - actions
 *
 * The advantages of the this system:
 * - Less code to write - so you can concentrate on the main functionality.
 * - Flexibility - you can turn on/off ready features or override it for the custom behavior.
 *
 * Grid is working together with Paginate to look through the data in the grid. @see BxDolPaginate
 *
 * @section grid_create Creating the new Grid object:
 *
 * 1. add record to 'sys_objects_grid' table:
 *
 * - object: name of the grid object, in the format: vendor prefix, underscore, module prefix, underscore, internal identifier or nothing; for example: bx_profiles_admin - to display profiles in admin panel.
 * - source_type: type of the source data:
 *      - Sql: the source is SQL query.
 *      - Array: the source is serialized array.
 * - source: the source data, different for each 'source_type':
 *      - Sql: the SQL query string, without ORDER BY and LIMIT clauses, these clauses are added automatically for sorting, pagination and filtering.
 *      - Array: 2 dimentional serialized array string.
 * - table: table name (if 'source_type' is 'Sql'), to automatically update order field and delete records.
 * - field_id: name of the ID field.
 * - field_order: name of the order field.
 * - field_active: name of the field which determines if the row is active or disabled. This field is used to display row as disabled (ususally as grayed out).
 *      The following functions can be overrided for custom behavior:
 *      - '_switcherChecked2State' and '_switcherState2Checked': override these functions if value of 'field_active' field is different from '0' and '1'
 *      - '_enable': for custom behavior upon activation/deactivation
 *      - '_isRowDisabled' and '_isCheckboxDisabled': for displaying disabled rows which is not related to 'field_active' field.
 *      - '_isSwitcherOn': to display rows which are active/disabled by default.
 * - paginate_url: URL of the page for the grid, set it empty for AJAX paginate, or specify the url for regular page reloading in paginate, with the following markers:
 *      - {start}: starting record to show data from.
 *      - {per_page}: number of records per one page.
 * - paginate_per_page: number of records per one page.
 * - paginate_simple: show full or simple paginate, the following values are supported:
 *      - NULL: show full(big) paginate.
 *      - ''(empty string): show simple(small) paginate.
 *      - 'some url': show simple(small) paginate with "View All" link to the specified URL.
 * - paginate_get_start: GET variable name for 'start'.
 * - paginate_get_per_page: GET variable name for 'per_page'.
 * - filter_fields: comma separated list of field names to search in; if field contains language key then it is better to specify it in 'filter_fields_translatable'.
 * - filter_fields_translatable: comma separated list of field names to search in its translations; enter field name here if field contains language key.
 * - filter_mode: search mode:
 *      - like: use SQL LIKE expression for search, if 'source_type' is not 'Sql' it doesn't matter.
 *      - fulltext: use MATCH ... AGAINST expression for search, if 'source_type' is not 'Sql' it doesn't matter.
 *      - auto: use 'like' or 'fulltext', depending on 'useLikeOperator' setting option.
 * - sorting_fields: comma separated field names, which will be allowed for sorting, if field contains language keys, specify it in 'sorting_fields_translatable' field instead.
 * - sorting_fields_translatable: comma separated field names which need to be sorted by translations, enter field name here if field contains language key.
 * - visible_for_levels: bit field with set of member level ids. To use member level id in bit field - the level id minus 1 as power of 2 is used, for example:
 *      - user level id = 1 -> 2^(1-1) = 1
 *      - user level id = 2 -> 2^(2-1) = 2
 *      - user level id = 3 -> 2^(3-1) = 4
 *      - user level id = 4 -> 2^(4-1) = 8
 * - override_class_name: user defined class name which is derived from BxTemplGrid.
 * - override_class_file: the location of the user defined class, leave it empty if class is located in system folders.
 *
 * 2. Specify field names (columns in the grid) in sys_grid_fields table:
 *
 * - object: name of the Grid object.
 * - name: name of the field, it must refer to the SQL field name in the case of 'Sql' 'source_type' or index of the 2 dimentional array in the case of 'Array' 'source_type'.
 * - title: title of the field, the language key.
 * - width: width of the column in % or px, pt, etc.
 * - translatable: if field contains language key and it is needed to display translation for this key - set it to 1, by default 0.
 * - params: searialized array of additional params:
 *      - display: display function from BxDolFormCheckerHelper class, for example to convert unix timestamp to the regular date/time string.
 *      - attr_cell: tag attributes for the data cell.
 *      - attr_head: tag attributes for the header cell.
 * - order: order of the field.
 *
 * There are some fields which are always available, additionally to the provided set of fields:
 *
 * - order: display column as dragable handle, it makes sense if you have data ordered by some field
 *          and it is specified in field_order, field_id and table fields; reordering is not correctly
 *          working with paginate, so make sure that paginate_per_page number is big enough to show all records;
 *          reordering is working with Sql source_type.
 * - checkbox: display column with checkboxes, so several records can be selected for bulk action;
 *          you need to specify 'field_id' field, so every checkbox have unique row id;
 *          you need to specify bulk actions separately in 'sys_grid_actions' table;
 *          you can override '_isCheckboxSelected' function to display checkbox as checked by default.
 * - actions: display column with single actions, displayed as buttons; you need to specify field_id field,
 *          so every action is provided with unique row id; you need to specify single actions separately in sys_grid_actions table.
 *
 * 3. Add actions to sys_grid_actions table:
 *
 * - object: name of the Grid object.
 * - type: action type, one of the following:
 *      - bulk: bulk action, to perform on the set of records, the action is usually displaed below the grid.
 *      - single: simple action, to perform on one record, the action is usually displayed in the grid row.
 *      - independent: independent actionm which is not related to any rowm the action is usually displayed above the grid.
 * - name: action name.
 * - title: title of the action, the language key.
 * - icon: display action as icon, title need to be empty in this case.
 * - confirm: ask confirmation before performing the action, 0 or 1.
 * - order: order of the action in particular actions set by type.
 *
 * Usually you need to handle actions manually, but there are several actions which are available by default:
 *
 * - delete: delete the record, it works automatically when 'source_type' is 'Sql' and 'field_id', 'table' fields are specified.
 *
 *
 *
 * @section grid_display_custom_cell Displaying custom cell
 *
 * Cell is displayed with default design. It is possible to easily customize its design by specifying custom attributes as 'attr_cell' in params field in sys_grid_fields table.
 *
 * If it is not enough, you can customize it even more by adding the method to your custom class with the following format:
 * _getCell[field name]
 * where [field name] is the name of the field you want to have custom look with the capital first letter.
 *
 * For example:
 *
 * @code
 * protected function _getCellStatus ($mixedValue, $sKey, $aField, $aRow) {
 *
 *     $sAttr = $this->_convertAttrs(
 *         $aField, 'attr_cell',
 *         false,
 *         isset($aField['width']) ? 'width:' . $aField['width'] : false // add default styles
 *     );
 *     return '<td ' . $sAttr . '><span style="background-color:' . ('Active' == $mixedValue ? '#cfc' : '#fcc') . '">' . $mixedValue . '</span></td>';
 * }
 * @endcode
 *
 * Above example is displaying user's status using different colors depending on the status value. Please note that you need to convert attributes by adding some default classes or styles if you need.
 *
 *
 *
 * @section grid_display_custom_header Displaying custom column header
 *
 * This is working similar to displaying custom cell. It easily customize its design by specifying custom attributes as 'attr_head' in params field in sys_grid_fields table.
 * If it is not enough, you can customize it even more by adding the method to your custom class with the following format:
 * _getCellHeader[field name]
 * where [field name] is the name of the field you want to have custom look with the capital first letter.
 *
 * For example:
 *
 * @code
 * protected function _getCellHeaderStatus ($sKey, $aField) {
 *     $s = parent::_getCellHeaderDefault($sKey, $aField);
 *     return preg_replace ('/<th(.*?)>(.*?)<\/th>/', '<th$1><img src="' . BxDolTemplate::getInstance()->getIconUrl('user.png') . '"></th>', $s);
 * }
 * @endcode
 *
 * The above example replaces column header text with the image.
 *
 *
 *
 * @section grid_display_custom_action Displaying custom action
 *
 * All actions are displayed as buttons. Bulk and independent actions are displaed as big buttons and single actions are displayed as small buttons.
 *
 * It is possible to completely customize it by adding the following method to your custom class:
 * _getAction[action name]
 * where [action name] is the action name with the capital first letter.
 *
 * For example:
 *
 * @code
 * protected function _getActionCustom1 ($sType, $sKey, $a, $isSmall = false) {
 *     $sAttr = $this->_convertAttrs(
 *         $a, 'attr',
 *         'bx-btn bx-def-margin-sec-left' . ($isSmall ? ' bx-btn-small' : '') // add default classes
 *     );
 *     return '<button ' . $sAttr . ' onclick="$(this).off(); alert(\'default behaviour is overrided, so the action is not performed\');">' . $a['title'] . '</button>';
 * }
 * @endcode
 *
 * The above example disables default onclick event and just displays an alert. Please note that you need to convert attributes by adding some default classes or styles if you need.
 *
 *
 *
 * @section grid_add_action_handler Add action handler
 *
 * As it was mentioned earlier only several actions can be handled automatically, all other actions must be processed manually.
 * To add action handler you need to add method to your custom class with the following format:
 * performAction[action name]
 * where [action name] is the action name with the capital first letter.
 *
 * For example:
 *
 * @code
 * public function performActionApprove() {
 *
 *     $iAffected = 0;
 *     $aIds = bx_get('ids');
 *     if (!$aIds || !is_array($aIds)) {
 *         echoJson(array());
 *         exit;
 *     }
 *
 *     $aIdsAffected = array ();
 *     foreach ($aIds as $mixedId) {
 *         if (!$this->_approve($mixedId))
 *             continue;
 *         $aIdsAffected[] = (int)$mixedId;
 *         $iAffected++;
 *     }
 *
 *     echoJson(array(
 *         'msg' => $iAffected > 0 ? sprintf("%d profiles successfully activated", $iAffected) : "Profile(s) activation failed",
 *         'grid' => $this->getCode(false),
 *         'blink' => $aIdsAffected,
 *     ));
 * }
 *
 * protected function _approve ($mixedId) {
 *     $oDb = BxDolDb::getInstance();
 *     $sTable = $this->_aOptions['table'];
 *     $sFieldId = $this->_aOptions['field_id'];
 *     $sQuery = $oDb->prepare("UPDATE `{$sTable}` SET `Status` = 'Active' WHERE `{$sFieldId}` = ?", $mixedId);
 *     return $oDb->query($sQuery);
 * }
 * @endcode
 *
 * The action can be used as 'single' or 'bulk', in the case of 'single' action 'ids' array always has one element.
 *
 * As the result, action must outputs JSON array, which is done by echoJson function.
 * The defined indexes in the array determines behavior after action is performed, the following behaviors are supported:
 *
 * - msg: display javascript alert message.
 * - grid: reload grid data with the provided HTML code.
 * - popup: display popup with the provided HTML code.
 * - blink: highlight(blink effect) the specified rows, by the ids.
 *
 */

class BxDolGrid extends BxDolFactory implements iBxDolFactoryObject, iBxDolReplaceable
{
    protected $_bIsApi;

    protected $_aMarkers = array ();

    protected $_sObject;
    protected $_aOptions;

    protected $_aBrowseParams;
    protected $_sDefaultSortingOrder = 'ASC';
    protected $_iTotalCount = 0;

    protected $_bActionCsrfChecking;

    /**
     * Constructor
     * @param $aOptions array of grid options
     */
    protected function __construct($aOptions)
    {
        parent::__construct();

        $this->_bIsApi = bx_is_api();

        $this->_bActionCsrfChecking = true;

        $this->_sObject = $aOptions['object'];
        $this->_aOptions = $aOptions;

        $sBrowseParams = bx_get('bp');
        if(!empty($sBrowseParams)) {
        	$aBrowseParams = bx_process_input(json_decode(urldecode($sBrowseParams), true));
        	if(!empty($aBrowseParams) && is_array($aBrowseParams))
            	$this->setBrowseParams($aBrowseParams);
        }
    }

    /**
     * Get grid object instance by object name
     * @param $sObject object name
     * @return object instance or false on error
     */
    public static function getObjectInstance($sObject, $oTemplate = false)
    {
        if (isset($GLOBALS['bxDolClasses']['BxDolGrid!'.$sObject]))
            return $GLOBALS['bxDolClasses']['BxDolGrid!'.$sObject];

        $aObject = BxDolGridQuery::getGridObject($sObject);
        if (!$aObject || !is_array($aObject))
            return false;

        $sClass = 'BxTemplGrid';
        if (!empty($aObject['override_class_name'])) {
            $sClass = $aObject['override_class_name'];
            if (!empty($aObject['override_class_file']))
                require_once(BX_DIRECTORY_PATH_ROOT . $aObject['override_class_file']);
        }

        $o = new $sClass($aObject, $oTemplate);

        if (!$o->_isVisibleGrid($aObject))
            return false;

        return ($GLOBALS['bxDolClasses']['BxDolGrid!'.$sObject] = $o);
    }

    public function getObject()
    {
        return $this->_sObject;
    }

    /**
     * Add replace markers. Curently markers are replaced in 'source' field
     * @param $a array of markers as key => value
     * @return true on success or false on error
     */
    public function addMarkers ($a)
    {
        if (empty($a) || !is_array($a))
            return false;
        $this->_aMarkers = array_merge ($this->_aMarkers, $a);
        return true;
    }

    public function setBrowseParams($aBrowseParams)
    {
    	$this->_aBrowseParams = $aBrowseParams;
    	$this->_aQueryAppend['bp'] = urlencode(json_encode($this->_aBrowseParams));
    }

    /**
     * Replace provided markers in form array
     * @param $a form description array
     * @return array where markes are replaced with real values
     */
    protected function _replaceMarkers ()
    {
        $this->_aOptions['source'] = bx_replace_markers($this->_aOptions['source'], $this->_aMarkers);
    }

    protected function _getData ($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage)
    {
        $sFunc = '_getData' . $this->_aOptions['source_type'];
        return $this->$sFunc($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage);
    }
    
    protected function _getDataArray ($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage)
    {
        if ($this->_aOptions['source'] && !is_array($this->_aOptions['source'])) {
            $this->_aOptions['source'] = unserialize($this->_aOptions['source']);
        }

        // apply filter
        if ($sFilter && (!empty($this->_aOptions['filter_fields']) || !empty($this->_aOptions['filter_fields_translatable']))) {
            $aSource = array();
            foreach ($this->_aOptions['source'] as $aRow) {
                $bFound = false;
                if (!empty($this->_aOptions['filter_fields'])) {
                    foreach ($this->_aOptions['filter_fields'] as $sField) {
                        if (empty($aRow[$sField]) || false === stripos($aRow[$sField], $sFilter))
                            continue;
                        $aSource[] = $aRow;
                        $bFound = true;
                        break;
                    }
                }
                if (!$bFound && !empty($this->_aOptions['filter_fields_translatable'])) {
                    foreach ($this->_aOptions['filter_fields_translatable'] as $sField) {
                        if (empty($aRow[$sField]) || false === stripos(_t($aRow[$sField]), $sFilter))
                            continue;
                        $aSource[] = $aRow;
                        $bFound = true;
                        break;
                    }
                }
            }
        } else {
            $aSource = &$this->_aOptions['source'];
        }

        // sort
        $sSortField = false;
        $iSortDir = 1;
        if ($sOrderField && ($aSortingFields = $this->_getOrderFields()) && in_array($sOrderField, $aSortingFields)) { // explicit order
            $sSortField = $sOrderField;
            $iSortDir = 0 === strcasecmp($sOrderDir, 'desc') ? -1 : 1;
        } elseif (!empty($this->_aOptions['field_order'])) { // order by "order" field
            $sSortField = $this->_aOptions['field_order'];
        }

        if ($sSortField) {
            $aSourceOrdered = $aSource;
            $this->_tmpOrderField = $sSortField;
            $this->_tmpOrderDir = $iSortDir;
            usort($aSourceOrdered, array($this, '_cmp'));
        } else {
            $aSourceOrdered = &$aSource;
        }
        
        // calculate total records count
        if ($this->_aOptions['show_total_count'] == 1){
            $this->_iTotalCount =  count($aSourceOrdered);
        }
        return array_slice($aSourceOrdered, $iStart, $iPerPage, true);
    }

   protected function _getDataSql ($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage)
   {
        $oDb = BxDolDb::getInstance();
        $sQuery = $this->_aOptions['source'];
        if (false === stripos($sQuery, ' WHERE '))
            $sQuery .= " WHERE 1 ";

        $aResults = false;
        /**
         * @hooks
         * @hookdef hook-grid-get_data 'grid', 'get_data' - hook to override the data to be shown in the grid
         * - $unit_name - equals `grid`
         * - $action - equals `get_data`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `object` - [string] grid object name
         *      - `options` - [array] grid options array as key&value pairs
         *      - `markers` - [array] markers array as key&value pairs
         *      - `filter` - [string] filter value
         *      - `browse_params` - [array] additional browse params array as key&value pairs
         *      - `results` - [array] by ref, array of grid rows, where each row is an array of fields values, can be overridden in hook processing
         * @hook @ref hook-grid-get_data
         */
        bx_alert('grid', 'get_data', 0, false, [
            'object' => $this->_sObject, 
            'options' => $this->_aOptions, 
            'markers' => $this->_aMarkers, 
            'filter' => $sFilter, 
            'browse_params' => $this->_aBrowseParams, 
            'results' => &$aResults
        ]);
    	if($aResults !== false)
    	    return $aResults;

        // add filter condition
        $sQuery = $this->_modifyDataSqlWhereClause($sQuery, $sFilter, $sOrderByFilter);

        // add custom filter condition and order
        $sOrderByFilter = '';
        $sQuery .= $this->_getDataSqlWhereClause($sFilter, $sOrderByFilter);

        // calculate total records count
        if ($this->_aOptions['show_total_count'] == 1){
             $this->_iTotalCount = $this->_getDataSqlCounter($sQuery, $sFilter);
        }
        
        // add order
        $sQuery .= $this->_getDataSqlOrderClause ($sOrderByFilter, $sOrderField, $sOrderDir);
        
        $sQuery = $sQuery . $oDb->prepareAsString(' LIMIT ?, ?', $iStart, $iPerPage);
        return $oDb->getAll($sQuery);
    }

    protected function _getDataSqlCounter($sQuery, $sFilter)
    {
        $oDb = BxDolDb::getInstance();

        $sQuery = preg_replace("/^SELECT.*FROM/mU", "SELECT COUNT(*) FROM ", $sQuery);
        if(strpos($sQuery, 'GROUP BY') === false)
            return $oDb->getOne($sQuery);
        else
            return array_sum($oDb->getColumn($sQuery));
    }
   
    protected function _modifyDataSqlWhereClause($sQuery, $sFilter, &$sOrderByFilter)
    {
        if(!$sFilter || (empty($this->_aOptions['filter_fields']) && empty($this->_aOptions['filter_fields_translatable']))) 
            return $sQuery;

        $oDb = BxDolDb::getInstance();

        $sMode = $this->_aOptions['filter_mode'];
        if($sMode != 'like' && $sMode != 'fulltext')
            $sMode = getParam('useLikeOperator') ? 'like' : 'fulltext';

        $sCond = '';
        $sJoin = '';
        if('like' == $sMode) { // LIKE search

            // condition for regular fields
            if (!empty($this->_aOptions['filter_fields']))
                foreach ($this->_aOptions['filter_fields'] as $sField)
                    $sCond .= $oDb->prepareAsString("`{$sField}` LIKE ? OR ", '%' . $sFilter . '%');

            // condition for translatable fields
            if (!empty($this->_aOptions['filter_fields_translatable'])) {
                $sCondFields = '';
                foreach ($this->_aOptions['filter_fields_translatable'] as $sField)
                    $sCondFields .= "`k`.`Key` = `{$sField}` OR ";

                $sCondFields = rtrim($sCondFields, ' OR ');

                if ($sCondFields) {
                    $sJoin .= " INNER JOIN `sys_localization_keys` AS `k` ON " . $sCondFields . " INNER JOIN `sys_localization_strings` AS `s` ON `k`.`ID` = `s`.`IDKey` ";
                    $sCond .= $oDb->prepareAsString("`s`.`string` LIKE ? ", '%' . $sFilter . '%');
                }
            }

            $sCond = rtrim($sCond, ' OR ');

        } 
        else { // FULLTEXT search

            // condition for regular fields
            if (!empty($this->_aOptions['filter_fields'])) {

                $sCondFields = '';
                foreach ($this->_aOptions['filter_fields'] as $sField)
                    $sCondFields .= "`{$sField}`,";

                $sCondFields = rtrim($sCondFields, ',');

                if ($sCondFields) {
                    $sCond = $oDb->prepareAsString(" MATCH ($sCondFields) AGAINST (?) ", $sFilter);
                    $sOrderByFilter = $sCond;
                    $sCond .= ' > 1 OR ';
                }
            }

            // condition for translatable fields
            if (!empty($this->_aOptions['filter_fields_translatable'])) {

                $sCondFields = '';
                foreach ($this->_aOptions['filter_fields_translatable'] as $sField)
                    $sCondFields .= "`k`.`Key` = `{$sField}` OR ";

                $sCondFields = rtrim($sCondFields, ',');

                if ($sCondFields) {
                    $sJoin .= " INNER JOIN `sys_localization_strings` AS `s` INNER JOIN `sys_localization_keys` AS `k` ON (`k`.`ID` = `s`.`IDKey`) ";
                    $sCond .= $oDb->prepareAsString(" (MATCH (`s`.`string`) AGAINST (?) AND ($sCondFields)) OR ", $sFilter);
                }
            }

            $sCond = rtrim($sCond, ' OR ');
        }

        /**
         * @hooks
         * @hookdef hook-grid-get_data_by_filter 'grid', 'get_data_by_filter' - hook to override the data to be shown in the grid
         * - $unit_name - equals `grid`
         * - $action - equals `get_data_by_filter`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `object` - [string] grid object name
         *      - `options` - [array] grid options array as key&value pairs
         *      - `markers` - [array] markers array as key&value pairs
         *      - `filter` - [string] filter value
         *      - `browse_params` - [array] additional browse params array as key&value pairs
         *      - `conditions` - [string] by ref, 'where' part of SQL query in accordance with provided filter(s), can be overridden in hook processing
         * @hook @ref hook-grid-get_data_by_filter
         */
        bx_alert('grid', 'get_data_by_filter', 0, false, [
            'object' => $this->_sObject, 
            'options' => $this->_aOptions, 
            'markers' => $this->_aMarkers, 
            'filter' => $sFilter, 
            'browse_params' => $this->_aBrowseParams, 

            'query' => &$sQuery,
            'conditions' => &$sCond,
            'join' => &$sJoin,

            'query_ref' => &$sQuery,
            'conditions_ref' => &$sCond,
            'join_ref' => &$sJoin,
        ]);

        // add WHERE for searching in translatable fields
        $sQuery .= $sCond ? ' AND (' . $sCond . ')' : $sCond;

        if (!empty($this->_aOptions['filter_fields_translatable'])) {

            // add JOIN for searching in translatable fields
            $sQuery = str_replace('WHERE', "$sJoin WHERE", $sQuery);

            // change SELECT * to include table name
            $sQuery = ltrim($sQuery);
            if (preg_match("/^SELECT\s\*\sFROM\s`(.*?)`/i", $sQuery)) {
                $sQuery = preg_replace("/^SELECT\s\*\sFROM\s`(.*?)`/i", "SELECT $1.* FROM `$1`", $sQuery);
            }

            // add DISTINCT for searching in translatable fields to remove duplicates
            if (false === mb_stripos($sQuery, 'DISTINCT')) {
                $sQuery = preg_replace('/^SELECT/i', 'SELECT DISTINCT', $sQuery);
            }
        }

        return $sQuery;
    }

    protected function _getDataSqlWhereClause($sFilter, &$sOrderByFilter)
    {
        if(!$sFilter || (empty($this->_aOptions['filter_fields']) && empty($this->_aOptions['filter_fields_translatable']))) 
            return '';

        /**
         * @hooks
         * @hookdef hook-grid-get_data_by_filter 'grid', 'get_data_by_filter' - hook to override the data to be shown in the grid
         * - $unit_name - equals `grid`
         * - $action - equals `get_data_by_filter`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `object` - [string] grid object name
         *      - `options` - [array] grid options array as key&value pairs
         *      - `markers` - [array] markers array as key&value pairs
         *      - `filter` - [string] filter value
         *      - `browse_params` - [array] additional browse params array as key&value pairs
         *      - `conditions` - [string] by ref, 'where' part of SQL query in accordance with provided filter(s), can be overridden in hook processing
         * @hook @ref hook-grid-get_data_by_filter
         */
        bx_alert('grid', 'get_data_by_filter', 0, false, [
            'object' => $this->_sObject, 
            'options' => $this->_aOptions, 
            'markers' => $this->_aMarkers, 
            'filter' => $sFilter, 
            'browse_params' => $this->_aBrowseParams, 
            'conditions' => &$sCond
        ]);

        return $sCond ? ' AND (' . $sCond . ')' : $sCond;
    }

    protected function _getDataSqlOrderClause ($sOrderByFilter, $sOrderField, $sOrderDir, $bFieldsOnly = false)
    {
        $sOrderClause = '';

        if ($sOrderField && ($aSortingFields = $this->_getOrderFields()) && in_array($sOrderField, $aSortingFields)) { // explicit order

            $sDir = (0 === strcasecmp($sOrderDir, 'desc') ? 'DESC' : 'ASC');

            if (($aSortingFieldsTranslatable = $this->_getOrderFieldsTranslatable()) && in_array($sOrderField, $aSortingFieldsTranslatable)) {

                // translatable fields
                $iLang = BxDolLanguages::getInstance()->getCurrentLangId();
                $oDb = BxDolDb::getInstance();
                $sOrderClause = $oDb->prepareAsString("(SELECT `s`.`string` FROM `sys_localization_strings` AS `s` INNER JOIN `sys_localization_keys` AS `k` ON (`k`.`ID` = `s`.`IDKey`) WHERE `k`.`KEY` = `$sOrderField` AND `s`.`IDLanguage` = ? LIMIT 1) ", $iLang) . $sDir;

            } else {

                // regular fields
                $sOrderClause = "`" . $sOrderField . "` $sDir";

            }

        } elseif ($sOrderByFilter) { // order by filter

            $sOrderClause = $sOrderByFilter . " DESC";

        } elseif (!empty($this->_aOptions['field_order'])) { // order by "order" field

            if (false == strpos($this->_aOptions['field_order'], ',')) {
                $sOrderClause = "`" . $this->_aOptions['field_order'] . "` " . $this->_sDefaultSortingOrder;
            } else {
                $a = explode(',', $this->_aOptions['field_order']);
                foreach ($a as $sField)
                    $sOrderClause .= "`" . trim($sField) . "` " . $this->_sDefaultSortingOrder . ", ";

                if ($sOrderClause)
                    $sOrderClause = trim($sOrderClause, ', ');
            }

        }

        return $bFieldsOnly || empty($sOrderClause) ? $sOrderClause : " ORDER BY " . $sOrderClause;
    }

    protected function _getDataUpdated ($aIds)
    {
        $sFunc = '_getData' . $this->_aOptions['source_type'] . 'Updated';
        return method_exists($this, $sFunc) ? $this->$sFunc($aIds) : [];
    }

    protected function _getDataSqlUpdated ($aIds)
    {
        $oDb = BxDolDb::getInstance();
        $sQuery = $this->_aOptions['source'];
        if (false === stripos($sQuery, ' WHERE '))
            $sQuery .= " WHERE 1 ";

        $aResults = false;
        /**
         * @hooks
         * @hookdef hook-grid-get_data_updated 'grid', 'get_data_updated' - hook to override the updated data to be shown in the grid
         * - $unit_name - equals `grid`
         * - $action - equals `get_data_updated`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `object` - [string] grid object name
         *      - `options` - [array] grid options array as key&value pairs
         *      - `markers` - [array] markers array as key&value pairs
         *      - `ids` - [array] IDs to show updated data for
         *      - `browse_params` - [array] additional browse params array as key&value pairs
         *      - `results` - [array] by ref, array of grid rows, where each row is an array of fields values, can be overridden in hook processing
         * @hook @ref hook-grid-get_data_updated
         */
        bx_alert('grid', 'get_data_updated', 0, false, [
            'object' => $this->_sObject, 
            'options' => $this->_aOptions, 
            'markers' => $this->_aMarkers, 
            'ids' => $aIds, 
            'browse_params' => $this->_aBrowseParams, 
            'results' => &$aResults
        ]);
        if($aResults !== false)
            return $aResults;

        if(!$this->_aOptions['field_id'] || !$aIds || !is_array($aIds))
            return [];

        $sFieldId = $this->_aOptions['field_id'];
        if(($sTableAlias = $this->_getTableAlias()))
            $sFieldId = '`' . $sTableAlias . '`.' . $sFieldId;

        $sQuery .= ' AND ' . $sFieldId . ' IN (' . $oDb->implode_escape($aIds) . ')';

        return $oDb->getAll($sQuery);
    }

    protected function _getCellData($sKey, $aField, $aRow)
    {
        if (isset($aRow[$sKey])) {
            if (!empty($aField['display'])) {
                bx_import('BxDolForm');
                $sDisplayFunc = 'display' . $aField['display'];
                $oDisplay = new BxDolFormCheckerHelper();
                return $oDisplay->$sDisplayFunc($aRow[$sKey]);
            } else {
                return bx_process_output($aRow[$sKey]);
            }
        } else {
            return _t('_undefined');
        }
    }

    protected function _cmp ($r1, $r2)
    {
        $iRet = strcasecmp($r1[$this->_tmpOrderField], $r2[$this->_tmpOrderField]);
        return $iRet ? $this->_tmpOrderDir * $iRet : 0;
    }

    protected function _genMethodName ($s)
    {
        return bx_gen_method_name($s);
    }

    protected function _isVisibleGrid ($a)
    {
        if (isAdmin() || !isset($a['visible_for_levels']))
            return true;
        return BxDolAcl::getInstance()->isMemberLevelInSet($a['visible_for_levels']);
    }

    protected function _getFilterValue()
    {
        return bx_unicode_urldecode(bx_process_input(bx_get($this->_aOptions['filter_get'])));
    }

    protected function _getTableAlias()
    {
        return '';
    }

    protected function _getOrderFields($bTranslatable = false)
    {
        $sKey = 'sorting_fields' . ($bTranslatable ? '_translatable' : '');
        return !empty($this->_aOptions[$sKey]) && is_array($this->_aOptions[$sKey]) ? $this->_aOptions[$sKey] : [];
    }

    protected function _getOrderFieldsTranslatable()
    {
        return $this->_getOrderFields(true);
    }

    protected function _getOrderValue()
    {
        return bx_unicode_urldecode(bx_process_input(bx_get($this->_aOptions['order_get_field'])));
    }

    public function setActionCsrfChecking($bCsrfChecking)
    {
        $this->_bActionCsrfChecking = $bCsrfChecking;
    }

    public function isActionCsrfCheckingDisabled() {
        return !$this->_bActionCsrfChecking;
    }
}

/** @} */
