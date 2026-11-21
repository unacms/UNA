-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The default guest splash (sys_site_splash_code), where a site still has these declarations:
--   * dark illustration colours follow the accent pair the site and the apps use in dark mode (blue-900 / blue-300, was blue-950 / blue-400);
--   * the text under the title is at most 36rem wide (about 68 characters a line at 18px; 48rem ran to about 90);
--   * its line height is unitless (1.5, 1.5556), so it scales with the text size.
-- Each REPLACE changes one exact declaration, so an edited splash keeps everything else, and a second run finds nothing to change.
UPDATE `sys_options` SET `value` = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(`value`,
    '--bx-landing-accent: #172554;', '--bx-landing-accent: #1e3a8a;'),
    '--bx-landing-accent-fg: #60a5fa;', '--bx-landing-accent-fg: #93c5fd;'),
    'max-width: 48rem;', 'max-width: 36rem;'),
    'line-height: 1.5rem;', 'line-height: 1.5;'),
    'line-height: 1.75rem;', 'line-height: 1.5556;')
WHERE `name` = 'sys_site_splash_code';
