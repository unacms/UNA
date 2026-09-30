<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'title' => 'Stripe Connect',
    'version_from' => '15.0.2',
    'version_to' => '15.0.3',
    'vendor' => 'UNA INC',

    'compatible_with' => array(
        '15.0.0-RC2'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/stripe_connect/updates/update_15.0.2_15.0.3/',
    'home_uri' => 'stripe_connect_update_1502_1503',

    'module_dir' => 'boonex/stripe_connect/',
    'module_uri' => 'stripe_connect',

    'db_prefix' => 'bx_stripe_connect_',
    'class_prefix' => 'BxStripeConnect',

    /**
     * Installation/Uninstallation Section.
     */
    'install' => array(
        'execute_sql' => 1,
        'update_files' => 1,
        'update_languages' => 0,
        'clear_db_cache' => 1,
    ),

    /**
     * Category for language keys.
     */
    'language_category' => 'Stripe Connect',

    /**
     * Files Section
     */
    'delete_files' => array(),
);
