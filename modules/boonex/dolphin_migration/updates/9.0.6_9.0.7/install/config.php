<?php
/**
 * Copyright (c) BoonEx Pty Limited - http://www.boonex.com/
 * CC-BY License - http://creativecommons.org/licenses/by/3.0/
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'title' => 'Dolphin Migration',
    'version_from' => '9.0.6',
	'version_to' => '9.0.7',
    'vendor' => 'BoonEx',

    'compatible_with' => array(
        '15.0.0-RC5'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/dolphin_migration/updates/update_9.0.6_9.0.7/',
	'home_uri' => 'dolphin_migration_update_906_907',

	'module_dir' => 'boonex/dolphin_migration/',
	'module_uri' => 'dolphin_migration',

    'db_prefix' => 'bx_dolphin_',
    'class_prefix' => 'BxDolM',

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
    'language_category' => 'Boonex Dolphin Migration Tool',

	/**
     * Files Section
     */
    'delete_files' => array(),
);
