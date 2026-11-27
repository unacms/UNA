-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The agent chat's script (plugins_public/bundle.js: React and the chat, about 230 KB compressed) was a system
-- script, so every page of the site and of Studio loaded it in <head>. Only the AI agent chat block and
-- Studio > Agents use it, and both add it themselves now. Deleting the row twice is safe.
DELETE FROM `sys_preloader` WHERE `module` = 'system' AND `type` = 'js_system' AND `content` = 'bundle.js';
