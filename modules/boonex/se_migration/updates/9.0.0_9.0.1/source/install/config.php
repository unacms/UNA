<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    SocialEngineMigration SocialEngine Migration
 * @ingroup     UnaModules
 *
 * @{
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'type' => BX_DOL_MODULE_TYPE_MODULE,
    'name' => 'bx_se_migration',
    'title' => 'SocialEngine Migration',
    'note' => 'SocialEngine migration, import from SocialEngine',
    'version' => '9.0.1',
    'vendor' => 'UNA INC',
    'help_url' => '',

    'compatible_with' => array(
        '15.0.0-RC5'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/se_migration/',
    'home_uri' => 'se_migration',

    'db_prefix' => 'bx_semig_',
    'class_prefix' => 'BxSEMig',

    /**
     * Category for language keys.
     */
    'language_category' => 'Boonex Social Migration Tool',

    /**
     * Installation/Uninstallation Section.
     */
    'install' => array(
        'execute_sql' => 1,
        'update_languages' => 1,
    	'clear_db_cache' => 1
    ),
    'uninstall' => array (
        'execute_sql' => 1,
        'update_languages' => 1,
    	'clear_db_cache' => 1
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
    'dependencies' => array(),
);

/** @} */
