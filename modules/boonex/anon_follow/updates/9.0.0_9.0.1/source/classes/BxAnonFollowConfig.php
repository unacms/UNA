<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    AnonymousFollow Anonymous Follow
 * @ingroup     UnaModules
 *
 * @{
 */

class BxAnonFollowConfig extends BxDolModuleConfig
{
    public $CNF = [];

    public function __construct($aModule)
    {
        parent::__construct($aModule);
        $this->CNF = array (
           // database tables
           'TABLE_ENTRIES' => $aModule['db_prefix'] . 'subscriptions',
           
            // database fields
           'FIELD_ID' => 'id',
           'FIELD_INITIATOR' => 'initiator',
           'FIELD_CONTENT' => 'content',
           'FIELD_ADDED' => 'added',
       );
    }
}

/** @} */
