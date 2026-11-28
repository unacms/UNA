<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'title' => 'New Comments',
    'version_from' => '9.0.0',
    'version_to' => '9.0.1',
    'vendor' => 'UNA INC',

    'compatible_with' => array(
        '15.0.0-RC5'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/new_comments/updates/update_9.0.0_9.0.1/',
    'home_uri' => 'new_comments_update_900_901',

    'module_dir' => 'boonex/new_comments/',
    'module_uri' => 'new_comments',

    'db_prefix' => 'bx_new_comments_',
    'class_prefix' => 'BxNewComments',

    /**
     * Installation/Uninstallation Section.
     */
    'install' => array(
        'update_files' => 1,
        'execute_sql' => 1,
        'update_languages' => 0,
        'clear_db_cache' => 1,
    ),

    /**
     * Category for language keys.
     */
    'language_category' => 'New Comments',

    /**
     * Files Section
     */
    'delete_files' => array(),
);
