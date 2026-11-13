-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The default email header shows the logo uploaded in Designer ({site_logo}, the site title when there is none) instead of the site title, in a darker grey that reaches 3:1.
UPDATE `sys_options` SET `value` = REPLACE(`value`, 'font-weight:bold; font-size:22px; color:#999;">{site_name}</div>', 'font-weight:bold; font-size:22px; color:#666;">{site_logo}</div>') WHERE `name` = 'site_email_html_template_header' AND `value` LIKE '%font-weight:bold; font-size:22px; color:#999;">{site_name}</div>%';
