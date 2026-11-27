-- UNA-Migration-Min-System-Version: 15.0.0-RC3

-- install.sql of the update pack. Moves the checkout marker from `order` to `type`; the second run finds nothing to move.
SET @sName = 'bx_credits';

-- TABLES
UPDATE `bx_credits_history` SET `order`=`type`, `type`='checkout' WHERE `order`='checkout';

-- enable-app.sql changes since RC3 (NEO flags); a block that left the app is switched off
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site' AND `module`='bx_credits' AND `name`='credits-home';
