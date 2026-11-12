<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Database queries for pages.
 * @see BxDolPage
 */
class BxDolPageQuery extends BxDolDb
{
    protected static $_aSeoLinksScopes = []; ///< open SEO links scopes, the last one is in use, @see openSeoLinksScope
    /** Links to prime in the open scope at the first one asked for (@see primeSeoLinksLater): scope => module and page => param values. */
    protected static $_aSeoLinksPending = [];

    protected $_aObject;

    public function __construct($aObject)
    {
        parent::__construct();
        $this->_aObject = $aObject;
    }

    static public function getPageObject ($sObject)
    {
        $oDb = BxDolDb::getInstance();

        $a = $oDb->fromCache('sys_pages_objects_data', 'getAllWithKey', "SELECT `o`.*, `l`.`template`, `l`.`cells_number` FROM `sys_objects_page` AS `o` INNER JOIN `sys_pages_layouts` AS `l` ON (`l`.`id` = `o`.`layout_id`)", 'object');
        if (isset($a[$sObject]))
            return $a[$sObject];

        return false;
    }

    static public function getPageObjectNameByURI($sURI, $sModule = false, $bSearchRedirects = false)
    {
        $oDb = BxDolDb::getInstance();
        $sObject = false;
        if ($sModule) {
            $sObject = $oDb->getOne("SELECT `object` FROM `sys_objects_page` WHERE `uri` = :uri AND `module` = :module", ['uri' => $sURI, 'module' => $sModule]);
        } 
        else {
            $aUri2Object = $oDb->fromCache('sys_pages_uri_object_map', 'getPairs', "SELECT `uri`, `object` FROM `sys_objects_page`", 'uri', 'object');
            if (isset($aUri2Object[$sURI]))
                $sObject = $aUri2Object[$sURI];
        }

        if ($bSearchRedirects && !$sObject) {
            if ($sModule) {
                $sQuery = "SELECT `p`.`object` FROM `sys_objects_page` AS `p` INNER JOIN `sys_seo_uri_rewrites` AS `r` ON (`p`.`uri` = `r`.`uri_orig`) WHERE `r`.`uri_rewrite` = :uri AND `module` = :module";
                $sObject = $oDb->getOne($sQuery, ['uri' => $sURI, 'module' => $sModule]);
            }
            else {
                $aUriRewrite2Object = $oDb->fromCache('sys_pages_urirewrite_object_map', 'getPairs', "SELECT `r`.`uri_rewrite`, `p`.`object` FROM `sys_objects_page` AS `p` INNER JOIN `sys_seo_uri_rewrites` AS `r` ON (`p`.`uri` = `r`.`uri_orig`)", 'uri_rewrite', 'object');
                if (isset($aUriRewrite2Object[$sURI]))
                    $sObject = $aUriRewrite2Object[$sURI];
            }            
        }

        return $sObject;
    }
    
    static public function getContentInfoObjectNameByURI($sURI)
    {
        $oDb = BxDolDb::getInstance();
        $a = array('uri' => $sURI);
        $sQuery = "SELECT `module`, `content_info` FROM `sys_objects_page` WHERE `uri` = :uri";
        $aRow = $oDb->getRow($sQuery, $a);
        if ($aRow['content_info'] != '') 
            return $aRow['content_info'];
        
        return $aRow['module'];
    }

	static public function getPageTriggers($sTriggerName)
    {
        $oDb = BxDolDb::getInstance();
        $sQuery = $oDb->prepare("SELECT * FROM `sys_pages_blocks` WHERE `object` = ? ORDER BY `id` ASC", $sTriggerName);
        return $oDb->getAll($sQuery);
    }

