-- PAGES: config_api
UPDATE `sys_objects_page` SET `config_api`='{\r\n    layout: \'post\',\r\n   \r\n}' WHERE `object`='bx_polls_view_entry';

-- PAGES: active_api
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_polls_create_entry' AND `module`='bx_polls' AND `title_system`='' AND `title`='_bx_polls_page_block_title_create_entry';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_polls_edit_entry' AND `module`='bx_polls' AND `title_system`='' AND `title`='_bx_polls_page_block_title_edit_entry';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_polls_delete_entry' AND `module`='bx_polls' AND `title_system`='' AND `title`='_bx_polls_page_block_title_delete_entry';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_polls_view_entry' AND `module`='bx_polls' AND `title_system`='' AND `title`='_bx_polls_page_block_title_entry_text_and_subentries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_polls_view_entry' AND `module`='bx_polls' AND `title_system`='' AND `title`='_bx_polls_page_block_title_entry_author';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_polls_view_entry' AND `module`='bx_polls' AND `title_system`='_bx_polls_page_block_title_sys_entry_context' AND `title`='_bx_polls_page_block_title_entry_context';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_polls_view_entry' AND `module`='bx_polls' AND `title_system`='' AND `title`='_bx_polls_page_block_title_entry_info';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_polls_view_entry' AND `module`='bx_polls' AND `title_system`='' AND `title`='_bx_polls_page_block_title_entry_all_actions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_polls_view_entry' AND `module`='bx_polls' AND `title_system`='' AND `title`='_bx_polls_page_block_title_entry_comments';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_polls_view_entry' AND `module`='bx_polls' AND `title_system`='' AND `title`='_bx_polls_page_block_title_entry_location';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_polls_view_entry' AND `module`='bx_polls' AND `title_system`='' AND `title`='_bx_polls_page_block_title_featured_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_polls_view_entry_comments' AND `module`='bx_polls' AND `title_system`='_bx_polls_page_block_title_entry_comments' AND `title`='_bx_polls_page_block_title_entry_comments_link';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_polls_popular' AND `module`='bx_polls' AND `title_system`='' AND `title`='_bx_polls_page_block_title_popular_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_polls_top' AND `module`='bx_polls' AND `title_system`='' AND `title`='_bx_polls_page_block_title_top_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_polls_updated' AND `module`='bx_polls' AND `title_system`='' AND `title`='_bx_polls_page_block_title_updated_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_polls_author' AND `module`='bx_polls' AND `title_system`='' AND `title`='_bx_polls_page_block_title_entries_actions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_polls_author' AND `module`='bx_polls' AND `title_system`='_bx_polls_page_block_title_sys_favorites_of_author' AND `title`='_bx_polls_page_block_title_favorites_of_author';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_polls_author' AND `module`='bx_polls' AND `title_system`='_bx_polls_page_block_title_sys_entries_of_author' AND `title`='_bx_polls_page_block_title_entries_of_author';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_polls_author' AND `module`='bx_polls' AND `title_system`='_bx_polls_page_block_title_sys_entries_in_context' AND `title`='_bx_polls_page_block_title_entries_in_context';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_polls_favorites' AND `module`='bx_polls' AND `title_system`='_bx_polls_page_block_title_sys_favorites_entries' AND `title`='_bx_polls_page_block_title_favorites_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_polls_favorites' AND `module`='bx_polls' AND `title_system`='' AND `title`='_bx_polls_page_block_title_favorites_entries_info';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_polls_favorites' AND `module`='bx_polls' AND `title_system`='' AND `title`='_bx_polls_page_block_title_favorites_entries_actions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_polls_context' AND `module`='bx_polls' AND `title_system`='_bx_polls_page_block_title_sys_entries_in_context' AND `title`='_bx_polls_page_block_title_entries_in_context';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_polls_home' AND `module`='bx_polls' AND `title_system`='' AND `title`='_bx_polls_page_block_title_recent_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_polls_search' AND `module`='bx_polls' AND `title_system`='' AND `title`='_bx_polls_page_block_title_search_form';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_polls_search' AND `module`='bx_polls' AND `title_system`='' AND `title`='_bx_polls_page_block_title_search_results';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_polls_manage' AND `module`='bx_polls' AND `title_system`='_bx_polls_page_block_title_system_manage' AND `title`='_bx_polls_page_block_title_manage';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_polls_administration' AND `module`='bx_polls' AND `title_system`='_bx_polls_page_block_title_system_manage_administration' AND `title`='_bx_polls_page_block_title_manage';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_persons_view_profile' AND `module`='bx_polls' AND `title_system`='_bx_polls_page_block_title_sys_my_entries' AND `title`='_bx_polls_page_block_title_my_entries';


-- MENUS:

-- MENUS: config_api

-- MENUS: active_api
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site' AND `module`='bx_polls' AND `name`='polls-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_homepage' AND `module`='bx_polls' AND `name`='polls-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_add_content_links' AND `module`='bx_polls' AND `name`='create-poll';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_profile_stats' AND `module`='bx_polls' AND `name`='profile-stats-my-polls';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_dashboard_manage_tools' AND `module`='bx_polls' AND `name`='polls-administration';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_polls_view' AND `module`='bx_polls' AND `name`='edit-poll';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_polls_view' AND `module`='bx_polls' AND `name`='delete-poll';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_polls_view' AND `module`='bx_polls' AND `name`='approve';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_polls_view_actions' AND `module`='bx_polls' AND `name`='edit-poll';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_polls_view_actions' AND `module`='bx_polls' AND `name`='delete-poll';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_polls_view_actions' AND `module`='bx_polls' AND `name`='approve';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_polls_view_actions' AND `module`='bx_polls' AND `name`='view';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_polls_view_actions' AND `module`='bx_polls' AND `name`='reaction';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_polls_view_actions' AND `module`='bx_polls' AND `name`='score';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_polls_view_actions' AND `module`='bx_polls' AND `name`='favorite';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_polls_view_actions' AND `module`='bx_polls' AND `name`='feature';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_polls_view_actions' AND `module`='bx_polls' AND `name`='repost';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_polls_view_actions' AND `module`='bx_polls' AND `name`='report';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_polls_view_actions' AND `module`='bx_polls' AND `name`='notes';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_polls_view_actions' AND `module`='bx_polls' AND `name`='audit';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_polls_view_actions' AND `module`='bx_polls' AND `name`='social-sharing';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_polls_view_actions' AND `module`='bx_polls' AND `name`='more-auto';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_polls_my' AND `module`='bx_polls' AND `name`='create-poll';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_polls_submenu' AND `module`='bx_polls' AND `name`='polls-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_polls_submenu' AND `module`='bx_polls' AND `name`='polls-popular';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_polls_submenu' AND `module`='bx_polls' AND `name`='polls-top';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_polls_submenu' AND `module`='bx_polls' AND `name`='polls-search';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_polls_submenu' AND `module`='bx_polls' AND `name`='polls-manage';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_polls_snippet_meta' AND `module`='bx_polls' AND `name`='date';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_polls_snippet_meta' AND `module`='bx_polls' AND `name`='comments';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_polls_snippet_meta' AND `module`='bx_polls' AND `name`='author';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_polls_snippet_meta' AND `module`='bx_polls' AND `name`='actions';
