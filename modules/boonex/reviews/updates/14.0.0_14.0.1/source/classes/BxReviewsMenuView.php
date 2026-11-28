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
 * View entry menu
 */
class BxReviewsMenuView extends BxBaseModTextMenuView
{
    public function __construct($aObject, $oTemplate = false)
    {
        $this->MODULE = 'bx_reviews';
        parent::__construct($aObject, $oTemplate);
    }
}

/** @} */
