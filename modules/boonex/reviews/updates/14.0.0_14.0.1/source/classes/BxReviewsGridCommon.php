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

class BxReviewsGridCommon extends BxBaseModTextGridCommon
{
    public function __construct ($aOptions, $oTemplate = false)
    {
    	$this->MODULE = 'bx_reviews';
        parent::__construct ($aOptions, $oTemplate);
    }
}

/** @} */
