<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup	Messenger Messenger
 * @ingroup		UnaModules
 *
 * @{
 */

/**
 * View block menu.
 */
class BxMessengerNavGroupsMenu extends BxTemplMenuProfileFollowings
{
    private $_sModule = '';
    private $_oModule = null;
    private $_oConfig = null;
    private $_oDb = null;
    private $_aMenuStat = null;
    private $_iProfileId = 0;

    public function __construct ($aObject, $oTemplate = false)
    {
        $this->_sModule = 'bx_messenger';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);
        parent::__construct ($aObject, $this->_oModule->_oTemplate);

        $this->_oConfig = &$this->_oModule->_oConfig;
        $this->_oDb = &$this->_oModule->_oDb;

        $this->_iProfileId = bx_get_logged_profile_id();
        if ($this->_iProfileId) {
            $this->_aMenuStat = $this->_oModule->_oDb->getUnreadMessagesStat($this->_iProfileId);
        }
    }

    protected function _getMenuItem ($a){
        $aMenuItem = parent::_getMenuItem($a);
        $iAddon = 0;
        if (isset($this->_aMenuStat['groups'])) {
            if (isset($aMenuItem['module'])) {
                if (isset($this->_aMenuStat['groups'][$aMenuItem['module']]))
                    $iAddon = count($this->_aMenuStat['groups'][$aMenuItem['module']]);
            } else if (!empty($aMenuItem['parent']) &&
                    isset($this->_aMenuStat['groups'][$aMenuItem['parent']]) &&
                    isset($this->_aMenuStat['groups'][$aMenuItem['parent']][$aMenuItem['group-id']]))
            {
                $iAddon = count($this->_aMenuStat['groups'][$aMenuItem['parent']][$aMenuItem['group-id']]);
            }
        }

        $sModule = isset($aMenuItem['module']) ? $aMenuItem['module'] : '';
        $aMenuItem['bx_if:addon'] = array (
            'condition' => true,
            'content' => array(
                'addon' => $iAddon,
                'hidden' => !$iAddon ? 'hidden' : '',
                'bx_if:module' => array(
                    'condition' => $sModule,
                    'content' => array(
                        'type' => $sModule
                    )
                )
            )
        );

        return $aMenuItem;
    }

    public function getMenuItemsRaw(){
        $CNF = $this->_oConfig->CNF;

        $iProfileId = bx_get_logged_profile_id();

        //echo '<pre>';
        $aMenuItems = array();
        $aGroupsList = $this->_oDb->getMyLotsByGroups($iProfileId);

        //print_r($aGroupsList);
        //exit;
        if (empty($aGroupsList))
            return $aMenuItems;

		$i = 0;
        foreach($aGroupsList as $sModule => $aModule) {
            $aMenuItems[$sModule] = [
                'onclick' => "javascript:bx_menu_toggle(this, '" . $this->_sObject . "', '" . $sModule . "')",
                'title' => _t("_{$sModule}"),
                'module' => $sModule,
                'name' => $sModule . $iProfileId,
				'id' => $i++,
            ];

            $aSubmenu = array();
            foreach ($aModule as &$aItem) {
                if ($sModule !== BX_MSG_TALK_TYPE_PAGES) {                    
                    if ($oContext = BxDolProfile::getInstance($aItem['id'])){
                    $sIcon = $oContext->getIcon();
						$sTitle = html_entity_decode($oContext->getDisplayName());
					} else 
					{
						$sIcon = '';
						$sTitle = $aItem['name'];				
					}					
                }
                else
                {
                    $sIcon = $this->_oConfig->getPageIcon();
                    /*if (!$sIcon)
                        $sIcon = bx_srv($sModule, 'get_thumb', $aItem['id']);*/
                    if ($oPage = BxDolPage::getObjectInstanceByURI($aItem['url']))
                        $sIcon = $oPage->getIcon();
                    //print_r($oPage);
                    //$oPage->getIcon();

                    $sTitle = $aItem[$CNF['FMG_NAME']];
                }


                $aSubmenu[] = [
                    'id' => 'context-' . $aItem['group_id'],
                    'name' => 'context-' . $aItem['group_id'],
                    'group-id' => $aItem['group_id'],
                    'parent' => $sModule,
                    'class' => $aItem['name'],
                    'link' => 'javascript:void(0)',
                    'onclick' => "{$CNF['JSMain']}.loadTalksList(this, { group: 'groups', id: " . (int)$aItem[$CNF['FMGL_GROUP_ID']] . " })",
                    'target' => '_self',
                    'title' => $sTitle,
                    'icon' => $sIcon,
                    'active' => 1
                ];
            }

            if (!empty($aSubmenu)){                
				if (bx_is_api())
					$aMenuItems[$sModule]['submenu_object'] = $aSubmenu;
				else
				{
                $aMenuItems[$sModule]['subitems'] = $aSubmenu;
					$this->_oTemplate->addJs('utils.js');
				}
			}
            else
                unset($aMenuItems[$sModule]);
        }
        
        /*echo '<pre>';
        print_r($aMenuItems);
        exit;*/
        
        return $aMenuItems;
    }
}

/** @} */
