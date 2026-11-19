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

class BxForumSearchResult extends BxBaseModTextSearchResult
{
    function __construct($sMode = '', $aParams = array())
    {
        parent::__construct($sMode, $aParams);

        $this->aCurrent = array(
            'name' => 'bx_forum',
            'module_name' => 'bx_forum',
            'object_metatags' => 'bx_forum',
            'title' => _t('_bx_forum_page_title_browse'),
            'table' => 'bx_forum_discussions',
            'ownFields' => array('id', 'title', 'text', 'thumb', 'author', 'added', 'comments', 'lr_profile_id', 'cat'),
            'searchFields' => array(),
            'restriction' => array(
                'author' => array('value' => '', 'field' => 'author', 'operator' => '='),
                'cmt_author' => array('value' => '', 'field' => 'cmt_author_id', 'operator' => '=', 'table' => 'bx_forum_cmts'),
                'category' => array('value' => '', 'field' => 'cat', 'operator' => '='),
                'featured' => array('value' => '', 'field' => 'featured', 'operator' => '<>'),
                'status' => array('value' => 'active', 'field' => 'status', 'operator' => '='),
                'statusAdmin' => array('value' => 'active', 'field' => 'status_admin', 'operator' => '='),
            ),
            'paginate' => array('perPage' => getParam('bx_forum_per_page_browse'), 'start' => 0),
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
                    'Desc' => 'text',
            		'Image' => 'thumb'
                ),
            ),
            'ident' => 'id',
        );

        $this->sFilterName = 'bx_forum_filter';
        $this->oModule = $this->getMain();

        $CNF = &$this->oModule->_oConfig->CNF;

        $sSearchFields = getParam($CNF['PARAM_SEARCHABLE_FIELDS']);
        $this->aCurrent['searchFields'] = !empty($sSearchFields) ? explode(',', $sSearchFields) : '';

        $oProfileAuthor = null;

        switch ($sMode) {
            case 'author':
                $oProfileAuthor = BxDolProfile::getInstance((int)$aParams['author']);
                if (!$oProfileAuthor) {
                    $this->isError = true;
                    break;
                }

                $this->aCurrent['restriction']['author']['value'] = $oProfileAuthor->id();
                $this->aCurrent['paginate']['perPage'] = getParam('bx_forum_per_page_profile');

                $this->sBrowseUrl = 'page.php?i=' . $CNF['URI_AUTHOR_ENTRIES'] . '&profile_id={profile_id}';
                $this->aCurrent['title'] = _t('_bx_forum_page_title_browse_by_author');
                $this->aCurrent['rss']['link'] = 'modules/?r=forum/rss/' . $sMode . '/' . $oProfileAuthor->id();
                break;

            case 'context':
                if(!$this->_updateCurrentForContext($sMode, $aParams, $oProfileAuthor))
                    $this->isError = true;
                break;
                
            case 'favorite':
                if(!$this->_updateCurrentForFavorite($sMode, $aParams, $oProfileAuthor))
                    $this->isError = true;
                break;

            case 'category':
                    $iCategory = (int)$aParams['category'];
                    $this->addMarkers(array(
                        'category_id' => $iCategory,
                        'category_name' => BxDolCategory::getObjectInstance($CNF['OBJECT_CATEGORY'])->getCategoryTitle($iCategory),
                    ));

                $this->aCurrent['restriction']['category']['value'] = $iCategory;

                $this->sBrowseUrl = 'page.php?i=' . $CNF['URI_CATEGORY_ENTRIES'] . '&category={category_id}';
                $this->aCurrent['title'] = _t('_bx_forum_page_title_browse_by_category');
                $this->aCurrent['rss']['link'] = 'modules/?r=forum/rss/' . $sMode . '/' . $iCategory;
                break;

            case 'new':
            case 'public':
                $this->sBrowseUrl = BxDolPermalinks::getInstance()->permalink($CNF['URL_NEW']);
                $this->aCurrent['title'] = _t('_bx_forum_page_title_browse_new');
                $this->aCurrent['rss']['link'] = 'modules/?r=forum/rss/' . $sMode;
                break;

            case 'index':
                $this->aCurrent['paginate']['perPage'] = getParam('bx_forum_per_page_index');

            case 'latest':
                $this->sBrowseUrl = BxDolPermalinks::getInstance()->permalink($CNF['URL_LATEST']);
                $this->aCurrent['title'] = _t('_bx_forum_page_title_browse_latest');
                $this->aCurrent['rss']['link'] = 'modules/?r=forum/rss/' . $sMode;
                $this->aCurrent['sorting'] = 'latest';
                break;

            case 'featured':
                $this->sBrowseUrl = BxDolPermalinks::getInstance()->permalink($CNF['URL_HOME']);
                $this->aCurrent['title'] = _t('_bx_forum_page_title_browse_featured');
                $this->aCurrent['restriction']['featured']['value'] = '0';
                $this->aCurrent['rss']['link'] = 'modules/?r=forum/rss/' . $sMode;
                $this->aCurrent['sorting'] = 'featured';
                break;

            case 'top':
                $this->sBrowseUrl = BxDolPermalinks::getInstance()->permalink($CNF['URL_TOP']);
                $this->aCurrent['title'] = _t('_bx_forum_page_title_browse_top');
                $this->aCurrent['rss']['link'] = 'modules/?r=forum/rss/' . $sMode;
                $this->aCurrent['sorting'] = 'top';
                break;

            case 'popular':
                $this->sBrowseUrl = BxDolPermalinks::getInstance()->permalink($CNF['URL_POPULAR']);
                $this->aCurrent['title'] = _t('_bx_forum_page_title_browse_popular');
                $this->aCurrent['rss']['link'] = 'modules/?r=forum/rss/' . $sMode;
                $this->aCurrent['sorting'] = 'popular';
                break;

            case 'updated':
                $this->sBrowseUrl = BxDolPermalinks::getInstance()->permalink($CNF['URL_UPDATED']);
                $this->aCurrent['title'] = _t('_bx_forum_page_title_browse_updated');
                $this->aCurrent['rss']['link'] = 'modules/?r=forum/rss/' . $sMode;
                $this->aCurrent['sorting'] = 'updated';
                break;

            case 'partaken':
                $this->aCurrent['restriction']['cmt_author']['value'] = (int)$aParams['author'];

                if(!isset($this->aCurrent['join']))
                    $this->aCurrent['join'] = array();

                $this->aCurrent['join']['cmts'] = array(
                    'type' => 'INNER',
                    'table' => 'bx_forum_cmts',
                    'mainField' => 'id',
                    'onField' => 'cmt_object_id',
                    'joinFields' => array('cmt_author_id'),
                    'groupTable' => 'bx_forum_discussions',
                    'groupField' => 'id'
                );

                $this->sBrowseUrl = BxDolPermalinks::getInstance()->permalink($CNF['URL_PARTAKEN']);
                $this->aCurrent['title'] = _t('_bx_forum_page_title_browse_partaken');
                $this->aCurrent['rss']['link'] = 'modules/?r=forum/rss/' . $sMode;
                $this->aCurrent['sorting'] = 'partaken';
                break;

            case '': // search results
                $this->checkRestrictionsForContext($sMode, $aParams, $oProfileAuthor);
                $this->sBrowseUrl = BX_DOL_SEARCH_KEYWORD_PAGE;
                $this->aCurrent['title'] = _t('_bx_forum');
                unset($this->aCurrent['paginate']['perPage'], $this->aCurrent['rss']);
                break;

            default:
                $sMode = '';
                $this->isError = true;
        }

        $this->processReplaceableMarkers($oProfileAuthor);

        $this->addConditionsForPrivateContent($CNF, $oProfileAuthor);
        $this->addCustomConditions($CNF, $oProfileAuthor, $sMode, $aParams);
    }

    function getAlterOrder()
    {
        $aSql = array();

        switch ($this->aCurrent['sorting']) {
            case 'latest':
                $aSql['order'] = ' ORDER BY `bx_forum_discussions`.`lr_timestamp` DESC';
                break;

            case 'partaken':
                $aSql['order'] = ' ORDER BY MAX(`bx_forum_cmts`.`cmt_time`) DESC';
                break;

            default:
                $aSql = parent::getAlterOrder();
        }

        return $aSql;
    }
    
    function displayResultBlock()
    {
        if ($this->bShowcaseView) {
            $this->oModule->_oTemplate->addCss(array('carusel.css'));
            $this->oModule->_oTemplate->addJs(array('carusel.js'));
            
            return $this->oModule->_oTemplate->parseHtmlByName('unaca.html', ['content' => str_replace(['bx-forum-wrapper', 'bx-base-unit-showcase-wrapper'], '' ,str_replace('bx-search-result-block', 'bx-search-result-block unaca-t', parent::displayResultBlock()))]);
            
        }

        return parent::displayResultBlock();
    }
}

/** @} */
