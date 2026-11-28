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

class BxStoriesGridAdministration extends BxBaseModTextGridAdministration
{
    public function __construct ($aOptions, $oTemplate = false)
    {
    	$this->MODULE = 'bx_stories';

        parent::__construct ($aOptions, $oTemplate);
    }
}

/** @} */
