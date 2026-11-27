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

class BxStoriesSearchResult extends BxBaseModTextSearchResult
{
    public function __construct($sMode = '', $aParams = [])
    {
        $this->aUnitViews = ['extended' => 'unit.html', 'gallery' => 'unit_gallery.html'];

        if(empty($aParams['unit_view'])) {
            if(!is_array($aParams))
                $aParams = [];

            $aParams['unit_view'] = 'extended';
        }

        parent::__construct($sMode, $aParams);

        $this->aCurrent = array(
            'name' => 'bx_stories',
            'module_name' => 'bx_stories',
            'object_metatags' => 'bx_stories',
            'title' => _t('_bx_stories_page_title_browse'),
            'table' => 'bx_stories_entries',
            'ownFields' => array('id', 'title', 'text', 'thumb', 'author', 'added'),
            'searchFields' => array(),
            'restriction' => array(
                'author' => array('value' => '', 'field' => 'author', 'operator' => '='),
                'expired' => array('value' => time(), 'field' => 'expired', 'operator' => '>'),
                'status' => array('value' => 'active', 'field' => 'status', 'operator' => '='),
                'statusAdmin' => array('value' => 'active', 'field' => 'status_admin', 'operator' => '='),
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
                    'Desc' => 'text',
            		'Image' => 'thumb'
                ),
            ),
            'ident' => 'id',
        );

        $this->sFilterName = 'bx_stories_filter';
        $this->oModule = $this->getMain();

        $CNF = &$this->oModule->_oConfig->CNF;

        $sSearchFields = getParam($CNF['PARAM_SEARCHABLE_FIELDS']);
        $this->aCurrent['searchFields'] = !empty($sSearchFields) ? explode(',', $sSearchFields) : '';

        $oProfileAuthor = null;

        switch ($sMode) {

            case 'author':
                $this->aCurrent['restriction']['expired'] = '';

                if(!$this->_updateCurrentForAuthor($sMode, $aParams, $oProfileAuthor))
                    $this->isError = true;
                break;
                
            case 'context':
                if(!$this->_updateCurrentForContext($sMode, $aParams, $oProfileAuthor))
                    $this->isError = true;
                break;

            case 'public':
                $this->sBrowseUrl = BxDolPermalinks::getInstance()->permalink($CNF['URL_HOME']);
                $this->aCurrent['title'] = _t('_bx_stories_page_title_browse_recent');
                $this->aCurrent['rss']['link'] = 'modules/?r=stories/rss/' . $sMode;
                break;

            case 'popular':
                $this->sBrowseUrl = BxDolPermalinks::getInstance()->permalink($CNF['URL_POPULAR']);
                $this->aCurrent['title'] = _t('_bx_stories_page_title_browse_popular');
                $this->aCurrent['rss']['link'] = 'modules/?r=stories/rss/' . $sMode;
                $this->aCurrent['sorting'] = 'popular';
                break;

            case 'top':
                $this->sBrowseUrl = BxDolPermalinks::getInstance()->permalink($CNF['URL_TOP']);
                $this->aCurrent['title'] = _t('_bx_stories_page_title_browse_top');
                $this->aCurrent['rss']['link'] = 'modules/?r=stories/rss/' . $sMode;
                $this->aCurrent['sorting'] = 'top';
                break;

            case 'updated':
                $this->sBrowseUrl = BxDolPermalinks::getInstance()->permalink($CNF['URL_UPDATED']);
                $this->aCurrent['title'] = _t('_bx_stories_page_title_browse_updated');
                $this->aCurrent['rss']['link'] = 'modules/?r=stories/rss/' . $sMode;
                $this->aCurrent['sorting'] = 'updated';
                break;

            case '': // search results
                $this->sBrowseUrl = BX_DOL_SEARCH_KEYWORD_PAGE;
                $this->aCurrent['title'] = _t('_bx_stories');
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

    function displayResultBlock ()
    {
        $s = parent::displayResultBlock ();
        $s = '<div class="bx-stories-wrapper">' . $s . '</div>';
        return $this->oModule->_oTemplate->getJsCode('main') . $s;
    }

    function getDesignBoxMenu ()
    {
        return BxBaseModGeneralSearchResult::getDesignBoxMenu ();
    }
}

/** @} */
