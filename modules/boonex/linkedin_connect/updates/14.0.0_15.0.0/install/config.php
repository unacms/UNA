<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'title' => 'LinkedIn connect',
    'version_from' => '14.0.0',
    'version_to' => '15.0.0',
    'vendor' => 'UNA INC',

    'compatible_with' => array(
        '15.0.0-RC2'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/linkedin_connect/updates/update_14.0.0_15.0.0/',
    'home_uri' => 'linkedin_update_1400_1500',

    'module_dir' => 'boonex/linkedin_connect/',
    'module_uri' => 'linkedin',

    'db_prefix' => 'bx_linkedin_',
    'class_prefix' => 'BxLinkedin',

    /**
     * Installation/Uninstallation Section.
     */
    'install' => array(
        'execute_sql' => 1,
        'update_files' => 1,
        'update_languages' => 0,
        'clear_db_cache' => 1,
    ),

    /**
     * Category for language keys.
     */
    'language_category' => 'LinkedIn connect',

    /**
     * Files Section
     */
    'delete_files' => array(),
);
