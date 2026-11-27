<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Groups Groups
 * @ingroup     UnaModules
 *
 * @{
 */

/*
 * Groups module representation.
 */
class BxGroupsTemplate extends BxBaseModGroupsTemplate
{
    function __construct(&$oConfig, &$oDb)
    {
        $this->MODULE = 'bx_groups';
        parent::__construct($oConfig, $oDb);

        // the gallery card (unit.html here) is the apps' card (unit_card.html), as people's and organizations' is
        $this->_bUnitCard = true;
        $this->_aUnitCardTemplates = ['unit.html', 'unit_with_cover.html'];
        $this->_sUnitCardViewIcon = 'arrow-circle-right';
    }
}

/** @} */
