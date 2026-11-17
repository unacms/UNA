<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * @see BxBaseConnection
 */
class BxBaseConnectionFriend extends BxDolConnectionFriend
{
    protected function __construct($aObject)
    {
        parent::__construct($aObject);

        $this->_aT = array_merge($this->_aT, [
            'done_initiator' => '_sys_conn_friends_done_initiator',
            'done_initiator_mutual' => '_sys_conn_friends_done_initiator_mutual',
            'do_content' => '_sys_conn_friends_do_content',
            'counter' => '_sys_conn_friends_counter'
        ]);
    }

    protected function _getActions($iInitiator, $iContent, $aParams = [])
    {
        $sName = $sTitle = '';
        $aActions = [];

        if($this->isConnectedNotMutual($iInitiator, $iContent)) {
            $sName = 'default';
            $sTitle = $this->_aT['done_initiator'];
            $aActions = [[
                'name' => 'remove',
                'title' => ($sKey = 'txt_unfriend_cancel') && !empty($aParams[$sKey]) ? $aParams[$sKey] : '_sys_menu_item_title_sm_unfriend_cancel'
            ], [
                /*
                 * An empty array item to show all items in popup.
                 * More actions will be added later.
                 */
            ]];
        }
        else if($this->isConnectedNotMutual($iContent, $iInitiator)) {
            $sName = 'add';
            $sTitle = $this->_aT['do_content'];
            $aActions = [[
                'name' => 'add',
                'title' => ($sKey = 'txt_befriend_confirm') && !empty($aParams[$sKey]) ? $aParams[$sKey] : '_sys_menu_item_title_sm_befriend_confirm'
            ], [
                'name' => 'remove',
                'title' => ($sKey = 'txt_unfriend_reject') && !empty($aParams[$sKey]) ? $aParams[$sKey] : '_sys_menu_item_title_sm_unfriend_reject'
            ]];
        }
        else if($this->isConnected($iInitiator, $iContent, true)) {
            $sName = 'default';
            $sTitle = $this->_aT['done_initiator_mutual'];
            $aActions = [[
                'name' => 'remove',
                'title' => ($sKey = 'txt_unfriend') && !empty($aParams[$sKey]) ? $aParams[$sKey] : '_sys_menu_item_title_sm_unfriend'
            ], [
                /*
                 * An empty array item to show all items in popup.
                 * More actions will be added later.
                 */
            ]];
        }
        else
            $aActions = [[
                'name' => 'add',
                'title' => ($sKey = 'txt_befriend') && !empty($aParams[$sKey]) ? $aParams[$sKey] : '_sys_menu_item_title_sm_befriend'
            ]];

        return [
            'name' => $sName,
            'title' => $sTitle,
            'items' => $aActions
        ];
    }

    /**
     * The button's icon is its state's (`name` of _getActions): adding a friend, or `default` once the request is
     * sent or accepted; a row of its menu takes its action's (Cancel request, Unfriend, Reject: `remove`). Lucide
     * names, the same ones the apps draw (NEO: settings/social-actions.js).
     */
    protected function _getActionIconAsIcon($sAction)
    {
        $sDefault = 'user-round-check';

        $aA2I = [
            'add' => 'user-round-plus',
            'remove' => 'user-round-x'
        ];

        return isset($aA2I[$sAction]) ? $aA2I[$sAction] : $sDefault;
    }

    protected function _getActionIconAsEmoji($sAction)
    {
        $sDefault = '💕';

        $aA2I = [
            'add' => '❤️',
            'remove' => '💔'
        ];

        return isset($aA2I[$sAction]) ? $aA2I[$sAction] : $sDefault;
    }

    protected function _getActionIconAsImage($sAction)
    {
        $sDefault = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-round-check-icon lucide-user-round-check"><path d="M2 21a8 8 0 0 1 13.292-6"/><circle cx="10" cy="8" r="5"/><path d="m16 19 2 2 4-4"/></svg>';

        $aA2I = [
            'add' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-round-plus-icon lucide-user-round-plus"><path d="M2 21a8 8 0 0 1 13.292-6"/><circle cx="10" cy="8" r="5"/><path d="M19 16v6"/><path d="M22 19h-6"/></svg>',
            'remove' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-round-x-icon lucide-user-round-x"><path d="M2 21a8 8 0 0 1 11.873-7"/><circle cx="10" cy="8" r="5"/><path d="m17 17 5 5"/><path d="m22 17-5 5"/></svg>'
        ];

        return isset($aA2I[$sAction]) ? $aA2I[$sAction] : $sDefault;
    }
}
