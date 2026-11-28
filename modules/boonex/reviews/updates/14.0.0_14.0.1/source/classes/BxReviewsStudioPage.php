<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Reviews Reviews
 * @ingroup     UnaModules
 *
 * @{
 */

class BxReviewsStudioPage extends BxTemplStudioModule
{
    protected $_sModule;
    protected $_oModule;
    
    function __construct($sModule, $mixedPageName, $sPage = "")
    {
    	$this->_sModule = 'bx_reviews';
    	$this->_oModule = BxDolModule::getInstance($this->_sModule);

        parent::__construct($sModule, $mixedPageName, $sPage);

        $this->aMenuItems = [
            'settings' => ['name' => 'settings', 'icon' => 'cog', 'title' => '_bx_reviews_txt_settings'],
            'voting_options' => ['name' => 'voting_options', 'icon' => 'star', 'title' => '_bx_reviews_txt_voting_options'],
        ];
    }

    protected function getVotingOptions()
    {
        bx_import('BxTemplGrid');
        /** @noinspection PhpParamsInspection */
        $oGrid = BxDolGrid::getObjectInstance('bx_reviews_voting_options', BxDolStudioTemplate::getInstance());
        if (!$oGrid) die('"bx_reviews_voting_options" grid object is not defined');

        return $oGrid->getCode();
    }
}

/** @} */
