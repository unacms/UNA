<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'title' => 'Artificer',
    'version_from' => '15.0.8',
    'version_to' => '15.0.9',
    'vendor' => 'UNA INC',

    'compatible_with' => array(
        '15.0.0-RC5'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/artificer/updates/update_15.0.8_15.0.9/',
    'home_uri' => 'artificer_update_1508_1509',

    'module_dir' => 'boonex/artificer/',
    'module_uri' => 'artificer',

    'db_prefix' => 'bx_artificer_',
    'class_prefix' => 'BxArtificer',

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
    'language_category' => 'Boonex Artificer Template',

    /**
     * Files Section
     */
    'delete_files' => array(
        'data/template/system/sidebar_account.html',
    ),
);
