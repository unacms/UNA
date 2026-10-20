<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

define('BX_DOL_PAGINATE_PER_PAGE_DEFAULT', 10);

/**
 * Paginage for any content.
 * It is used to create paginate, configuring it via input parameters.
 * Paginate don't support total number of pages, moreover it is not recommended to count all records - it slows down the site.
 * To correctly determine last page we need to pass number of available records on the current page plus one - so we always know if next page is available.
 *
 *
 * Two types of paginate presentation is supported:
 * - getPaginate() - to get default paginate, it is better to use it on the whole page.
 * - getSimplePaginate() - to get limited paginate, it is better to use in some boxes, where availabel space is limited or for ajax paginate.
 *
 *
 * The list of available input parameters:
 *
 *
 * Parameters:
 * - start - position of the first item.
 * - num - number of available items on the page, it should be number of items per page + 1 (+1 is needed to correctly determine last page). It is possible to set this value automatically @see setNumFromDataArray.
 * - per_page - number of items displayed on the page.
 * - page_url - page URL to go through pages, special markers are automatically replaced.
 * - on_change_page - JavaScript code to be called on change page.
 * - info - display info.
 * - view_all_url - URL for 'view all' page. This url is not showed by default. It is convinient to use with @see getSimplePaginate.
 * - view_all_caption - optional caption for 'view all' link.
 *
 *
 * Available markers to replace in 'page_url' and 'on_change_page' parameters:
 * - {per_page} - current number of items to display per page.
 * - {start} - the number to display items starting from.
 *
 *
 * Example of usage:
 * @code
 * $oPaginate = new BxDolPaginate(array(
 *      'start' => 0,
 *      'num' => 11,
 *      'per_page' => 10,
 *      'on_change_page' => 'changePage({start}, {per_page})'
 * ));
 * $oPaginate->getPaginate();
 * @endcode
 *
 *
 * Memberships/ACL:
 * Doesn't depend on user's membership.
 *
 *
 * Alerts:
 * no alerts available
 *
 */
abstract class BxDolPaginate extends BxDol
{
    protected $_aParams; ///< an array with initially provided params

    protected $_iStart; ///< start display items from this number
    protected $_iPerPage; ///< results per page
    protected $_iNum; ///< available results, you need to query per_page + 1 results, so paginate can determine last page

    protected $_iTotal; ///< total number of results. (Optional)
    protected $_bTotal; ///< show displayed items info with total value

    protected $_sPageUrl; ///< page url of next/prev page, special markers will be replaced here automatically
    protected $_sOnChangePage; ///< on click of next/prev page, special markers will be replaced here automatically
    protected $_bInfo; ///< show displayed items info

    protected $_sViewAllUrl; ///< view "all results" url, for "simple" paginate
    protected $_sViewAllCaption; ///< 'view all' link caption

    /**
     * Constructor
     */
    public function __construct($aParams)
    {
        parent::__construct();

        if (isset($aParams['count']))
           trigger_error ('Paginate "count" is deprecated - use "num" instead: ' . get_class($this), E_USER_ERROR);

        //--- Main settings ---//
        $this->_aParams = $aParams;

        $this->_iStart = isset($aParams['start']) && (int)$aParams['start'] > 0 ? (int)$aParams['start'] : 0;
        $this->_iPerPage = isset($aParams['per_page']) && (int)$aParams['per_page'] > 0 ? (int)$aParams['per_page'] : BX_DOL_PAGINATE_PER_PAGE_DEFAULT;
        $this->_iNum = isset($aParams['num']) ? (int)$aParams['num'] : 0;

        $this->_iTotal = isset($aParams['total']) ? (int)$aParams['total'] : 0;
        $this->_bTotal = $this->_iTotal > 0;

        $this->_bInfo = isset($aParams['info']) ? (bool)$aParams['info'] : true;
        
        $this->_sViewAllUrl = isset($aParams['view_all_url']) ? $aParams['view_all_url'] : false;
        $this->_sViewAllCaption = isset($aParams['view_all_caption']) ? $aParams['view_all_caption'] : _t('_sys_paginate_view_all');       

        // page url
        $this->_sPageUrl = isset($aParams['page_url']) ? $aParams['page_url'] : BX_DOL_URL_ROOT;

        // on click (js mode)
        $this->_sOnChangePage = isset($aParams['on_change_page']) ? $aParams['on_change_page'] : '';
    }

