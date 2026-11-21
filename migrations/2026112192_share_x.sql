-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Share: Twitter is X, and its share link opens X's own composer.
UPDATE `sys_menu_items` SET `link` = 'https://x.com/intent/post?url={url_encoded}' WHERE `set_name` = 'sys_social_sharing' AND `name` = 'social-sharing-twitter' AND `link` = 'https://twitter.com/share?url={url_encoded}';
