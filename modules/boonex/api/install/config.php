<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    API API to the UNA backend
 * @ingroup     UnaModules
 *
 * @{
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'type' => BX_DOL_MODULE_TYPE_MODULE,
    'name' => 'bx_api',
    'title' => 'API',
    'note' => 'API, backend interface',
    'version' => '13.0.2.DEV',
    'vendor' => 'BoonEx',
    'help_url' => 'http://feed.una.io/?section={module_name}',

    'compatible_with' => array(
        '13.0.x'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/api/',
    'home_uri' => 'api',

    'db_prefix' => 'bx_api_',
    'class_prefix' => 'BxApi',

    /**
     * Category for language keys.
     */
    'language_category' => 'API',

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
    'disable' => array(
        'execute_sql' => 1,
        'clear_db_cache' => 1,
    ),

    /**
     * Dependencies Section
     */
    'dependencies' => array(
        'oauth2' => 'BoonEx OAuth2 Server Module'
    ),
);

/** @} */
