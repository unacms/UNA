-- PAGES: config_api
UPDATE `sys_objects_page` SET `config_api`='{\r\n    layout: \'post\',\r\n}' WHERE `object`='bx_posts_view_entry';

UPDATE `sys_pages_blocks` SET `config_api`='{\r\n\"content_type\":\"browse_simple\",\r\n\"header_more_url\":\"/posts-home\",\r\n\"view\":\"row\"\r\n}' WHERE `object`='sys_explore' AND `module`='bx_posts' AND `title_system`='_bx_posts_page_block_title_sys_featured_entries_view_showcase';

-- PAGES: blocks config_api
-- Categories on the posts home: a dropdown next to the tabs while NEO's left panel is off screen.
UPDATE `sys_pages_blocks` SET `config_api`='{"use_as_menu": true}' WHERE `object`='bx_posts_home' AND `module`='bx_posts' AND `type`='menu' AND `content`='bx_posts_categories';

-- PAGES: active_api
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_posts_home' AND `module`='bx_posts' AND `type`='menu' AND `content`='bx_posts_categories';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_posts_create_entry' AND `module`='bx_posts' AND `title_system`='' AND `title`='_bx_posts_page_block_title_create_entry';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_posts_edit_entry' AND `module`='bx_posts' AND `title_system`='' AND `title`='_bx_posts_page_block_title_edit_entry';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_posts_delete_entry' AND `module`='bx_posts' AND `title_system`='' AND `title`='_bx_posts_page_block_title_delete_entry';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_posts_view_entry' AND `module`='bx_posts' AND `title_system`='' AND `title`='_bx_posts_page_block_title_entry_breadcrumb';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_posts_view_entry' AND `module`='bx_posts' AND `title_system`='' AND `title`='_bx_posts_page_block_title_entry_text';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_posts_view_entry' AND `module`='bx_posts' AND `title_system`='' AND `title`='_bx_posts_page_block_title_entry_author';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_posts_view_entry' AND `module`='bx_posts' AND `title_system`='_bx_posts_page_block_title_sys_entry_context' AND `title`='_bx_posts_page_block_title_entry_context';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_posts_view_entry' AND `module`='bx_posts' AND `title_system`='' AND `title`='_bx_posts_page_block_title_entry_info';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_posts_view_entry' AND `module`='bx_posts' AND `title_system`='' AND `title`='_bx_posts_page_block_title_entry_all_actions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_posts_view_entry' AND `module`='bx_posts' AND `title_system`='' AND `title`='_bx_posts_page_block_title_entry_actions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_posts_view_entry' AND `module`='bx_posts' AND `title_system`='' AND `title`='_bx_posts_page_block_title_entry_attachments';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_posts_view_entry' AND `module`='bx_posts' AND `title_system`='' AND `title`='_bx_posts_page_block_title_entry_comments';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_posts_view_entry' AND `module`='bx_posts' AND `title_system`='' AND `title`='_bx_posts_page_block_title_entry_location';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_posts_view_entry' AND `module`='bx_posts' AND `title_system`='' AND `title`='_bx_posts_page_block_title_featured_entries_view_extended';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_posts_view_entry_comments' AND `module`='bx_posts' AND `title_system`='_bx_posts_page_block_title_entry_comments' AND `title`='_bx_posts_page_block_title_entry_comments_link';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_posts_popular' AND `module`='bx_posts' AND `title_system`='' AND `title`='_bx_posts_page_block_title_popular_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_posts_top' AND `module`='bx_posts' AND `title_system`='' AND `title`='_bx_posts_page_block_title_top_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_posts_updated' AND `module`='bx_posts' AND `title_system`='' AND `title`='_bx_posts_page_block_title_updated_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_posts_author' AND `module`='bx_posts' AND `title_system`='' AND `title`='_bx_posts_page_block_title_entries_actions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_posts_author' AND `module`='bx_posts' AND `title_system`='_bx_posts_page_block_title_sys_favorites_of_author' AND `title`='_bx_posts_page_block_title_favorites_of_author';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_posts_author' AND `module`='bx_posts' AND `title_system`='_bx_posts_page_block_title_sys_entries_of_author' AND `title`='_bx_posts_page_block_title_entries_of_author';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_posts_author' AND `module`='bx_posts' AND `title_system`='_bx_posts_page_block_title_sys_entries_in_context' AND `title`='_bx_posts_page_block_title_entries_in_context';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_posts_favorites' AND `module`='bx_posts' AND `title_system`='_bx_posts_page_block_title_sys_favorites_entries' AND `title`='_bx_posts_page_block_title_favorites_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_posts_favorites' AND `module`='bx_posts' AND `title_system`='' AND `title`='_bx_posts_page_block_title_favorites_entries_info';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_posts_favorites' AND `module`='bx_posts' AND `title_system`='' AND `title`='_bx_posts_page_block_title_favorites_entries_actions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_posts_context' AND `module`='bx_posts' AND `title_system`='_bx_posts_page_block_title_sys_entries_in_context' AND `title`='_bx_posts_page_block_title_entries_in_context';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_posts_home' AND `module`='bx_posts' AND `title_system`='' AND `title`='_bx_posts_page_block_title_recent_entries_view_extended';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_posts_search' AND `module`='bx_posts' AND `title_system`='' AND `title`='_bx_posts_page_block_title_search_form';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_posts_search' AND `module`='bx_posts' AND `title_system`='' AND `title`='_bx_posts_page_block_title_search_results';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_posts_manage' AND `module`='bx_posts' AND `title_system`='_bx_posts_page_block_title_system_manage' AND `title`='_bx_posts_page_block_title_manage';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_posts_administration' AND `module`='bx_posts' AND `title_system`='_bx_posts_page_block_title_system_manage_administration' AND `title`='_bx_posts_page_block_title_manage';


