<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Resources Resources
 * @ingroup     UnaModules
 *
 * @{
 */

$aConfig = [

    /**
     * Main Section.
     */
    'type' => BX_DOL_MODULE_TYPE_MODULE,
    'name' => 'bx_resources',
    'title' => 'Resources',
    'note' => 'Resources, shared resources',
    'version' => '15.0.0.DEV',
    'vendor' => 'UNA INC',
    'help_url' => 'http://feed.una.io/?section={module_name}',

    'compatible_with' => [
        '15.0.x'
    ],

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/resources/',
    'home_uri' => 'resources',

    'db_prefix' => 'bx_resources_',
    'class_prefix' => 'BxResources',

    /**
     * Category for language keys.
     */
    'language_category' => 'Resources',

    /**
     * List of page triggers.
     */
    'page_triggers' => [
        'trigger_page_profile_view_entry',
        'trigger_page_group_view_entry',
    ],
    
    /**
     * Menu triggers.
     */
    'menu_triggers' => [
        'trigger_profile_view_submenu',
        'trigger_profile_view_actions',
        'trigger_group_view_submenu',
        'trigger_group_view_actions'
    ],

    /**
     * Storage objects to automatically delete files from upon module uninstallation.
     * Note. Don't add storage objects used in transcoder objects.
     */
    'storages' => [
        'bx_resources_covers',
    ],

    /**
     * Transcoders.
     */
    'transcoders' => [
        'bx_resources_preview',
        'bx_resources_miniature',
        'bx_resources_gallery',
        'bx_resources_cover',
    ],

    /**
     * Extended Search Forms.
     */
    'esearches' => [
        'bx_resources',
    	'bx_resources_cmts'
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
    	'process_esearches' => 1,
        'execute_sql' => 1,
        'update_languages' => 1,
        'update_relations' => 1,
        'clear_db_cache' => 1,
    ],
    'enable' => [
        'execute_sql' => 1,
        'update_relations' => 1,
        'clear_db_cache' => 1,
    ],
    'enable_success' => [
        'process_menu_triggers' => 1,
        'process_page_triggers' => 1,
    	'process_esearches' => 1,
        'register_transcoders' => 1,
        'clear_db_cache' => 1,
    ],
    'disable' => [
        'execute_sql' => 1,
        'update_relations' => 1,
        'unregister_transcoders' => 1,
        'clear_db_cache' => 1,
    ],
    'disable_failed' => [
        'register_transcoders' => 1,
        'clear_db_cache' => 1,
    ],

    /**
     * Dependencies Section
     */
    'dependencies' => [],

    /**
     * Relations Section
     */
    'relations' => [
    	'bx_timeline',
    	'bx_notifications'
    ]
];

/** @} */
