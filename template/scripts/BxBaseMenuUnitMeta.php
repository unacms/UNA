<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Menu representation.
 * @see BxDolMenu
 */
class BxBaseMenuUnitMeta extends BxTemplMenuCustom
{
    protected $_sStylePrefix;

    protected $_sContext;

    protected $_iButtons;
    protected $_iButtonsMax;

    public function __construct ($aObject, $oTemplate)
    {
        parent::__construct ($aObject, $oTemplate);

        $this->_sStylePrefix = 'sys-meta';

        $this->_sContext = '';

        $this->_iButtons = 0;
        $this->_iButtonsMax = false;
    }

    public function setContext($sContext)
    {
        $this->_sContext = $sContext;
    }

    public function getUnitMetaItemLink($sContent, $aAttrs = array())
    {
        return $this->getUnitMetaItemButtonOrLink('a', $sContent, $aAttrs);
    }

    public function getUnitMetaItemText($sContent, $aAttrs = array())
    {
        return $this->getUnitMetaItem('span', $sContent, $aAttrs);
    }

    public function getUnitMetaItemButton($sContent, $aAttrs = array())
    {
        if(!$this->_buttonsCounterCheck())
            return false;

        $sResult = $this->getUnitMetaItemButtonOrLink('button', $sContent, $aAttrs);
        if(!empty($sResult))
            $this->_buttonsCounterIncrement();

        return $sResult;
    }

    public function getUnitMetaItemButtonSmall($sContent, $aAttrs = array())
    {
        if(!$this->_buttonsCounterCheck())
            return false;

        $sResult = $this->getUnitMetaItemButtonOrLink('sbutton', $sContent, $aAttrs);
        if(!empty($sResult))
            $this->_buttonsCounterIncrement();

        return $sResult;
    }

    public function getUnitMetaItemNl($sContent = '')
    {
        return $this->getUnitMetaItem('nl', $sContent);
    }

    public function getUnitMetaItemCustom($sContent)
    {
        return $this->getUnitMetaItem('custom', $sContent);
    }
    
    public function getUnitMetaItemExtended($sContent = '', $sIcon = '', $sUrl = '', $bIsNoBg = false, $bIsNoPadding = false )
    {
        $aTmplVarsEx = [];
        
        if ($sContent == '' && $sIcon == '')
            return ;
        
        $aTmplVarsEx['bx_if:icon'] = [
            'condition' => ($sIcon != ''),
            'content' => ['icon' => $this->getMenuIconHtml($sIcon)]
        ];
        
        $aTmplVarsEx['bx_if:noicon'] = [
            'condition' => ($sIcon == ''),
            'content' => []
        ];
        
        $aTmplVarsEx['bx_if:a'] = [
            'condition' => ($sUrl != ''),
            'content' => ['link' => $sUrl]
        ];
        
        $aTmplVarsEx['bx_if:a2'] = [
            'condition' => ($sUrl != ''),
            'content' => []
        ];

        $aTmplVarsEx['bx_if:text'] = [
            'condition' => ($sContent != ''),
            'content' => ['content' => $sContent]
        ];

        $aTmplVars['bx_if:extended'] = [
            'condition' => true,
            'content' => $aTmplVarsEx
        ];
        
        $aTags = array('span', 'a', 'button', 'sbutton', 'custom', 'nl');
        
        foreach($aTags as $sTag) {
            $aTmplVars['bx_if:' . $sTag] = array(
            	'condition' => false,
                'content' => []
            );
        }
        
        $aTmplVars['class'] = $bIsNoBg ? 'bx-menu-meta-item-ex-no-bg' : '';
        
        $aTmplVars['class'] = $bIsNoPadding ? 'bx-menu-meta-item-ex-no-pad' : '';
        
        return $this->_oTemplate->parseHtmlByName('unit_meta_item_ex.html', $aTmplVars);
    }

