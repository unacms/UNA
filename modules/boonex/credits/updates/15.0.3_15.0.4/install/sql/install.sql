SET @sName = 'bx_credits';

-- TABLES
UPDATE `bx_credits_history` SET `order`=`type`, `type`='checkout' WHERE `order`='checkout';
