<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    AIProxy AI Proxy
 * @ingroup     UnaModules
 *
 * @{
 */

class BxAiProxyDb extends BxDolModuleDb
{
    public function __construct(&$oConfig)
    {
        parent::__construct($oConfig);
    }

    /**
     * Active knowledge stores the master can search. A una-proxy store would call this site again.
     *
     * @return array<int, string>
     */
    public function getActiveKnowledgeStores(): array
    {
        $aStores = $this->getPairs(
            "SELECT `id`, `title` FROM `sys_agents_vector_store` WHERE `active` = 1 AND `type` <> :type ORDER BY `title` ASC",
            'id',
            'title',
            ['type' => 'una-proxy']
        );

        return is_array($aStores) ? $aStores : [];
    }
}

/** @} */
