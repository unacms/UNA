-- PAGES: config_api
UPDATE `sys_objects_page` SET `config_api`='{\r\n    layout: \'post\',\r\n    top: true,\r\n    blocks: {\r\n        author: {\r\n            name: \'bx_ads:entity_author\',\r\n            showTitle: false,\r\n            showBg: false,\r\n            forList: true,\r\n            forHeader: true,\r\n        },\r\n        text: {\r\n            name: \'bx_ads:entity_text_block\',\r\n            showTitle: false,\r\n            showBg: false,\r\n            forList: true,\r\n        },\r\n        attachments: {\r\n            name: \'bx_ads:entity_attachments\',\r\n            showTitle: false,\r\n            showBg: false,\r\n            forList: true,\r\n        },\r\n        actions: {\r\n            name: \'bx_ads:entity_all_actions\',\r\n            showTitle: false,\r\n            showBg: false,\r\n            forList: true,\r\n        },\r\n        \'comments-empty\': {\r\n            name: \'static:comments_empty\',\r\n            showTitle: false,\r\n            showBg: false,\r\n            forList: true,\r\n        },\r\n        comments: {\r\n            name: \'bx_ads:entity_reviews\',\r\n            showTitle: false,\r\n            showBg: false,\r\n        },\r\n    },\r\n    headerSettings: {\r\n        footer: false,\r\n    },\r\n}' WHERE `object`='bx_ads_view_entry';

-- PAGES: active_api
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_create_entry' AND `module`='bx_ads' AND `title_system`='' AND `title`='_bx_ads_page_block_title_create_entry';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_edit_entry' AND `module`='bx_ads' AND `title_system`='' AND `title`='_bx_ads_page_block_title_edit_entry';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_delete_entry' AND `module`='bx_ads' AND `title_system`='' AND `title`='_bx_ads_page_block_title_delete_entry';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_view_entry' AND `module`='bx_ads' AND `title_system`='' AND `title`='_bx_ads_page_block_title_entry_breadcrumb';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_view_entry' AND `module`='bx_ads' AND `title_system`='' AND `title`='_bx_ads_page_block_title_entry_author';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_view_entry' AND `module`='bx_ads' AND `title_system`='' AND `title`='_bx_ads_page_block_title_entry_text';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_view_entry' AND `module`='bx_ads' AND `title_system`='' AND `title`='_bx_ads_page_block_title_entry_all_actions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_view_entry' AND `module`='bx_ads' AND `title_system`='' AND `title`='_bx_ads_page_block_title_entry_attachments';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_view_entry' AND `module`='bx_ads' AND `title_system`='' AND `title`='_bx_ads_page_block_title_entry_reviews';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_view_entry' AND `module`='bx_ads' AND `title_system`='' AND `title`='_bx_ads_page_block_title_entry_offer_accepted';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_view_entry' AND `module`='bx_ads' AND `title_system`='_bx_ads_page_block_title_sys_entry_context' AND `title`='_bx_ads_page_block_title_entry_context';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_view_entry' AND `module`='bx_ads' AND `title_system`='' AND `title`='_bx_ads_page_block_title_entry_info';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_view_entry' AND `module`='bx_ads' AND `title_system`='' AND `title`='_bx_ads_page_block_title_entry_reviews_rating';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_view_entry' AND `module`='bx_ads' AND `title_system`='' AND `title`='_bx_ads_page_block_title_entry_location';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_view_entry' AND `module`='bx_ads' AND `title_system`='' AND `title`='_bx_ads_page_block_title_entry_polls';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_view_entry' AND `module`='bx_ads' AND `title_system`='' AND `title`='_bx_ads_page_block_title_featured_entries_view_extended';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_view_entry' AND `module`='bx_ads' AND `title_system`='' AND `title`='_bx_ads_page_block_title_entry_reports';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_view_entry_comments' AND `module`='bx_ads' AND `title_system`='_bx_ads_page_block_title_entry_comments' AND `title`='_bx_ads_page_block_title_entry_comments_link';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_popular' AND `module`='bx_ads' AND `title_system`='' AND `title`='_bx_ads_page_block_title_popular_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_updated' AND `module`='bx_ads' AND `title_system`='' AND `title`='_bx_ads_page_block_title_updated_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_categories' AND `module`='bx_ads' AND `title_system`='' AND `title`='_bx_ads_page_block_title_categories';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_categories' AND `module`='bx_ads' AND `title_system`='' AND `title`='_bx_ads_page_block_title_entries_by_category';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_author' AND `module`='bx_ads' AND `title_system`='' AND `title`='_bx_ads_page_block_title_entries_actions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_author' AND `module`='bx_ads' AND `title_system`='_bx_ads_page_block_title_sys_favorites_of_author' AND `title`='_bx_ads_page_block_title_favorites_of_author';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_author' AND `module`='bx_ads' AND `title_system`='_bx_ads_page_block_title_sys_entries_of_author' AND `title`='_bx_ads_page_block_title_entries_of_author';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_author' AND `module`='bx_ads' AND `title_system`='_bx_ads_page_block_title_sys_entries_in_context' AND `title`='_bx_ads_page_block_title_entries_in_context';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_favorites' AND `module`='bx_ads' AND `title_system`='' AND `title`='_bx_ads_page_block_title_favorites_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_favorites' AND `module`='bx_ads' AND `title_system`='' AND `title`='_bx_ads_page_block_title_favorites_entries_info';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_favorites' AND `module`='bx_ads' AND `title_system`='' AND `title`='_bx_ads_page_block_title_favorites_entries_actions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_context' AND `module`='bx_ads' AND `title_system`='_bx_ads_page_block_title_sys_entries_in_context' AND `title`='_bx_ads_page_block_title_entries_in_context';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_home' AND `module`='bx_ads' AND `title_system`='' AND `title`='_bx_ads_page_block_title_recent_entries_view_extended';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_search' AND `module`='bx_ads' AND `title_system`='' AND `title`='_bx_ads_page_block_title_search_form';
UPDATE `sys_pages_blocks` SET `config_api`='{"use_as_filter":true}' WHERE `object`='bx_ads_search' AND `module`='bx_ads' AND `title_system`='' AND `title`='_bx_ads_page_block_title_search_form';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_search' AND `module`='bx_ads' AND `title_system`='' AND `title`='_bx_ads_page_block_title_search_results';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_manage' AND `module`='bx_ads' AND `title_system`='_bx_ads_page_block_title_system_manage' AND `title`='_bx_ads_page_block_title_manage';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_administration' AND `module`='bx_ads' AND `title_system`='_bx_ads_page_block_title_system_manage_administration' AND `title`='_bx_ads_page_block_title_manage';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_licenses' AND `module`='bx_ads' AND `title_system`='' AND `title`='_bx_ads_page_block_title_licenses_note';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_licenses' AND `module`='bx_ads' AND `title_system`='' AND `title`='_bx_ads_page_block_title_licenses';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_licenses_administration' AND `module`='bx_ads' AND `title_system`='' AND `title`='_bx_ads_page_block_title_licenses_administration';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_offers' AND `module`='bx_ads' AND `title_system`='' AND `title`='_bx_ads_page_block_title_entry_breadcrumb';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_offers' AND `module`='bx_ads' AND `title_system`='' AND `title`='_bx_ads_page_block_title_offers';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_ads_offers_all' AND `module`='bx_ads' AND `title_system`='' AND `title`='_bx_ads_page_block_title_offers_all';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_persons_view_profile' AND `module`='bx_ads' AND `title_system`='_bx_ads_page_block_title_sys_my_entries' AND `title`='_bx_ads_page_block_title_my_entries';