    /**
     * Get number of available results per page. If it is not last page,
     * then this number is number of result per page plus one.
     * @return integer
     */
    public function getNum()
    {
        return $this->_iNum;
    }

    /**
     * Set number of available items on the page directly from data array.
     * Since data array should contain additional record - we will pop last item from array automatically.
     * @return nothing.
     */
    public function setNumFromDataArray(&$a, $isAutoPopLastElement = true)
    {
        if ($a && is_array($a))
            $this->_iNum = count($a);
        else
            $this->_iNum = 0;

        if ($this->_iNum > $this->_iPerPage && $isAutoPopLastElement)
            array_pop($a);
    }

    /**
     * Set number of available items on the page,
     * it should be number of items per page + 1 (+1 is needed to correctly determine last page).
     * It is possible to set this value automatically @see setNumFromDataArray.
     * @param $i positive integer.
     * @return true on success or false if $i param isn't correct.
     */
    public function setNum($i)
    {
        if ($i >= 0) {
            $this->_iNum = (int)$i;
            return true;
        }
        return false;
    }

    /**
     * Position, the data is showing from.
     * @return integer.
     */
    public function getStart()
    {
        return $this->_iStart;
    }

    /**
     * Set the starting position, the data is showing from.
     * @param $i positive integer.
     * @return true on siccess or false on error.
     */
    public function setStart($i)
    {
        if ($i >= 0) {
            $this->_iStart = (int)$i;
            return true;
        }
        return false;
    }

    /**
     * Get number of records per page.
     * @return integer.
     */
    public function getPerPage()
    {
        return $this->_iPerPage;
    }

    /**
     * Set number of records per page.
     * @param $i positive integer.
     * @return integer.
     */
    public function setPerPage($i)
    {
        if ((int)$i > 0) {
            $this->_iPerPage = $i;
            return true;
        }
        return false;
    }

    /**
     * Set string to pass to 'onclick' for change page button.
     * The following markers are replaced automatically:
     * - {per_page}
     * - {start}
     *
     * @param $i positive integer.
     * @return integer.
     */
    public function setOnChangePage($s)
    {
        $this->_sOnChangePage = $s;
    }

    /**
     * @return true if previous page is available, or false if not
     */
    public function isPrevAvail ()
    {
        return $this->_iStart > 0 ? true : false;
    }

    /**
     * @return true if next page is available, or false if not
     */
    public function isNextAvail ()
    {
        return $this->_iNum > $this->_iPerPage ? true : false;
    }

    public function isLoadMoreAvail ()
    {
        return $this->isNextAvail();
    }

    protected function _getReplacement()
    {
        return [
            'start' => $this->_iStart,
            'per_page' => $this->_iPerPage,
        ];
    }

    protected function _getReplacementPrev()
    {
        return array_merge($this->_getReplacement(), [
            'start' => ($iStart = $this->_iStart - $this->_iPerPage) > 0 ? $iStart : 0
        ]);
    }

    protected function _getReplacementNext()
    {
        return array_merge($this->_getReplacement(), [
            'start' => $this->_iStart + $this->_iPerPage
        ]);
    }

    protected function _getReplacementLoadMore()
    {
        return $this->_getReplacementNext();
    }

    protected function _getPageChangeUrl($aMarkers)
    {
        return bx_replace_markers($this->_sPageUrl, $aMarkers);
    }

    protected function _getPageChangeOnClick($aMarkers)
    {
        return !empty($this->_sOnChangePage) ? 'onclick="javascript:' . bx_replace_markers($this->_sOnChangePage, $aMarkers) . '; return false;"' : '';
    }
}

/** @} */