    static public function addPageBlockToPage($aPageBlock)
    {
        $oDb = BxDolDb::getInstance();

        if (empty($aPageBlock['object']))
            return false;

        // check if block already exists, 
        // so the block position will not reset when it's unnecessary
        $sQuery = $oDb->prepare("SELECT `id` FROM `sys_pages_blocks` WHERE `object` = ? AND `type` = ? AND `title` = ?", $aPageBlock['object'], $aPageBlock['type'], $aPageBlock['title']);
        if ($oDb->getOne($sQuery))
            return true;
        
        // get order
        if (empty($aPageBlock['order'])) {
        	$iCellId = !empty($aPageBlock['cell_id']) ? (int)$aPageBlock['cell_id'] : 1;
            $sQuery = $oDb->prepare("SELECT `order` FROM `sys_pages_blocks` WHERE `object` = ? AND `cell_id` = ? AND `active` = 1 ORDER BY `order` DESC LIMIT 1", $aPageBlock['object'], $iCellId);
            $aPageBlock['order'] = (int)$oDb->getOne($sQuery) + 1;
        }

        // add new block
        unset($aPageBlock['id']);
        return $oDb->query("INSERT INTO `sys_pages_blocks` SET " . $oDb->arrayToSQL($aPageBlock));
    }

    static public function getPageType($iId)
    {
        $aPageTypes = BxDolDb::getInstance()->fromCache('pages_types', 'getAllWithKey', "SELECT * FROM `sys_pages_types`", 'id');
        if(isset($aPageTypes[$iId]))
            return $aPageTypes[$iId];
        return false;
    }

    static public function getPageTypes()
    {
        return BxDolDb::getInstance()->getAll("SELECT * FROM `sys_pages_types` WHERE 1");
    }

    /**
     * Content (serialized service call) of every service block that calls the given method.
     */
    static public function getServiceBlocksContent($sMethod)
    {
        $oDb = BxDolDb::getInstance();
        return $oDb->getColumn("SELECT `content` FROM `sys_pages_blocks` WHERE `type` = 'service' AND `content` LIKE " . $oDb->escape('%' . $sMethod . '%'));
    }

    public function getPageLayoutColumns($iLayoutId, $sKey = 'index')
    {
        return $this->getAllWithKey('SELECT * FROM `sys_pages_layout_columns` WHERE `layout_id`=:layout_id', $sKey, [
            'layout_id' => $iLayoutId
        ]);
    }

    /**
     * The columns of every layout, by layout id and then by index (sys_pages_layout_columns: `name`
     * top, left, center, right or bottom, and `width`), from the database cache: layouts come with
     * installs only.
     */
    static public function getLayoutColumnsAll()
    {
        $aRows = BxDolDb::getInstance()->fromCache('sys_pages_layout_columns_all', 'getAll', "SELECT `layout_id`, `index`, `name`, `width` FROM `sys_pages_layout_columns` ORDER BY `layout_id`, `index`");

        $aLayouts = [];
        foreach (is_array($aRows) ? $aRows : [] as $aRow)
            $aLayouts[(int)$aRow['layout_id']][(int)$aRow['index']] = $aRow;
        return $aLayouts;
    }

    /**
     * The blocks of a page the apps show (`active_api`), in its cells (cell_id 1 and up, cell 0
     * holds the blocks taken off the page) and their order, in one query.
     */
    static public function getPageBlocksApi($sObject)
    {
        return BxDolDb::getInstance()->getAll("SELECT `id`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `hidden_on`, `title_hidden_on`, `bg_hidden_on`, `padding_hidden_on` FROM `sys_pages_blocks` WHERE `object` = :object AND `cell_id` > 0 AND `active_api` = 1 ORDER BY `cell_id`, `order`, `id`", [
            'object' => $sObject,
        ]);
    }

    /**
     * One block shown in the apps (`active_api`), with its page's visibility, for API v2's
     * text blocks (BxBaseApiV2Layout::blockText); false for none.
     */
    static public function getPageBlockApi($iBlockId)
    {
        return BxDolDb::getInstance()->getRow("SELECT `b`.`id`, `b`.`object`, `b`.`module`, `b`.`title`, `b`.`visible_for_levels`, `b`.`type`, `b`.`content`, `b`.`hidden_on`, `p`.`visible_for_levels` AS `page_visible_for_levels` FROM `sys_pages_blocks` AS `b` INNER JOIN `sys_objects_page` AS `p` ON `p`.`object` = `b`.`object` WHERE `b`.`id` = :id AND `b`.`cell_id` > 0 AND `b`.`active_api` = 1", [
            'id' => (int)$iBlockId,
        ]);
    }

