<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'title' => 'Tasks',
    'version_from' => '15.0.7',
    'version_to' => '15.0.8',
    'vendor' => 'UNA INC',

    'compatible_with' => array(
        '15.0.0-RC4'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/tasks/updates/update_15.0.7_15.0.8/',
    'home_uri' => 'tasks_update_1507_1508',

    'module_dir' => 'boonex/tasks/',
    'module_uri' => 'tasks',

    'db_prefix' => 'bx_tasks_',
    'class_prefix' => 'BxTasks',

    /**
     * Installation/Uninstallation Section.
     */
    'install' => array(
        'execute_sql' => 1,
        'update_files' => 1,
        'update_languages' => 1,
        'clear_db_cache' => 1,
    ),

    /**
     * Category for language keys.
     */
    'language_category' => 'Tasks',

    /**
     * Files Section
     */
    'delete_files' => array(),
);
