<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Timeline Timeline
 * @ingroup     UnaModules
 *
 * @{
 */

class BxTimelinePageViewItem extends BxTemplPage
{
    protected $_sModule;
    protected $_oModule;

    protected $_iItemId;
    protected $_aItemData;

    public function __construct($aObject, $oTemplate = false)
    {
        $this->_sModule = 'bx_timeline';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);

        parent::__construct($aObject, $this->_oModule->_oTemplate);

        $iItemId = bx_process_input(bx_get('id'), BX_DATA_INT);
        if(!$iItemId) 
            return;

        $this->_iItemId = $iItemId;
        $this->_aItemData = $this->_oModule->getItemData($this->_iItemId);
    }

    protected function _isAvailablePage ($a)
    {
        if (!$this->_iItemId || $this->_aItemData['code'] == 1)
            return false;

        return parent::_isAvailablePage($a);
    }

    protected function _isVisiblePage ($a)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(!$this->_iItemId || $this->_aItemData['code'] == 2)
            return false;

        $oCf = BxDolContentFilter::getInstance();
        if($oCf->isEnabled() && !$oCf->isAllowed($this->_aItemData['event'][$CNF['FIELD_CF']]))
            return false;

        return parent::_isVisiblePage($a);
    }

    public function getCode()
    {
        if(empty($this->_aItemData) || !is_array($this->_aItemData))
            $this->_oTemplate->displayPageNotFound();

        if($this->_aItemData['code'] != 0) {
            switch($this->_aItemData['code']) {
                case 1:
                    $this->_oTemplate->displayPageNotFound();
                    break;

                case 2: 
                    $this->_oTemplate->displayAccessDenied($this->_aItemData['content']);
                    break;

                default:
                    $this->_oTemplate->displayMsg($this->_aItemData['content']);
            }
        }

        $sPageUrl = 'page.php?i=' . $this->_aObject['uri'] . '&id=' . $this->_iItemId;
        if(!empty($this->_aItemData['event']['content']['url']))
            $sPageUrl = $this->_aItemData['event']['content']['url'];

        BxDolTemplate::getInstance()->setPageUrl($sPageUrl);

        return parent::getCode();
    }
}

/** @} */
