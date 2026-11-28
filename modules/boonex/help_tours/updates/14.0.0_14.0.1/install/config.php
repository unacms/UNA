<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'title' => 'Help Tours',
    'version_from' => '14.0.0',
    'version_to' => '14.0.1',
    'vendor' => 'BoonEx',

    'compatible_with' => array(
        '15.0.0-RC5'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/help_tours/updates/update_14.0.0_14.0.1/',
    'home_uri' => 'help_tours_update_1400_1401',

    'module_dir' => 'boonex/help_tours/',
    'module_uri' => 'help_tours',

    'db_prefix' => 'bx_help_tours_',
    'class_prefix' => 'BxHelpTours',

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
    'language_category' => 'Help Tours',

    /**
     * Files Section
     */
    'delete_files' => array(),
);
