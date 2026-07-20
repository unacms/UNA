-- PAGES: 

-- PAGES: config_api
UPDATE `sys_pages_blocks` SET `config_api`='{"content_type":"browse_simple"}' WHERE `object`='bx_albums_view_entry' AND `title`='_bx_albums_page_block_title_entry_attachments';

-- PAGES: active_api
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_albums_create_entry' AND `module`='bx_albums' AND `title_system`='' AND `title`='_bx_albums_page_block_title_create_entry';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_albums_add_images' AND `module`='bx_albums' AND `title_system`='' AND `title`='_bx_albums_page_block_title_add_images';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_albums_edit_entry' AND `module`='bx_albums' AND `title_system`='' AND `title`='_bx_albums_page_block_title_edit_entry';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_albums_delete_entry' AND `module`='bx_albums' AND `title_system`='' AND `title`='_bx_albums_page_block_title_delete_entry';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_albums_view_entry' AND `module`='bx_albums' AND `title_system`='' AND `title`='_bx_albums_page_block_title_entry_text';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_albums_view_entry' AND `module`='bx_albums' AND `title_system`='' AND `title`='_bx_albums_page_block_title_entry_attachments';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_albums_view_entry' AND `module`='bx_albums' AND `title_system`='' AND `title`='_bx_albums_page_block_title_entry_comments';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_albums_view_entry' AND `module`='bx_albums' AND `title_system`='' AND `title`='_bx_albums_page_block_title_entry_author';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_albums_view_entry' AND `module`='bx_albums' AND `title_system`='' AND `title`='_bx_albums_page_block_title_entry_info';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_albums_view_entry' AND `module`='bx_albums' AND `title_system`='' AND `title`='_bx_albums_page_block_title_entry_all_actions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_albums_view_media' AND `module`='bx_albums' AND `title_system`='' AND `title`='_bx_albums_page_block_title_entry_view_media';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_albums_view_media' AND `module`='bx_albums' AND `title_system`='' AND `title`='_bx_albums_page_block_title_entry_author';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_albums_view_media' AND `module`='bx_albums' AND `title_system`='' AND `title`='_bx_albums_page_block_title_entry_comments';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_albums_view_media' AND `module`='bx_albums' AND `title_system`='' AND `title`='_bx_albums_page_block_title_entry_view_media_exif';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_albums_view_media' AND `module`='bx_albums' AND `title_system`='' AND `title`='_bx_albums_page_block_title_entry_all_actions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_albums_view_media' AND `module`='bx_albums' AND `title_system`='' AND `title`='_bx_albums_page_block_title_featured_entries_view_gallery_media';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_albums_view_entry_comments' AND `module`='bx_albums' AND `title_system`='_bx_albums_page_block_title_entry_comments' AND `title`='_bx_albums_page_block_title_entry_comments_link';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_albums_popular' AND `module`='bx_albums' AND `title_system`='' AND `title`='_bx_albums_page_block_title_popular_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_albums_popular_media' AND `module`='bx_albums' AND `title_system`='' AND `title`='_bx_albums_page_block_title_popular_media';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_albums_top' AND `module`='bx_albums' AND `title_system`='' AND `title`='_bx_albums_page_block_title_top_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_albums_top_media' AND `module`='bx_albums' AND `title_system`='' AND `title`='_bx_albums_page_block_title_top_media';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_albums_author' AND `module`='bx_albums' AND `title_system`='' AND `title`='_bx_albums_page_block_title_entries_actions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_albums_author' AND `module`='bx_albums' AND `title_system`='_bx_albums_page_block_title_sys_favorites_of_author' AND `title`='_bx_albums_page_block_title_favorites_of_author';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_albums_author' AND `module`='bx_albums' AND `title_system`='_bx_albums_page_block_title_sys_favorites_of_author_media' AND `title`='_bx_albums_page_block_title_favorites_of_author_media';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_albums_author' AND `module`='bx_albums' AND `title_system`='_bx_albums_page_block_title_sys_entries_of_author' AND `title`='_bx_albums_page_block_title_entries_of_author';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_albums_author' AND `module`='bx_albums' AND `title_system`='_bx_albums_page_block_title_sys_entries_in_context' AND `title`='_bx_albums_page_block_title_entries_in_context';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_albums_favorites' AND `module`='bx_albums' AND `title_system`='_bx_albums_page_block_title_sys_favorites_entries' AND `title`='_bx_albums_page_block_title_favorites_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_albums_favorites' AND `module`='bx_albums' AND `title_system`='' AND `title`='_bx_albums_page_block_title_favorites_entries_info';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_albums_favorites' AND `module`='bx_albums' AND `title_system`='' AND `title`='_bx_albums_page_block_title_favorites_entries_actions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_albums_context' AND `module`='bx_albums' AND `title_system`='_bx_albums_page_block_title_sys_entries_in_context' AND `title`='_bx_albums_page_block_title_entries_in_context';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_albums_home' AND `module`='bx_albums' AND `title_system`='' AND `title`='_bx_albums_page_block_title_updated_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_albums_search' AND `module`='bx_albums' AND `title_system`='' AND `title`='_bx_albums_page_block_title_search_form';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_albums_search' AND `module`='bx_albums' AND `title_system`='' AND `title`='_bx_albums_page_block_title_search_results';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_albums_manage' AND `module`='bx_albums' AND `title_system`='_bx_albums_page_block_title_system_manage' AND `title`='_bx_albums_page_block_title_manage';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_albums_administration' AND `module`='bx_albums' AND `title_system`='_bx_albums_page_block_title_system_manage_administration' AND `title`='_bx_albums_page_block_title_manage';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_view_profile' AND `module`='bx_albums' AND `title_system`='_bx_albums_page_block_title_sys_my_entries' AND `title`='_bx_albums_page_block_title_my_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_persons_view_profile' AND `module`='bx_albums' AND `title_system`='_bx_albums_page_block_title_sys_my_entries' AND `title`='_bx_albums_page_block_title_my_entries';

