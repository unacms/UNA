<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'title' => 'Attendant',
    'version_from' => '14.0.0',
    'version_to' => '14.0.1',
    'vendor' => 'BoonEx',

    'compatible_with' => array(
        '15.0.0-RC5'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/attendant/updates/update_14.0.0_14.0.1/',
    'home_uri' => 'attendant_update_1400_1401',

    'module_dir' => 'boonex/attendant/',
    'module_uri' => 'attendant',

    'db_prefix' => 'bx_attendant_',
    'class_prefix' => 'BxAttendant',

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
    'language_category' => 'Attendant',

    /**
     * Files Section
     */
    'delete_files' => array(),
);
