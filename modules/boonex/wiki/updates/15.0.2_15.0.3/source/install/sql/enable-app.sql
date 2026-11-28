-- PAGES: config_api

-- PAGES: active_api
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_wiki_home' AND `module`='bx_wiki' AND `title_system`='' AND `title`='_bx_wiki_block_home';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_wiki_missing_translations' AND `module`='bx_wiki' AND `title_system`='' AND `title`='_bx_wiki_block_missing_translations';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_wiki_outdated_translations' AND `module`='bx_wiki' AND `title_system`='' AND `title`='_bx_wiki_block_outdated_translations';


-- MENUS:

-- MENUS: config_api

-- MENUS: active_api
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site' AND `module`='bx_wiki' AND `name`='wiki-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_homepage' AND `module`='bx_wiki' AND `name`='wiki-home';
