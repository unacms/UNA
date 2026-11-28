<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'title' => 'API',
    'version_from' => '13.0.1',
    'version_to' => '13.0.2',
    'vendor' => 'BoonEx',

    'compatible_with' => array(
        '15.0.0-RC5'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/api/updates/update_13.0.1_13.0.2/',
    'home_uri' => 'api_update_1301_1302',

    'module_dir' => 'boonex/api/',
    'module_uri' => 'api',

    'db_prefix' => 'bx_api_',
    'class_prefix' => 'BxApi',

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
    'language_category' => 'API',

    /**
     * Files Section
     */
    'delete_files' => array(),
);
