-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The Workspace card of "Create your profile" gets a description, as Person and Organization have.
UPDATE `sys_menu_items` SET `info` = '_bx_workspaces_menu_item_info_create_profile' WHERE `set_name` = 'sys_add_profile_links' AND `module` = 'bx_workspaces' AND `name` = 'create-workspaces-profile' AND `info` = '';
