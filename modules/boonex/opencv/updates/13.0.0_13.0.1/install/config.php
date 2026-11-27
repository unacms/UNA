<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'title' => 'OpenCV',
    'version_from' => '13.0.0',
    'version_to' => '13.0.1',
    'vendor' => 'UNA INC',

    'compatible_with' => array(
        '15.0.0-RC5'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/opencv/updates/update_13.0.0_13.0.1/',
    'home_uri' => 'opencv_update_1300_1301',

    'module_dir' => 'boonex/opencv/',
    'module_uri' => 'opencv',

    'db_prefix' => 'bx_opencv_',
    'class_prefix' => 'BxOpencv',

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
    'language_category' => 'Opencv',

    /**
     * Files Section
     */
    'delete_files' => array(),
);