-- MENUS:

-- MENUS: config_api

-- MENUS: active_api
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site' AND `module`='bx_ads' AND `name`='ads-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_homepage' AND `module`='bx_ads' AND `name`='ads-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_add_content_links' AND `module`='bx_ads' AND `name`='create-ad';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_profile_stats' AND `module`='bx_ads' AND `name`='profile-stats-my-ads';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_dashboard_manage_tools' AND `module`='bx_ads' AND `name`='ads-administration';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_ads_entry_attachments' AND `module`='bx_ads' AND `name`='photo_html5';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_ads_entry_attachments' AND `module`='bx_ads' AND `name`='video_html5';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_ads_entry_attachments' AND `module`='bx_ads' AND `name`='record_video';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_ads_entry_attachments' AND `module`='bx_ads' AND `name`='file_html5';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_ads_entry_attachments' AND `module`='bx_ads' AND `name`='poll';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_ads_view' AND `module`='bx_ads' AND `name`='interested';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_ads_view' AND `module`='bx_ads' AND `name`='add-to-cart';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_ads_view' AND `module`='bx_ads' AND `name`='make-offer';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_ads_view' AND `module`='bx_ads' AND `name`='view-offers';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_ads_view' AND `module`='bx_ads' AND `name`='edit-ad';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_ads_view' AND `module`='bx_ads' AND `name`='delete-ad';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_ads_view' AND `module`='bx_ads' AND `name`='approve';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_ads_view' AND `module`='bx_ads' AND `name`='shipped';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_ads_view' AND `module`='bx_ads' AND `name`='received';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_ads_view_actions' AND `module`='bx_ads' AND `name`='edit-ad';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_ads_view_actions' AND `module`='bx_ads' AND `name`='delete-ad';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_ads_view_actions' AND `module`='bx_ads' AND `name`='received';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_ads_my' AND `module`='bx_ads' AND `name`='create-ad';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_ads_submenu' AND `module`='bx_ads' AND `name`='ads-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_ads_submenu' AND `module`='bx_ads' AND `name`='ads-popular';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_ads_submenu' AND `module`='bx_ads' AND `name`='ads-categories';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_ads_submenu' AND `module`='bx_ads' AND `name`='ads-search';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_ads_submenu' AND `module`='bx_ads' AND `name`='ads-manage';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_ads_snippet_meta' AND `module`='bx_ads' AND `name`='date';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_ads_snippet_meta' AND `module`='bx_ads' AND `name`='author';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_ads_snippet_meta' AND `module`='bx_ads' AND `name`='category';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_ads_snippet_meta' AND `module`='bx_ads' AND `name`='price';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_ads_licenses_submenu' AND `module`='bx_ads' AND `name`='ads-licenses-administration';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_ads_licenses_submenu' AND `module`='bx_ads' AND `name`='ads-licenses';
