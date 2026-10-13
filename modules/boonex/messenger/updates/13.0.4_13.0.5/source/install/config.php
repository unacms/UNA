<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Messenger Messenger
 * @ingroup     UnaModules
 *
 * @{
 */

$aConfig = array(
/**
* Main Section.
*/
	'type' => BX_DOL_MODULE_TYPE_MODULE,
	'name' => 'bx_messenger',
	'title' => 'Messenger',
	'note' => 'Messenger module.',
	'version' => '13.0.5',
	'vendor' => 'BoonEx',
	'help_url' => 'http://feed.una.io/?section={module_name}',

	'compatible_with' => array(
		'13.0.0'
	),

	/**
	* 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
	*/
	'home_dir' => 'boonex/messenger/',
	'home_uri' => 'messenger',

	'db_prefix' => 'bx_messenger_',
	'class_prefix' => 'BxMessenger',

	/**
	* Category for language keys.
	 */
	'language_category' => 'Messenger',

	/**
	* List of page triggers.
	 */
	'page_triggers' => array (
	'trigger_page_profile_view_entry',
	'trigger_page_group_view_entry',
	),  

	/**
	*Menu triggers.
	*/
	'menu_triggers' => array(
		'trigger_profile_view_submenu', 
		'trigger_profile_view_actions',
	),

	/**
     * Storage objects to automatically delete files from upon module uninstallation.
     * Note. Don't add storage objects used in transcoder objects.
     */
	'storages' => array(
		'bx_messenger_files',
		'bx_messenger_photos_resized',
		'bx_messenger_videos_processed',
		'bx_messenger_mp3_processed'
	),

	/**
	* Transcoders.
	*/
	
	'transcoders' => array(
        'bx_messenger_preview',
		'bx_messenger_videos_poster',
		'bx_messenger_videos_mp4',
		'bx_messenger_videos_mp4_hd',
		'bx_messenger_videos_webm',
		'bx_messenger_mp3',
	),
	
	/**
	* Installation/Uninstallation Section.
	*/
	'install' => array(
		'execute_sql' => 1,
		'update_languages' => 1,
		'clear_db_cache' => 1,
	),
	'uninstall' => array (
		'execute_sql' => 1,
		'update_languages' => 1,
		'clear_db_cache' => 1,
        'update_relations' => 1
	),
	'enable' => array(
		'execute_sql' => 1,
		'clear_db_cache' => 1,
        'update_relations' => 1
	),
	'enable_success' => array(
		'process_page_triggers' => 1,
		'register_transcoders' => 1,
		'process_menu_triggers' => 1,
		'clear_db_cache' => 1,
	),
	'disable' => array (
		'execute_sql' => 1,
		'unregister_transcoders' => 1,
		'clear_db_cache' => 1,
        'update_relations' => 1
	),
	'disable_failed' => array (
		'register_transcoders' => 1,
		'clear_db_cache' => 1,
	),

	/**
	 * Dependencies Section
	 */
	'dependencies' => array(),

    'relations' => array(
        'bx_notifications'
    ),
);

/** @} */
