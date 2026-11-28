<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'title' => 'Reminders',
    'version_from' => '11.0.0',
    'version_to' => '11.0.1',
    'vendor' => 'UNA INC',

    'compatible_with' => array(
        '15.0.0-RC5'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/reminders/updates/update_11.0.0_11.0.1/',
    'home_uri' => 'reminders_update_1100_1101',

    'module_dir' => 'boonex/reminders/',
    'module_uri' => 'reminders',

    'db_prefix' => 'bx_reminders_',
    'class_prefix' => 'BxReminders',

    /**
     * Installation/Uninstallation Section.
     */
    'install' => array(
        'update_files' => 1,
        'execute_sql' => 1,
        'update_languages' => 0,
        'clear_db_cache' => 1,
    ),

    /**
     * Category for language keys.
     */
    'language_category' => 'Reminders',

    /**
     * Files Section
     */
    'delete_files' => array(),
);
