-- OPTIONS
UPDATE `bx_payment_providers_options` SET `type`='secret' WHERE `name` IN (
    'pp_token',
    'pp_api_live_secret', 'pp_api_test_secret',
    'cbee_live_api_key', 'cbee_test_api_key',
    'cbee_v3_live_api_key', 'cbee_v3_test_api_key',
    'strp_live_sec_key', 'strp_test_sec_key',
    'strp_v3_live_sec_key', 'strp_v3_test_sec_key',
    'aina_secret'
);


-- GRIDS
UPDATE `sys_grid_fields` SET `width`='5%' WHERE `object`='bx_payment_grid_cart' AND `name`='checkbox';
UPDATE `sys_grid_fields` SET `width`='45%' WHERE `object`='bx_payment_grid_cart' AND `name`='description';
UPDATE `sys_grid_fields` SET `width`='5%' WHERE `object`='bx_payment_grid_cart' AND `name`='price_single';
UPDATE `sys_grid_fields` SET `width`='10%' WHERE `object`='bx_payment_grid_cart' AND `name`='actions';
