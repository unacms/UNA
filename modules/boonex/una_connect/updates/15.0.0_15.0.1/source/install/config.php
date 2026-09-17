<?php 
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaConnect UNA Connect
 * @ingroup     UnaModules
 *
 * @{
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'type' => BX_DOL_MODULE_TYPE_MODULE,
    'name' => 'bx_unacon',
    'title' => 'UNA connect',
    'note' => 'Join the site using another UNA site account credentials.',
    'version' => '15.0.1',
    'vendor' => 'UNA INC',
    'help_url' => 'http://feed.una.io/?section={module_name}',

    'compatible_with' => array(
        '15.0.0-RC2'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/una_connect/',
    'home_uri' => 'unacon',

    'db_prefix' => 'bx_unacon_',
    'class_prefix' => 'BxUnaCon',

    /**
     * Category for language keys.
     */
    'language_category' => 'UNA Connect',

    /**
     * Installation/Uninstallation Section.
     */
    'install' => array(
        'execute_sql' => 1,
        'update_languages' => 1,
    ),
    'uninstall' => array (
        'execute_sql' => 1,
        'update_languages' => 1,
    ),
    'enable' => array(
        'execute_sql' => 1,
        'clear_db_cache' => 1,
    ),
    'disable' => array (
        'execute_sql' => 1,
        'clear_db_cache' => 1,
    ),

    /**
     * Dependencies Section
     */
    'dependencies' => array(),
);

/** @} */
