<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Resources Resources
 * @ingroup     UnaModules
 *
 * @{
 */

class BxResourcesCmts extends BxTemplCmts
{
    protected $_sModule;
    protected $_oModule;

    public function __construct($sSystem, $iId, $iInit = 1)
    {
        parent::__construct($sSystem, $iId, $iInit);

        $this->_sModule = 'bx_resources';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);

        $this->_aT = array_merge($this->_aT, [
            'block_comments_title' => '_bx_resources_page_block_title_entry_comments'
        ]);
    }
}

/** @} */
