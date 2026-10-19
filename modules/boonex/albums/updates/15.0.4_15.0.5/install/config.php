<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'title' => 'Albums',
    'version_from' => '15.0.4',
    'version_to' => '15.0.5',
    'vendor' => 'UNA INC',

    'compatible_with' => array(
        '15.0.0-RC3'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/albums/updates/update_15.0.4_15.0.5/',
    'home_uri' => 'albums_update_1504_1505',

    'module_dir' => 'boonex/albums/',
    'module_uri' => 'albums',

    'db_prefix' => 'bx_albums_',
    'class_prefix' => 'BxAlbums',

    /**
     * Installation/Uninstallation Section.
     */
    'install' => array(
        'execute_sql' => 0,
        'update_files' => 1,
        'update_languages' => 0,
        'clear_db_cache' => 0,
    ),

    /**
     * Category for language keys.
     */
    'language_category' => 'Albums',

    /**
     * Files Section
     */
    'delete_files' => array(),
);
