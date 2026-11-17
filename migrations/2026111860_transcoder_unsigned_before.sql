-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- image_transcoder.php serves only signed links since 15.0.0-RC4, and editors saved unsigned links in the texts
-- of posts before that. Public files of the editor storages uploaded before this time keep working without a
-- signature (BxDolTranscoder::isUnsignedHandlerAllowed). A site installed with signed links has 0 here from
-- install SQL. sys_options has a unique key on the name, so INSERT IGNORE is safe to run again and keeps the
-- time of the first run.
INSERT IGNORE INTO `sys_options` (`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_params`, `check_error`, `order`)
SELECT `id`, 'sys_transcoder_unsigned_before', '_adm_stg_cpt_option_sys_transcoder_unsigned_before', UNIX_TIMESTAMP(), 'digit', '', '', '', '', 9
FROM `sys_options_categories` WHERE `name` = 'hidden';
