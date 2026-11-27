-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The friend and follow suggestions get a compact title (Studio > Pages > block: "Title size"), in the blocks list and
-- in the home page's sidebar. A size the site's admin has already chosen stays.
UPDATE `sys_pages_blocks` SET `title_size` = 'compact' WHERE `object` IN ('', 'sys_home') AND `module` = 'system' AND `title` IN ('_sys_page_block_title_recom_friends', '_sys_page_block_title_recom_subscriptions') AND `title_size` = '';
