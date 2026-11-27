<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'title' => 'Reviews',
    'version_from' => '14.0.0',
    'version_to' => '14.0.1',
    'vendor' => 'UNA INC',

    'compatible_with' => array(
        '15.0.0-RC5'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/reviews/updates/update_14.0.0_14.0.1/',
    'home_uri' => 'reviews_update_1400_1401',

    'module_dir' => 'boonex/reviews/',
    'module_uri' => 'reviews',

    'db_prefix' => 'bx_reviews_',
    'class_prefix' => 'BxReviews',

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
    'language_category' => 'Reviews',

    /**
     * Files Section
     */
    'delete_files' => array(),
);
