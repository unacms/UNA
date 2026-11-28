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

/**
 * Browse entries pages.
 */
class BxReviewsPageBrowse extends BxBaseModTextPageBrowse
{
    public function __construct($aObject, $oTemplate = false)
    {
        $this->MODULE = 'bx_reviews';
        parent::__construct($aObject, $oTemplate);
    }
}

/** @} */
