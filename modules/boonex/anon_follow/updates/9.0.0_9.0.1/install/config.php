<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'title' => 'Anonymous Follow',
    'version_from' => '9.0.0',
    'version_to' => '9.0.1',
    'vendor' => 'UNA INC',

    'compatible_with' => array(
        '15.0.0-RC5'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/anon_follow/updates/update_9.0.0_9.0.1/',
    'home_uri' => 'anon_follow_update_900_901',

    'module_dir' => 'boonex/anon_follow/',
    'module_uri' => 'anon_follow',

    'db_prefix' => 'bx_anon_follow_',
    'class_prefix' => 'BxAnonFollow',

    /**
     * Installation/Uninstallation Section.
     */
    'install' => array(
        'update_files' => 1,
        'execute_sql' => 1,
        'update_languages' => 1,
        'clear_db_cache' => 1,
    ),

    /**
     * Category for language keys.
     */
    'language_category' => 'Anonymous Follow',

    /**
     * Files Section
     */
    'delete_files' => array(),
);
