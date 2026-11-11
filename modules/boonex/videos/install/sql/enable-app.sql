-- PAGES: config_api
UPDATE `sys_objects_page` SET `config_api`='{\r\n    layout: \'post\',\r\n   \r\n}' WHERE `object`='bx_videos_view_entry';

-- PAGES: active_api
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_videos_create_entry' AND `module`='bx_videos' AND `title_system`='' AND `title`='_bx_videos_page_block_title_create_entry';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_videos_edit_entry' AND `module`='bx_videos' AND `title_system`='' AND `title`='_bx_videos_page_block_title_edit_entry';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_videos_delete_entry' AND `module`='bx_videos' AND `title_system`='' AND `title`='_bx_videos_page_block_title_delete_entry';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_videos_view_entry' AND `module`='bx_videos' AND `title_system`='' AND `title`='_bx_videos_page_block_title_entry_text';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_videos_view_entry' AND `module`='bx_videos' AND `title_system`='' AND `title`='_bx_videos_page_block_title_entry_author';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_videos_view_entry' AND `module`='bx_videos' AND `title_system`='_bx_videos_page_block_title_sys_entry_context' AND `title`='_bx_videos_page_block_title_entry_context';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_videos_view_entry' AND `module`='bx_videos' AND `title_system`='' AND `title`='_bx_videos_page_block_title_entry_info';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_videos_view_entry' AND `module`='bx_videos' AND `title_system`='' AND `title`='_bx_videos_page_block_title_entry_all_actions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_videos_view_entry' AND `module`='bx_videos' AND `title_system`='' AND `title`='_bx_videos_page_block_title_entry_comments';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_videos_view_entry' AND `module`='bx_videos' AND `title_system`='' AND `title`='_bx_videos_page_block_title_entry_location';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_videos_view_entry' AND `module`='bx_videos' AND `title_system`='' AND `title`='_bx_videos_page_block_title_featured_entries_view_extended';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_videos_view_entry_comments' AND `module`='bx_videos' AND `title_system`='_bx_videos_page_block_title_entry_comments' AND `title`='_bx_videos_page_block_title_entry_comments_link';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_videos_popular' AND `module`='bx_videos' AND `title_system`='' AND `title`='_bx_videos_page_block_title_popular_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_videos_top' AND `module`='bx_videos' AND `title_system`='' AND `title`='_bx_videos_page_block_title_top_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_videos_updated' AND `module`='bx_videos' AND `title_system`='' AND `title`='_bx_videos_page_block_title_updated_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_videos_author' AND `module`='bx_videos' AND `title_system`='' AND `title`='_bx_videos_page_block_title_entries_actions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_videos_author' AND `module`='bx_videos' AND `title_system`='_bx_videos_page_block_title_sys_favorites_of_author' AND `title`='_bx_videos_page_block_title_favorites_of_author';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_videos_author' AND `module`='bx_videos' AND `title_system`='_bx_videos_page_block_title_sys_entries_of_author' AND `title`='_bx_videos_page_block_title_entries_of_author';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_videos_author' AND `module`='bx_videos' AND `title_system`='_bx_videos_page_block_title_sys_entries_in_context' AND `title`='_bx_videos_page_block_title_entries_in_context';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_videos_favorites' AND `module`='bx_videos' AND `title_system`='_bx_videos_page_block_title_sys_favorites_entries' AND `title`='_bx_videos_page_block_title_favorites_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_videos_favorites' AND `module`='bx_videos' AND `title_system`='' AND `title`='_bx_videos_page_block_title_favorites_entries_info';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_videos_favorites' AND `module`='bx_videos' AND `title_system`='' AND `title`='_bx_videos_page_block_title_favorites_entries_actions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_videos_context' AND `module`='bx_videos' AND `title_system`='_bx_videos_page_block_title_sys_entries_in_context' AND `title`='_bx_videos_page_block_title_entries_in_context';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_videos_home' AND `module`='bx_videos' AND `title_system`='' AND `title`='_bx_videos_page_block_title_recent_entries_view_extended';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_videos_search' AND `module`='bx_videos' AND `title_system`='' AND `title`='_bx_videos_page_block_title_search_form';
UPDATE `sys_pages_blocks` SET `config_api`='{"use_as_filter":true}' WHERE `object`='bx_videos_search' AND `module`='bx_videos' AND `title_system`='' AND `title`='_bx_videos_page_block_title_search_form';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_videos_search' AND `module`='bx_videos' AND `title_system`='' AND `title`='_bx_videos_page_block_title_search_results';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_videos_manage' AND `module`='bx_videos' AND `title_system`='_bx_videos_page_block_title_system_manage' AND `title`='_bx_videos_page_block_title_manage';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_videos_administration' AND `module`='bx_videos' AND `title_system`='_bx_videos_page_block_title_system_manage_administration' AND `title`='_bx_videos_page_block_title_manage';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_persons_view_profile' AND `module`='bx_videos' AND `title_system`='_bx_videos_page_block_title_sys_my_entries' AND `title`='_bx_videos_page_block_title_my_entries';


-- MENUS:

-- MENUS: config_api

-- MENUS: active_api
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site' AND `module`='bx_videos' AND `name`='videos-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_homepage' AND `module`='bx_videos' AND `name`='videos-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_add_content_links' AND `module`='bx_videos' AND `name`='create-video';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_profile_stats' AND `module`='bx_videos' AND `name`='profile-stats-my-videos';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_dashboard_manage_tools' AND `module`='bx_videos' AND `name`='videos-administration';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_videos_view' AND `module`='bx_videos' AND `name`='edit-video';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_videos_view' AND `module`='bx_videos' AND `name`='delete-video';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_videos_view' AND `module`='bx_videos' AND `name`='approve';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_videos_view_actions' AND `module`='bx_videos' AND `name`='edit-video';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_videos_view_actions' AND `module`='bx_videos' AND `name`='delete-video';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_videos_view_actions' AND `module`='bx_videos' AND `name`='approve';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_videos_view_actions' AND `module`='bx_videos' AND `name`='view';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_videos_view_actions' AND `module`='bx_videos' AND `name`='reaction';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_videos_view_actions' AND `module`='bx_videos' AND `name`='score';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_videos_view_actions' AND `module`='bx_videos' AND `name`='favorite';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_videos_view_actions' AND `module`='bx_videos' AND `name`='feature';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_videos_view_actions' AND `module`='bx_videos' AND `name`='repost';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_videos_view_actions' AND `module`='bx_videos' AND `name`='report';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_videos_my' AND `module`='bx_videos' AND `name`='create-video';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_videos_submenu' AND `module`='bx_videos' AND `name`='videos-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_videos_submenu' AND `module`='bx_videos' AND `name`='videos-popular';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_videos_submenu' AND `module`='bx_videos' AND `name`='videos-top';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_videos_submenu' AND `module`='bx_videos' AND `name`='videos-search';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_videos_submenu' AND `module`='bx_videos' AND `name`='videos-manage';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_videos_snippet_meta' AND `module`='bx_videos' AND `name`='date';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_videos_snippet_meta' AND `module`='bx_videos' AND `name`='rating';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_videos_snippet_meta' AND `module`='bx_videos' AND `name`='author';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_videos_snippet_meta' AND `module`='bx_videos' AND `name`='views';
