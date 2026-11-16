-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The home page's menu block (the grid of sections) is for guests: members get their own home (Create post, the feed).
-- A site that changed who sees it keeps its choice.
UPDATE `sys_pages_blocks` SET `visible_for_levels`=1 WHERE `object`='sys_home' AND `module`='system' AND `type`='menu' AND `content`='sys_homepage' AND `visible_for_levels`=2147483647;
