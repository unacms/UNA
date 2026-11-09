-- UNA-Migration-Min-System-Version: 15.0.0-RC3

-- enable.sql changes since RC3: visibility of the levels and leaderboard grids
UPDATE `sys_objects_grid` SET `visible_for_levels`=192 WHERE `object` IN ('bx_reputation_levels', 'bx_reputation_manage_leaderboard') AND `visible_for_levels`=2147483647;
