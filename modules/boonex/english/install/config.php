<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    English English language
 * @ingroup     UnaModules
 *
 * @{
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'type' => BX_DOL_MODULE_TYPE_LANGUAGE,
    'name' => 'bx_en',
    'title' => 'English',
    'note' => 'Language file',
    'version' => '15.0.6.DEV',
    'vendor' => 'UNA INC',
    'help_url' => 'http://feed.una.io/?section={module_name}',

    'compatible_with' => array(
        '15.0.x'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/english/',
    'home_uri' => 'en',

    'db_prefix' => 'bx_eng_',
    'class_prefix' => 'BxEng',

    /**
     * Category for language keys.
     */
    'language_category' => 'BoonEx English',

    /**
     * Installation/Uninstallation Section.
     * NOTE. The sequence of actions is critical. Don't change the order.
     */
    'install' => array(
        'execute_sql' => 1,
        'update_languages' => 1,
        'install_language' => 1,
    	'clear_db_cache' => 1
    ),
    'uninstall' => array (
        'update_languages' => 1,
        'execute_sql' => 1,
    	'clear_db_cache' => 1
    ),
    'enable' => array(
        'execute_sql' => 1
    ),
    'disable' => array(
        'execute_sql' => 1
    ),

    /**
     * Dependencies Section
     */
    'dependencies' => array(),

);

/** @} */
