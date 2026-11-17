-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The Contacts block gets a compact title (Studio > Pages > block: "Title size"), in the blocks list and wherever it
-- was placed. A size the site's admin has already chosen stays.
UPDATE `sys_pages_blocks` SET `title_size` = 'compact' WHERE `module` = 'bx_messenger' AND `title` = '_bx_messenger_page_block_contacts_title' AND `title_size` = '';
