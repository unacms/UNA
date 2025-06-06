<?php 
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    GoogleConnect Google Connect
 * @ingroup     UnaModules
 *
 * @{
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'type' => BX_DOL_MODULE_TYPE_MODULE,
    'name' => 'bx_googlecon',
    'title' => 'Google connect',
    'note' => 'Join the site using LinkedIn account.',
    'version' => '13.0.2.DEV',
    'vendor' => 'UNA INC',
    'help_url' => 'http://feed.una.io/?section={module_name}',

    'compatible_with' => array(
        '13.0.x'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/google_connect/',
    'home_uri' => 'googlecon',

    'db_prefix' => 'bx_googlecon_',
    'class_prefix' => 'BxGoogleCon',

    /**
     * Category for language keys.
     */
    'language_category' => 'Google Connect',

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
