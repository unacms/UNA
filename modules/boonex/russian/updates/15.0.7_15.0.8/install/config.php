<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'title' => 'Russian',
    'version_from' => '15.0.7',
    'version_to' => '15.0.8',
    'vendor' => 'UNA INC',

    'compatible_with' => array(
        '15.0.0-RC4'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/russian/updates/update_15.0.7_15.0.8/',
    'home_uri' => 'ru_update_1507_1508',

    'module_dir' => 'boonex/russian/',
    'module_uri' => 'ru',

    'db_prefix' => 'bx_rsn_',
    'class_prefix' => 'BxRsn',

    /**
     * Installation/Uninstallation Section.
     */
    'install' => array(
        'execute_sql' => 0,
        'update_files' => 1,
        'update_languages' => 1,
        'restore_languages' => 0,
        'clear_db_cache' => 0,
    ),

    /**
     * Category for language keys.
     */
    'language_category' => array(
        array('name' => 'Credits', 'path' => 'bx_credits/'),
        array('name' => 'Developer', 'path' => 'bx_developer/'),
        array('name' => 'Google Connect', 'path' => 'bx_googlecon/'),
        array('name' => 'Notifications', 'path' => 'bx_notifications/'),
        array('name' => 'Snipcart', 'path' => 'bx_snipcart/'),
        array('name' => 'Tasks', 'path' => 'bx_tasks/'),
        array('name' => 'Timeline', 'path' => 'bx_timeline/'),
        array('name' => 'System', 'path' => 'system/'),
    ),

    /**
     * Files Section
     */
    'delete_files' => array(),
);
