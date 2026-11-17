<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Market Market
 * @ingroup     UnaModules
 *
 * @{
 */

class BxMarketMenuSnippetMeta extends BxBaseModTextMenuSnippetMeta
{
    public function __construct($aObject, $oTemplate = false)
    {
        $this->_sModule = 'bx_market';

        parent::__construct($aObject, $oTemplate);
    }

    protected function _getMenuItemAuthor($aItem)
    {
        // on a card, and for the apps, the author as every content card shows it (with the avatar)
        if($this->_bCard || $this->_bIsApi)
            return parent::_getMenuItemAuthor($aItem);

        $CNF = &$this->_oModule->_oConfig->CNF;

        $oProfile = BxDolProfile::getInstance($this->_aContentInfo[$CNF['FIELD_AUTHOR']]);
        if(!$oProfile) 
            $oProfile = BxDolProfileUndefined::getInstance();

        return $this->getUnitMetaItemText($oProfile->getDisplayName());
    }
}

/** @} */
