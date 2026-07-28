<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    System System
 * @ingroup     UnaModules
 *
 * @{
 */

$aConfig = [
    /**
     * Main Section.
     */
    'type' => BX_DOL_MODULE_TYPE_MODULE,
    'name' => 'system',
    'title' => 'System',
    'note' => 'System module.',
    'version' => '15.0.0.DEV',
    'vendor' => 'UNA INC',
    'help_url' => '',

    'compatible_with' => array(
        '15.0.x'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'system/',
    'home_uri' => 'system',

    'db_prefix' => 'sys_',
    'class_prefix' => 'Bx',

    /**
     * Category for language keys.
     */
    'language_category' => 'System',

    /**
     * Installation/Uninstallation Section.
     */
    'install' => [
        'execute_sql' => 0,
        'update_languages' => 0,
        'clear_db_cache' => 0,
    ],
    'uninstall' => [
        'execute_sql' => 0,
        'update_languages' => 0,
        'clear_db_cache' => 0,
    ],
    'enable' => [
        'execute_sql' => 0,
        'clear_db_cache' => 0,
    ],
    'disable' => [
        'execute_sql' => 0,
        'clear_db_cache' => 0,
    ],

    /**
     * Dependencies Section
     */
    'dependencies' => [],

];

/** @} */
