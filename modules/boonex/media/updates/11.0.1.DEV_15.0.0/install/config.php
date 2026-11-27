<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'title' => 'Media Manager',
    'version_from' => '11.0.1.DEV',
    'version_to' => '15.0.0',
    'vendor' => 'UNA INC',

    'compatible_with' => array(
        '15.0.0-RC4'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/media/updates/update_11.0.1.DEV_15.0.0/',
    'home_uri' => 'media_update_1101_1500',

    'module_dir' => 'boonex/media/',
    'module_uri' => 'media',

    'db_prefix' => 'bx_media_',
    'class_prefix' => 'BxMedia',

    /**
     * Installation/Uninstallation Section.
     */
    'install' => array(
        'execute_sql' => 0,
        'update_files' => 1,
        'update_languages' => 1,
        'clear_db_cache' => 1,
    ),

    /**
     * Category for language keys.
     */
    'language_category' => 'MediaManager',

    /**
     * Files Section
     */
    'delete_files' => array(
        'plugins/',
        'js/BxMediaUploader.js.bak',
        'template/media_uploader_js_settings.html',
    ),
);
