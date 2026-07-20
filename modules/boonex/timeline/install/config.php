<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Timeline Timeline
 * @ingroup     UnaModules
 *
 * @{
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'type' => BX_DOL_MODULE_TYPE_MODULE,
    'name' => 'bx_timeline',
    'title' => 'Timeline',
    'note' => 'Timeline module.',
    'version' => '15.0.6.DEV',
    'vendor' => 'UNA INC',
    'help_url' => 'http://feed.una.io/?section={module_name}',

    'compatible_with' => array(
        '15.0.x'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/timeline/',
    'home_uri' => 'timeline',

    'db_prefix' => 'bx_timeline_',
    'class_prefix' => 'BxTimeline',

    /**
     * Category for language keys.
     */
    'language_category' => 'Timeline',

    /**
     * List of page triggers.
     */
    'page_triggers' => array (
        'trigger_page_profile_view_entry',
        'trigger_page_group_view_entry',
    ),

    /**
     * Menu triggers.
     */
    'menu_triggers' => array(
    	'trigger_profile_view_submenu',
    	'trigger_group_view_submenu',
    ),

    /**
     * Storage objects to automatically delete files from upon module uninstallation.
     * Note. Don't add storage objects used in transcoder objects.
     */
    'storages' => array(
    	'bx_timeline_photos',
    	'bx_timeline_videos',
        'bx_timeline_files'
    ),

    /**
     * Transcoders.
     */
    'transcoders' => array(
    	'bx_timeline_photos_preview',
    	'bx_timeline_photos_view',
        'bx_timeline_photos_medium',
        'bx_timeline_photos_big',

        'bx_timeline_videos_photo_preview',
        'bx_timeline_videos_photo_view',
        'bx_timeline_videos_photo_big',
        'bx_timeline_videos_poster_preview',
    	'bx_timeline_videos_poster_view',
        'bx_timeline_videos_poster_big',
    	'bx_timeline_videos_mp4',
    	'bx_timeline_videos_mp4_hd'
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
        'execute_sql' => 1,
        'update_languages' => 1,
        'clear_db_cache' => 1,
    ),
    'enable' => array(
        'execute_sql' => 1,
    	'update_relations_for_all' => 1,
    	'update_relations' => 1,
        'clear_db_cache' => 1,
    ),
    'enable_success' => array(
    	'process_page_triggers' => 1,
        'process_menu_triggers' => 1,
    	'register_transcoders' => 1,
    	'clear_db_cache' => 1,
    ),
    'disable' => array (
        'execute_sql' => 1,
    	'update_relations_for_all' => 1,
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
    'relation_handlers' => array(
    	'on_install' => '',
    	'on_uninstall' => 'delete_module_events',
        'on_enable' => 'add_handlers',
        'on_disable' => 'delete_handlers',
    ),
    'relations' => array(
        'bx_notifications',
    	'bx_reputation'
    )
);

/** @} */
