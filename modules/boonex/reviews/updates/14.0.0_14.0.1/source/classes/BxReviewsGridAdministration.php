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

class BxReviewsGridAdministration extends BxBaseModTextGridAdministration
{
    public function __construct ($aOptions, $oTemplate = false)
    {
    	$this->MODULE = 'bx_reviews';
        parent::__construct ($aOptions, $oTemplate);
    }
}

/** @} */
