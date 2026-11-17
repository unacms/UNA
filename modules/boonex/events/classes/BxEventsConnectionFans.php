<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Events Events
 * @ingroup     UnaModules
 *
 * @{
 */

class BxEventsConnectionFans extends BxBaseModGroupsConnectionFans
{
    public function __construct($aObject)
    {
        $this->_sModule = 'bx_events';

        parent::__construct($aObject);

        $this->_bQuestionnaire = true;
    }

    /**
     * Attend (calendar-plus), Going (calendar-check), Not going (calendar-x); the names are ones both icon sets
     * have, and the apps draw the same icons (NEO: lib/connection-icons.ts).
     */
    protected function _getActionIconAsIcon($sAction)
    {
        $aA2I = [
            'add' => 'calendar-plus',
            'remove' => 'calendar-times'
        ];

        return isset($aA2I[$sAction]) ? $aA2I[$sAction] : 'calendar-check';
    }

    /**
     * The same icons where a site draws inline pictures (`use_icon_as` => image).
     */
    protected function _getActionIconAsImage($sAction)
    {
        $aA2I = [
            'add' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-plus-icon lucide-calendar-plus"><path d="M16 18h6"/><path d="M16 2v3"/><path d="M19 15v6"/><path d="M21 11.5V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8.3"/><path d="M3 9h18"/><path d="M8 2v3"/></svg>',
            'remove' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-x-icon lucide-calendar-x"><path d="M8 2v3"/><path d="M16 2v3"/><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="m14 13-4 4"/><path d="m10 13 4 4"/></svg>'
        ];

        return isset($aA2I[$sAction]) ? $aA2I[$sAction] : '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-check-icon lucide-calendar-check"><path d="M8 2v3"/><path d="M16 2v3"/><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="m9 15 2 2 4-4"/></svg>';
    }
}

/** @} */
