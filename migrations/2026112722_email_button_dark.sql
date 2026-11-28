-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Email header: in dark mode a button's label took the panel's link colour (`.bx-email-panel a` outranks
-- `.bx-email-btn`) and disappeared on the light button. Only sites whose header has the default dark button rule.
UPDATE `sys_options` SET `value` = REPLACE(`value`, '.bx-email-btn { background-color:#f4f4f5 !important; color:#18181b !important; }', '.bx-email-btn { background-color:#f4f4f5 !important; color:#18181b !important; }\r\n    .bx-email-panel a.bx-email-btn { color:#18181b !important; }') WHERE `name` = 'site_email_html_template_header' AND `value` LIKE '%.bx-email-btn { background-color:#f4f4f5 !important; color:#18181b !important; }%' AND `value` NOT LIKE '%.bx-email-panel a.bx-email-btn%';
