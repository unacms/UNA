<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'title' => 'Mass Mailer',
    'version_from' => '15.0.2',
    'version_to' => '15.0.3',
    'vendor' => 'UNA INC',

    'compatible_with' => array(
        '15.0.0-RC5'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/massmailer/updates/update_15.0.2_15.0.3/',
    'home_uri' => 'massmailer_update_1502_1503',

    'module_dir' => 'boonex/massmailer/',
    'module_uri' => 'massmailer',

    'db_prefix' => 'bx_massmailer_',
    'class_prefix' => 'BxMassMailer',

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
    'language_category' => 'Mass Mailer',

    /**
     * Files Section
     */
    'delete_files' => array(),
);
