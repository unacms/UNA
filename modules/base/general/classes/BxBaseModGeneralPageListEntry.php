<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    BaseGeneral Base classes for modules
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * * List entry page
 */
class BxBaseModGeneralPageListEntry extends BxBaseModGeneralPageBrowse
{    
    protected $_iListId;
    
    public function __construct($aObject, $oTemplate = false)
    {
        parent::__construct($aObject, $oTemplate);

        $CNF = &$this->_oModule->_oConfig->CNF;

        $this->_iListId = 0;
        if(bx_get('list_id') !== false)
            $this->_iListId = (int)bx_get('list_id');

        $oFavorite = BxDolFavorite::getObjectInstance($CNF['OBJECT_FAVORITES'], 0, true);
        $aList = $oFavorite->getQueryObject()->getList(array('type' => 'id', 'list_id' => $this->_iListId));   
        if($this->_iListId != 0 && (empty($aList) || !is_array($aList))) {
            $this->_iListId = false;
            return false;
        }

        $sTitle = $this->_iListId != 0 ? $aList['title'] : _t('_sys_txt_default_favorite_list');

        $this->addMarkers(array(
            'title' => $sTitle
        ));

        $this->_aObject['title'] = $sTitle;
    }

    public function getCode ()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if($this->_iListId === false) {
            $this->_oTemplate->displayPageNotFound();
            exit;
        }

        if ($this->_iListId > 0) {
            $oPrivacy = BxDolPrivacy::getObjectInstance($CNF['OBJECT_PRIVACY_LIST_VIEW']);
            if (!$oPrivacy->check($this->_iListId)) {
                $this->_oTemplate->displayAccessDenied('');
                exit;
            }
        }

        return parent::getCode();
    }

    /**
     * The checks of getCode, for the API page (and em.php) as well, which don't run getCode.
     */
    protected function _isAvailablePage($a)
    {
        if($this->_iListId === false)
            return false;

        return parent::_isAvailablePage($a);
    }

    protected function _isVisiblePage($a)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if($this->_iListId > 0 && !BxDolPrivacy::getObjectInstance($CNF['OBJECT_PRIVACY_LIST_VIEW'])->check($this->_iListId))
            return false;

        return parent::_isVisiblePage($a);
    }
}