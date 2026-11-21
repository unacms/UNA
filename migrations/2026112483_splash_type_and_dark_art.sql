-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The default guest splash (sys_site_splash_code), only where a site still has the default code unchanged (its MD5):
--   * dark illustration colours follow the accent pair the site and the apps use in dark mode (blue-900 / blue-300, was blue-950 / blue-400);
--   * the text under the title is at most 36rem wide (about 68 characters a line at 18px; 48rem ran to about 90);
--   * its line height is unitless (1.5, 1.5556), so it scales with the text size.
-- A splash an operator edited is left as it is. After the update the MD5 no longer matches, so a second run changes nothing.
UPDATE `sys_options` SET `value` = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(`value`,
    '--bx-landing-accent: #172554;', '--bx-landing-accent: #1e3a8a;'),
    '--bx-landing-accent-fg: #60a5fa;', '--bx-landing-accent-fg: #93c5fd;'),
    'max-width: 48rem;', 'max-width: 36rem;'),
    'line-height: 1.5rem;', 'line-height: 1.5;'),
    'line-height: 1.75rem;', 'line-height: 1.5556;')
WHERE `name` = 'sys_site_splash_code' AND MD5(`value`) = '98da721ddee0f7ab9061442964938017';
