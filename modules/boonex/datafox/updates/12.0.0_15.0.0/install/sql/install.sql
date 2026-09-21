-- Studio page and widget

SET @iPageId = (SELECT `id` FROM `sys_std_pages` WHERE `name` = 'bx_datafox' LIMIT 1);
UPDATE `sys_std_widgets` SET `caption`='_bx_datafox_wgt_cpt', `cnt_actions`='a:4:{s:6:"module";s:10:"bx_datafox";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:6:"Module";}' WHERE `page_id`=@iPageId AND `module`='bx_datafox';
