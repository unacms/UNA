<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

class BxBasePagesSearchResult extends BxTemplSearchResult
{
    function __construct()
    {
        parent::__construct();

        $this->aCurrent = array(
            'name' => 'sys_pages',
            'module_name' => 'system',
            'title' => _t('_sys_pages'),
            'table' => 'sys_pages_blocks',
            'ownFields' => array('text_updated`, MAX(`text_updated`) AS `updated_max'),
            'searchFields' => array('text'),
            'restriction' => array(
                'visible_for_levels' => array('value' => '', 'field' => 'visible_for_levels', 'operator' => '&'),
                'url' => array('value' => 'n/a', 'field' => 'url', 'operator' => 'not empty value', 'table' => 'sys_objects_page'),
            ),
            'join' => array(
                'albums' => array(
                    'type' => 'INNER',
                    'table' => 'sys_objects_page',
                    'mainField' => 'object',
                    'onField' => 'object',
                    'joinFields' => array('id', 'title', 'url', 'module'),
                    'groupTable' => 'sys_objects_page', 
                    'groupField' => 'object',
                ),
            ),
            'paginate' => array('perPage' => 10, 'start' => 0),
            'sorting' => 'last',
            'ident' => 'id',
            'added' => 'id'
        );

        $this->sBrowseUrl = BX_DOL_SEARCH_KEYWORD_PAGE;

        $this->aCurrent['restriction']['visible_for_levels']['value'] = 1; // for guests
        if (isAdmin()) {
            // admin can view anything
            $this->aCurrent['restriction']['visible_for_levels']['value'] = '';
        }
        elseif ($iProfileId = bx_get_logged_profile_id()) {
            $oAcl = BxDolAcl::getInstance();
            $iProfileAclBit = $oAcl->getMemberLevelBit($iProfileId);
            if ($iProfileAclBit) 
                $this->aCurrent['restriction']['visible_for_levels']['value'] = $iProfileAclBit;
        }
        // TODO: check for privacy
    }

    function displaySearchUnit($aData)
    {
        $sModule = $aData['module'];
        $sIcon = 'file-text';
        if ('system' == $sModule || 'custom' == $sModule) {
            $sModule = '';
        }
        elseif (($oModule = BxDolModule::getInstance($aData['module'])) && isset($oModule->_oConfig->CNF)) {
            $CNF = $oModule->_oConfig->CNF;
            if (isset($CNF['T']['txt_sample_single']))
                $sModule = _t($CNF['T']['txt_sample_single']);
            if (isset($CNF['ICON']))
                $sIcon = $CNF['ICON'];
        }
        $sUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink($aData['url']));
        
        $sTitle = _t($aData['title']);
        if (preg_match ('/{.*?}/', $sTitle))
            return '';
        
        $aVars = array(
            'title' => $sTitle,
            'content_url' => $sUrl,
            'updated' => $aData['updated_max'] ? bx_time_js($aData['updated_max']) : '',
            'ts' => $aData['updated_max'],
            'module_name' => $sModule,
            'icon' => $sIcon,
        );
        if ($this->_bLiveSearch) {
            $sTemplate = 'search_pages_results_live.html';
        }
        else {
            $sTemplate = 'search_pages_results.html';
        }
        return BxDolTemplate::getInstance()->parseHtmlByName($sTemplate, $aVars);
    }

    function getAlterOrder()
    {
        if($this->aCurrent['sorting'] == 'last')
            return array('order' => " ORDER BY `text_updated` DESC");

        return array();
    }
}

/** @} */
