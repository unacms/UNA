<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'title' => 'Xero',
    'version_from' => '15.0.3',
    'version_to' => '15.0.4',
    'vendor' => 'UNA INC',

    'compatible_with' => array(
        '15.0.0-RC5'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/xero/updates/update_15.0.3_15.0.4/',
    'home_uri' => 'xero_update_1503_1504',

    'module_dir' => 'boonex/xero/',
    'module_uri' => 'xero',

    'db_prefix' => 'bx_xero_',
    'class_prefix' => 'BxXero',

    /**
     * Installation/Uninstallation Section.
     */
    'install' => array(
        'update_files' => 1,
        'execute_sql' => 1,
        'update_languages' => 1,
        'clear_db_cache' => 1,
    ),

    /**
     * Category for language keys.
     */
    'language_category' => 'Xero',

    /**
     * Files Section
     */
    'delete_files' => array(),
);
