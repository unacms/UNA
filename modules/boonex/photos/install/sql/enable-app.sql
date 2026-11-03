-- PAGES: config_api
UPDATE `sys_objects_page` SET `config_api`='{\r\n    layout: \'post\',\r\n   \r\n}' WHERE `object`='bx_photos_view_entry';

-- PAGES: active_api
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_create_entry' AND `module`='bx_photos' AND `title_system`='' AND `title`='_bx_photos_page_block_title_create_entry';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_edit_entry' AND `module`='bx_photos' AND `title_system`='' AND `title`='_bx_photos_page_block_title_edit_entry';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_delete_entry' AND `module`='bx_photos' AND `title_system`='' AND `title`='_bx_photos_page_block_title_delete_entry';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_view_entry' AND `module`='bx_photos' AND `title_system`='' AND `title`='_bx_photos_page_block_title_entry_photo';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_view_entry' AND `module`='bx_photos' AND `title_system`='' AND `title`='_bx_photos_page_block_title_entry_text';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_view_entry' AND `module`='bx_photos' AND `title_system`='' AND `title`='_bx_photos_page_block_title_entry_author';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_view_entry' AND `module`='bx_photos' AND `title_system`='_bx_photos_page_block_title_sys_entry_context' AND `title`='_bx_photos_page_block_title_entry_context';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_view_entry' AND `module`='bx_photos' AND `title_system`='' AND `title`='_bx_photos_page_block_title_entry_info';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_view_entry' AND `module`='bx_photos' AND `title_system`='' AND `title`='_bx_photos_page_block_title_entry_media_exif';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_view_entry' AND `module`='bx_photos' AND `title_system`='' AND `title`='_bx_photos_page_block_title_entry_all_actions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_view_entry' AND `module`='bx_photos' AND `title_system`='' AND `title`='_bx_photos_page_block_title_entry_comments';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_view_entry' AND `module`='bx_photos' AND `title_system`='' AND `title`='_bx_photos_page_block_title_entry_location';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_view_entry' AND `module`='bx_photos' AND `title_system`='' AND `title`='_bx_photos_page_block_title_featured_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_view_entry' AND `module`='bx_photos' AND `title_system`='' AND `title`='_bx_photos_page_block_title_entry_reports';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_view_entry_brief' AND `module`='bx_photos' AND `title_system`='' AND `title`='_bx_photos_page_block_title_entry_photo';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_view_entry_brief' AND `module`='bx_photos' AND `title_system`='' AND `title`='_bx_photos_page_block_title_entry_info';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_view_entry_brief' AND `module`='bx_photos' AND `title_system`='' AND `title`='_bx_photos_page_block_title_entry_author';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_view_entry_comments' AND `module`='bx_photos' AND `title_system`='_bx_photos_page_block_title_entry_comments' AND `title`='_bx_photos_page_block_title_entry_comments_link';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_popular' AND `module`='bx_photos' AND `title_system`='' AND `title`='_bx_photos_page_block_title_popular_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_top' AND `module`='bx_photos' AND `title_system`='' AND `title`='_bx_photos_page_block_title_top_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_updated' AND `module`='bx_photos' AND `title_system`='' AND `title`='_bx_photos_page_block_title_updated_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_author' AND `module`='bx_photos' AND `title_system`='' AND `title`='_bx_photos_page_block_title_entries_actions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_author' AND `module`='bx_photos' AND `title_system`='_bx_photos_page_block_title_sys_favorites_of_author' AND `title`='_bx_photos_page_block_title_favorites_of_author';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_author' AND `module`='bx_photos' AND `title_system`='_bx_photos_page_block_title_sys_entries_of_author' AND `title`='_bx_photos_page_block_title_entries_of_author';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_author' AND `module`='bx_photos' AND `title_system`='_bx_photos_page_block_title_sys_entries_in_context' AND `title`='_bx_photos_page_block_title_entries_in_context';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_favorites' AND `module`='bx_photos' AND `title_system`='_bx_photos_page_block_title_sys_favorites_entries' AND `title`='_bx_photos_page_block_title_favorites_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_favorites' AND `module`='bx_photos' AND `title_system`='' AND `title`='_bx_photos_page_block_title_favorites_entries_info';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_favorites' AND `module`='bx_photos' AND `title_system`='' AND `title`='_bx_photos_page_block_title_favorites_entries_actions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_context' AND `module`='bx_photos' AND `title_system`='_bx_photos_page_block_title_sys_entries_in_context' AND `title`='_bx_photos_page_block_title_entries_in_context';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_home' AND `module`='bx_photos' AND `title_system`='' AND `title`='_bx_photos_page_block_title_recent_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_home' AND `module`='bx_photos' AND `title_system`='' AND `title`='_bx_photos_page_block_title_popular_keywords';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_home' AND `module`='bx_photos' AND `title_system`='' AND `title`='_bx_photos_page_block_title_cats';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_search' AND `module`='bx_photos' AND `title_system`='' AND `title`='_bx_photos_page_block_title_search_form';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_search' AND `module`='bx_photos' AND `title_system`='' AND `title`='_bx_photos_page_block_title_search_results';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_manage' AND `module`='bx_photos' AND `title_system`='_bx_photos_page_block_title_system_manage' AND `title`='_bx_photos_page_block_title_manage';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_photos_administration' AND `module`='bx_photos' AND `title_system`='_bx_photos_page_block_title_system_manage_administration' AND `title`='_bx_photos_page_block_title_manage';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_persons_view_profile' AND `module`='bx_photos' AND `title_system`='_bx_photos_page_block_title_sys_my_entries' AND `title`='_bx_photos_page_block_title_my_entries';