    public function getPageBlocks($bIsApi = false)
    {
        $sActiveClause = $bIsApi ? "`active_api` = 1" : "`active` = 1";
        $aLayoutColumns = $bIsApi ? $this->getPageLayoutColumns($this->_aObject['layout_id']) : [];
        
        $aRet = [];
        for($i = 1; $i <= $this->_aObject['cells_number']; ++$i)
            $aRet['cell_' . ($bIsApi && isset($aLayoutColumns[$i]) ? $aLayoutColumns[$i]['name'] : $i)] = $this->getAll("SELECT * FROM `sys_pages_blocks` WHERE `object` = :object AND `cell_id` = :cell_id AND " . $sActiveClause . " ORDER BY `order` ASC", [
                'object' => $this->_aObject['object'],
                'cell_id' => $i
            ]);

        return $aRet;
    }

    public function getPageBlock($iBlockId)
    {
        $sQuery = $this->prepare("SELECT * FROM `sys_pages_blocks` WHERE `object` = ? AND `id` = ?", $this->_aObject['object'], $iBlockId);
        return $this->getRow($sQuery);
    }

    public function getBlockById($iBlockId)
    {
        return $this->getRow("SELECT * FROM `sys_pages_blocks` WHERE `id` = :id", ['id' => (int)$iBlockId]);
    }

    public function getEditorImageRefs($iImageId)
    {
        return $this->getAll("SELECT `block_id`, `content_id`, `content_module`, `data` FROM `sys_pages_blocks_data` WHERE `data` LIKE :needle", [
            'needle' => '%"content":' . (int)$iImageId . '%',
        ]);
    }

    public function getPageBlockData($iBlockId, $iContentId = 0, $sContentModule = '')
    {
        $aBindings = [
            'block_id' => $iBlockId
        ];

        $sWhereClause = '';
        if(!empty($iContentId) && !empty($sContentModule)) {
            $aBindings = array_merge($aBindings, [
                'content_id' => $iContentId,
                'content_module' => $sContentModule
            ]);
            $sWhereClause .= " AND `content_id` = :content_id AND `content_module` = :content_module";
        }

        return $this->getOne("SELECT `data` FROM `sys_pages_blocks_data` WHERE `block_id` = :block_id" . $sWhereClause, $aBindings);
    }

    public function setPageBlockData($iBlockId, $iContentId = 0, $sContentModule = '', $mixedData = '')
    {
        return $this->query("INSERT INTO `sys_pages_blocks_data` (`block_id`, `content_id`, `content_module`, `data`) VALUES (:block_id, :content_id, :content_module, :data) ON DUPLICATE KEY UPDATE `data` = :data", [
            'block_id' => $iBlockId,
            'content_id' => $iContentId,
            'content_module' => $sContentModule,
            'data' => is_array($mixedData) ? json_encode($mixedData) : $mixedData
        ]);
    }

    public function getPageBlockContent($iId)
    {
        $sQuery = $this->prepare("SELECT `content` FROM `sys_pages_blocks` WHERE `id` = ?", $iId);
        return $this->getOne($sQuery);
    }

    public function setPageBlockContent($iId, $sContent)
    {
        return $this->query("UPDATE `sys_pages_blocks` SET `content`=:content WHERE `id`=:id", [
            'id' => $iId,
            'content' => $sContent
        ]) !== false;
    }

    public function getPageBlockContentPlaceholder($iId)
    {
        $sQuery = $this->prepare("SELECT `id`, `module`, `template` FROM `sys_pages_content_placeholders` WHERE `id` = ?", $iId);
        return $this->getRow($sQuery);
    }

    static public function getSeoUriRewrites()
    {
        $oDb = BxDolDb::getInstance();
        return $oDb->fromCache('sys_seo_uri_rewrites', 'getPairs', 'SELECT `uri_orig`, `uri_rewrite` FROM `sys_seo_uri_rewrites`', 'uri_orig', 'uri_rewrite');
    }

