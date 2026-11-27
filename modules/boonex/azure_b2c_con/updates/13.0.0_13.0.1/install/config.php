<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'title' => 'Azure B2C Connect',
    'version_from' => '13.0.0',
    'version_to' => '13.0.1',
    'vendor' => 'UNA INC',

    'compatible_with' => array(
        '15.0.0-RC5'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/azure_b2c_con/updates/update_13.0.0_13.0.1/',
    'home_uri' => 'azrb2c_update_1300_1301',

    'module_dir' => 'boonex/azure_b2c_con/',
    'module_uri' => 'azrb2c',

    'db_prefix' => 'bx_azrb2c_',
    'class_prefix' => 'BxAzrB2C',

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
    'language_category' => 'Azure B2C Connect',

    /**
     * Files Section
     */
    'delete_files' => array(
        '.gitignore',
        'composer.json',
        'composer.lock',
    ),
);
