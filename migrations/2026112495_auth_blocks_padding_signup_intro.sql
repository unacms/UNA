-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The sign-in and sign-up blocks get large padding (Studio > Pages > block > Padding), on their pages and on the home
-- page, whose rows the guest splash draws. Only where the padding is still Regular.
UPDATE `sys_pages_blocks` SET `padding_size`='large' WHERE `object` IN ('sys_login', 'sys_create_account', 'sys_home') AND `module`='system' AND `title` IN ('_sys_page_block_title_login', '_sys_page_block_title_create_account') AND `padding_size`='';

-- The Sign up page gets a block with the picture and the words the apps drew themselves, beside the form: the page
-- becomes two equal columns, its blocks move to the second one and the new block takes the first.
-- Only where the page is still the thin column it was installed as; a page an operator laid out differently is left
-- as it is. The layout changes last, so a run that stopped halfway starts over from here.
SET @bSignUpAsInstalled = (SELECT COUNT(*) FROM `sys_objects_page` WHERE `object`='sys_create_account' AND `module`='system' AND `layout_id`=18);

UPDATE `sys_pages_blocks` SET `cell_id`=2 WHERE `object`='sys_create_account' AND `cell_id`=1 AND `title`<>'_sys_page_block_title_create_account_intro' AND @bSignUpAsInstalled > 0;

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `tabs`, `async`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `active_api`, `order`)
SELECT 'sys_create_account', 1, 'system', '', '_sys_page_block_title_create_account_intro', 0, 0, 0, 2147483647, 'service', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:20:"create_account_intro";s:5:"class";s:19:"TemplServiceAccount";}', 0, 1, 1, 1, 1 FROM DUAL
WHERE @bSignUpAsInstalled > 0 AND NOT EXISTS (SELECT 1 FROM `sys_pages_blocks` WHERE `object`='sys_create_account' AND `title`='_sys_page_block_title_create_account_intro');

-- The apps draw the page from its blocks now, as the site does: the page's App config, which named their own layout,
-- is cleared where it is still the installed one (compared without spaces and line breaks).
UPDATE `sys_objects_page` SET `config_api`='' WHERE `object`='sys_create_account' AND `module`='system' AND @bSignUpAsInstalled > 0
    AND REPLACE(REPLACE(REPLACE(`config_api`, '\r', ''), '\n', ''), ' ', '') = '{layout:\'create-account\',blocks:{form_join:{name:\'system:create_account_form\',showTitle:false,showBg:false,},form_invitation:{name:\'bx_invites:get_block_form_request\',showTitle:false,showBg:false,},},}';

UPDATE `sys_objects_page` SET `layout_id`=4 WHERE `object`='sys_create_account' AND `module`='system' AND `layout_id`=18 AND @bSignUpAsInstalled > 0;