    static public function getSeoLink($sModule, $sPageUri, $aCond = [])
    {
        $oDb = BxDolDb::getInstance();
        $sWhere = " 1 "; 
        
        foreach ($aCond as $k => $v) {
            if (($k === 'param_name' || $k === 'param_value') && get_mb_len($v) > 32) {
                $v = get_mb_substr($v, 0, 32);
                $aCond[$k] = $v;
            }
        }

        // a link primed in the open scope (@see primeSeoLinks, primeSeoLinksLater)
        if (self::$_aSeoLinksScopes && array_keys($aCond) === ['param_value']) {
            if (!empty(self::$_aSeoLinksPending[count(self::$_aSeoLinksScopes) - 1]))
                self::_primeSeoLinksPending();
            $sKey = self::_seoLinkKey($sModule, $sPageUri, $aCond['param_value']);
            $iScope = count(self::$_aSeoLinksScopes) - 1;
            if (isset(self::$_aSeoLinksScopes[$iScope][$sKey]))
                return self::$_aSeoLinksScopes[$iScope][$sKey];
        }

        if ($aCond)
            $sWhere = $oDb->arrayToSQL($aCond, " AND ");
        return $oDb->getRow("SELECT `uri`, `param_name`, `param_value` FROM `sys_seo_links` WHERE " . $sWhere . " AND `module` = :module AND `page_uri` = :page_uri", [
            'module' => $sModule,
            'page_uri' => $sPageUri,
        ]);
    }

    /**
     * While a scope is open, the SEO links of the pages of many entries are read in one query
     * (@see primeSeoLinks) and getSeoLink of one of them by its param value reads none. For an
     * API page that links many entries and their authors. Only links that exist are kept: one
     * that is missing is read (and made) as before, and a change to the links forgets them.
     * @return the scope to give to @see closeSeoLinksScope
     */
    public static function openSeoLinksScope()
    {
        self::$_aSeoLinksScopes[] = [];

        return count(self::$_aSeoLinksScopes);
    }

    /**
     * Close the scope and any scope opened inside it that was left open.
     */
    public static function closeSeoLinksScope($iScope)
    {
        array_splice(self::$_aSeoLinksScopes, max(0, (int)$iScope - 1));
        foreach (array_keys(self::$_aSeoLinksPending) as $i)
            if ($i >= count(self::$_aSeoLinksScopes))
                unset(self::$_aSeoLinksPending[$i]);
    }

    /**
     * In the open scope: the SEO links of a module's page for these param values (entry ids) in
     * one query. Does nothing outside of a scope.
     */
    public static function primeSeoLinks($sModule, $sPageUri, $aParamValues)
    {
        if (!self::$_aSeoLinksScopes || $sModule === '' || $sPageUri === '')
            return;

        $iScope = count(self::$_aSeoLinksScopes) - 1;
        $aValues = [];
        foreach ((array)$aParamValues as $v) {
            $v = get_mb_substr((string)$v, 0, 32);
            if ($v !== '' && !isset(self::$_aSeoLinksScopes[$iScope][self::_seoLinkKey($sModule, $sPageUri, $v)]))
                $aValues[$v] = $v;
        }
        if (!$aValues)
            return;

        $oDb = BxDolDb::getInstance();
        $aRows = $oDb->getAll("SELECT `uri`, `param_name`, `param_value` FROM `sys_seo_links` WHERE `module` = :module AND `page_uri` = :page_uri AND `param_value` IN (" . $oDb->implode_escape(array_values($aValues)) . ")", [
            'module' => $sModule,
            'page_uri' => $sPageUri,
        ]);
        foreach ($aRows as $aRow)
            self::$_aSeoLinksScopes[$iScope][self::_seoLinkKey($sModule, $sPageUri, $aRow['param_value'])] = $aRow;
    }