    public function getUnitMetaItem($sName, $sContent, $aAttrs = [], $sTemplate = 'unit_meta_item.html')
    {
        if(empty($sContent) && $sName != 'nl')
            return '';

        return $this->_oTemplate->parseTag($sName, $sContent, $aAttrs, [
            'template_name' => $sTemplate,
            'template_vars' => [
                'style_prefix' => $this->_sStylePrefix
            ]
        ]);
    }

    public function getUnitMetaItemButtonOrLink($sName, $sContent, $aAttrs = array())
    {
        if(!isset($aAttrs['href']))
            $aAttrs['href'] = 'javascript:void(0)';

        // A button that only runs a script is a button, not a link (see BxBaseMenu::_getMenuAttrs).
        if(!isset($aAttrs['role']) && strncmp($aAttrs['href'], 'javascript:', 11) === 0)
            $aAttrs['role'] = 'button';

        return $this->getUnitMetaItem($sName, $sContent, $aAttrs);
    }
    
    protected function _getMenuItemNl($aItem)
    {
        return $this->getUnitMetaItemNl();
    }

    protected function _getMenuItemDefault($aItem)
    {
        $sResult = '';

        if(!empty($aItem['link']))
            $sResult = $this->getUnitMetaItemLink($aItem['title'], array(
                'href' => $aItem['link']
            ));
        else if(!empty($aItem['onclick']))
            $sResult = $this->getUnitMetaItemButtonSmall($aItem['title'], array(
            	'onclick' => $aItem['onclick']
            ));
        else 
            $sResult = $this->getUnitMetaItemText($aItem['title']);
        
        return $sResult;
    }

    protected function _getMenuItemAPI($aItem, $mixedType = 'text', $aData = [])
    {
        $sDisplayType = 'link';
        $sContentType = 'text';
        if(is_array($mixedType)) {
            if(isset($mixedType['display']))
                $sDisplayType = $mixedType['display'];
            if(isset($mixedType['content']))
                $sContentType = $mixedType['content'];
        }
        else
            $sContentType = $mixedType;

        $aItemData = array_merge([
            'id' => $aItem['id'],
            'name' => $aItem['name'],
            'display_type' => $sDisplayType,
            'content_type' => $sContentType,
            'title' => $aItem['title'],
            'link' => !empty($aItem['link']) && $aItem['link'] != 'javascript:void(0)' ? $aItem['link'] : '',
            'primary' => !empty($aItem['primary']),
        ], $aData);

        return $aItemData;
    }

    protected function _getMenuItemElementAPI($aItem, $aElement)
    {
        return [
            'id' => $aItem['id'],
            'name' => $aItem['name'],
            'display_type' => 'element',
            'data' => $aElement
        ];
    }

    protected function _buttonsCounterReset()
    {
        if($this->_iButtonsMax === false)
            return;

        $this->_iButtons = 0;
    }

    protected function _buttonsCounterIncrement()
    {
        if($this->_iButtonsMax === false)
            return;

        $this->_iButtons++;
    }

    protected function _buttonsCounterCheck()
    {
        if($this->_iButtonsMax === false)
            return true;

        return $this->_iButtons < $this->_iButtonsMax;
    }

    protected function _isVisibleInContext($aItem)
    {
        $sDiv = ',';

        if(empty($this->_sContext) && empty($aItem['hidden_on_cxt']))
            return true;

        //--- Hide everywhere.
        if($aItem['hidden_on_cxt'] == 'all')
            return false;

        //--- Hide everywhere except following list.
        if(substr($aItem['hidden_on_cxt'], 0, 4) == 'all!') {
            $aContexts = explode($sDiv, substr($aItem['hidden_on_cxt'], 4));
            return in_array($this->_sContext, $aContexts);
        }

        $aContexts = explode($sDiv, $aItem['hidden_on_cxt']);
        return !in_array($this->_sContext, $aContexts);
    }
}

/** @} */
