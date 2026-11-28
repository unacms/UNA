<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'title' => 'AI Proxy',
    'version_from' => '15.0.0',
    'version_to' => '15.0.1',
    'vendor' => 'UNA INC',

    'compatible_with' => array(
        '15.0.0-RC5'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/ai_proxy/updates/update_15.0.0_15.0.1/',
    'home_uri' => 'ai_proxy_update_1500_1501',

    'module_dir' => 'boonex/ai_proxy/',
    'module_uri' => 'ai_proxy',

    'db_prefix' => 'bx_ai_proxy_',
    'class_prefix' => 'BxAiProxy',

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
    'language_category' => 'AI Proxy',

    /**
     * Files Section
     */
    'delete_files' => array(),
);
