<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'title' => 'Data Fox',
    'version_from' => '12.0.0',
    'version_to' => '15.0.0',
    'vendor' => 'UNA INC',

    'compatible_with' => array(
        '15.0.0-RC2'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/datafox/updates/update_12.0.0_15.0.0/',
    'home_uri' => 'datafox_update_1200_1500',

    'module_dir' => 'boonex/datafox/',
    'module_uri' => 'datafox',

    'db_prefix' => 'bx_datafox_',
    'class_prefix' => 'BxDataFox',

    /**
     * Installation/Uninstallation Section.
     */
    'install' => array(
        'execute_sql' => 1,
        'update_files' => 1,
        'update_languages' => 1,
        'clear_db_cache' => 1,
    ),

    /**
     * Category for language keys.
     */
    'language_category' => 'Data Fox',

    /**
     * Files Section
     */
    'delete_files' => array(),
);
