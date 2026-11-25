-- UNA-Migration-Min-System-Version: 15.0.0-RC4

-- Market: the email a vendor gets when a product is used without a license (#6363), for a site where Market was enabled before.
INSERT INTO `sys_email_templates` (`Module`, `NameSystem`, `Name`, `Subject`, `Body`)
SELECT 'bx_market', '_bx_market_et_txt_name_unauthorized_purchase', 'bx_market_unauthorized_purchase', '_bx_market_et_txt_subject_unauthorized_purchase', '_bx_market_et_txt_body_unauthorized_purchase'
WHERE NOT EXISTS (SELECT 1 FROM `sys_email_templates` WHERE `Name` = 'bx_market_unauthorized_purchase');
