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

/**
 * Browse entries pages.
 */
class BxStoriesPageBrowse extends BxBaseModTextPageBrowse
{
    public function __construct($aObject, $oTemplate = false)
    {
        $this->MODULE = 'bx_stories';

        parent::__construct($aObject, $oTemplate);
    }
}

/** @} */
