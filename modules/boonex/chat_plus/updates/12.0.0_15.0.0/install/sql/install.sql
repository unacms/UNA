-- Studio page and widget

SET @iPageId = (SELECT `id` FROM `sys_std_pages` WHERE `name` = 'bx_chat_plus' LIMIT 1);
UPDATE `sys_std_widgets` SET `caption`='_bx_chat_plus_wgt_cpt', `cnt_actions`='a:4:{s:6:"module";s:12:"bx_chat_plus";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:6:"Module";}' WHERE `page_id`=@iPageId AND `module`='bx_chat_plus';
