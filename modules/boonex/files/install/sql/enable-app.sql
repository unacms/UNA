-- PAGES: config_api
UPDATE `sys_objects_page` SET `config_api`='{\r\n    layout: \'post\',\r\n    \r\n}' WHERE `object`='bx_files_view_entry';

-- PAGES: active_api
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_files_create_entry' AND `module`='bx_files' AND `title_system`='' AND `title`='_bx_files_page_block_title_create_entry';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_files_edit_entry' AND `module`='bx_files' AND `title_system`='' AND `title`='_bx_files_page_block_title_edit_entry';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_files_delete_entry' AND `module`='bx_files' AND `title_system`='' AND `title`='_bx_files_page_block_title_delete_entry';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_files_view_entry' AND `module`='bx_files' AND `title_system`='' AND `title`='_bx_files_page_block_title_entry_text';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_files_view_entry' AND `module`='bx_files' AND `title_system`='' AND `title`='_bx_files_page_block_title_entry_author';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_files_view_entry' AND `module`='bx_files' AND `title_system`='_bx_files_page_block_title_sys_entry_context' AND `title`='_bx_files_page_block_title_entry_context';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_files_view_entry' AND `module`='bx_files' AND `title_system`='' AND `title`='_bx_files_page_block_title_entry_info';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_files_view_entry' AND `module`='bx_files' AND `title_system`='' AND `title`='_bx_files_page_block_title_entry_all_actions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_files_view_entry' AND `module`='bx_files' AND `title_system`='' AND `title`='_bx_files_page_block_title_entry_comments';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_files_view_entry' AND `module`='bx_files' AND `title_system`='' AND `title`='_bx_files_page_block_title_entry_location';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_files_view_entry' AND `module`='bx_files' AND `title_system`='' AND `title`='_bx_files_page_block_title_entry_reports';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_files_view_entry_comments' AND `module`='bx_files' AND `title_system`='_bx_files_page_block_title_entry_comments' AND `title`='_bx_files_page_block_title_entry_comments_link';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_files_popular' AND `module`='bx_files' AND `title_system`='' AND `title`='_bx_files_page_block_title_popular_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_files_top' AND `module`='bx_files' AND `title_system`='' AND `title`='_bx_files_page_block_title_top_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_files_updated' AND `module`='bx_files' AND `title_system`='' AND `title`='_bx_files_page_block_title_updated_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_files_author' AND `module`='bx_files' AND `title_system`='_bx_files_page_block_title_sys_favorites_of_author' AND `title`='_bx_files_page_block_title_favorites_of_author';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_files_author' AND `module`='bx_files' AND `title_system`='_bx_files_page_block_title_sys_entries_of_author' AND `title`='_bx_files_page_block_title_entries_of_author';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_files_author' AND `module`='bx_files' AND `title_system`='_bx_files_page_block_title_sys_entries_in_context' AND `title`='_bx_files_page_block_title_entries_in_context';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_files_favorites' AND `module`='bx_files' AND `title_system`='_bx_files_page_block_title_sys_favorites_entries' AND `title`='_bx_files_page_block_title_favorites_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_files_favorites' AND `module`='bx_files' AND `title_system`='' AND `title`='_bx_files_page_block_title_favorites_entries_info';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_files_favorites' AND `module`='bx_files' AND `title_system`='' AND `title`='_bx_files_page_block_title_favorites_entries_actions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_files_context' AND `module`='bx_files' AND `title_system`='_bx_files_page_block_title_sys_entries_in_context' AND `title`='_bx_files_page_block_title_entries_in_context';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_files_home' AND `module`='bx_files' AND `title_system`='' AND `title`='_bx_files_page_block_title_recent_entries_view_extended';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_files_home' AND `module`='bx_files' AND `title_system`='' AND `title`='_bx_files_page_block_title_popular_keywords';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_files_home' AND `module`='bx_files' AND `title_system`='' AND `title`='_bx_files_page_block_title_cats';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_files_search' AND `module`='bx_files' AND `title_system`='' AND `title`='_bx_files_page_block_title_search_form';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_files_search' AND `module`='bx_files' AND `title_system`='' AND `title`='_bx_files_page_block_title_search_results';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_files_manage' AND `module`='bx_files' AND `title_system`='_bx_files_page_block_title_system_manage' AND `title`='_bx_files_page_block_title_manage';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_files_administration' AND `module`='bx_files' AND `title_system`='_bx_files_page_block_title_system_manage_administration' AND `title`='_bx_files_page_block_title_manage';


-- MENUS:

-- MENUS: config_api

-- MENUS: active_api
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site' AND `module`='bx_files' AND `name`='files-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_profile_stats' AND `module`='bx_files' AND `name`='profile-stats-my-files';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_view' AND `module`='bx_files' AND `name`='download-file';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_view' AND `module`='bx_files' AND `name`='edit-file';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_view' AND `module`='bx_files' AND `name`='delete-file';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_view' AND `module`='bx_files' AND `name`='approve';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_view_actions' AND `module`='bx_files' AND `name`='download-file';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_view_actions' AND `module`='bx_files' AND `name`='edit-file';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_view_actions' AND `module`='bx_files' AND `name`='delete-file';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_view_actions' AND `module`='bx_files' AND `name`='approve';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_view_actions' AND `module`='bx_files' AND `name`='view';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_view_actions' AND `module`='bx_files' AND `name`='reaction';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_view_actions' AND `module`='bx_files' AND `name`='score';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_view_actions' AND `module`='bx_files' AND `name`='favorite';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_view_actions' AND `module`='bx_files' AND `name`='feature';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_view_actions' AND `module`='bx_files' AND `name`='repost';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_view_actions' AND `module`='bx_files' AND `name`='report';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_view_actions' AND `module`='bx_files' AND `name`='notes';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_view_actions' AND `module`='bx_files' AND `name`='audit';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_view_actions' AND `module`='bx_files' AND `name`='social-sharing';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_view_actions' AND `module`='bx_files' AND `name`='more-auto';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_view_inline' AND `module`='bx_files' AND `name`='bookmark';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_view_inline' AND `module`='bx_files' AND `name`='download-file';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_view_inline' AND `module`='bx_files' AND `name`='delete-file-quick';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_view_inline' AND `module`='bx_files' AND `name`='move-to';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_view_inline' AND `module`='bx_files' AND `name`='edit-title';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_view_inline' AND `module`='bx_files' AND `name`='preview';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_view_inline' AND `module`='bx_files' AND `name`='report';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_view_inline' AND `module`='bx_files' AND `name`='more-auto';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_my' AND `module`='bx_files' AND `name`='create-file';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_submenu' AND `module`='bx_files' AND `name`='files-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_submenu' AND `module`='bx_files' AND `name`='files-popular';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_submenu' AND `module`='bx_files' AND `name`='files-top';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_submenu' AND `module`='bx_files' AND `name`='files-search';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_submenu' AND `module`='bx_files' AND `name`='files-manage';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_snippet_meta' AND `module`='bx_files' AND `name`='date';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_snippet_meta' AND `module`='bx_files' AND `name`='size';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_files_snippet_meta' AND `module`='bx_files' AND `name`='author';
