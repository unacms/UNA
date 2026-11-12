<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Ads Ads
 * @ingroup     UnaModules
 *
 * @{
 */

require_once(BX_DIRECTORY_PATH_INC . "design.inc.php");

class BxAdsCronOffers extends BxDolCron
{
    protected $_sModule;
    protected $_oModule;

    public function __construct()
    {
        $this->_sModule = 'bx_ads';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);

        parent::__construct();
    }

    function processing()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aOffers = $this->_oModule->_oDb->getOffersBy(['type' => 'expired', 'hours' => (int)getParam($CNF['PARAM_LIFETIME_OFFERS'])]);
        foreach($aOffers as $aOffer)
            $this->_oModule->offerDecline($aOffer[$CNF['FIELD_OFR_ID']], true);
    }
}

/** @} */
