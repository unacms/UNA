<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Wiki block menu
 */
class BxBaseMenuWiki extends BxTemplMenu
{
    protected $_oWikiObject;
    protected $_iBlockId;

    public function __construct ($aObject, $oTemplate)
    {
        parent::__construct ($aObject, $oTemplate);

        if(($sObject = bx_get('wiki_obj')) !== false)
            $this->setParams($sObject, bx_get('block_id'));
    }

    public function setParams($sObject, $iBlockId)
    {
        $oObject = BxDolWiki::getObjectInstance($sObject);
        if(!$oObject)
            return;

        $this->_oWikiObject = $oObject;
        $this->_iBlockId = (int)$iBlockId;
    }

    public function getCode ()
    {
        $s = parent::getCode ();
        $s .= '<script>window.glBxDolWiki' . $this->_iBlockId . '.bindEvents();</script>';
        return $s;
    }

    protected function _getMenuItemEditImage($aItem)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aResult = $this->_getMenuItemByNameActions($aItem, [
            'object_menu' => $CNF['OBJECT_MENU_ACTIONS_VIEW_MEDIA']
        ]);

        if($this->_bIsApi) {
            $aResult = array_merge($aResult, [
                'link' => BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_EDIT_MEDIA'] . '&id=' . $this->_iMediaId),
            ]);

            unset($aResult['display_type'], $aResult['data']);
        }

        return $aResult;
    }

    protected function _getMenuItemAPI($a)
    {
        $aResult = parent::_getMenuItemAPI($a);
        
        $sUri = $this->_oWikiObject->getUri();
        
        $aAdd = [];
        switch($a['name']) {
            case 'edit':
                $aAdd = [
                    'display_type' => 'modal',
                    'data' => [
                        'request_url' => 'system/wiki_action/TemplServiceWiki&params[]=' . $sUri . '&params[]=edit&params[]=' . $this->_iBlockId,
                    ]
                ];
                break;

            case 'delete-version':
                $aAdd = [
                    'display_type' => 'modal',
                    'data' => [
                        'request_url' => 'system/wiki_action/TemplServiceWiki&params[]=' . $sUri . '&params[]=delete-version&params[]=' . $this->_iBlockId,
                    ]
                ];
                break;

            case 'delete-block':
                $aAdd = [
                    'display_type' => 'callback',
                    'data' => [
                        'request_url' => 'system/wiki_action/TemplServiceWiki&params[]=' . $sUri . '&params[]=delete-block&params[]=' . $this->_iBlockId,
                        'on_callback' => 'hide'
                    ]
                ];
                break;

            case 'translate':
                $aAdd = [
                    'display_type' => 'modal',
                    'data' => [
                        'request_url' => 'system/wiki_action/TemplServiceWiki&params[]=' . $sUri . '&params[]=translate&params[]=' . $this->_iBlockId,
                    ]
                ];
                break;

            case 'history':
                $aAdd = [
                    'display_type' => 'modal',
                    'data' => [
                        'request_url' => 'system/wiki_action/TemplServiceWiki&params[]=' . $sUri . '&params[]=history&params[]=' . $this->_iBlockId,
                    ]
                ];
                break;
        }

        if($aAdd)
            $aResult = array_merge($aResult, $aAdd);

        return $aResult;
    }

    /**
     * Check if menu items is visible with extended checking for friends notifications
     * @param $a menu item array
     * @return boolean
     */
    protected function _isVisible ($a)
    {
        if(!$this->_oWikiObject || !parent::_isVisible($a))
            return false;

        return $this->_oWikiObject->isAllowed($a['name']);
    }
}

/** @} */