-- MENUS:

-- MENUS: config_api

-- MENUS: active_api
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site' AND `module`='bx_posts' AND `name`='posts-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_homepage' AND `module`='bx_posts' AND `name`='posts-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_add_content_links' AND `module`='bx_posts' AND `name`='create-post';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_create_post' AND `module`='bx_posts' AND `name`='create-post';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_profile_stats' AND `module`='bx_posts' AND `name`='profile-stats-my-posts';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_dashboard_manage_tools' AND `module`='bx_posts' AND `name`='posts-administration';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_posts_entry_attachments' AND `module`='bx_posts' AND `name`='photo_html5';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_posts_entry_attachments' AND `module`='bx_posts' AND `name`='video_html5';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_posts_entry_attachments' AND `module`='bx_posts' AND `name`='video_record_video';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_posts_entry_attachments' AND `module`='bx_posts' AND `name`='sound_html5';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_posts_entry_attachments' AND `module`='bx_posts' AND `name`='file_html5';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_posts_entry_attachments' AND `module`='bx_posts' AND `name`='poll';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_posts_entry_attachments' AND `module`='bx_posts' AND `name`='add-link';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_posts_view' AND `module`='bx_posts' AND `name`='edit-post';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_posts_view' AND `module`='bx_posts' AND `name`='delete-post';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_posts_view' AND `module`='bx_posts' AND `name`='approve';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_posts_view_actions' AND `module`='bx_posts' AND `name`='edit-post';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_posts_view_actions' AND `module`='bx_posts' AND `name`='delete-post';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_posts_view_actions' AND `module`='bx_posts' AND `name`='comment';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_posts_view_actions' AND `module`='bx_posts' AND `name`='reaction';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_posts_view_actions' AND `module`='bx_posts' AND `name`='score';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_posts_view_actions' AND `module`='bx_posts' AND `name`='favorite';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_posts_view_actions' AND `module`='bx_posts' AND `name`='feature';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_posts_view_actions' AND `module`='bx_posts' AND `name`='report';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_posts_my' AND `module`='bx_posts' AND `name`='create-post';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_posts_submenu' AND `module`='bx_posts' AND `name`='posts-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_posts_submenu' AND `module`='bx_posts' AND `name`='posts-popular';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_posts_submenu' AND `module`='bx_posts' AND `name`='posts-manage';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_posts_snippet_meta' AND `module`='bx_posts' AND `name`='author';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_posts_snippet_meta' AND `module`='bx_posts' AND `name`='date';
