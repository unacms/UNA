<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Posts Posts
 * @ingroup     UnaModules
 *
 * @{
 */

$aConfig = array(

    /**
     * Main Section.
     */
    'type' => BX_DOL_MODULE_TYPE_MODULE,
    'name' => 'bx_posts',
    'title' => 'Posts',
    'note' => 'Basic blogging module.',
    'version' => '15.0.5.DEV',
    'vendor' => 'UNA INC',
    'help_url' => 'http://feed.una.io/?section={module_name}',

    'compatible_with' => array(
        '15.0.x'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/posts/',
    'home_uri' => 'posts',

    'db_prefix' => 'bx_posts_',
    'class_prefix' => 'BxPosts',

    /**
     * Category for language keys.
     */
    'language_category' => 'Posts',

    /**
     * List of page triggers.
     */
    'page_triggers' => array (
    	'trigger_page_profile_view_entry',
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
        'bx_posts_covers',
        'bx_posts_photos',
        'bx_posts_videos',
        'bx_posts_files'
    ),

    /**
     * Transcoders.
     */
    'transcoders' => array(
        'bx_posts_preview',
        'bx_posts_miniature',
        'bx_posts_gallery',
        'bx_posts_cover',

        'bx_posts_preview_photos',
        'bx_posts_miniature_photos',
        'bx_posts_gallery_photos',
        'bx_posts_view_photos',

        'bx_posts_videos_poster',
        'bx_posts_videos_poster_preview',
        'bx_posts_videos_mp4',
        'bx_posts_videos_mp4_hd',
        
        'bx_posts_sounds_mp3',

        'bx_posts_preview_files',
        'bx_posts_gallery_files'
    ),

    /**
     * Extended Search Forms.
     */
    'esearches' => array(
        'bx_posts',
    	'bx_posts_cmts'
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
        'process_page_triggers' => 1,
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
