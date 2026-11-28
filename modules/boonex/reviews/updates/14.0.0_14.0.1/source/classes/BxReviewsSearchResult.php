<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Reviews Reviews
 * @ingroup     UnaModules
 *
 * @{
 */

class BxReviewsSearchResult extends BxBaseModTextSearchResult
{
    function __construct($sMode = '', $aParams = array())
    {
        parent::__construct($sMode, $aParams);

        $this->aCurrent = array(
            'name' => 'bx_reviews',
            'module_name' => 'bx_reviews',
            'object_metatags' => 'bx_reviews',
            'title' => _t('_bx_reviews_page_title_browse'),
            'table' => 'bx_reviews_reviews',
            'ownFields' => array('id', 'title', 'text', 'thumb', 'author', 'added', 'voting_avg', 'allow_view_to', 'product'),
            'searchFields' => array(),
            'restriction' => array(
                'author' => array('value' => '', 'field' => 'author', 'operator' => '='),
        		'featured' => array('value' => '', 'field' => 'featured', 'operator' => '<>'),
        		'status' => array('value' => 'active', 'field' => 'status', 'operator' => '='),
        		'statusAdmin' => array('value' => 'active', 'field' => 'status_admin', 'operator' => '='),
            ),
            'paginate' => array('perPage' => getParam('bx_reviews_per_page_browse'), 'start' => 0),
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

        $this->sFilterName = 'bx_reviews_filter';
        $this->oModule = $this->getMain();

        $CNF = &$this->oModule->_oConfig->CNF;

        $sSearchFields = getParam($CNF['PARAM_SEARCHABLE_FIELDS']);
        $this->aCurrent['searchFields'] = !empty($sSearchFields) ? explode(',', $sSearchFields) : '';

        $oProfileAuthor = null;

        switch ($sMode) {
            case 'author':
                if(!$this->_updateCurrentForAuthor($sMode, $aParams, $oProfileAuthor))
                    $this->isError = true;
                break;

            case 'context':
                if(!$this->_updateCurrentForContext($sMode, $aParams, $oProfileAuthor))
                    $this->isError = true;
                break;
                
            case 'favorite':
                if(!$this->_updateCurrentForFavorite($sMode, $aParams, $oProfileAuthor))
                    $this->isError = true;
                break;

            case 'public':
                $this->sBrowseUrl = BxDolPermalinks::getInstance()->permalink($CNF['URL_HOME']);
                $this->aCurrent['title'] = _t('_bx_reviews_page_title_browse_recent');
                $this->aCurrent['rss']['link'] = 'modules/?r=reviews/rss/' . $sMode;
                break;

            case 'featured':
                $this->sBrowseUrl = BxDolPermalinks::getInstance()->permalink($CNF['URL_HOME']);
                $this->aCurrent['title'] = _t('_bx_reviews_page_title_browse_featured');
                $this->aCurrent['restriction']['featured']['value'] = '0';
                $this->aCurrent['rss']['link'] = 'modules/?r=reviews/rss/' . $sMode;
                $this->aCurrent['sorting'] = 'featured';
                break;

            case 'popular':
                $this->sBrowseUrl = BxDolPermalinks::getInstance()->permalink($CNF['URL_TOP']);
                $this->aCurrent['title'] = _t('_bx_reviews_page_title_browse_popular');
                $this->aCurrent['rss']['link'] = 'modules/?r=reviews/rss/' . $sMode;
                $this->aCurrent['sorting'] = 'popular';
                break;

            case 'top':
                $this->sBrowseUrl = BxDolPermalinks::getInstance()->permalink($CNF['URL_POPULAR']);
                $this->aCurrent['title'] = _t('_bx_reviews_page_title_browse_top');
                $this->aCurrent['rss']['link'] = 'modules/?r=reviews/rss/' . $sMode;
                $this->aCurrent['sorting'] = 'top';
                break;

            case 'updated':
                $this->sBrowseUrl = BxDolPermalinks::getInstance()->permalink($CNF['URL_UPDATED']);
                $this->aCurrent['title'] = _t('_bx_reviews_page_title_browse_updated');
                $this->aCurrent['rss']['link'] = 'modules/?r=reviews/rss/' . $sMode;
                $this->aCurrent['sorting'] = 'updated';
                break;

            case '': // search results
                $this->checkRestrictionsForContext($sMode, $aParams, $oProfileAuthor);
                $this->sBrowseUrl = BX_DOL_SEARCH_KEYWORD_PAGE;
                $this->aCurrent['title'] = _t('_bx_reviews');
                unset($this->aCurrent['paginate']['perPage'], $this->aCurrent['rss']);
                break;

            default:
                $sMode = '';
                $this->isError = true;
        }

        $this->processReplaceableMarkers($oProfileAuthor);

        // in case we are using a custom control we can't have a private content at all and can have only either public or in context
        // content which also must be shows publicly
        if ($this->oModule->_oDb->getParam($CNF['PARAM_CONTEXT_CONTROL_ENABLE'])) {
            $this->setProcessPrivateContent(true);
        } else {
            $this->addConditionsForPrivateContent($CNF, $oProfileAuthor);
        }

        $this->addCustomConditions($CNF, $oProfileAuthor, $sMode, $aParams);
    }
}

class BxReviewsProductsSearchResult extends BxReviewsSearchResult
{
    function __construct($sMode = '', $aParams = array())
    {
        parent::__construct($sMode, $aParams);

        $this->aCurrent['searchFields'] = 'product';
        $this->aCurrent['title'] = _t('_bx_reviews_products');
    }
}

/** @} */
