<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Jobs Jobs
 * @ingroup     UnaModules
 *
 * @{
 */

class BxJobsSearchResult extends BxBaseModGroupsSearchResult
{
    function __construct($sMode = '', $aParams = false)
    {
        parent::__construct($sMode, $aParams); 

        $this->aCurrent =  array(
            'name' => 'bx_jobs',
            'module_name' => 'bx_jobs',
            'object_metatags' => 'bx_jobs',
            'title' => _t('_bx_jobs_page_title_browse'),
            'table' => 'sys_profiles',
            'tableSearch' => 'bx_jobs_data',
            'ownFields' => array(),
            'searchFields' => array(),
            'restriction' => array(
                'account_id' => array('value' => '', 'field' => 'account_id', 'operator' => '='),
                'perofileStatus' => array('value' => 'active', 'field' => 'status', 'operator' => '='),
                'perofileType' => array('value' => 'bx_jobs', 'field' => 'type', 'operator' => '='),
                'owner' => array('value' => '', 'field' => 'author', 'operator' => '=', 'table' => 'bx_jobs_data'),
                'featured' => array('value' => '', 'field' => 'featured', 'operator' => '<>', 'table' => 'bx_jobs_data'),
                'status' => array('value' => 'active', 'field' => 'status', 'operator' => '=', 'table' => 'bx_jobs_data'),
                'statusAdmin' => array('value' => 'active', 'field' => 'status_admin', 'operator' => '=', 'table' => 'bx_jobs_data'),
            ),
            'join' => array (
                'profile' => array(
                    'type' => 'INNER',
                    'table' => 'bx_jobs_data',
                    'mainField' => 'content_id',
                    'onField' => 'id',
                    'joinFields' => array('id', 'name', 'desc', 'picture', 'cover', 'cover_data', 'added', 'author', 'allow_view_to'),
                ),
                'account' => array(
                    'type' => 'INNER',
                    'table' => 'sys_accounts',
                    'mainField' => 'account_id',
                    'onField' => 'id',
                    'joinFields' => array(),
                ),
            ),
            'paginate' => array('perPage' => getParam('bx_jobs_per_page_browse'), 'start' => 0, 'on_top' => true, 'on_bottom' => true),
            'sorting' => 'last',
            'rss' => array(
                'title' => '',
                'link' => '',
                'image' => '',
                'profile' => 0,
                'fields' => array (
                    'Guid' => 'link',
                    'Link' => 'link',
                    'Title' => 'name',
                    'DateTimeUTS' => 'added',
                    'Desc' => 'name',
                    'Image' => 'picture',
                ),
            ),
            'ident' => 'id'
        );

        $this->sFilterName = 'bx_jobs_data_filter';
        $this->oModule = $this->getMain();

        $CNF = &$this->oModule->_oConfig->CNF;

        $sSearchFields = getParam($CNF['PARAM_SEARCHABLE_FIELDS']);
        $this->aCurrent['searchFields'] = !empty($sSearchFields) ? explode(',', $sSearchFields) : '';

        $oJoinedProfile = null;
        $bProcessConditionsForPrivateContent = true;
        switch ($sMode) {
            case 'created_entries':
                $this->_setAuthorConditions($sMode, $aParams, $oJoinedProfile);
                break;

            case 'context':
                $oProfileContext = null;
                if(!$this->_updateCurrentForContext($sMode, $aParams, $oProfileContext))
                    break;
                
                if(!$this->aCurrent['title'])
                    $this->aCurrent['title'] = _t('_bx_jobs_page_title_browse_by_context');
                break;

            case 'joined_entries':
                $oJoinedProfile = null;
                if(!$this->_updateCurrentForJoinedEntries($sMode, $aParams, $oJoinedProfile))
                    break;

                $bProcessConditionsForPrivateContent = false;

                if(!$this->aCurrent['title'])
                    $this->aCurrent['title'] = _t('_bx_jobs_page_title_joined_entries');
                break;

            case 'followed_entries':
                $oJoinedProfile = null;
                if(!$this->_updateCurrentForFollowedEntries($sMode, $aParams, $oJoinedProfile))
                    break;

                $bProcessConditionsForPrivateContent = false;

                if(!$this->aCurrent['title'])
                    $this->aCurrent['title'] = _t('_bx_jobs_page_title_followed_entries');
                break;

            case 'connections':
                if ($this->_setConnectionsConditions($aParams)) {
                    $bProcessConditionsForPrivateContent = false;
                    $oProfile = BxDolProfile::getInstance($aParams['profile']);
                    $oProfile2 = isset($aParams['profile2']) ? BxDolProfile::getInstance($aParams['profile2']) : null;

                    if (isset($aParams['type']) && $aParams['type'] == 'common' && $oProfile && $oProfile2)
                        $this->aCurrent['title'] = _t('_bx_jobs_page_title_browse_connections_mutual', $oProfile->getDisplayName(), $oProfile2->getDisplayName());
                    elseif ((!isset($aParams['type']) || $aParams['type'] != 'common') && $oProfile)
                        $this->aCurrent['title'] = _t('_bx_jobs_page_title_browse_connections', $oProfile->getDisplayName());

                    $this->aCurrent['rss']['link'] = 'modules/?r=jobs/rss/' . $sMode . '/' . $aParams['object'] . '/' . $aParams['type'] . '/' . (int)$aParams['profile'] . '/' . (int)$aParams['profile2'] . '/' . (int)$aParams['mutual'];
                }
                break;

            case 'favorite':
                $this->_setFavoriteConditions($sMode, $aParams, $oJoinedProfile);
                break;

            case 'recent':
                $this->aCurrent['rss']['link'] = 'modules/?r=jobs/rss/' . $sMode;
                $this->aCurrent['title'] = _t('_bx_jobs_page_title_browse_recent');
                $this->aCurrent['sorting'] = 'last';
                $this->sBrowseUrl = 'page.php?i=jobs-home';
                break;

            case 'featured':
                $this->sBrowseUrl = BxDolPermalinks::getInstance()->permalink($CNF['URL_HOME']);
                $this->aCurrent['title'] = _t('_bx_jobs_page_title_browse_featured');
                $this->aCurrent['restriction']['featured']['value'] = '0';
                $this->aCurrent['rss']['link'] = 'modules/?r=jobs/rss/' . $sMode;
                $this->aCurrent['sorting'] = 'featured';
                break;

            case 'recommended':
                $this->sBrowseUrl = BxDolPermalinks::getInstance()->permalink($CNF['URL_HOME']);
                $this->aCurrent['title'] = _t('_bx_jobs_page_title_browse_recommended');
                $this->aCurrent['restriction']['featured']['value'] = '0';
                $this->aCurrent['rss']['link'] = 'modules/?r=jobs/rss/' . $sMode;
                $this->aCurrent['sorting'] = 'recommended';
                $this->_setConditionsForRecommended();
                break;    
                
            case 'top':
                $this->aCurrent['rss']['link'] = 'modules/?r=jobs/rss/' . $sMode;
                $this->aCurrent['title'] = _t('_bx_jobs_page_title_browse_top');
                $this->aCurrent['sorting'] = 'top';
                $this->sBrowseUrl = 'page.php?i=jobs-top';
                break;

            case '': // search results
                $this->sBrowseUrl = BX_DOL_SEARCH_KEYWORD_PAGE;
                $this->aCurrent['title'] = _t('_bx_jobs');
                unset($this->aCurrent['paginate']['perPage'], $this->aCurrent['rss']);
                break;

            default:
                $this->isError = true;
        }

        if ($bProcessConditionsForPrivateContent) {
            $this->addConditionsForPrivateContent($CNF, $oJoinedProfile);

            $this->addCustomConditions($CNF, $oJoinedProfile, $sMode, $aParams);
        }

        $this->sCenterContentUnitSelector = false;
    }

    function getAlterOrder()
    {
        switch ($this->aCurrent['sorting']) {
        case 'featured':
            return array('order' => ' ORDER BY `bx_jobs_data`.`featured` DESC ');
        case 'recommended':
            return array('order' => ' ORDER BY RAND() ');
        case 'none':
            return array();
        case 'top':
            return array('order' => ' ORDER BY `bx_jobs_data`.`views` DESC ');
        case 'last':
        default:                        
            return array('order' => ' ORDER BY `bx_jobs_data`.`added` DESC ');
        }
    }

    function _getPseud ()
    {
        return array(
            'id' => 'id',
            'name' => 'name',
            'added' => 'added',
            'author' => 'author',
            'picture' => 'picture',
        );
    }
}

/** @} */
