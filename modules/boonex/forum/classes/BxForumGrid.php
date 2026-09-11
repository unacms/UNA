<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Forum Forum
 * @ingroup     UnaModules
 *
 * @{
 */

require_once(BX_DIRECTORY_PATH_INC . "design.inc.php");

define('BX_FORUM_FILTER_STATUS_RESOLVED', 'yes');
define('BX_FORUM_FILTER_STATUS_UNRESOLVED', 'no');

define('BX_FORUM_FILTER_ORDER_RECENT', 'latest');
define('BX_FORUM_FILTER_ORDER_NEW', 'new');
define('BX_FORUM_FILTER_ORDER_TOP', 'top');
define('BX_FORUM_FILTER_ORDER_UPDATED', 'updated');
define('BX_FORUM_FILTER_ORDER_POPULAR', 'popular');
define('BX_FORUM_FILTER_ORDER_FEATURED', 'featured');
define('BX_FORUM_FILTER_ORDER_FAVORITE', 'favorite');
define('BX_FORUM_FILTER_ORDER_PARTAKEN', 'partaken');

class BxForumGrid extends BxBaseModGeneralGrid
{
    protected $_sDefaultSource; 

    protected $_sFilter1Name;
    protected $_sFilter1Value;
    protected $_aFilter1Values;
    
    protected $_sFilter2Name;
    protected $_sFilter2Value;
    protected $_aFilter2Values;
    
    protected $_sFilter3Name;
    protected $_sFilter3Value;
    protected $_aFilter3Values;

    public function __construct ($aOptions, $oTemplate = false)
    {
        $this->_sModule = 'bx_forum';

        parent::__construct ($aOptions, $oTemplate);
        
        $this->_sFilter1Name = 'filter1';
        $this->_aFilter1Values = [
            '' => _t('_bx_forum_grid_filter_resolved_all'),
            BX_FORUM_FILTER_STATUS_RESOLVED => _t('_bx_forum_grid_filter_resolved_resolved'),
            BX_FORUM_FILTER_STATUS_UNRESOLVED => _t('_bx_forum_grid_filter_resolved_unresolved'),
        ];

        if(($sFilter1 = bx_get($this->_sFilter1Name)) !== false) {
            $this->_sFilter1Value = bx_process_input($sFilter1);
            $this->_aQueryAppend['filter1'] = $this->_sFilter1Value;
        }

        $this->_sFilter2Name = 'filter2';
        $this->_aFilter2Values = [];

        $aBadges = BxDolBadges::getInstance()->getData(['type' => 'by_module', 'module' => $this->_oModule->_aModule['name']]);
        if(is_array($aBadges) && count($aBadges) > 0) {
            $this->_aFilter2Values[''] = _t('_bx_forum_grid_filter_badges_all');

            foreach($aBadges as $aBadge)
                $this->_aFilter2Values[$aBadge['id']] = $aBadge['text'];
        }

        if(($sFilter2 = bx_get($this->_sFilter2Name)) !== false) {
            $this->_sFilter2Value = bx_process_input($sFilter2);
            $this->_aQueryAppend['filter2'] = $this->_sFilter2Value;
        }

        $this->_sFilter3Name = 'filter3';
        $this->_aFilter3Values = [
            BX_FORUM_FILTER_ORDER_RECENT => _t('_bx_forum_grid_filter_order_updated'),
            BX_FORUM_FILTER_ORDER_NEW => _t('_bx_forum_grid_filter_order_new'),
            BX_FORUM_FILTER_ORDER_TOP => _t('_bx_forum_grid_filter_order_top'),
            BX_FORUM_FILTER_ORDER_POPULAR => _t('_bx_forum_grid_filter_order_popular'),
            BX_FORUM_FILTER_ORDER_FEATURED => _t('_bx_forum_grid_filter_order_featured'),
            BX_FORUM_FILTER_ORDER_FAVORITE => _t('_bx_forum_grid_filter_order_favorite'),
            BX_FORUM_FILTER_ORDER_PARTAKEN => _t('_bx_forum_grid_filter_order_partaken'),
        ];

        if(($sFilter3 = bx_get($this->_sFilter3Name)) !== false) {
            $this->_sFilter1Value = bx_process_input($sFilter3);
            $this->_aQueryAppend['filter3'] = $this->_sFilter1Value;
        }

        $this->_aFilterAreaLabels = [
            $this->_sFilter3Name => '_sys_grid_lbl_order', // "Order": filter3 has no placeholder option to borrow a name from
        ];

        $this->_sDefaultSortingOrder = 'DESC';
        $this->_sDefaultSource = $this->_aOptions['source'];
    }

    public function setBrowseParams($aParams)
    {
        if(isset($aParams['ajax_paginate'])) {
            if(!$aParams['ajax_paginate']) {
                list($sPageLink, $aPageParams) = bx_get_base_url_inline();

                $aPageParams[$this->_aOptions['paginate_get_start']] = '{start}';
                $this->_aOptions['paginate_url'] = BxDolPermalinks::getInstance()->permalink(bx_append_url_params($sPageLink, $aPageParams, true, ['{start}']));
            }

            unset($aParams['ajax_paginate']);
        }
        
        if ($aParams['type'])
            $this->_sFilter3Value = $aParams['type'];

        parent::setBrowseParams($aParams);

    	$sField = 'added';
    	if(!empty($this->_aBrowseParams['type']))
            switch($this->_aBrowseParams['type']) {
                case 'new':
                case 'index':
                case 'author':
                case 'favorite':
                case 'category':
                    $sField = 'added';
                    break;

                case 'featured':
                    $sField = 'featured';
                    break;

                case 'latest':
                    $sField = 'lr_timestamp';
                    break;

                case 'popular':
                    $sField = 'views';
                    break;
            }

        $this->_aOptions['field_order'] = $sField;
        $this->_aOptions['paginate_per_page'] = !empty($this->_aBrowseParams['per_page']) ? (int)$this->_aBrowseParams['per_page'] : (int)$this->_oModule->_oDb->getParam('bx_forum_per_page_browse');
    }

    public function getCode ($isDisplayHeader = true)
    {
        $sCode = parent::getCode($isDisplayHeader);
        if(empty($sCode))
            return '';

    	return $this->_oModule->_oTemplate->parseHtmlByName('units.html', array(
            'code' => $sCode,
            'js_code' => $this->_oModule->_oTemplate->getJsCode('main')
        ));
    }

    protected function _getActionAdd ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        if($this->_oModule->checkAllowedAdd() !== CHECK_ACTION_RESULT_ALLOWED)
            return '';

        $sUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $this->_oModule->_oConfig->CNF['URI_ADD_ENTRY']));

        unset($a['attr']['bx_grid_action_independent']);
        $a['attr'] = array_merge($a['attr'], array(
    		"onclick" => "window.open('" . $sUrl . "','_self');"
    	));

        return parent::_getActionDefault ($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    protected function _getRowHead ()
    {
    	return array();
    }

    protected function _getCellDefault ($mixedValue, $sKey, $aField, $aRow)
    {
        $aField['attr_cell']['class'] = 'bx-grid-table-cell-' . $sKey;

        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellAuthor($mixedValue, $sKey, $aField, $aRow)
    {
    	$mixedValue = $this->_oModule->_oTemplate->getEntryAuthor($aRow);

        return self::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }
    
    protected function _getCellCategory($mixedValue, $sKey, $aField, $aRow)
    {
        $sIcon = $this->_oModule->_oTemplate->parseHtmlByName('default_category.html', []);
        $o = BxDolCategory::getObjectInstance('bx_forum_cats');
        
        $aCategoryData = $this->_oModule->_oDb->getCategories(array('type' => 'by_category', 'category' => $aRow['cat']));

        if(isset($aCategoryData['icon']))
            $sIcon = $this->_oTemplate->getImage($aCategoryData['icon'], array('class' => 'sys-icon'));
        
        $mixedValue = $this->_oModule->_oTemplate->parseHtmlByName('thumb.html', ['icon' => $sIcon, 'title' => $o->getCategoryTitle($aRow['cat'])]);
        return self::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }
    
    protected function _getCellRating($mixedValue, $sKey, $aField, $aRow)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $oObject = isset($CNF['OBJECT_SCORES']) ? BxDolScore::getObjectInstance($CNF['OBJECT_SCORES'], $aRow[$CNF['FIELD_ID']], true, $this->_oModule->_oTemplate) : null;
        $mixedValue = $oObject ? $oObject->getElementInline() : '';
        
        return self::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }
    
    protected function _getCellParticipants($mixedValue, $sKey, $aField, $aRow)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
    	$oObject = isset($CNF['OBJECT_COMMENTS']) ? BxDolCmts::getObjectInstance($CNF['OBJECT_COMMENTS'], $aRow[$CNF['FIELD_ID']]) : null;
      
        $mixedValue = $oObject ? $oObject->getCounter(['show_counter_empty' => true, 'show_counter' => false, 'show_counter_style' => 'simple', 'dynamic_mode' => true, 'show_icon' => false, 'caption_empty' => '']) : '';

        return self::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellText($mixedValue, $sKey, $aField, $aRow)
    {
        $mixedValue = $this->_oModule->_oTemplate->getEntryPreview($aRow, ['show_meta_counters' => false, 'show_meta_reply' => false]);

        return self::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _addJsCss()
    {
        parent::_addJsCss();

        $this->_oModule->_oTemplate->addJs(array('main.js'));
        $this->_oModule->_oTemplate->addCss(array('main.css', 'main-media-phone.css', 'main-media-tablet.css', 'main-media-desktop.css'));
    }

    protected function _getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        
        if(strpos($sFilter, $this->_sParamsDivider) !== false)
            list($this->_sFilter1Value, $this->_sFilter2Value, $this->_sFilter3Value, $sFilter) = explode($this->_sParamsDivider, $sFilter);

        $bAuthor = false;
        $iAuthorId = bx_get_logged_profile_id();
    	if(!empty($this->_aBrowseParams['author']) && ($oProfileAuthor = BxDolProfile::getInstance((int)$this->_aBrowseParams['author'])) !== false) {
            $bAuthor = true;
            $iAuthorId = $oProfileAuthor->id();
    	}

        // featured
        if ($this->_sFilter3Value == BX_FORUM_FILTER_ORDER_FEATURED) {
            $this->_aBrowseParams['where'] = ['fld' => 'featured', 'val' => 0, 'opr' => '<>'];
        }
        
        // partaken
        if ($this->_sFilter3Value == BX_FORUM_FILTER_ORDER_PARTAKEN) {
            $this->_aBrowseParams['select'] = [
                'tbla' => 'tco', 
                'fld' => 'cmt_author_id',
            ];

            $this->_aBrowseParams['join'] = [
                'tp' => 'LEFT',
                'tbl1' => 'bx_forum_cmts',
                'tbl1a' => 'tco',
                'fld1' => 'cmt_object_id',
                'tbl2' => 'bx_forum_discussions',
                'fld2' => 'id'
            ];

            $this->_aBrowseParams['where'] = ['grp' => true, 'opr' => 'OR', 'cnds' => [[
                    'tbl' => 'bx_forum_discussions',
                    'fld' => 'author',
                    'val' => $iAuthorId, 
                    'opr' => '='
                ], [
                    'tbl' => 'tco', 
                    'fld' => 'cmt_author_id', 
                    'val' => $iAuthorId, 
                    'opr' => '='
                ]
            ]];

            $this->_aBrowseParams['group_by'] = [
                'tbl' => 'bx_forum_discussions', 
                'fld' => 'id',
            ];
        }

        //FAVORITE
        if ($this->_sFilter3Value == BX_FORUM_FILTER_ORDER_FAVORITE){
            $oProfile = BxDolProfile:: getInstance(bx_process_input(bx_get('profile_id'), BX_DATA_INT));
            if(!$oProfile)
                $oProfile = BxDolProfile::getInstance();
            if(!$oProfile)
                return '';

            $iProfileAuthor = $oProfile->id();
            $oFavorite = $this->_oModule->getObjectFavorite();
            if(!$oFavorite->isPublic() && $iProfileAuthor != bx_get_logged_profile_id())
                return '';
            
            $aConditions = $oFavorite->getConditionsTrack($CNF['TABLE_ENTRIES'], 'id', $iProfileAuthor);
            if(empty($aConditions) || !is_array($aConditions)) 
                return '';

            $aJoinGroup = array('grp' => true, 'cnds' => array());
            if(!empty($aConditions['join']))
                foreach($aConditions['join'] as $aCondition)
                    $aJoinGroup['cnds'][] = array(
                        'tp' => $aCondition['type'],
                        'tbl1' => $aCondition['table'],
                        'fld1' => $aCondition['onField'],
                        'tbl2' => $aCondition['mainTable'],
                        'fld2' => $aCondition['mainField']
                    );

            $aWhereGroup = array('grp' => true, 'opr' => 'AND', 'cnds' => array());
            if(!empty($aConditions['restriction']))
                foreach($aConditions['restriction'] as $aCondition)
                    $aWhereGroup['cnds'][] = array(
                        'tbl' => (!empty($aCondition['table']) ? $aCondition['table'] : ''), 
                        'fld' => $aCondition['field'], 
                        'val' => $aCondition['value'], 
                        'opr' => $aCondition['operator']
                    );
            
            $this->_aBrowseParams['author'] = $iProfileAuthor; 
            $this->_aBrowseParams['join'] = $aJoinGroup;
            $this->_aBrowseParams['where'] = $aWhereGroup; 
        }
        
    	$sSelectClause = $sJoinClause = $sWhereClause = $sGroupByClause = '';

    	//--- Check status
    	$sWhereClause .= " AND `{$CNF['TABLE_ENTRIES']}`.`" . $CNF['FIELD_STATUS'] . "`='active'";
    	$sWhereClause .= " AND `{$CNF['TABLE_ENTRIES']}`.`" . $CNF['FIELD_STATUS_ADMIN'] . "`='active'";

    	//--- Check privacy
        $bIncludeContexts = isset($this->_aBrowseParams['include_contexts']) && $this->_aBrowseParams['include_contexts'];

        $sPrivacy = $CNF['OBJECT_PRIVACY_VIEW'];
        $oPrivacy = BxDolPrivacy::getObjectInstance($sPrivacy);
        $aCondition = $oPrivacy ? $oPrivacy->{'getContentPublic' . ($bIncludeContexts ? 'AndInContext' : '') . 'AsSQLPart'}($bAuthor ? $iAuthorId : 0) : [];
        if(isset($aCondition['join']))
            $sJoinClause .= $aCondition['join'];
        if(isset($aCondition['where']))
            $sWhereClause .= $aCondition['where'];

        //--- Check browse params
        if(!empty($this->_aBrowseParams['select']) && is_array($this->_aBrowseParams['select'])) {
            $sSelectClauseBrowse = $this->_getSqlSelectFromGroup($this->_aBrowseParams['select']);
            if(!empty($sSelectClauseBrowse))
                $sSelectClause .= ", " . $sSelectClauseBrowse;
        }

        if(!empty($this->_aBrowseParams['join']) && is_array($this->_aBrowseParams['join'])) {
            $sJoinClauseBrowse = $this->_getSqlJoinFromGroup($this->_aBrowseParams['join']);
            if(!empty($sJoinClauseBrowse))
                $sJoinClause .= " " . $sJoinClauseBrowse;
        }

        if(!empty($this->_aBrowseParams['where']) && is_array($this->_aBrowseParams['where'])) {
            $sWhereClauseBrowse = $this->_getSqlWhereFromGroup($this->_aBrowseParams['where']);
            if(!empty($sWhereClauseBrowse))
                $sWhereClause .= " AND " . $sWhereClauseBrowse;
        }

        if(!empty($this->_aBrowseParams['group_by']) && is_array($this->_aBrowseParams['group_by'])) {
            $sGroupByClauseBrowse = $this->_getSqlGroupByFromGroup($this->_aBrowseParams['group_by']);
            if(!empty($sGroupByClauseBrowse))
                $sGroupByClause .= " GROUP BY " . $sGroupByClauseBrowse;
        }
        
        $sFilterSql = "";

        // filter by resolved status
        if(!empty($this->_sFilter1Value))
            $sWhereClause .= " AND `" . $CNF['TABLE_ENTRIES'] . "`.`" . $CNF['FIELD_RESOLVABLE'] . "` = 1 AND `" . $CNF['TABLE_ENTRIES'] . "`.`" . $CNF['FIELD_RESOLVE'] . "` = " . ($this->_sFilter1Value == BX_FORUM_FILTER_STATUS_RESOLVED ? 1 : 0);

        // filter out posts of suspended members
        $sJoinClause .= " INNER JOIN `sys_profiles` AS `p` ON (`p`.`id` = ABS(`{$CNF['TABLE_ENTRIES']}`.`{$CNF['FIELD_AUTHOR']}`) AND `p`.`status` = 'active') ";

        // filter out posts by content filter
        $oCf = BxDolContentFilter::getInstance();
        if($oCf->isEnabled())
            $sWhereClause .= $oCf->getSQLParts ($CNF['TABLE_ENTRIES'], $CNF['FIELD_CF']);

        // filter by badges
        if(isset($this->_sFilter2Value) && $this->_sFilter2Value != '') {
            $aObjects = BxDolBadges::getInstance()->getData(['type' => 'by_module&badge', 'badge_id' => $this->_sFilter2Value, 'module' => $this->_oModule->_aModule['name']]);
            $sWhereClause .= " AND `" . $CNF['TABLE_ENTRIES'] . "`.`" . $CNF['FIELD_ID'] . "` IN (" . implode(',', $aObjects ) . ")";
        }

        $this->_aOptions['source'] = sprintf($this->_sDefaultSource, $sSelectClause, $sJoinClause, $sWhereClause, $sGroupByClause);
        return parent::_getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage);
    }

    protected function _getDataSqlOrderClause($sOrderByFilter, $sOrderField, $sOrderDir, $bFieldsOnly = false)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(isset($this->_sFilter3Value) && $this->_sFilter3Value != ''){
            $sOrderField = $this->_aBrowseParams['type'] = $this->_sFilter3Value;
            if (!empty($this->_aBrowseParams['type']) && $this->_aBrowseParams['type'] != 'partaken'){
                $this->_aBrowseParams['type'] = $this->_aBrowseParams['type'] = $this->_sFilter3Value;
            }
        }
        
    	$sOrder = parent::_getDataSqlOrderClause($sOrderByFilter, $sOrderField, $sOrderDir, true);
                
        if(!empty($this->_aBrowseParams['type']))
            switch($this->_aBrowseParams['type']) {
                case 'top':
                    $aPartsUp = $aPartsDown = array(0);
                    if(($oVote = BxDolVote::getObjectInstance($CNF['OBJECT_VOTES'], 0, false)) !== false && $oVote->isEnabled()) {
                        $aVote = $oVote->getSystemInfo();
                        if(!empty($aVote['trigger_table']) && !empty($aVote['trigger_field_count']))
                            $aPartsUp[] = '`' . $aVote['trigger_table'] . '`.`' . $aVote['trigger_field_count'] . '`';
                    }

                    if(($oReaction = BxDolVote::getObjectInstance($CNF['OBJECT_REACTIONS'], 0, false)) !== false && $oReaction->isEnabled()) {
                        $aReaction = $oReaction->getSystemInfo();
                        if(!empty($aReaction['trigger_table']) && !empty($aReaction['trigger_field_count']))
                            $aPartsUp[] = '`' . $aReaction['trigger_table'] . '`.`' . $aReaction['trigger_field_count'] . '`';
                    }

                    if(($oScore = BxDolScore::getObjectInstance($CNF['OBJECT_SCORES'], 0, false)) !== false && $oScore->isEnabled()) {
                        $aScore = $oScore->getSystemInfo();
                        if(!empty($aScore['trigger_table']) && !empty($aScore['trigger_field_cup']) && !empty($aScore['trigger_field_cdown'])) {
                            $aPartsUp[] = '`' . $aScore['trigger_table'] . '`.`' . $aScore['trigger_field_cup'] . '`';
                            $aPartsDown[] = '`' . $aScore['trigger_table'] . '`.`' . $aScore['trigger_field_cdown'] . '`';
                        }
                    }

                    $sOrder = pow(10, 8) . ' * ((' . implode(' + ', $aPartsUp) . ') - (' . implode(' + ', $aPartsDown) . ')) / (UNIX_TIMESTAMP() - `' . $this->_aOptions['table'] . '`.`' . $CNF['FIELD_ADDED'] . '`) ' . $this->_sDefaultSortingOrder;
                    break;

                case 'partaken':
                    $sOrder = 'MAX(IF(`tco`.`cmt_time`, `tco`.`cmt_time`, `' . $CNF['TABLE_ENTRIES'] . '`.`' . $CNF['FIELD_ADDED'] . '`)) ' . $this->_sDefaultSortingOrder;
                    break;
            }           

    	return " ORDER BY `" . $CNF['TABLE_ENTRIES'] . "`.`" . $CNF['FIELD_STICK'] . "` DESC, " . $sOrder;
    }

    protected function _getSqlSelectFromGroup($aGrp)
    {
        if(!isset($aGrp['grp']) || (bool)$aGrp['grp'] !== true)
            return $this->_getSqlSelectFromCondition($aGrp);

        $sResult = "";
        if(empty($aGrp['cnds']) || !is_array($aGrp['cnds']))
            return $sResult;

        $sOprGrp = ", ";
        foreach($aGrp['cnds'] as $aCnd) {
            $sResultCnd = $this->_getSqlSelectFromCondition($aCnd);
            if(!empty($sResultCnd))
                $sResult .= $sOprGrp . $sResultCnd;
        }

        return trim($sResult, $sOprGrp);
    }

    protected function _getSqlSelectFromCondition($aCnd)
    {
    	$sResult = "";
    	if(!isset($aCnd['fld']))
            return $sResult;

        $sResult = "`" . $aCnd['fld'] . "`";
        if(!empty($aCnd['tbla']))
            $sResult = "`" . $aCnd['tbla'] . "`." . $sResult;
        else if(!empty($aCnd['tbl']))
            $sResult = "`" . $aCnd['tbl'] . "`." . $sResult;

        return $sResult;
    }

    protected function _getSqlJoinFromGroup($aGrp)
    {
        if(!isset($aGrp['grp']) || (bool)$aGrp['grp'] !== true)
            return $this->_getSqlJoinFromCondition($aGrp);

        $sResult = "";
        if(empty($aGrp['cnds']) || !is_array($aGrp['cnds']))
            return $sResult;

        $sOprGrp = " ";
        foreach($aGrp['cnds'] as $aCnd) {
            $sResultCnd = $this->_getSqlJoinFromCondition($aCnd);
            if(!empty($sResultCnd))
                $sResult .= $sOprGrp . $sResultCnd;
        }

        return trim($sResult, $sOprGrp);
    }

    protected function _getSqlJoinFromCondition($aCnd)
    {
    	$sResult = "";
    	if(!isset($aCnd['tp'], $aCnd['tbl1'], $aCnd['fld1'], $aCnd['fld2']))
            return $sResult;

        $sTbl1A = $aCnd['tbl1'];
        if(!empty($aCnd['tbl1a']))
            $sTbl1A = $aCnd['tbl1a'];

        $sField1 = "`" . $sTbl1A . "`.`" . $aCnd['fld1'] . "`";

        $sField2 = "`" . $aCnd['fld2'] . "`";
        if(!empty($aCnd['tbl2a']))
            $sField2 = "`" . $aCnd['tbl2a'] . "`." . $sField2;
        else if(!empty($aCnd['tbl2']))
            $sField2 = "`" . $aCnd['tbl2'] . "`." . $sField2;

        return $aCnd['tp'] . " JOIN `" . $aCnd['tbl1'] . "` AS `" . $sTbl1A . "` ON (" . $sField1 . " = " . $sField2 . ")";
    }

    protected function _getSqlWhereFromGroup($aGrp)
    {
        if(!isset($aGrp['grp']) || (bool)$aGrp['grp'] !== true)
            return $this->_getSqlWhereFromCondition($aGrp);

        $sResult = "";
        if(!isset($aGrp['opr'], $aGrp['cnds']) || empty($aGrp['cnds']) || !is_array($aGrp['cnds']))
            return $sResult;

        $sOprGrp = " " . $aGrp['opr'] . " ";
        foreach($aGrp['cnds'] as $aCnd) {
            $sMethod = '_getSqlWhereFrom' . (isset($aGrp['grp']) && (bool)$aGrp['grp'] === true ? 'Group' : 'Condition');
            $sResultCnd = $this->$sMethod($aCnd);
            if(!empty($sResultCnd))
                $sResult .= $sOprGrp . $sResultCnd;
        }

        $sResult = trim($sResult, $sOprGrp);
        if(!empty($sResult))
            $sResult = "(" . $sResult . ")";

    	return $sResult;
    }

    protected function _getSqlWhereFromCondition($aCnd)
    {
        $sResult = "";
        if(!isset($aCnd['fld'], $aCnd['val'], $aCnd['opr']))
            return $sResult;

        $sMethod = '_getSqlWhereFromCondition' . bx_gen_method_name($aCnd['fld']);
        if(method_exists($this, $sMethod)) {
            $mixedResult = $this->$sMethod($aCnd);
            if(is_array($mixedResult) && isset($mixedResult['fld'], $mixedResult['val'], $mixedResult['opr']))
                $aCnd = $mixedResult;
            else
                return $mixedResult;
        }
        
        $sField = "`" . $aCnd['fld'] . "`";
        if(!empty($aCnd['tbl']))
            $sField = "`" . $aCnd['tbl'] . "`." . $sField;

        switch($aCnd['opr']) {
            case 'IN':
                if(empty($aCnd['val']) || !is_array($aCnd['val']))
                    break;

                $sResult .= $sField . " IN (" . $this->_oModule->_oDb->implode_escape($aCnd['val']) . ")";
                break;

            case 'LIKE':
                $sResult .= $sField . " LIKE " . $this->_oModule->_oDb->escape('%' . $aCnd['val'] . '%');
                break;

            default:
                $sResult .= $sField . " " . $aCnd['opr'] . " " . $this->_oModule->_oDb->escape($aCnd['val']);
        }

        return $sResult;
    }

    protected function _getSqlGroupByFromGroup($aGrp)
    {
        if(!isset($aGrp['grp']) || (bool)$aGrp['grp'] !== true)
            return $this->_getSqlGroupByFromCondition($aGrp);

        $sResult = "";
        if(empty($aGrp['cnds']) || !is_array($aGrp['cnds']))
            return $sResult;

        $sOprGrp = ", ";
        foreach($aGrp['cnds'] as $aCnd) {
            $sResultCnd = $this->_getSqlGroupByFromCondition($aCnd);
            if(!empty($sResultCnd))
                $sResult .= $sOprGrp . $sResultCnd;
        }

        return trim($sResult, $sOprGrp);
    }

    protected function _getSqlGroupByFromCondition($aCnd)
    {
    	$sResult = "";
    	if(!isset($aCnd['fld']))
            return $sResult;

        $sResult = "`" . $aCnd['fld'] . "`";
        if(!empty($aCnd['tbla']))
            $sResult = "`" . $aCnd['tbla'] . "`." . $sResult;
        else if(!empty($aCnd['tbl']))
            $sResult = "`" . $aCnd['tbl'] . "`." . $sResult;

        return $sResult;
    }

    protected function _getSqlWhereFromConditionAuthorComment($aCnd)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aEntriesIds = $this->_oModule->_oDb->getComments(array('type' => 'entries_author_search', 'author' => $aCnd['val']));
        if(!empty($aEntriesIds) && is_array($aEntriesIds))
            return array('tbl' => $CNF['TABLE_ENTRIES'], 'fld' => 'id', 'val' => $aEntriesIds, 'opr' => 'IN');

        return '';
    }

    protected function _getSqlWhereFromConditionKeywordComment($aCnd)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aEntriesIds = $this->_oModule->_oDb->getComments(array('type' => 'entries_keyword_search', 'keyword' => $aCnd['val']));
        if(!empty($aEntriesIds) && is_array($aEntriesIds))
            return array('tbl' => $CNF['TABLE_ENTRIES'], 'fld' => 'id', 'val' => $aEntriesIds, 'opr' => 'IN');

        return '';
    }
    
    protected function _getFilterControls ()
    {
        parent::_getFilterControls();
        return  $this->_getFilterSelectOne($this->_sFilter3Name, $this->_sFilter3Value, $this->_aFilter3Values) . $this->_getFilterSelectOne($this->_sFilter1Name, $this->_sFilter1Value, $this->_aFilter1Values) . (count($this->_aFilter2Values) > 0 ? $this->_getFilterSelectOne($this->_sFilter2Name, $this->_sFilter2Value, $this->_aFilter2Values) : '') . $this->_getSearchInput();
    }

    protected function _getFilterOnChange()
    {
        return $this->_oModule->_oConfig->getJsObject('main') . '.onChangeFilter(this)';
    }

    protected function _getFilterSelectOne($sFilterName, $sFilterValue, $aFilterValues, $bAddSelectOne = false, $bAsArray = false)
    {
        return parent::_getFilterSelectOne($sFilterName, $sFilterValue, $aFilterValues, $bAddSelectOne, $bAsArray);
    }
}

/** @} */
