<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    SocialEngineMigration SocialEngine Migration
 * @ingroup     UnaModules
 *
 * @{
 */

class BxSEMigTemplate extends BxBaseModGeneralTemplate
{
    public function __construct(&$oConfig, &$oDb)
    {
        $this -> MODULE = 'bx_se_migration';
        parent::__construct($oConfig, $oDb);
    }
}

/** @} */
