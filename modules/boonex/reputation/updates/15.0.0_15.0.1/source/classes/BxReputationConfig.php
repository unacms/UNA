<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Reputation Reputation
 * @ingroup     UnaModules
 *
 * @{
 */

class BxReputationConfig extends BxBaseModNotificationsConfig
{
    protected $_oDb;

    public function __construct($aModule)
    {
        parent::__construct($aModule);

        $this->CNF = [
            // module icon
            'ICON' => 'star',

            // database tables
            'TABLE_EVENTS' => $aModule['db_prefix'] . 'events',
            'TABLE_LEVELS' => $aModule['db_prefix'] . 'levels',
            'TABLE_PROFILES' => $aModule['db_prefix'] . 'profiles',
            'TABLE_PROFILES_LEVELS' => $aModule['db_prefix'] . 'profiles_levels',

            // database fields
            'FIELD_LEVEL_NAME' => 'name',
            'FIELD_LEVEL_ICON' => 'icon',

            // page URIs
            'URL_LEADERBOARD' => 'page.php?i=leaderboard',
            'URL_MANAGE' => 'page.php?i=reputation-manage',
            'URL_HISTORY' => 'page.php?i=points-history',

            // some params
            'PARAM_MULTILEVEL' => 'bx_reputation_enable_multilevel',
            'PARAM_LEADERBOARD_LIMIT' => 'bx_reputation_leaderboard_limit',
            'PARAM_HISTORY_LIMIT' => 'bx_reputation_history_limit',
            'PARAM_ACTIONS_LIMIT' => 'bx_reputation_actions_limit',

            // objects
            'OBJECT_FORM_HANDLER' => 'bx_reputation_handler',
            'OBJECT_FORM_HANDLER_DISPLAY_EDIT' => 'bx_reputation_handler_edit',
            'OBJECT_FORM_LEVEL' => 'bx_reputation_level',
            'OBJECT_FORM_LEVEL_DISPLAY_ADD' => 'bx_reputation_level_add',
            'OBJECT_FORM_LEVEL_DISPLAY_EDIT' => 'bx_reputation_level_edit',
            'OBJECT_MENU_SUBMENU' => 'bx_reputation_submenu',
            'OBJECT_GRID_HANDLERS' => 'bx_reputation_handlers',
            'OBJECT_GRID_LEVELS' => 'bx_reputation_levels',
            'OBJECT_GRID_MANAGE_LEADERBOARD' => 'bx_reputation_manage_leaderboard',

            // some language keys
            'T' => [
                'grid_action_err_perform' => '_bx_reputation_grid_action_err_perform',
                'popup_title_handler_edit' => '_bx_reputation_popup_title_handler_edit',
                'popup_title_level_add' => '_bx_reputation_popup_title_level_add',
                'popup_title_level_edit' => '_bx_reputation_popup_title_level_edit',
                'filter_item_select_one_filter1' => '_bx_reputation_grid_filter_item_title_hdr_select_one_filter1',
                'err_cannot_perform' => '_bx_reputation_err_cannot_perform',
            ]
        ];

        $this->_aJsClasses = [
            'leaderboard' => 'BxReputationLeaderboard',
            'handlers' => 'BxReputationHandlers',
            'levels' => 'BxReputationLevels',
        ];

        $this->_aJsObjects = [
            'leaderboard' => 'oBxReputationLeaderboard',
            'handlers' => 'oBxReputationHandlers',
            'levels' => 'oBxReputationLevels',
        ];

        $sHtmlPrefix = str_replace('_', '-', $this->_sName);
        $this->_aHtmlIds = [
            'general' => [
                'leaderboard' =>  $sHtmlPrefix . '-leaderboard-',
                'filters_popup' => $sHtmlPrefix . '-filters-popup',
                'handler_popup' => $sHtmlPrefix . '-handler-popup',
                'level_popup' => $sHtmlPrefix . '-level-popup',
            ]
        ];

        $this->_aHandlerFields = ['group', 'type', 'alert_unit', 'alert_action', 'points_active', 'points_passive'];
        $this->_aHandlerDescriptor = [];
        $this->_sHandlersMethod = 'get_reputation_data';
    }

    public function init(&$oDb)
    {
        parent::init($oDb);
    }

    public function isMultilevel()
    {
        return getParam($this->CNF['PARAM_MULTILEVEL']) == 'on';
    }

    public function getLevelName($sName)
    {
        return uriGenerate($sName, $this->CNF['TABLE_LEVELS'], $this->CNF['FIELD_LEVEL_NAME'], ['lowercase' => false]);
    }
}

/** @} */