-- MENUS:

-- MENUS: config_api

-- MENUS: active_api
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_homepage' AND `module`='bx_photos' AND `name`='photos-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_profile_stats' AND `module`='bx_photos' AND `name`='profile-stats-my-photos';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_dashboard_manage_tools' AND `module`='bx_photos' AND `name`='photos-administration';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_photos_view' AND `module`='bx_photos' AND `name`='edit-photo';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_photos_view' AND `module`='bx_photos' AND `name`='delete-photo';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_photos_view' AND `module`='bx_photos' AND `name`='approve';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_photos_view_actions' AND `module`='bx_photos' AND `name`='edit-photo';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_photos_view_actions' AND `module`='bx_photos' AND `name`='delete-photo';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_photos_view_actions' AND `module`='bx_photos' AND `name`='approve';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_photos_view_actions' AND `module`='bx_photos' AND `name`='view';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_photos_view_actions' AND `module`='bx_photos' AND `name`='reaction';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_photos_view_actions' AND `module`='bx_photos' AND `name`='score';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_photos_view_actions' AND `module`='bx_photos' AND `name`='favorite';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_photos_view_actions' AND `module`='bx_photos' AND `name`='feature';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_photos_view_actions' AND `module`='bx_photos' AND `name`='repost';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_photos_view_actions' AND `module`='bx_photos' AND `name`='report';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_photos_view_actions' AND `module`='bx_photos' AND `name`='notes';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_photos_view_actions' AND `module`='bx_photos' AND `name`='audit';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_photos_view_actions' AND `module`='bx_photos' AND `name`='social-sharing';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_photos_view_actions' AND `module`='bx_photos' AND `name`='more-auto';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_photos_my' AND `module`='bx_photos' AND `name`='create-photo';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_photos_submenu' AND `module`='bx_photos' AND `name`='photos-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_photos_submenu' AND `module`='bx_photos' AND `name`='photos-popular';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_photos_submenu' AND `module`='bx_photos' AND `name`='photos-top';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_photos_submenu' AND `module`='bx_photos' AND `name`='photos-search';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_photos_submenu' AND `module`='bx_photos' AND `name`='photos-manage';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_photos_snippet_meta' AND `module`='bx_photos' AND `name`='rating';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_photos_snippet_meta' AND `module`='bx_photos' AND `name`='comments';
