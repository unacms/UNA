<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * The signed-in account's personal access tokens (BxDolApiTokens) in account settings > Connectors,
 * on the site and in the apps. Studio's grid of them is BxBaseStudioAgentsConnectors.
 * @see BxDolApiTokensGrid
 */
class BxDolGridApiTokens extends BxTemplGrid
{
    use BxDolApiTokensGrid;

    public function __construct ($aOptions, $oTemplate = false)
    {
        parent::__construct ($aOptions, $oTemplate);

        $this->_initApiTokens();
    }
}

/** @} */
