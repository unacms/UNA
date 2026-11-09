-- UNA-Migration-Min-System-Version: 15.0.0-RC3

-- enable.sql of the update pack
-- MENUS
UPDATE `sys_menu_items` SET `icon`='folder-plus' WHERE `set_name`='bx_courses_view_actions_more' AND `module`='bx_courses' AND `name`='add-course-content' AND `icon`='plus';
UPDATE `sys_menu_items` SET `icon`='folder-open' WHERE `set_name`='bx_courses_view_actions_more' AND `module`='bx_courses' AND `name`='edit-course-content' AND `icon`='folder-tree';

-- enable-app.sql changes since RC3 (NEO flags); a block that left the app is switched off
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site' AND `module`='bx_courses' AND `name`='courses-home';
