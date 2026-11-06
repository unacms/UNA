-- UNA-Migration-Min-System-Version: 15.0.0-RC3
-- Google Connect: additional allowed Client IDs setting. sys_options has a unique key on the
-- name, so INSERT IGNORE is safe to run again and leaves an admin's own value alone.
INSERT IGNORE INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `order`, `extra`)
SELECT 'bx_googlecon_client_ids', '', `id`, '_bx_googlecon_option_client_ids', 'digit', '', '', 30, ''
FROM `sys_options_categories` WHERE `name` = 'bx_googlecon_general';
