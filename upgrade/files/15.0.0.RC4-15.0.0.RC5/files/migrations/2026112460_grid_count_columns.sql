-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Studio grids: the columns that show a count (a menu's items, a level's actions, a form's fields) say so in their
-- params, so the grid makes them as wide as their capsule (BxBaseGrid::_getColumnKind). Only where params are empty.
UPDATE `sys_grid_fields` SET `params` = 'a:1:{s:4:"kind";s:5:"count";}' WHERE `params` = '' AND (
       (`object` = 'sys_studio_nav_menus' AND `name` = 'items')
    OR (`object` = 'sys_studio_nav_sets' AND `name` = 'items')
    OR (`object` = 'sys_studio_acl' AND `name` = 'ActionsList')
    OR (`object` = 'sys_studio_roles' AND `name` = 'actions_list')
    OR (`object` = 'sys_studio_groups_roles' AND `name` = 'actions_list')
    OR (`object` = 'sys_studio_forms_displays' AND `name` = 'fields')
    OR (`object` = 'sys_studio_search_forms' AND `name` IN ('fields', 'sortable_fields'))
    OR (`object` = 'sys_studio_labels' AND `name` = 'items')
);
