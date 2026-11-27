<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Organizations Organizations
 * @ingroup     UnaModules
 *
 * @{
 */

/*
 * Organizations module representation.
 */
class BxOrgsTemplate extends BxBaseModGroupsTemplate
{
    function __construct(&$oConfig, &$oDb)
    {
        $this->MODULE = 'bx_organizations';

        parent::__construct($oConfig, $oDb);

        $this->_bLetterAvatar = true;

        $this->_bUnitCard = true;

        $this->_sUnitClass = 'bx-base-pofile-unit';
        $this->_sUnitClassWoCover = $this->_sUnitClass;
        $this->_sUnitClassWithCover = 'bx-base-pofile-unit-with-cover';
        $this->_sUnitClassWoInfo = 'bx-base-pofile-unit-wo-info';
        $this->_sUnitClassWoInfoShowCase = 'bx-base-pofile-unit-wo-info bx-base-unit-showcase bx-base-pofile-unit-wo-info-showcase';
        $this->_sUnitClassShowCase = 'bx-base-pofile-unit-with-cover bx-base-unit-showcase bx-base-pofile-unit-showcase';
    }

    protected function _getUnitClass($aData, $sTemplateName = 'unit.html')
    {
        return BxBaseModProfileTemplate::_getUnitClass($aData, $sTemplateName);
    }

    protected function _getUnitSize($aData, $sTemplateName = 'unit.html')
    {
        return BxBaseModProfileTemplate::_getUnitSize($aData, $sTemplateName);
    }
}

/** @} */
