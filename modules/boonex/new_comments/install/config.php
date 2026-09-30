<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    NewComments New Comments
 * @ingroup     UnaModules
 *
 * @{
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'type' => BX_DOL_MODULE_TYPE_MODULE,
    'name' => 'bx_new_comments',
    'title' => 'New Comments',
    'note' => 'New comments, unread comments',
    'version' => '9.0.0',
    'vendor' => 'UNA INC',
    'help_url' => 'http://feed.boonex.com/?section={module_name}',

    'compatible_with' => array(
        '9.0.x'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/new_comments/',
    'home_uri' => 'new_comments',

    'db_prefix' => 'bx_new_comments_',
    'class_prefix' => 'BxNewComments',

    /**
     * Category for language keys.
     */
    'language_category' => 'New Comments',

    
    /**
      * Menu triggers.
      */
    'menu_triggers' => array(
        'trigger_profile_view_actions',
        'trigger_profile_snippet_meta',
    ),
    
    /**
     * Installation/Uninstallation Section.
     */
    'install' => array(
        'check_dependencies' => 1,
        'execute_sql' => 1,
        'update_languages' => 1,
    ),
    'uninstall' => array (
        'execute_sql' => 1,
        'update_languages' => 1,
    ),
    'enable' => array(
        'check_dependencies' => 1,
        'execute_sql' => 1,
        'clear_db_cache' => 1,
    ),
    'enable_success' => array(
        'process_menu_triggers' => 1,
        'clear_db_cache' => 1,
    ),
    'disable' => array(
        'execute_sql' => 1,
        'clear_db_cache' => 1,
    ),
);

/** @} */
