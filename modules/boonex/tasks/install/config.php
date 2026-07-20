<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Tasks Tasks
 * @ingroup     UnaModules
 *
 * @{
 */

$aConfig = array(

    /**
     * Main Section.
     */
    'type' => BX_DOL_MODULE_TYPE_MODULE,
    'name' => 'bx_tasks',
    'title' => 'Tasks',
    'note' => 'Tasks module.',
    'version' => '15.0.6.DEV',
    'vendor' => 'UNA INC',
    'help_url' => 'http://feed.una.io/?section={module_name}',

    'compatible_with' => array(
        '15.0.x'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/tasks/',
    'home_uri' => 'tasks',

    'db_prefix' => 'bx_tasks_',
    'class_prefix' => 'BxTasks',

    /**
     * Category for language keys.
     */
    'language_category' => 'Tasks',

    /**
     * List of page triggers.
     */
    'page_triggers' => array (),
    
    /**
     * Menu triggers.
     */
    'menu_triggers' => array(
        'trigger_group_view_submenu',
    ),

    /**
     * Storage objects to automatically delete files from upon module uninstallation.
     * Note. Don't add storage objects used in transcoder objects.
     */
    'storages' => array(
        'bx_tasks_covers',
    	'bx_tasks_photos',
        'bx_tasks_videos',
        'bx_tasks_files'
    ),

    /**
     * Transcoders.
     */
    'transcoders' => array(
        'bx_tasks_preview',
        'bx_tasks_gallery',
        'bx_tasks_cover',

        'bx_tasks_preview_photos',
        'bx_tasks_gallery_photos', 

        'bx_tasks_videos_poster',
        'bx_tasks_videos_poster_preview',
        'bx_tasks_videos_mp4',
        'bx_tasks_videos_mp4_hd',

        'bx_tasks_preview_files',
        'bx_tasks_gallery_files'
    ),

    /**
     * Extended Search Forms.
     */
    'esearches' => array(
        'bx_tasks',
    	'bx_tasks_cmts'
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
        'process_page_triggers' => 0,
    	'process_esearches' => 1,
        'register_transcoders' => 1,
        'clear_db_cache' => 1,
    ),
    'disable' => array (
        'execute_sql' => 1,
        'update_relations' => 1,
        'unregister_transcoders' => 1,
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
     * Relations Section
     */
    'relations' => array(
    	'bx_timeline',
    	'bx_notifications'
    ),

);

/** @} */
