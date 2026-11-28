<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'title' => 'Wiki',
    'version_from' => '15.0.2',
    'version_to' => '15.0.3',
    'vendor' => 'UNA INC',

    'compatible_with' => array(
        '15.0.0-RC5'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/wiki/updates/update_15.0.2_15.0.3/',
    'home_uri' => 'wiki_update_1502_1503',

    'module_dir' => 'boonex/wiki/',
    'module_uri' => 'wiki',

    'db_prefix' => 'bx_wiki_',
    'class_prefix' => 'BxWiki',

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
    'language_category' => 'Wiki',

    /**
     * Files Section
     */
    'delete_files' => array(),
);
