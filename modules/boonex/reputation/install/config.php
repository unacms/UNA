<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Reputation Reputation
 * @ingroup     UnaModules
 *
 * @{
 */

$aConfig = [
    /**
     * Main Section.
     */
    'type' => BX_DOL_MODULE_TYPE_MODULE,
    'name' => 'bx_reputation',
    'title' => 'Reputation',
    'note' => 'Reputation, points, ranks',
    'version' => '15.0.0',
    'vendor' => 'UNA INC',
    'help_url' => 'http://feed.una.io/?section={module_name}',

    'compatible_with' => [
        '15.0.x'
    ],

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/reputation/',
    'home_uri' => 'reputation',

    'db_prefix' => 'bx_reputation_',
    'class_prefix' => 'BxReputation',

    /**
     * Category for language keys.
     */
    'language_category' => 'Reputation',
    
    /**
     * List of page triggers.
     */
    'page_triggers' => [
        'trigger_page_profile_view_entry'
    ],

    /**
     * Installation/Uninstallation Section.
     */
    'install' => [
        'execute_sql' => 1,
        'update_languages' => 1,
        'clear_db_cache' => 1,
    ],
    'uninstall' => [
        'execute_sql' => 1,
        'update_languages' => 1,
        'clear_db_cache' => 1,
    ],
    'enable' => [
        'execute_sql' => 1,
        'update_relations_for_all' => 1,
        'clear_db_cache' => 1,
    ],
    'enable_success' => [
    	'process_page_triggers' => 1,
    	'clear_db_cache' => 1,
    ],
    'disable' => [
        'execute_sql' => 1,
        'update_relations_for_all' => 1,
        'clear_db_cache' => 1,
    ],

    /**
     * Dependencies Section
     */
    'dependencies' => [],

    /**
     * Relations Section
     */
    'relation_handlers' => [
    	'on_install' => '',
    	'on_uninstall' => 'delete_module_events',
        'on_enable' => 'add_handlers',
        'on_disable' => 'delete_handlers',
    ],
    'relation_handlers_method' => 'get_reputation_data',
];

/** @} */
