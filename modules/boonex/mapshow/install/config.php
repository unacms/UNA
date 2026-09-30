<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    MapShow Display last sign up users on map
 * @ingroup     UnaModules
 *
 * @{
 */

$aConfig = array(

    /**
     * Main Section.
     */
    'type' => BX_DOL_MODULE_TYPE_MODULE,
    'name' => 'bx_mapshow',
    'title' => 'Map Show',
    'note' => 'Maps, locations shown on a map',
    'version' => '1.0.0.DEV',
    'vendor' => 'UNA INC',
    'help_url' => 'http://feed.una.io/?section={module_name}',

    'compatible_with' => array(
        '9.0.x'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/mapshow/',
    'home_uri' => 'mapshow',

    'db_prefix' => 'bx_mapshow_',
    'class_prefix' => 'BxMapShow',

    /**
     * Category for language keys.
     */
    'language_category' => 'MapShow',

    /**
     * Installation/Uninstallation Section.
     */
    'install' => array(
        'execute_sql' => 1,
        'update_languages' => 1,
        'clear_db_cache' => 1,
    ),
    'uninstall' => array (
        'execute_sql' => 1,
        'update_languages' => 1,
        'clear_db_cache' => 1,
    ),
    'enable' => array(
        'execute_sql' => 1,
        'clear_db_cache' => 1,
    ),
    'enable_success' => array(
        'clear_db_cache' => 1,
    ),
    'disable' => array (
        'execute_sql' => 1,
        'clear_db_cache' => 1,
    ),
    'disable_failed' => array (
        'clear_db_cache' => 1,
    ),

    /**
     * Dependencies Section
     */
    'dependencies' => array(),
);

/** @} */
