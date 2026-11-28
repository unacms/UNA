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

class BxReviewsAlertsResponse extends BxBaseModTextAlertsResponse
{
    public function __construct()
    {
        $this->MODULE = 'bx_reviews';
        parent::__construct();
    }
}

/** @} */
