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

    public function getPageLayoutColumns($iLayoutId, $sKey = 'index')
    {
        return $this->getAllWithKey('SELECT * FROM `sys_pages_layout_columns` WHERE `layout_id`=:layout_id', $sKey, [
            'layout_id' => $iLayoutId
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

    public function getPageBlockData($iBlockId, $iContentId = 0, $sContentModule = '')
    {
        $aBindings = [
            'block_id' => $iBlockId
        ];

        $sWhereClause = "";
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

        if ($aCond)
            $sWhere = $oDb->arrayToSQL($aCond, " AND ");
        return $oDb->getRow("SELECT `uri`, `param_name`, `param_value` FROM `sys_seo_links` WHERE " . $sWhere . " AND `module` = :module AND `page_uri` = :page_uri", [
            'module' => $sModule,
            'page_uri' => $sPageUri,
        ]);
    }

    static public function insertSeoLink($sModule, $sPageUri, $sSeoParamName, $sSeoParamValue, $sUri)
    {
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
        return BxDolDb::getInstance()->query("DELETE FROM `sys_seo_links` WHERE `module` = :module AND `page_uri` IN (SELECT `uri` FROM `sys_objects_page` WHERE `module` = :content_info OR `content_info` = :content_info) AND `param_value` = :param_value", [
            'module' => $sModule,
            'content_info' => $sContentInfoObject,
            'param_value' => $sId,
        ]);
    }

    static public function deleteSeoLinkByParam($sParamName, $sId)
    {
        return BxDolDb::getInstance()->query("DELETE FROM `sys_seo_links` WHERE `param_name` = :param_name AND `param_value` = :param_value", [
            'param_name' => $sParamName,
            'param_value' => $sId,
        ]);
    }

    static public function deleteSeoLinkByModule($sModule)
    {
        return BxDolDb::getInstance()->query("DELETE FROM `sys_seo_links` WHERE `module` = :module", [
            'module' => $sModule,
        ]);
    }
}

/** @} */
