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
class BxBaseConnectionSubscription extends BxDolConnectionSubscription
{
    protected function __construct($aObject)
    {
        parent::__construct($aObject);

        $this->_aT = array_merge($this->_aT, [
            'do_initiator' => '_sys_conn_subscriptions_do_initiator',
            'counter' => '_sys_conn_subscriptions_counter'
        ]);
    }

    protected function _getActions($iInitiator, $iContent, $aParams = [])
    {
        $sName = $sTitle = '';
        $aActions = [];

        if($this->isConnected($iInitiator, $iContent)) {
            // the state, as a friend request's: the button says "Following", its menu holds the action (remove)
            $sName = 'default';
            $sTitle = $this->_aT['do_initiator'];
            $aActions = [[
                'name' => 'remove',
                'title' => ($sKey = 'txt_unsubscribe') && !empty($aParams[$sKey]) ? $aParams[$sKey] : '_sys_menu_item_title_sm_unsubscribe'
            ], [
                /*
                 * An empty array item to show all items in popup.
                 * More actions will be added later.
                 */
            ]];
        } else
            $aActions = [[
                'name' => 'add',
                'title' => ($sKey = 'txt_subscribe') && !empty($aParams[$sKey]) ? $aParams[$sKey] : '_sys_menu_item_title_sm_subscribe'
            ]];

        return [
            'name' => $sName,
            'title' => $sTitle,
            'items' => $aActions
        ];
    }
    
    /**
     * The button's icon is its state's (`name` of _getActions): Follow, or `default` once following; the row of its
     * menu takes its action's (Unfollow: `remove`). Lucide names, the same ones the apps draw (NEO:
     * settings/social-actions.js).
     */
    protected function _getActionIconAsIcon($sAction)
    {
        $sDefault = 'circle-check';

        $aA2I = [
            'add' => 'circle-plus',
            'remove' => 'circle-minus'
        ];

        return isset($aA2I[$sAction]) ? $aA2I[$sAction] : $sDefault;
    }

    protected function _getActionIconAsEmoji($sAction)
    {
        $sDefault = '✔️';

        $aA2I = [
            'add' => $sDefault,
            'remove' => $sDefault
        ];

        return isset($aA2I[$sAction]) ? $aA2I[$sAction] : $sDefault;
    }

    protected function _getActionIconAsImage($sAction)
    {
        $sDefault = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check-icon lucide-circle-check"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>';

        $aA2I = [
            'add' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-plus-icon lucide-circle-plus"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>',
            'remove' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-minus-icon lucide-circle-minus"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>'
        ];

        return isset($aA2I[$sAction]) ? $aA2I[$sAction] : $sDefault;
    }
}
