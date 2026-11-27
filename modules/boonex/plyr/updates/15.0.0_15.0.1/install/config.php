<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'title' => 'Plyr',
    'version_from' => '15.0.0',
    'version_to' => '15.0.1',
    'vendor' => 'UNA INC',

    'compatible_with' => array(
        '15.0.0-RC5'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/plyr/updates/update_15.0.0_15.0.1/',
    'home_uri' => 'plyr_update_1500_1501',

    'module_dir' => 'boonex/plyr/',
    'module_uri' => 'plyr',

    'db_prefix' => 'bx_plyr_',
    'class_prefix' => 'BxPlyr',

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
    'language_category' => 'Plyr',

    /**
     * Files Section
     */
    'delete_files' => array(),
);
