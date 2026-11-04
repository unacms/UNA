<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Glossary Glossary 
 * @ingroup     UnaModules
 *
 * @{
 */

class BxGlsrSearchResult extends BxBaseModTextSearchResult
{
    function __construct($sMode = '', $aParams = array())
    {
        parent::__construct($sMode, $aParams);

        $this->aCurrent = array(
            'name' => 'bx_glossary',
            'module_name' => 'bx_glossary',
            'object_metatags' => 'bx_glossary',
            'title' => _t('_bx_glossary_page_title_browse'),
            'table' => 'bx_glossary_terms',
            'ownFields' => array('id', 'title', 'text', 'thumb', 'author', 'added'),
            'searchFields' => array(),
            'restriction' => array(
                'author' => array('value' => '', 'field' => 'author', 'operator' => '='),
                'featured' => array('value' => '', 'field' => 'featured', 'operator' => '<>'),
                'status' => array('value' => 'active', 'field' => 'status', 'operator' => '='),
                'statusAdmin' => array('value' => 'active', 'field' => 'status_admin', 'operator' => '='),
            ),
            'paginate' => array('perPage' => getParam('bx_glossary_per_page_browse'), 'start' => 0),
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
                ),
            ),
            'ident' => 'id',
        );

        $this->sFilterName = 'bx_glossary_filter';
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
                $this->aCurrent['title'] = _t('_bx_glossary_page_title_browse_recent');
                $this->aCurrent['rss']['link'] = 'modules/?r=glossary/rss/' . $sMode;
                break;

            case 'featured':
                $this->sBrowseUrl = BxDolPermalinks::getInstance()->permalink($CNF['URL_HOME']);
                $this->aCurrent['title'] = _t('_bx_glossary_page_title_browse_featured');
                $this->aCurrent['restriction']['featured']['value'] = '0';
                $this->aCurrent['rss']['link'] = 'modules/?r=glossary/rss/' . $sMode;
                $this->aCurrent['sorting'] = 'featured';
                break;

            case 'popular':
                $this->sBrowseUrl = BxDolPermalinks::getInstance()->permalink($CNF['URL_POPULAR']);
                $this->aCurrent['title'] = _t('_bx_glossary_page_title_browse_popular');
                $this->aCurrent['rss']['link'] = 'modules/?r=glossary/rss/' . $sMode;
                $this->aCurrent['sorting'] = 'popular';
                break;

            case 'top':
                $this->sBrowseUrl = BxDolPermalinks::getInstance()->permalink($CNF['URL_TOP']);
                $this->aCurrent['title'] = _t('_bx_glossary_page_title_browse_top');
                $this->aCurrent['rss']['link'] = 'modules/?r=glossary/rss/' . $sMode;
                $this->aCurrent['sorting'] = 'top';
                break;

            case 'updated':
                $this->sBrowseUrl = BxDolPermalinks::getInstance()->permalink($CNF['URL_UPDATED']);
                $this->aCurrent['title'] = _t('_bx_glossary_page_title_browse_updated');
                $this->aCurrent['rss']['link'] = 'modules/?r=glossary/rss/' . $sMode;
                $this->aCurrent['sorting'] = 'updated';
                break;

            case 'alphabetical':
                $this->sBrowseUrl = BxDolPermalinks::getInstance()->permalink($CNF['URL_HOME']);
                $this->aCurrent['title'] = _t('_bx_glossary_page_title_browse_alphabetical');
                $this->aCurrent['rss']['link'] = 'modules/?r=glossary/rss/' . $sMode;
                $this->aCurrent['sorting'] = 'alphabetical';
                break;

            case '': // search results
                $this->sBrowseUrl = BX_DOL_SEARCH_KEYWORD_PAGE;
                $this->aCurrent['title'] = _t('_bx_glossary');
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
            case 'alphabetical':
                $aSql['order'] = ' ORDER BY `bx_glossary_terms`.`title` ASC';
                break;

            default:
                $aSql = parent::getAlterOrder();
        }

        return $aSql;
    }

    function displayResultBlock ()
    {
        if ($this->bShowcaseView){
            $this->addContainerClass(array('bx-def-margin-sec-lefttopright-neg', 'bx-base-unit-showcase-wrapper'));
			$this->aCurrent['paginate']['perPage'] = $this->getItemPerPageInShowCase();
			$this->oModule->_oTemplate->addCss(array(BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'flickity/|flickity.css'));
            $this->oModule->_oTemplate->addJs(array('flickity/flickity.pkgd.min.js','modules/base/general/js/|showcase.js'));
		}
        
        $bIsAlphabetical = false;
        if ($this->aCurrent['sorting'] == 'alphabetical')
            $bIsAlphabetical = true;
        
        $CNF = &$this->oModule->_oConfig->CNF;
        $sCode = '';
        $sLetter = '';
        $aData = $this->getSearchData();
        if ($this->aCurrent['paginate']['num'] > 0) {
            $sCode .= $this->addCustomParts();
            foreach ($aData as $aValue){
                if ($bIsAlphabetical){
                    $sTmp = mb_strtoupper(get_mb_substr($aValue[$CNF['FIELD_TITLE']], 0, 1));
                    if($sTmp != $sLetter){
                        $sLetter = $sTmp;
                        $sCode .= $this->oModule->_oTemplate->getAlphabeticalAnchor($sLetter);
                    }
                }
                $sCode .= $this->displaySearchUnit($aValue);
            }
            $sSearchResultBlockId = 'bx-search-result-block-' . rand(0, PHP_INT_MAX);
            $sClasses = implode(' ', $this->aContainerClasses);
            $sCode = '<div id="' . $sSearchResultBlockId . '" class="' . $sClasses . '">' . $sCode . '</div>';

            if (!$this->_bLiveSearch && $this->sCenterContentUnitSelector) {
                $sCode .= "
                    <script>
                        $(document).ready(function() {
                            bx_center_content('#{$sSearchResultBlockId}', '{$this->sCenterContentUnitSelector}', true);
                        });
                    </script>";
            }
            if ($bIsAlphabetical) {
                $this->oModule->_oTemplate->addJs('alphabetical_list.js');
                if (($sLetter = bx_get('letter')) !== false) {
                    $sCode .= "
                    <script>
                        $(document).ready(function() {
                            BxGlsrAlphabeticalList_goAnchor('" . bx_process_output($sLetter) . "')
                        });
                    </script>";
                }
            }
        }
        return $sCode;   
    }
    
}

/** @} */
