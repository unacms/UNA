-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Artificer's "Page width" now follows Designer (Designer > Settings > Header, per page layout and audience) when it
-- is empty, as Header width and Main menu alignment do. Designer's widths start as Artificer's
-- (migrations/2026111884_header_layout_options.sql), so the setting is emptied where it is the same and the site keeps
-- its width. Running it again changes nothing: an empty setting is not Designer's width.
SET @sDesignerWidth = (SELECT `value` FROM `sys_options` WHERE `name` = 'sys_page_width_standard_visitor' LIMIT 1);

UPDATE `sys_options` SET `value` = '' WHERE `name` = 'bx_artificer_page_width' AND `value` = @sDesignerWidth;
