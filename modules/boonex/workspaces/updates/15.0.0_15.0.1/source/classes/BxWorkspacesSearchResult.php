<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Workspaces Workspaces
 * @ingroup     UnaModules
 *
 * @{
 */

class BxWorkspacesSearchResult extends BxBaseModProfileSearchResult
{
    function __construct($sMode = '', $aParams = false)
    {
        parent::__construct($sMode, $aParams);        
        
        $this->aCurrent =  array(
            'name' => 'bx_workspaces',
            'module_name' => 'bx_workspaces',
            'object_metatags' => 'bx_workspaces',
            'title' => _t('_bx_workspaces_page_title_browse'),
            'table' => 'sys_profiles',
            'tableSearch' => 'bx_workspaces_data',
            'ownFields' => array(),
            'searchFields' => array(),
            'restriction' => array(
                'account_id' => array('value' => '', 'field' => 'account_id', 'operator' => '='),
                'perofileStatus' => array('value' => 'active', 'field' => 'status', 'operator' => '='),
                'perofileType' => array('value' => 'bx_workspaces', 'field' => 'type', 'operator' => '='),
                'owner' => array('value' => '', 'field' => 'author', 'operator' => '=', 'table' => 'bx_workspaces_data'),
                'featured' => array('value' => '', 'field' => 'featured', 'operator' => '<>', 'table' => 'bx_workspaces_data'),
                'online' => array('value' => '', 'field' => 'date', 'operator' => '>', 'table' => 'sys_sessions'),
            ),
            'join' => array (
                'profile' => array(
                    'type' => 'INNER',
                    'table' => 'bx_workspaces_data',
                    'mainField' => 'content_id',
                    'onField' => 'id',
                    'joinFields' => array('id', 'added', 'author', 'allow_view_to'),
                ),
                'account' => array(
                    'type' => 'INNER',
                    'table' => 'sys_accounts',
                    'mainField' => 'account_id',
                    'onField' => 'id',
                    'joinFields' => array(),
                ),
            ),
            'paginate' => array('perPage' => getParam('bx_workspaces_per_page_browse'), 'start' => 0),
            'sorting' => 'active',
            'rss' => array(
                'title' => '',
                'link' => '',
                'image' => '',
                'profile' => 0,
                'fields' => array (
                    'Guid' => 'link',
                    'Link' => 'link',
                    'DateTimeUTS' => 'added',
                ),
            ),
            'ident' => 'id'
        );

        $this->sFilterName = 'bx_workspaces_filter';
        $this->oModule = $this->getMain();

        $CNF = &$this->oModule->_oConfig->CNF;
        
        $sSearchFields = getParam($CNF['PARAM_SEARCHABLE_FIELDS']);
        $this->aCurrent['searchFields'] = !empty($sSearchFields) ? explode(',', $sSearchFields) : '';

        $this->_setAccountConfirmationConditions($aParams);

        switch ($sMode) {

            case 'connections':
                if ($this->_setConnectionsConditions($aParams)) {
                    $oProfile = BxDolProfile::getInstance($aParams['profile']);
                    $oProfile2 = isset($aParams['profile2']) ? BxDolProfile::getInstance($aParams['profile2']) : null;

                    if (isset($aParams['type']) && $aParams['type'] == 'common' && $oProfile && $oProfile2)
                        $this->aCurrent['title'] = _t('_bx_workspaces_page_title_browse_connections_mutual', $oProfile->getDisplayName(), $oProfile2->getDisplayName());
                    elseif ((!isset($aParams['type']) || $aParams['type'] != 'common') && $oProfile)
                        $this->aCurrent['title'] = _t('_bx_workspaces_page_title_browse_connections', $oProfile->getDisplayName());

                    $this->aCurrent['rss']['link'] = 'modules/?r=workspaces/rss/' . $sMode . '/' . $aParams['object'] . '/' . $aParams['type'] . '/' . (int)$aParams['profile'] . '/' . (int)$aParams['profile2'] . '/' . (int)$aParams['mutual'];
                }
                break;

            case 'familiar':
                if($this->_setFamiliarConnectionsConditions($aParams)) {
                    $this->aCurrent['title'] = _t('_bx_workspaces_page_title_browse_familiar');
                    unset($this->aCurrent['rss']);
                }
                break;

            case 'acl':
                if ($this->_setAclConditions($aParams)) {
                    $this->aCurrent['title'] = _t('_bx_workspaces_page_title_browse_by_acl', implode(', ', $this->aCurrent['title']));
                    unset($this->aCurrent['rss']);
                }
                break;

            case 'favorite':
                $oProfileAuthor = null;
                if(!$this->_setFavoriteConditions($sMode, $aParams, $oProfileAuthor)) {
                    $this->isError = true;
                    break;
                }
                break;

            case 'recent':
                $this->aCurrent['rss']['link'] = 'modules/?r=workspaces/rss/' . $sMode;
                $this->aCurrent['title'] = _t('_bx_workspaces_page_title_browse_recent');
                $this->aCurrent['sorting'] = 'last';
                $this->sBrowseUrl = 'page.php?i=workspaces-home';
                break;

            case 'featured':
                $this->sBrowseUrl = BxDolPermalinks::getInstance()->permalink($CNF['URL_HOME']);
                $this->aCurrent['title'] = _t('_bx_workspaces_page_title_browse_featured');
                $this->aCurrent['restriction']['featured']['value'] = '0';
                $this->aCurrent['rss']['link'] = 'modules/?r=workspaces/rss/' . $sMode;
                $this->aCurrent['sorting'] = 'featured';
                break;
                
            case 'recommended':
                $this->sBrowseUrl = BxDolPermalinks::getInstance()->permalink($CNF['URL_HOME']);
                $this->aCurrent['title'] = _t('_bx_groups_page_title_browse_recommended');
                $this->aCurrent['restriction']['featured']['value'] = '0';
                $this->aCurrent['rss']['link'] = 'modules/?r=groups/rss/' . $sMode;
                $this->aCurrent['sorting'] = 'recommended';
                $this->_setConditionsForRecommended();
                break;    
            
            case 'active':
                $this->aCurrent['rss']['link'] = 'modules/?r=workspaces/rss/' . $sMode;
                $this->aCurrent['title'] = _t('_bx_workspaces_page_title_browse_active');
                $this->aCurrent['sorting'] = 'active';
                $this->sBrowseUrl = 'page.php?i=workspaces-active';
                break;

            case 'online':
                $this->aCurrent['rss']['link'] = 'modules/?r=workspaces/rss/' . $sMode;
                $this->aCurrent['title'] = _t('_bx_workspaces_page_title_browse_online');
                $this->aCurrent['restriction']['online']['value'] = time() - 60 * (int)getParam('sys_account_online_time');
                $this->aCurrent['restriction_sql'] = ' AND `sys_accounts`.`profile_id`=`sys_profiles`.`id`';
                $this->aCurrent['join']['session'] = array(
                    'type' => 'INNER',
                    'table' => 'sys_sessions',
                    'mainField' => 'account_id',
                    'onField' => 'user_id',
                    'joinFields' => array('date'),
                    'groupTable' => $this->aCurrent['table'],
                    'groupField' => 'id'
                );
                $this->aCurrent['sorting'] = 'online';
                $this->sBrowseUrl = 'page.php?i=workspaces-online';
                break;

            case '': // search results
                $this->sBrowseUrl = BX_DOL_SEARCH_KEYWORD_PAGE;
                $this->aCurrent['title'] = _t('_bx_workspaces');
                unset($this->aCurrent['paginate']['perPage'], $this->aCurrent['rss']);
                break;

            default:
                $this->isError = true;
        }

        $this->sCenterContentUnitSelector = false;
    }

    function getAlterOrder()
    {
        switch ($this->aCurrent['sorting']) {
            case 'featured':
                return array('order' => ' ORDER BY `bx_workspaces_data`.`featured` DESC ');
            case 'recommended':
                return array('order' => ' ORDER BY RAND() ');
            case 'none':
                return array();
	        case 'active':
	            return array('order' => ' ORDER BY `sys_accounts`.`logged` DESC ');
			case 'online':
	            return array('order' => ' ORDER BY `sys_sessions`.`date` DESC ');
	        case 'last':
	        default:
	            return array('order' => ' ORDER BY `bx_workspaces_data`.`added` DESC ');
        }
    }

    function _getPseud ()
    {
        return array(
            'id' => 'id',
            'fullname' => 'fullname',
            'added' => 'added',
            'author' => 'author',
            'picture' => 'picture',
        );
    }
}

/** @} */