    /**
     * In the open scope: the SEO links of these modules' pages to be primed as primeSeoLinks does,
     * all in one query when the first link is asked for (a page of many modules' entries asks
     * for links of a few of each).
     */
    public static function primeSeoLinksLater($sModule, $sPageUri, $aParamValues)
    {
        if (!self::$_aSeoLinksScopes || $sModule === '' || $sPageUri === '')
            return;

        $iScope = count(self::$_aSeoLinksScopes) - 1;
        foreach ((array)$aParamValues as $v) {
            $v = get_mb_substr((string)$v, 0, 32);
            if ($v !== '' && !isset(self::$_aSeoLinksScopes[$iScope][self::_seoLinkKey($sModule, $sPageUri, $v)]))
                self::$_aSeoLinksPending[$iScope][$sModule . "\n" . $sPageUri][$v] = $v;
        }
    }

    protected static function _primeSeoLinksPending()
    {
        $iScope = count(self::$_aSeoLinksScopes) - 1;
        $aPending = self::$_aSeoLinksPending[$iScope] ?? [];
        unset(self::$_aSeoLinksPending[$iScope]);
        if (!$aPending)
            return;

        $oDb = BxDolDb::getInstance();
        $aWhere = [];
        foreach ($aPending as $sGroup => $aValues) {
            list($sModule, $sPageUri) = explode("\n", $sGroup, 2);
            $aWhere[] = $oDb->prepareAsString("(`module` = ? AND `page_uri` = ?", $sModule, $sPageUri) . " AND `param_value` IN (" . $oDb->implode_escape(array_values($aValues)) . "))";
        }
        foreach ($oDb->getAll("SELECT `uri`, `param_name`, `param_value`, `module` AS `bx_module`, `page_uri` AS `bx_page_uri` FROM `sys_seo_links` WHERE " . implode(" OR ", $aWhere)) as $aRow) {
            $sKey = self::_seoLinkKey($aRow['bx_module'], $aRow['bx_page_uri'], $aRow['param_value']);
            unset($aRow['bx_module'], $aRow['bx_page_uri']);
            self::$_aSeoLinksScopes[$iScope][$sKey] = $aRow;
        }
    }

    protected static function _seoLinkKey($sModule, $sPageUri, $sParamValue)
    {
        return $sModule . "\n" . $sPageUri . "\n" . $sParamValue;
    }

    protected static function _forgetSeoLinks()
    {
        foreach (array_keys(self::$_aSeoLinksScopes) as $iScope)
            self::$_aSeoLinksScopes[$iScope] = [];
        self::$_aSeoLinksPending = [];
    }

    static public function insertSeoLink($sModule, $sPageUri, $sSeoParamName, $sSeoParamValue, $sUri)
    {
        self::_forgetSeoLinks();
        return BxDolDb::getInstance()->query("INSERT INTO `sys_seo_links` SET `module` = :module, `page_uri` = :page_uri, `param_name` = :param_name, `param_value` = :param_value, `uri` = :uri, `added` = :ts", [
            'module' => $sModule,
            'page_uri' => $sPageUri,
            'param_name' => $sSeoParamName,
            'param_value' => $sSeoParamValue,
            'uri' => $sUri,
            'ts' => time(),
        ]);
    }

    static public function deleteSeoLink($sModule, $sContentInfoObject, $sId)
    {
        self::_forgetSeoLinks();
        return BxDolDb::getInstance()->query("DELETE FROM `sys_seo_links` WHERE `module` = :module AND `page_uri` IN (SELECT `uri` FROM `sys_objects_page` WHERE `module` = :content_info OR `content_info` = :content_info) AND `param_value` = :param_value", [
            'module' => $sModule,
            'content_info' => $sContentInfoObject,
            'param_value' => $sId,
        ]);
    }

    static public function deleteSeoLinkByParam($sParamName, $sId)
    {
        self::_forgetSeoLinks();
        return BxDolDb::getInstance()->query("DELETE FROM `sys_seo_links` WHERE `param_name` = :param_name AND `param_value` = :param_value", [
            'param_name' => $sParamName,
            'param_value' => $sId,
        ]);
    }

    static public function deleteSeoLinkByModule($sModule)
    {
        self::_forgetSeoLinks();
        return BxDolDb::getInstance()->query("DELETE FROM `sys_seo_links` WHERE `module` = :module", [
            'module' => $sModule,
        ]);
    }
}

/** @} */
