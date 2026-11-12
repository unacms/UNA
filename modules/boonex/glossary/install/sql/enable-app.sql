-- PAGES: config_api


-- PAGES: active_api
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_glossary_create_entry' AND `module`='bx_glossary' AND `title_system`='' AND `title`='_bx_glossary_page_block_title_create_entry';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_glossary_edit_entry' AND `module`='bx_glossary' AND `title_system`='' AND `title`='_bx_glossary_page_block_title_edit_entry';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_glossary_delete_entry' AND `module`='bx_glossary' AND `title_system`='' AND `title`='_bx_glossary_page_block_title_delete_entry';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_glossary_view_entry' AND `module`='bx_glossary' AND `title_system`='' AND `title`='_bx_glossary_page_block_title_entry_text';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_glossary_view_entry' AND `module`='bx_glossary' AND `title_system`='_bx_glossary_page_block_title_sys_entry_context' AND `title`='_bx_glossary_page_block_title_entry_context';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_glossary_view_entry' AND `module`='bx_glossary' AND `title_system`='' AND `title`='_bx_glossary_page_block_title_entry_all_actions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_glossary_view_entry' AND `module`='bx_glossary' AND `title_system`='' AND `title`='_bx_glossary_page_block_title_entry_comments';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_glossary_view_entry' AND `module`='bx_glossary' AND `title_system`='' AND `title`='_bx_glossary_page_block_title_entry_reports';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_glossary_view_entry_comments' AND `module`='bx_glossary' AND `title_system`='_bx_glossary_page_block_title_entry_comments' AND `title`='_bx_glossary_page_block_title_entry_comments_link';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_glossary_popular' AND `module`='bx_glossary' AND `title_system`='' AND `title`='_bx_glossary_page_block_title_popular_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_glossary_top' AND `module`='bx_glossary' AND `title_system`='' AND `title`='_bx_glossary_page_block_title_top_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_glossary_updated' AND `module`='bx_glossary' AND `title_system`='' AND `title`='_bx_glossary_page_block_title_updated_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_glossary_author' AND `module`='bx_glossary' AND `title_system`='' AND `title`='_bx_glossary_page_block_title_entries_actions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_glossary_author' AND `module`='bx_glossary' AND `title_system`='_bx_glossary_page_block_title_sys_favorites_of_author' AND `title`='_bx_glossary_page_block_title_favorites_of_author';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_glossary_author' AND `module`='bx_glossary' AND `title_system`='_bx_glossary_page_block_title_sys_entries_of_author' AND `title`='_bx_glossary_page_block_title_entries_of_author';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_glossary_author' AND `module`='bx_glossary' AND `title_system`='_bx_glossary_page_block_title_sys_entries_in_context' AND `title`='_bx_glossary_page_block_title_entries_in_context';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_glossary_favorites' AND `module`='bx_glossary' AND `title_system`='_bx_glossary_page_block_title_sys_favorites_entries' AND `title`='_bx_glossary_page_block_title_favorites_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_glossary_favorites' AND `module`='bx_glossary' AND `title_system`='' AND `title`='_bx_glossary_page_block_title_favorites_entries_info';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_glossary_favorites' AND `module`='bx_glossary' AND `title_system`='' AND `title`='_bx_glossary_page_block_title_favorites_entries_actions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_glossary_context' AND `module`='bx_glossary' AND `title_system`='_bx_glossary_page_block_title_sys_entries_in_context' AND `title`='_bx_glossary_page_block_title_entries_in_context';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_glossary_home' AND `module`='bx_glossary' AND `title_system`='' AND `title`='_bx_glossary_page_block_title_featured_entries_view_alphabetical';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_glossary_search' AND `module`='bx_glossary' AND `title_system`='' AND `title`='_bx_glossary_page_block_title_search_form';
UPDATE `sys_pages_blocks` SET `config_api`='{"use_as_filter":true}' WHERE `object`='bx_glossary_search' AND `module`='bx_glossary' AND `title_system`='' AND `title`='_bx_glossary_page_block_title_search_form';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_glossary_search' AND `module`='bx_glossary' AND `title_system`='' AND `title`='_bx_glossary_page_block_title_search_results';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_glossary_manage' AND `module`='bx_glossary' AND `title_system`='_bx_glossary_page_block_title_system_manage' AND `title`='_bx_glossary_page_block_title_manage';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_glossary_administration' AND `module`='bx_glossary' AND `title_system`='_bx_glossary_page_block_title_system_manage_administration' AND `title`='_bx_glossary_page_block_title_manage';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_persons_view_profile' AND `module`='bx_glossary' AND `title_system`='_bx_glossary_page_block_title_sys_my_entries' AND `title`='_bx_glossary_page_block_title_my_entries';


-- MENUS:

-- MENUS: config_api

-- MENUS: active_api
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site' AND `module`='bx_glossary' AND `name`='glossary-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_profile_stats' AND `module`='bx_glossary' AND `name`='profile-stats-my-glossary';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_glossary_view' AND `module`='bx_glossary' AND `name`='edit-glossary';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_glossary_view' AND `module`='bx_glossary' AND `name`='delete-glossary';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_glossary_view' AND `module`='bx_glossary' AND `name`='approve';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_glossary_view_actions' AND `module`='bx_glossary' AND `name`='edit-glossary';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_glossary_view_actions' AND `module`='bx_glossary' AND `name`='delete-glossary';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_glossary_view_actions' AND `module`='bx_glossary' AND `name`='approve';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_glossary_view_actions' AND `module`='bx_glossary' AND `name`='view';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_glossary_view_actions' AND `module`='bx_glossary' AND `name`='reaction';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_glossary_view_actions' AND `module`='bx_glossary' AND `name`='score';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_glossary_view_actions' AND `module`='bx_glossary' AND `name`='favorite';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_glossary_view_actions' AND `module`='bx_glossary' AND `name`='feature';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_glossary_view_actions' AND `module`='bx_glossary' AND `name`='repost';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_glossary_view_actions' AND `module`='bx_glossary' AND `name`='report';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_glossary_view_actions' AND `module`='bx_glossary' AND `name`='notes';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_glossary_view_actions' AND `module`='bx_glossary' AND `name`='audit';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_glossary_view_actions' AND `module`='bx_glossary' AND `name`='social-sharing';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_glossary_view_actions' AND `module`='bx_glossary' AND `name`='more-auto';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_glossary_my' AND `module`='bx_glossary' AND `name`='create-glossary';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_glossary_submenu' AND `module`='bx_glossary' AND `name`='glossary-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_glossary_submenu' AND `module`='bx_glossary' AND `name`='glossary-popular';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_glossary_submenu' AND `module`='bx_glossary' AND `name`='glossary-top';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_glossary_submenu' AND `module`='bx_glossary' AND `name`='glossary-search';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_glossary_submenu' AND `module`='bx_glossary' AND `name`='glossary-manage';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_glossary_snippet_meta' AND `module`='bx_glossary' AND `name`='date';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_glossary_snippet_meta' AND `module`='bx_glossary' AND `name`='author';
