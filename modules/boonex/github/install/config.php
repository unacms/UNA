<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    GitHub GitHub
 * @ingroup     UnaModules
 *
 * @{
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'type' => BX_DOL_MODULE_TYPE_MODULE,
    'name' => 'bx_github',
    'title' => 'GitHub',
    'note' => 'GitHub integration',
    'version' => '15.0.1',
    'vendor' => 'UNA INC',
    'help_url' => '',

    'compatible_with' => array(
        '15.0.x'
    ),

    /**
     * Unfinished: installed and updated like any module, labelled as a preview in Studio and the installer.
     */
    'preview' => true,

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/github/',
    'home_uri' => 'github',

    'db_prefix' => 'bx_github_',
    'class_prefix' => 'BxGitHub',

    /**
     * Category for language keys.
     */
    'language_category' => 'GitHub',

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
