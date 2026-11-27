<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'title' => 'Twitter connect',
    'version_from' => '15.0.0',
    'version_to' => '15.0.1',
    'vendor' => 'UNA INC',

    'compatible_with' => array(
        '15.0.0-RC5'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/twitter_connect/updates/update_15.0.0_15.0.1/',
    'home_uri' => 'twitter_update_1500_1501',

    'module_dir' => 'boonex/twitter_connect/',
    'module_uri' => 'twitter',

    'db_prefix' => 'bx_twitter_',
    'class_prefix' => 'BxTwitter',

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
    'language_category' => 'Twitter Connect',

    /**
     * Files Section
     */
    'delete_files' => array(),
);
