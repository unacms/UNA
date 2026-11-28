<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup   Editor integration
 * @ingroup     UnaModules
 *
 * @{
 */

class BxEditorDb extends BxDolModuleDb
{
    function __construct(&$oConfig)
    {
        parent::__construct($oConfig);
    }
    
    public function getSettings ($sMode, $sType)
    {
        return $this->getOne("SELECT group_concat(`name` ORDER BY `order` SEPARATOR ',') FROM `bx_editor_toolbar_buttons` WHERE `mode` = :mode AND `inline` = :type AND `active` = 1", array(
            'mode' => $sMode,
            'type' => $sType,
        ));
    }
}

/** @} */
