<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Groups Groups
 * @ingroup     UnaModules
 *
 * @{
 */

$aConfig = array(

    /**
     * Main Section.
     */
    'type' => BX_DOL_MODULE_TYPE_MODULE,
    'name' => 'bx_groups',
    'title' => 'Groups',
    'note' => 'Basic group profiles functionality.',
    'version' => '15.0.3.DEV',
    'vendor' => 'UNA INC',
    'help_url' => 'http://feed.una.io/?section={module_name}',

    'compatible_with' => array(
        '15.0.x'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/groups/',
    'home_uri' => 'groups',

    'db_prefix' => 'bx_groups_',
    'class_prefix' => 'BxGroups',

    /**
     * Category for language keys.
     */
    'language_category' => 'Groups',

    /**
     * Connections.
     */
    'connections' => array(
    	'sys_profiles_friends' => array ('type' => 'profiles'),
		'sys_profiles_subscriptions' => array ('type' => 'profiles'),
    ),

    /**
     * Menu triggers.
     */
    'menu_triggers' => array(
    	'trigger_profile_view_submenu',
        'trigger_group_view_submenu',
        'trigger_group_snippet_meta',
        'trigger_group_view_actions',
    ),

    /**
     * Page triggers.
     */
    'page_triggers' => array (
    	'trigger_page_group_view_entry', 
    ),

	/**
     * Storage objects to automatically delete files from upon module uninstallation.
     * Note. Don't add storage objects used in transcoder objects.
     */
    'storages' => array(
    	'bx_groups_pics'
    ),

	/**
     * Transcoders.
     */
    'transcoders' => array(
    	'bx_groups_icon', 
    	'bx_groups_thumb', 
    	'bx_groups_avatar', 
        'bx_groups_avatar_big', 
    	'bx_groups_picture', 
    	'bx_groups_cover', 
    	'bx_groups_cover_thumb',
        'bx_groups_gallery'
    ),

    /**
     * Extended Search Forms.
     */
    'esearches' => array(
        'bx_groups',
    	'bx_groups_cmts',
    ),

    /**
     * Installation/Uninstallation Section.
     */
    'install' => array(
        'execute_sql' => 1,
        'update_languages' => 1,
        'clear_db_cache' => 1,
    ),
    'uninstall' => array (
    	'process_esearches' => 1,
        'execute_sql' => 1,
        'update_languages' => 1,
    	'process_connections' => 1,
        'process_deleted_profiles' => 1,
    	'update_relations' => 1,        
        'clear_db_cache' => 1,
    ),
    'enable' => array(
        'execute_sql' => 1,
    	'update_relations' => 1,
        'clear_db_cache' => 1,
    ),
    'enable_success' => array(
    	'process_menu_triggers' => 1,
    	'process_page_triggers' => 1,
    	'process_esearches' => 1,
    	'register_transcoders' => 1,
        'clear_db_cache' => 1,
    ),
    'disable' => array (
        'execute_sql' => 1,
        'unregister_transcoders' => 1,
        'update_relations' => 1,
        'clear_db_cache' => 1,
    ),
    'disable_failed' => array (
    	'register_transcoders' => 1,
    	'clear_db_cache' => 1,
    ),

    /**
     * Dependencies Section
     */
    'dependencies' => array(),

    /**
     * Connections Section
     */
    'relations' => array(
        'bx_timeline',
        'bx_notifications',
    ),
);

/** @} */
