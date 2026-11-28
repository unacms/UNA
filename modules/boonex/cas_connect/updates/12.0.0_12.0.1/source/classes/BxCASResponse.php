<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    CASConnect CAS Connect
 * @ingroup     UnaModules
 *
 * @{
 */

class BxCASResponse extends BxDolAlertsResponse
{
    protected $_sModule;
    protected $_oModule;

    public function __construct()
    {
        parent::__construct();

        $this->_sModule = 'bx_cas';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);
    }

    /**
     * Overwtire the method of parent class.
     *
     * @param BxDolAlerts $oAlert an instance of alert.
     */
    public function response($oAlert)
    {
        $sMethod = '_process' . bx_gen_method_name($oAlert->sUnit . '_' . $oAlert->sAction);
        if(!method_exists($this, $sMethod))
            return;

        return $this->$sMethod($oAlert);
    }

    protected function _processAccountAddForm($oAlert)
    {
        $sCode = $this->_oModule->serviceAccountAddFormCheck();
        if($sCode)
            $oAlert->aExtras['form_code'] = $sCode;
    }
}

/** @} */

