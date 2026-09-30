-- OPTIONS
UPDATE `sys_options` SET `type`='secret' WHERE `name`='bx_stripe_connect_api_secret_live';
UPDATE `sys_options` SET `type`='secret' WHERE `name`='bx_stripe_connect_api_secret_test';
