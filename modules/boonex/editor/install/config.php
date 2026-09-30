<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Editor integration
 * @ingroup     UnaModules
 *
 * @{
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'deprecated' => 1,
    'type' => BX_DOL_MODULE_TYPE_MODULE,
    'name' => 'bx_editor',
    'title' => 'Editor',
    'note' => 'Editor, rich text editor',
    'version' => '14.0.0.DEV',
    'vendor' => 'UNA INC',
    'help_url' => 'http://feed.una.io/?section={module_name}',

    'compatible_with' => array(
        '13.0.x'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/editor/',
    'home_uri' => 'editor',

    'db_prefix' => 'bx_editor_',
    'class_prefix' => 'BxEditor',

    /**
     * Category for language keys.
     */
    'language_category' => 'Editor',

	/**
     * Storage objects to automatically delete files from upon module uninstallation.
     * Note. Don't add storage objects used in transcoder objects.
     */
    'storages' => array(
    	'bx_editor_files'
    ),
    
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
    'dependencies' => array(),
);

/** @} */