-- MENUS:

-- MENUS: config_api

-- MENUS: active_api
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site' AND `module`='bx_albums' AND `name`='albums-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_add_content_links' AND `module`='bx_albums' AND `name`='create-album';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_profile_stats' AND `module`='bx_albums' AND `name`='profile-stats-my-albums';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view' AND `module`='bx_albums' AND `name`='add-images-to-album';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view' AND `module`='bx_albums' AND `name`='edit-album';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view' AND `module`='bx_albums' AND `name`='delete-album';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view' AND `module`='bx_albums' AND `name`='approve';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_actions' AND `module`='bx_albums' AND `name`='add-images-to-album';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_actions' AND `module`='bx_albums' AND `name`='edit-album';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_actions' AND `module`='bx_albums' AND `name`='delete-album';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_actions' AND `module`='bx_albums' AND `name`='approve';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_actions' AND `module`='bx_albums' AND `name`='view';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_actions' AND `module`='bx_albums' AND `name`='reaction';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_actions' AND `module`='bx_albums' AND `name`='score';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_actions' AND `module`='bx_albums' AND `name`='favorite';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_actions' AND `module`='bx_albums' AND `name`='feature';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_actions' AND `module`='bx_albums' AND `name`='repost';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_actions' AND `module`='bx_albums' AND `name`='report';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_actions' AND `module`='bx_albums' AND `name`='notes';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_actions' AND `module`='bx_albums' AND `name`='audit';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_actions' AND `module`='bx_albums' AND `name`='social-sharing';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_actions' AND `module`='bx_albums' AND `name`='more-auto';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_media' AND `module`='bx_albums' AND `name`='add-images-to-album';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_media' AND `module`='bx_albums' AND `name`='edit-album';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_media' AND `module`='bx_albums' AND `name`='edit-image';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_media' AND `module`='bx_albums' AND `name`='delete-image';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_media' AND `module`='bx_albums' AND `name`='move-image';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_actions_media' AND `module`='bx_albums' AND `name`='edit-image';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_actions_media' AND `module`='bx_albums' AND `name`='delete-image';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_actions_media' AND `module`='bx_albums' AND `name`='move-image';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_actions_media' AND `module`='bx_albums' AND `name`='view';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_actions_media' AND `module`='bx_albums' AND `name`='vote';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_actions_media' AND `module`='bx_albums' AND `name`='score';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_actions_media' AND `module`='bx_albums' AND `name`='favorite';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_actions_media' AND `module`='bx_albums' AND `name`='feature';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_actions_media' AND `module`='bx_albums' AND `name`='report';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_actions_media' AND `module`='bx_albums' AND `name`='social-sharing';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_actions_media' AND `module`='bx_albums' AND `name`='more-auto';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_actions_media_unit' AND `module`='bx_albums' AND `name`='comment';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_actions_media_unit' AND `module`='bx_albums' AND `name`='view';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_actions_media_unit' AND `module`='bx_albums' AND `name`='vote';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_actions_media_unit' AND `module`='bx_albums' AND `name`='score';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_actions_media_unit' AND `module`='bx_albums' AND `name`='favorite';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_actions_media_unit' AND `module`='bx_albums' AND `name`='feature';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_actions_media_unit' AND `module`='bx_albums' AND `name`='report';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_actions_media_unit' AND `module`='bx_albums' AND `name`='more-auto';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_my' AND `module`='bx_albums' AND `name`='create-album';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_submenu' AND `module`='bx_albums' AND `name`='albums-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_submenu' AND `module`='bx_albums' AND `name`='albums-popular';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_submenu' AND `module`='bx_albums' AND `name`='albums-top';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_submenu' AND `module`='bx_albums' AND `name`='albums-popular-media';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_submenu' AND `module`='bx_albums' AND `name`='albums-top-media';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_submenu' AND `module`='bx_albums' AND `name`='albums-search';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_submenu' AND `module`='bx_albums' AND `name`='albums-manage';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_submenu' AND `module`='bx_albums' AND `name`='view-album';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_view_submenu' AND `module`='bx_albums' AND `name`='view-album-comments';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_snippet_meta' AND `module`='bx_albums' AND `name`='date';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_albums_snippet_meta' AND `module`='bx_albums' AND `name`='author';
