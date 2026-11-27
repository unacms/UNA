<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'title' => 'Facebook connect',
    'version_from' => '15.0.1',
    'version_to' => '15.0.2',
    'vendor' => 'UNA INC',

    'compatible_with' => array(
        '15.0.0-RC5'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/facebook_connect/updates/update_15.0.1_15.0.2/',
    'home_uri' => 'facebook_connect_update_1501_1502',

    'module_dir' => 'boonex/facebook_connect/',
    'module_uri' => 'facebook_connect',

    'db_prefix' => 'bx_facebook_',
    'class_prefix' => 'BxFaceBookConnect',

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
    'language_category' => 'Facebook',

    /**
     * Files Section
     */
    'delete_files' => array(),
);
