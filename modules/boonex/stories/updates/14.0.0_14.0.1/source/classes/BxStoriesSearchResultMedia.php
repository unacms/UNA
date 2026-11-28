<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Stories Stories
 * @ingroup     UnaModules
 *
 * @{
 */

class BxStoriesSearchResultMedia extends BxBaseModTextSearchResult
{
    protected $sOrderDirection = 'DESC';

    function __construct($sMode = '', $aParams = array())
    {
        $this->sUnitTemplateLiveSearch = 'unit_media_live_search.html';

        $aParams['unit_views'] = array('gallery' => 'unit_media.html', 'showcase' => 'unit_showcase.html');
        parent::__construct($sMode, $aParams);

        $this->aCurrent = array(
            'name' => 'bx_stories_media',
            'module_name' => 'bx_stories',
            'object_metatags' => 'bx_stories_media',
            'title' => _t('_bx_stories_media'),
            'table' => 'bx_stories_entries_media',
            'ownFields' => array('id', 'title', 'data', 'content_id', 'file_id', 'order'),
            'searchFields' => array('title'),
            'restriction_sql' => '',
            'restriction' => array(
                'author' => array('value' => '', 'field' => 'author', 'operator' => '='),
                'story' => array('value' => '', 'field' => 'content_id', 'operator' => '='),
                'featured' => array('value' => '', 'field' => 'featured', 'operator' => '<>'),
                'status' => array('value' => 'active', 'field' => 'status', 'operator' => '=', 'table' => 'bx_stories_entries'),
                'statusAdmin' => array('value' => 'active', 'field' => 'status_admin', 'operator' => '=', 'table' => 'bx_stories_entries'),
            ),
            'join' => array(
                'stories' => array(
                    'type' => 'INNER',
                    'table' => 'bx_stories_entries',
                    'mainField' => 'content_id',
                    'onField' => 'id',
                    'joinFields' => array(),
                ),
                'files' => array(
                    'type' => 'INNER',
                    'table' => 'bx_stories_files',
                    'table_alias' => 'f',
                    'mainField' => 'file_id',
                    'onField' => 'id',
                    'joinFields' => array('added'),
                ),
            ),
            'paginate' => array('perPage' => getParam('bx_stories_per_page_browse'), 'start' => 0),
            'sorting' => 'last',
            'rss' => array(
                'title' => '',
                'link' => '',
                'image' => '',
                'profile' => 0,
                'fields' => array (
                    'Guid' => 'link',
                    'Link' => 'link',
                    'Title' => 'title',
                    'DateTimeUTS' => 'added',
                    'Desc' => 'title',
                ),
            ),
            'ident' => 'id',
        );

        $this->sFilterName = 'bx_stories_filter';
        $this->oModule = $this->getMain();

        $oProfileAuthor = isset($aParams['author']) ? BxDolProfile::getInstance((int)$aParams['author']) : null;

        $CNF = &$this->oModule->_oConfig->CNF;

        switch ($sMode) {
            case 'story':
                $iAlbumId = (int)$aParams['story_id'];
                $this->aCurrent['restriction']['story']['value'] = $iAlbumId;
                $this->sBrowseUrl = BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY'] . '&id=' . $iAlbumId);
                $this->aCurrent['title'] = _t('_bx_stories_page_title_browse_media_in_story');
                $this->aCurrent['rss']['link'] = 'modules/?r=stories/rss_media/' . $sMode . '/' . $iAlbumId;
                $this->aCurrent['sorting'] = 'order';
                $this->sOrderDirection = 'ASC';
                $this->setProcessPrivateContent(true);

                if($CNF['PARAM_ORDER_BY_GHOSTS'])
                    $this->_updateCurrentForOrderByGhosts();
                break;

            case '': // search results
                $this->sBrowseUrl = BX_DOL_SEARCH_KEYWORD_PAGE;
                unset($this->aCurrent['paginate']['perPage'], $this->aCurrent['rss']);
                break;

            default:
                $sMode = '';
                $this->isError = true;
        }

        $this->sBrowseUrl = $this->_replaceMarkers($this->sBrowseUrl);
        $this->aCurrent['title'] = $this->_replaceMarkers($this->aCurrent['title']); 

        $this->removeContainerClass('bx-def-margin-bottom-neg');
        $this->addContainerClass(array('bx-def-margin-sec-lefttopright-neg', 'bx-def-margin-sec-bottom-neg', 'bx-stories-medias-wrapper'));

        $this->addCustomConditions($CNF, $oProfileAuthor, $sMode, $aParams);
    }

    function getAlterOrder()
    {
        $CNF = &$this->oModule->_oConfig->CNF;

        $sTable = $this->aCurrent['table'];
        $sWay = $this->sOrderDirection;

        $aSql = array();
        switch ($this->aCurrent['sorting']) {
            case 'order':
                $aSql['order'] = " ORDER BY `" . $sTable . "`.`order` " . $sWay . ", `" . $sTable . "`.`id` " . $sWay . " ";
                break;

            case 'order_by_ghosts':
                $aSql['order'] = " ORDER BY `g`.`order` " . $sWay . ", `" . $sTable . "`.`id` " . $sWay . " ";
                break;

            case 'last':
                $aSql['order'] = " ORDER BY `f`.`added` " . $sWay . ", `" . $sTable . "`.`id` " . $sWay . " ";
                break;
        }

        return $aSql;
    }

    protected function _updateCurrentForOrderByGhosts()
    {
        $CNF = &$this->oModule->_oConfig->CNF;

        $this->aCurrent['join']['ghosts'] = [
            'type' => 'INNER',
            'table' => 'sys_storage_ghosts',
            'table_alias' => 'g',
            'mainField' => 'file_id',
            'on_sql' => $this->oModule->_oDb->prepareAsString(" `g`.`id`=`bx_stories_entries_media`.`file_id` AND `g`.`content_id`=`bx_stories_entries_media`.`content_id` AND `g`.`object`=? ", $CNF['OBJECT_STORAGE']),
            'joinFields' => array('order'),
        ];
        $this->aCurrent['sorting'] = 'order_by_ghosts';
        $this->sOrderDirection = 'ASC';
    }
}

/** @} */
