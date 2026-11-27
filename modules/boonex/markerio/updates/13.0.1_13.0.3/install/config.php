<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'title' => 'Marker.io',
    'version_from' => '13.0.1',
    'version_to' => '13.0.3',
    'vendor' => 'BoonEx',

    'compatible_with' => array(
        '15.0.0-RC5'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/markerio/updates/update_13.0.1_13.0.3/',
    'home_uri' => 'markerio_update_1301_1303',

    'module_dir' => 'boonex/markerio/',
    'module_uri' => 'markerio',

    'db_prefix' => 'bx_markerio_',
    'class_prefix' => 'BxMarkerIo',

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
    'language_category' => 'MarkerIo',

    /**
     * Files Section
     */
    'delete_files' => array(),
);
