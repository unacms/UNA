<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Wiki page
 */
class BxBasePageWiki extends BxTemplPage
{
    public function __construct($aObject, $oTemplate)
    {
        parent::__construct($aObject, $oTemplate);
    }

    public function getPageAPI ($aBlocks = [])
    {
        $aPage = parent::getPageAPI ($aBlocks);

        $aPagesList = BxDolPage::getObjectInstance('sys_sub_wiki_pages_list')->getPageContentAPI();
        if($aPagesList && ($aCell = $aPagesList['elements']['cell_center'] ?? false))
            $aPage['elements']['cell_left'] = $aCell;

        $sCell = 'center';
        if(($oWiki = BxDolWiki::getObjectInstance($this->_aObject['module'])) && $oWiki->isAllowed('add')) {
            $aLayoutColumns = $this->_oQuery->getPageLayoutColumns($this->_aObject['layout_id'], 'name');

            $aPage['elements']['cell_' . $sCell][] = bx_srv('system', 'wiki_add_block', [$oWiki, $this->_sObject, 'cell_' . $aLayoutColumns[$sCell]['index']], 'TemplServiceWiki');
        }

        return $aPage;
    }

    protected function _getPageCodeVars ()
    {
        $aVars = parent::_getPageCodeVars ();
        
        $oWiki = BxDolWiki::getObjectInstance($this->_aObject['module']);
        if ($oWiki && $oWiki->isAllowed('add')) {
            foreach ($aVars as $sKey => $sCell) {
                if (0 !== strncmp('cell_', $sKey, 5))
                    continue;
                $aVars[$sKey] = $sCell . bx_srv('system', 'wiki_add_block', array($oWiki, $this->_sObject, $sKey), 'TemplServiceWiki');
            }
        }
        return $aVars;
    }
}

/** @} */
