<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'title' => 'Messenger',
    'version_from' => '12.0.7',
	'version_to' => '13.0.0',
    'vendor' => 'BoonEx',

    'compatible_with' => array(
        '13.0.0'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/messenger/updates/update_12.0.7_13.0.0/',
	'home_uri' => 'messenger_update_1207_1300',

	'module_dir' => 'boonex/messenger/',
	'module_uri' => 'messenger',

    'db_prefix' => 'bx_messenger_',
    'class_prefix' => 'BxMessenger',
		
	/**
     * Installation/Uninstallation Section.
     */
    'install' => [
        'execute_sql' => 1,
        'update_files' => 1,
        'update_languages' => 1,
        'clear_db_cache' => 1
    ],
	
	/**
     * Category for language keys.
     */
    'language_category' => 'Messenger',

    /**
     *  Files Section
     */
    'delete_files' => [
        'template/a_file.html',
        'template/text_area.html',
        'template/hidden_jot.html',
        'template/header_wrapper.html',
        'template/custom_attachment.html',
        'template/giphy_panel.html',
        'template/giphy_items.html',
        'template/talk_header.html',
        'template/talk_edit_participants_list.html',
        'template/talk_body.html',
        'template/edit_icon.html',
        'template/edit_jot.html',
        'template/online_status.html',
        'template/lots_types_menu.html',
        'template/lots_list.html',
        'template/file_menu.html',
        'template/lots_briefs.html',
        'template/giphy_form.html',
        'template/files_feeds.html',
        'template/friends_list.html',
        'template/css/admin.css',
        'template/css/talk-header.css',
        'template/css/date-time-divider.css',
        'template/css/scroll-popup-elements.css',
        'template/css/emoji-mart.css',
        'template/css/quill-messenger.css',
        'template/css/messenger-block.css',
        'template/css/semantic.min.css',
        'template/css/semantic-messenger.css',
        'js/columns.js',
        'js/emoji-mart.js',
        'js/messenger-public-lib.js',
        'js/semantic.min.js',
        'js/emoji-mart'
    ],
);
