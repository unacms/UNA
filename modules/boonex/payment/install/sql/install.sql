SET @sName = 'bx_payment';


-- TABLES
CREATE TABLE IF NOT EXISTS `bx_payment_currencies` (
  `id` int(11) NOT NULL auto_increment,
  `code` varchar(4) NOT NULL default '',
  `rate` float NOT NULL default '0',
  PRIMARY KEY(`id`),
  UNIQUE KEY `code`(`code`)
);

CREATE TABLE IF NOT EXISTS `bx_payment_providers` (
  `id` int(11) NOT NULL auto_increment,
  `name` varchar(64) NOT NULL default '',
  `caption` varchar(128) NOT NULL default '',
  `description` varchar(128) NOT NULL default '',
  `option_prefix` varchar(32) NOT NULL default '',
  `for_visitor` tinyint(4) NOT NULL default '0',
  `for_owner_only` tinyint(4) NOT NULL default '0',
  `for_single` tinyint(4) NOT NULL default '0',
  `for_recurring` tinyint(4) NOT NULL default '0',
  `single_seller` tinyint(4) NOT NULL default '0',
  `time_tracker` tinyint(4) NOT NULL default '0',
  `active` tinyint(4) NOT NULL default '0',
  `order` tinyint(4) NOT NULL default '0',
  `class_name` varchar(128) NOT NULL default '',
  `class_file` varchar(255) NOT NULL  default '',
  PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `bx_payment_providers_options` (
  `id` int(11) NOT NULL auto_increment,
  `provider_id` varchar(64) NOT NULL default '',
  `name` varchar(64) NOT NULL default '',
  `type` varchar(64) NOT NULL default 'text',
  `value` varchar(255) NOT NULL default '',
  `caption` varchar(255) NOT NULL default '',
  `description` text NOT NULL default '',
  `extra` varchar(255) NOT NULL default '',
  `check_type` varchar(64) NOT NULL default '',
  `check_params` varchar(128) NOT NULL default '',
  `check_error` varchar(128) NOT NULL default '',
  `extended` tinyint(4) NOT NULL default '0',
  `order` tinyint(4) NOT NULL default '0',
  PRIMARY KEY(`id`),
  UNIQUE KEY `name`(`name`)
);

CREATE TABLE IF NOT EXISTS `bx_payment_user_values` (
  `id` int(11) NOT NULL auto_increment,
  `user_id` int(11) NOT NULL default '0',
  `option_id` int(11) NOT NULL default '0',  
  `value` varchar(255) NOT NULL default '',
  PRIMARY KEY(`id`),
  UNIQUE KEY `value`(`user_id`, `option_id`)
);

CREATE TABLE IF NOT EXISTS `bx_payment_cart` (
  `client_id` int(11) NOT NULL default '0',
  `items` text NOT NULL default '',
  `customs` text NOT NULL default '',
  PRIMARY KEY(`client_id`)
);

CREATE TABLE IF NOT EXISTS `bx_payment_transactions` (
  `id` int(11) NOT NULL auto_increment,
  `pending_id` int(11) NOT NULL default '0',
  `client_id` int(11) NOT NULL default '0',
  `seller_id` int(11) NOT NULL default '0',
  `author_id` int(11) NOT NULL default '0',
  `module_id` int(11) NOT NULL default '0',  
  `item_id` int(11) NOT NULL default '0',
  `item_count` int(11) NOT NULL default '0',
  `amount` float NOT NULL default '0',
  `currency` varchar(4) NOT NULL default '',
  `license` varchar(16) NOT NULL default '',
  `date` int(11) NOT NULL default '0',
  `new` tinyint(1) NOT NULL default '1',
  PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `bx_payment_subscriptions` (
  `id` int(11) NOT NULL auto_increment,
  `pending_id` int(11) NOT NULL default '0',
  `customer_id` varchar(32) NOT NULL default '',
  `subscription_id` varchar(32) NOT NULL default '',
  `period` int(11) unsigned NOT NULL default '1',
  `period_unit` varchar(32) NOT NULL default '',
  `trial` int(11) unsigned NOT NULL default '0',
  `date_add` int(11) NOT NULL default '0',
  `date_next` int(11) NOT NULL default '0',
  `pay_attempts` tinyint(4) NOT NULL default '0',
  `status` varchar(32) NOT NULL default 'unpaid',
  PRIMARY KEY(`id`),
  UNIQUE KEY `pending_id` (`pending_id`)
);

CREATE TABLE IF NOT EXISTS `bx_payment_subscriptions_deleted` (
  `id` int(11) NOT NULL auto_increment,
  `pending_id` int(11) NOT NULL default '0',
  `customer_id` varchar(32) NOT NULL default '',
  `subscription_id` varchar(32) NOT NULL default '',
  `period` int(11) unsigned NOT NULL default '1',
  `period_unit` varchar(32) NOT NULL default '',
  `trial` int(11) unsigned NOT NULL default '0',
  `date_add` int(11) NOT NULL default '0',
  `date_next` int(11) NOT NULL default '0',
  `pay_attempts` tinyint(4) NOT NULL default '0',
  `status` varchar(32) NOT NULL default 'unpaid',
  `reason` varchar(255) NOT NULL default '',
  `deleted` int(11) NOT NULL default '0',
  PRIMARY KEY(`id`),
  UNIQUE KEY `pending_id` (`pending_id`)
);

CREATE TABLE IF NOT EXISTS `bx_payment_transactions_pending` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `client_id` int(11) NOT NULL default '0',
  `seller_id` int(11) NOT NULL default '0',
  `type` varchar(16) NOT NULL default 'single',
  `provider` varchar(32) NOT NULL default '',
  `items` text NOT NULL default '',
  `customs` text NOT NULL default '',
  `amount` float NOT NULL default '0',
  `currency` varchar(4) NOT NULL default '',
  `order` varchar(32) NOT NULL default '',
  `data` text NOT NULL,
  `error_code` varchar(16) NOT NULL default '',
  `error_msg` varchar(255) NOT NULL default '',
  `date` int(11) NOT NULL default '0',
  `authorized` tinyint(4) NOT NULL default '0',
  `processed` tinyint(4) NOT NULL default '0',
  PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `bx_payment_modules` (
  `id` int(11) NOT NULL auto_increment,
  `name` varchar(32) NOT NULL default '',
  PRIMARY KEY(`id`),
  UNIQUE KEY `uri`(`name`)
);

INSERT INTO `bx_payment_modules`(`name`) VALUES
(@sName);

CREATE TABLE IF NOT EXISTS `bx_payment_commissions` (
  `id` int(11) NOT NULL auto_increment,
  `name` varchar(64) NOT NULL default '',
  `caption` varchar(128) NOT NULL default '',
  `description` varchar(128) NOT NULL default '',
  `acl_id` int(11) NOT NULL default '0',
  `percentage` float NOT NULL default '0',
  `installment` float NOT NULL default '0',
  `active` tinyint(4) NOT NULL default '0',
  `order` tinyint(4) NOT NULL default '0',
  PRIMARY KEY(`id`),
  UNIQUE KEY `name`(`name`)
);

CREATE TABLE IF NOT EXISTS `bx_payment_invoices` (
  `id` int(11) NOT NULL auto_increment,
  `name` varchar(64) NOT NULL default '',
  `commissionaire_id` varchar(32) NOT NULL default '',
  `committent_id` varchar(32) NOT NULL default '',
  `amount` float NOT NULL default '0',
  `currency` varchar(4) NOT NULL default '',
  `period_start` int(11) NOT NULL default '0',
  `period_end` int(11) NOT NULL default '0',
  `date_issue` int(11) NOT NULL default '0',
  `date_due` int(11) NOT NULL default '0',
  `status` varchar(32) NOT NULL default 'unpaid',
  `ntf_exp` tinyint(4) NOT NULL default '0',
  `ntf_due` tinyint(4) NOT NULL default '0',
  PRIMARY KEY(`id`),
  UNIQUE KEY `name`(`name`)
);

CREATE TABLE IF NOT EXISTS `bx_payment_stripe_payments_pending` (
  `id` int(11) NOT NULL auto_increment,
  `subscription_id` varchar(32) NOT NULL default '',
  `amount` float NOT NULL default '0',
  `currency` varchar(4) NOT NULL default '',
  PRIMARY KEY(`id`),
  UNIQUE KEY `subscription_id` (`subscription_id`)
);

-- Generic payment provider
INSERT INTO `bx_payment_providers`(`name`, `caption`, `description`, `option_prefix`, `for_visitor`, `for_single`, `for_recurring`, `single_seller`, `time_tracker`, `active`, `order`, `class_name`) VALUES
('generic', '_bx_payment_gc_cpt', '_bx_payment_gc_dsc', 'gc_', 0, 0, 0, 0, 0, 0, 0, 'BxPaymentProviderGeneric');
SET @iProviderId = LAST_INSERT_ID();

INSERT INTO `bx_payment_providers_options`(`provider_id`, `name`, `type`, `caption`, `description`, `extra`, `check_type`, `check_params`, `check_error`, `order`) VALUES
(@iProviderId, 'gc_currency_code', 'select', '_bx_payment_gc_currency_code_cpt', '_bx_payment_gc_currency_code_dsc', 'a:2:{s:6:"module";s:10:"bx_payment";s:6:"method";s:34:"get_options_personal_currency_code";}', '', '', '', 1);

-- Offline payment provider
INSERT INTO `bx_payment_providers`(`name`, `caption`, `description`, `option_prefix`, `for_visitor`, `for_single`, `for_recurring`, `single_seller`, `time_tracker`, `active`, `order`, `class_name`) VALUES
('offline', '_bx_payment_off_cpt', '_bx_payment_off_dsc', 'off_', 0, 1, 0, 0, 0, 1, 5, 'BxPaymentProviderOffline');
SET @iProviderId = LAST_INSERT_ID();

INSERT INTO `bx_payment_providers_options`(`provider_id`, `name`, `type`, `caption`, `description`, `extra`, `check_type`, `check_params`, `check_error`, `order`) VALUES
(@iProviderId, 'off_active', 'checkbox', '_bx_payment_off_active_cpt', '_bx_payment_off_active_dsc', '', '', '', '', 1),
(@iProviderId, 'off_checkout_email', 'text', '_bx_payment_off_checkout_email_cpt', '_bx_payment_off_checkout_email_dsc', '', 'EmailOrEmpty', '', '_sys_form_account_input_email_error', 2);


-- Credits payment provider
INSERT INTO `bx_payment_providers`(`name`, `caption`, `description`, `option_prefix`, `for_visitor`, `for_single`, `for_recurring`, `single_seller`, `time_tracker`, `active`, `order`, `class_name`) VALUES
('credits', '_bx_payment_cdt_cpt', '_bx_payment_cdt_dsc', 'cdt_', 0, 1, 1, 1, 1, 1, 6, 'BxPaymentProviderCredits');
SET @iProviderId = LAST_INSERT_ID();

INSERT INTO `bx_payment_providers_options`(`provider_id`, `name`, `type`, `caption`, `description`, `extra`, `check_type`, `check_params`, `check_error`, `order`) VALUES
(@iProviderId, 'cdt_active', 'checkbox', '_bx_payment_cdt_active_cpt', '_bx_payment_cdt_active_dsc', '', '', '', '', 1);


-- PayPal payment provider
INSERT INTO `bx_payment_providers`(`name`, `caption`, `description`, `option_prefix`, `for_visitor`, `for_single`, `for_recurring`, `single_seller`, `active`, `order`, `class_name`) VALUES
('paypal', '_bx_payment_pp_cpt', '_bx_payment_pp_dsc', 'pp_', 1, 1, 0, 1, 1, 10, 'BxPaymentProviderPayPal');
SET @iProviderId = LAST_INSERT_ID();

INSERT INTO `bx_payment_providers_options`(`provider_id`, `name`, `type`, `caption`, `description`, `extra`, `check_type`, `check_params`, `check_error`, `order`) VALUES
(@iProviderId, 'pp_active', 'checkbox', '_bx_payment_pp_active_cpt', '_bx_payment_pp_active_dsc', '', '', '', '', 1),
(@iProviderId, 'pp_mode', 'select', '_bx_payment_pp_mode_cpt', '_bx_payment_pp_mode_dsc', '1|_bx_payment_pp_mode_live,2|_bx_payment_pp_mode_test', '', '', '', 2),
(@iProviderId, 'pp_business', 'text', '_bx_payment_pp_business_cpt', '_bx_payment_pp_business_dsc', '', 'EmailOrEmpty', '', '_bx_payment_form_input_email_err_cor_or_emp', 3),
(@iProviderId, 'pp_prc_type', 'select', '_bx_payment_pp_prc_type_cpt', '_bx_payment_pp_prc_type_dsc', '1|_bx_payment_pp_prc_type_direct,2|_bx_payment_pp_prc_type_pdt,3|_bx_payment_pp_prc_type_ipn', '', '', '', 4),
(@iProviderId, 'pp_token', 'text', '_bx_payment_pp_token_cpt', '_bx_payment_pp_token_dsc', '', '', '', '', 5),
(@iProviderId, 'pp_sandbox', 'text', '_bx_payment_pp_sandbox_cpt', '_bx_payment_pp_sandbox_dsc', '', 'EmailOrEmpty', '', '_bx_payment_form_input_email_err_cor_or_emp', 6),
(@iProviderId, 'pp_return_data_url', 'value', '_bx_payment_pp_return_data_url_cpt', '', '', '', '', '', 7);

-- PayPal API payment provider
INSERT INTO `bx_payment_providers`(`name`, `caption`, `description`, `option_prefix`, `for_visitor`, `for_single`, `for_recurring`, `single_seller`, `active`, `order`, `class_name`) VALUES
('paypal_api', '_bx_payment_pp_api_cpt', '_bx_payment_pp_api_dsc', 'pp_api_', 1, 1, 1, 1, 1, 15, 'BxPaymentProviderPayPalApi');
SET @iProviderId = LAST_INSERT_ID();

INSERT INTO `bx_payment_providers_options`(`provider_id`, `name`, `type`, `caption`, `description`, `extra`, `check_type`, `check_params`, `check_error`, `order`) VALUES
(@iProviderId, 'pp_api_active', 'checkbox', '_bx_payment_pp_api_active_cpt', '_bx_payment_pp_api_active_dsc', '', '', '', '', 1),
(@iProviderId, 'pp_api_hidden', 'checkbox', '_bx_payment_pp_api_hidden_cpt', '_bx_payment_pp_api_hidden_dsc', '', '', '', '', 2),
(@iProviderId, 'pp_api_mode', 'select', '_bx_payment_pp_api_mode_cpt', '_bx_payment_pp_api_mode_dsc', '1|_bx_payment_pp_api_mode_live,2|_bx_payment_pp_api_mode_test', '', '', '', 3),
(@iProviderId, 'pp_api_live_account', 'text', '_bx_payment_pp_api_live_account_cpt', '_bx_payment_pp_api_live_account_dsc', '', 'EmailOrEmpty', '', '_bx_payment_form_input_email_err_cor_or_emp', 4),
(@iProviderId, 'pp_api_live_client_id', 'text', '_bx_payment_pp_api_live_client_id_cpt', '_bx_payment_pp_api_live_client_id_dsc', '', '', '', '', 5),
(@iProviderId, 'pp_api_live_secret', 'text', '_bx_payment_pp_api_live_secret_cpt', '_bx_payment_pp_api_live_secret_dsc', '', '', '', '', 6),
(@iProviderId, 'pp_api_test_account', 'text', '_bx_payment_pp_api_test_account_cpt', '_bx_payment_pp_api_test_account_dsc', '', 'EmailOrEmpty', '', '_bx_payment_form_input_email_err_cor_or_emp', 7),
(@iProviderId, 'pp_api_test_client_id', 'text', '_bx_payment_pp_api_test_client_id_cpt', '_bx_payment_pp_api_test_client_id_dsc', '', '', '', '', 8),
(@iProviderId, 'pp_api_test_secret', 'text', '_bx_payment_pp_api_test_secret_cpt', '_bx_payment_pp_api_test_secret_dsc', '', '', '', '', 9),
(@iProviderId, 'pp_api_return_data_url', 'value', '_bx_payment_pp_api_return_data_url_cpt', '', '', '', '', '', 10),
(@iProviderId, 'pp_api_notify_url', 'value', '_bx_payment_pp_api_notify_url_cpt', '', '', '', '', '', 11);

-- Chargebee payment provider
INSERT INTO `bx_payment_providers`(`name`, `caption`, `description`, `option_prefix`, `for_visitor`, `for_single`, `for_recurring`, `active`, `order`, `class_name`) VALUES
('chargebee', '_bx_payment_cbee_cpt', '_bx_payment_cbee_dsc', 'cbee_', 1, 0, 1, 1, 40, 'BxPaymentProviderChargebee');
SET @iProviderId = LAST_INSERT_ID();

INSERT INTO `bx_payment_providers_options`(`provider_id`, `name`, `type`, `caption`, `description`, `extra`, `check_type`, `check_params`, `check_error`, `order`) VALUES
(@iProviderId, 'cbee_active', 'checkbox', '_bx_payment_cbee_active_cpt', '_bx_payment_cbee_active_dsc', '', '', '', '', 1),
(@iProviderId, 'cbee_hidden', 'checkbox', '_bx_payment_cbee_hidden_cpt', '_bx_payment_cbee_hidden_dsc', '', '', '', '', 2),
(@iProviderId, 'cbee_mode', 'select', '_bx_payment_cbee_mode_cpt', '_bx_payment_cbee_mode_dsc', '1|_bx_payment_cbee_mode_live,2|_bx_payment_cbee_mode_test', '', '', '', 3),
(@iProviderId, 'cbee_live_site', 'text', '_bx_payment_cbee_live_site_cpt', '_bx_payment_cbee_live_site_dsc', '', '', '', '', 4),
(@iProviderId, 'cbee_live_api_key', 'text', '_bx_payment_cbee_live_api_key_cpt', '_bx_payment_cbee_live_api_key_dsc', '', '', '', '', 5),
(@iProviderId, 'cbee_test_site', 'text', '_bx_payment_cbee_test_site_cpt', '_bx_payment_cbee_test_site_dsc', '', '', '', '', 6),
(@iProviderId, 'cbee_test_api_key', 'text', '_bx_payment_cbee_test_api_key_cpt', '_bx_payment_cbee_test_api_key_dsc', '', '', '', '', 7),
(@iProviderId, 'cbee_check_amount', 'checkbox', '_bx_payment_cbee_check_amount_cpt', '_bx_payment_cbee_check_amount_dsc', '', '', '', '', 8),
(@iProviderId, 'cbee_ssl', 'checkbox', '_bx_payment_cbee_ssl_cpt', '_bx_payment_cbee_ssl_dsc', '', '', '', '', 9),
(@iProviderId, 'cbee_cancellation_email', 'text', '_bx_payment_cbee_cancellation_email_cpt', '', '', 'EmailOrEmpty', '', '_bx_payment_form_input_email_err_cor_or_emp', 10),
(@iProviderId, 'cbee_expiration_email', 'text', '_bx_payment_cbee_expiration_email_cpt', '', '', 'EmailOrEmpty', '', '_bx_payment_form_input_email_err_cor_or_emp', 11),
(@iProviderId, 'cbee_return_data_url', 'value', '_bx_payment_cbee_return_data_url_cpt', '', '', '', '', '', 12),
(@iProviderId, 'cbee_notify_url', 'value', '_bx_payment_cbee_notify_url_cpt', '', '', '', '', '', 13);

-- Chargebee V3 payment provider
INSERT INTO `bx_payment_providers`(`name`, `caption`, `description`, `option_prefix`, `for_visitor`, `for_single`, `for_recurring`, `active`, `order`, `class_name`) VALUES
('chargebee_v3', '_bx_payment_cbee_v3_cpt', '_bx_payment_cbee_v3_dsc', 'cbee_v3_', 1, 1, 1, 1, 41, 'BxPaymentProviderChargebeeV3');
SET @iProviderId = LAST_INSERT_ID();

INSERT INTO `bx_payment_providers_options`(`provider_id`, `name`, `type`, `caption`, `description`, `extra`, `check_type`, `check_params`, `check_error`, `order`) VALUES
(@iProviderId, 'cbee_v3_active', 'checkbox', '_bx_payment_cbee_active_cpt', '_bx_payment_cbee_active_dsc', '', '', '', '', 1),
(@iProviderId, 'cbee_v3_hidden', 'checkbox', '_bx_payment_cbee_hidden_cpt', '_bx_payment_cbee_hidden_dsc', '', '', '', '', 2),
(@iProviderId, 'cbee_v3_mode', 'select', '_bx_payment_cbee_mode_cpt', '_bx_payment_cbee_mode_dsc', '1|_bx_payment_cbee_mode_live,2|_bx_payment_cbee_mode_test', '', '', '', 3),
(@iProviderId, 'cbee_v3_live_site', 'text', '_bx_payment_cbee_live_site_cpt', '_bx_payment_cbee_live_site_dsc', '', '', '', '', 4),
(@iProviderId, 'cbee_v3_live_api_key', 'text', '_bx_payment_cbee_live_api_key_cpt', '_bx_payment_cbee_live_api_key_dsc', '', '', '', '', 5),
(@iProviderId, 'cbee_v3_test_site', 'text', '_bx_payment_cbee_test_site_cpt', '_bx_payment_cbee_test_site_dsc', '', '', '', '', 6),
(@iProviderId, 'cbee_v3_test_api_key', 'text', '_bx_payment_cbee_test_api_key_cpt', '_bx_payment_cbee_test_api_key_dsc', '', '', '', '', 7),
(@iProviderId, 'cbee_v3_check_amount', 'checkbox', '_bx_payment_cbee_check_amount_cpt', '_bx_payment_cbee_check_amount_dsc', '', '', '', '', 8),
(@iProviderId, 'cbee_v3_ssl', 'checkbox', '_bx_payment_cbee_ssl_cpt', '_bx_payment_cbee_ssl_dsc', '', '', '', '', 9),
(@iProviderId, 'cbee_v3_cancellation_email', 'text', '_bx_payment_cbee_cancellation_email_cpt', '', '', 'EmailOrEmpty', '', '_bx_payment_form_input_email_err_cor_or_emp', 10),
(@iProviderId, 'cbee_v3_expiration_email', 'text', '_bx_payment_cbee_expiration_email_cpt', '', '', 'EmailOrEmpty', '', '_bx_payment_form_input_email_err_cor_or_emp', 11),
(@iProviderId, 'cbee_v3_return_data_url', 'value', '_bx_payment_cbee_return_data_url_cpt', '', '', '', '', '', 12),
(@iProviderId, 'cbee_v3_notify_url', 'value', '_bx_payment_cbee_notify_url_cpt', '', '', '', '', '', 13);

-- Stripe payment provider
INSERT INTO `bx_payment_providers`(`name`, `caption`, `description`, `option_prefix`, `for_visitor`, `for_single`, `for_recurring`, `active`, `order`, `class_name`) VALUES
('stripe', '_bx_payment_strp_cpt', '_bx_payment_strp_dsc', 'strp_', 1, 1, 1, 1, 60, 'BxPaymentProviderStripe');
SET @iProviderId = LAST_INSERT_ID();

INSERT INTO `bx_payment_providers_options`(`provider_id`, `name`, `type`, `caption`, `description`, `extra`, `check_type`, `check_params`, `check_error`, `order`) VALUES
(@iProviderId, 'strp_active', 'checkbox', '_bx_payment_strp_active_cpt', '_bx_payment_strp_active_dsc', '', '', '', '', 1),
(@iProviderId, 'strp_hidden', 'checkbox', '_bx_payment_strp_hidden_cpt', '_bx_payment_strp_hidden_dsc', '', '', '', '', 2),
(@iProviderId, 'strp_mode', 'select', '_bx_payment_strp_mode_cpt', '_bx_payment_strp_mode_dsc', '1|_bx_payment_strp_mode_live,2|_bx_payment_strp_mode_test', '', '', '', 3),
(@iProviderId, 'strp_live_pub_key', 'text', '_bx_payment_strp_live_pub_key_cpt', '_bx_payment_strp_live_pub_key_dsc', '', '', '', '', 4),
(@iProviderId, 'strp_live_sec_key', 'text', '_bx_payment_strp_live_sec_key_cpt', '_bx_payment_strp_live_sec_key_dsc', '', '', '', '', 5),
(@iProviderId, 'strp_test_pub_key', 'text', '_bx_payment_strp_test_pub_key_cpt', '_bx_payment_strp_test_pub_key_dsc', '', '', '', '', 6),
(@iProviderId, 'strp_test_sec_key', 'text', '_bx_payment_strp_test_sec_key_cpt', '_bx_payment_strp_test_sec_key_dsc', '', '', '', '', 7),
(@iProviderId, 'strp_check_amount', 'checkbox', '_bx_payment_strp_check_amount_cpt', '_bx_payment_strp_check_amount_dsc', '', '', '', '', 8),
(@iProviderId, 'strp_ssl', 'checkbox', '_bx_payment_strp_ssl_cpt', '_bx_payment_strp_ssl_dsc', '', '', '', '', 9),
(@iProviderId, 'strp_cancellation_email', 'text', '_bx_payment_strp_cancellation_email_cpt', '', '', 'EmailOrEmpty', '', '_bx_payment_form_input_email_err_cor_or_emp', 10),
(@iProviderId, 'strp_expiration_email', 'text', '_bx_payment_strp_expiration_email_cpt', '', '', 'EmailOrEmpty', '', '_bx_payment_form_input_email_err_cor_or_emp', 11),
(@iProviderId, 'strp_notify_url', 'value', '_bx_payment_strp_notify_url_cpt', '', '', '', '', '', 12);

-- Stripe V3 payment provider (with 3D Secure authentication for Strong Customer Authentication (SCA) support)
INSERT INTO `bx_payment_providers`(`name`, `caption`, `description`, `option_prefix`, `for_visitor`, `for_single`, `for_recurring`, `active`, `order`, `class_name`) VALUES
('stripe_v3', '_bx_payment_strp_v3_cpt', '_bx_payment_strp_v3_dsc', 'strp_v3_', 1, 1, 1, 1, 61, 'BxPaymentProviderStripeV3');
SET @iProviderId = LAST_INSERT_ID();

INSERT INTO `bx_payment_providers_options`(`provider_id`, `name`, `type`, `value`, `caption`, `description`, `extra`, `check_type`, `check_params`, `check_error`, `extended`, `order`) VALUES
(@iProviderId, 'strp_v3_active', 'checkbox', 'on', '_bx_payment_strp_active_cpt', '_bx_payment_strp_active_dsc', '', '', '', '', 2, 1),
(@iProviderId, 'strp_v3_hidden', 'checkbox', '', '_bx_payment_strp_hidden_cpt', '_bx_payment_strp_hidden_dsc', '', '', '', '', 1, 2),
(@iProviderId, 'strp_v3_mode', 'select', '1', '_bx_payment_strp_mode_cpt', '_bx_payment_strp_mode_dsc', '1|_bx_payment_strp_mode_live,2|_bx_payment_strp_mode_test', '', '', '', 2, 3),
(@iProviderId, 'strp_v3_live_pub_key', 'text', '', '_bx_payment_strp_live_pub_key_cpt', '_bx_payment_strp_live_pub_key_dsc', '', '', '', '', 0, 4),
(@iProviderId, 'strp_v3_live_sec_key', 'text', '', '_bx_payment_strp_live_sec_key_cpt', '_bx_payment_strp_live_sec_key_dsc', '', '', '', '', 0, 5),
(@iProviderId, 'strp_v3_test_pub_key', 'text', '', '_bx_payment_strp_test_pub_key_cpt', '_bx_payment_strp_test_pub_key_dsc', '', '', '', '', 1, 6),
(@iProviderId, 'strp_v3_test_sec_key', 'text', '', '_bx_payment_strp_test_sec_key_cpt', '_bx_payment_strp_test_sec_key_dsc', '', '', '', '', 1, 7),
(@iProviderId, 'strp_v3_check_amount', 'checkbox', '', '_bx_payment_strp_check_amount_cpt', '_bx_payment_strp_check_amount_dsc', '', '', '', '', 1, 8),
(@iProviderId, 'strp_v3_ssl', 'checkbox', 'on', '_bx_payment_strp_ssl_cpt', '_bx_payment_strp_ssl_dsc', '', '', '', '', 1, 9),
(@iProviderId, 'strp_v3_cancellation_email', 'text', '', '_bx_payment_strp_cancellation_email_cpt', '', '', 'EmailOrEmpty', '', '_bx_payment_form_input_email_err_cor_or_emp', 0, 10),
(@iProviderId, 'strp_v3_expiration_email', 'text', '', '_bx_payment_strp_expiration_email_cpt', '', '', 'EmailOrEmpty', '', '_bx_payment_form_input_email_err_cor_or_emp', 1, 11),
(@iProviderId, 'strp_v3_notify_url', 'value', '', '_bx_payment_strp_notify_url_cpt', '', '', '', '', '', 0, 12);

-- Stripe Connect payment provider
INSERT INTO `bx_payment_providers`(`name`, `caption`, `description`, `option_prefix`, `for_visitor`, `for_single`, `for_recurring`, `active`, `order`, `class_name`) VALUES
('stripe_connect', '_bx_payment_strp_cnnt_cpt', '_bx_payment_strp_cnnt_dsc', 'strp_cnnt_', 1, 1, 1, 1, 65, 'BxPaymentProviderStripeConnect');
SET @iProviderId = LAST_INSERT_ID();

INSERT INTO `bx_payment_providers_options`(`provider_id`, `name`, `type`, `value`, `caption`, `description`, `extra`, `check_type`, `check_params`, `check_error`, `extended`, `order`) VALUES
(@iProviderId, 'strp_cnnt_mode', 'value', '', '_bx_payment_strp_mode_cpt', '', '', '', '', '', 0, 1),
(@iProviderId, 'strp_cnnt_connect', 'custom', '', '_bx_payment_strp_cnnt_connect_cpt', '', '', '', '', '', 0, 2),
(@iProviderId, 'strp_cnnt_live_account_id', 'value', '', '_bx_payment_strp_cnnt_live_account_id_cpt', '', '', '', '', '', 0, 3),
(@iProviderId, 'strp_cnnt_test_account_id', 'value', '', '_bx_payment_strp_cnnt_test_account_id_cpt', '', '', '', '', '', 1, 4);

-- Apple In-App payment provider
INSERT INTO `bx_payment_providers`(`name`, `caption`, `description`, `option_prefix`, `for_visitor`, `for_owner_only`, `for_single`, `for_recurring`, `active`, `order`, `class_name`) VALUES
('apple_in_app', '_bx_payment_aina_cpt', '_bx_payment_aina_dsc', 'aina_', 0, 1, 1, 1, 1, 70, 'BxPaymentProviderAppleInApp');
SET @iProviderId = LAST_INSERT_ID();

INSERT INTO `bx_payment_providers_options`(`provider_id`, `name`, `type`, `caption`, `description`, `extra`, `check_type`, `check_params`, `check_error`, `order`) VALUES
(@iProviderId, 'aina_active', 'checkbox', '_bx_payment_aina_active_cpt', '_bx_payment_aina_active_dsc', '', '', '', '', 1),
(@iProviderId, 'aina_hidden', 'checkbox', '_bx_payment_aina_hidden_cpt', '_bx_payment_aina_hidden_dsc', '', '', '', '', 2),
(@iProviderId, 'aina_secret', 'text', '_bx_payment_aina_secret_cpt', '_bx_payment_aina_secret_dsc', '', '', '', '', 3),
(@iProviderId, 'aina_notify_url', 'value', '_bx_payment_aina_notify_url_cpt', '', '', '', '', '', 4);

-- GRIDS
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `show_total_count`, `override_class_name`, `override_class_file`) VALUES
('bx_payment_grid_providers', 'Sql', 'SELECT * FROM `bx_payment_providers` WHERE 1 ', 'bx_payment_providers', 'id', 'order', 'active', '', 100, NULL, 'start', '', 'name', 'caption,description', 'auto', '', '', 192, 0, 'BxPaymentGridProviders', 'modules/boonex/payment/classes/BxPaymentGridProviders.php'),

('bx_payment_grid_carts', 'Array', '', '', 'vendor_id', '', '', '', 20, NULL, 'start', '', '', '', 'like', '', '', 2147483647, 1, 'BxPaymentGridCarts', 'modules/boonex/payment/classes/BxPaymentGridCarts.php'),
('bx_payment_grid_cart', 'Array', '', '', 'descriptor', '', '', '', 20, NULL, 'start', '', 'title,description', '', 'like', '', '', 2147483647, 1, 'BxPaymentGridCart', 'modules/boonex/payment/classes/BxPaymentGridCart.php'),

('bx_payment_grid_sbs_list_my', 'Sql', 'SELECT `ttp`.`id` AS `id`, `ttp`.`client_id` AS `client_id`, `ttp`.`seller_id` AS `seller_id`, `ttp`.`items` AS `items`, `ts`.`date_add` AS `date_add`, `ts`.`date_next` AS `date_next`, `ts`.`status` AS `status`, `ts`.`reason` AS `reason` FROM (SELECT `id`, `pending_id`, `customer_id`, `subscription_id`, `date_add`, `date_next`, `status`, '''' AS `reason` FROM `bx_payment_subscriptions` UNION SELECT `id`, `pending_id`, `customer_id`, `subscription_id`, `date_add`, `date_next`, ''canceled'' AS `status`, `reason` FROM `bx_payment_subscriptions_deleted`) AS `ts` LEFT JOIN `bx_payment_transactions_pending` AS `ttp` ON `ts`.`pending_id`=`ttp`.`id` WHERE 1 AND `ttp`.`type`=''recurring'' ', 'bx_payment_subscriptions', 'id', 'date_add', '', '', 100, NULL, 'start', '', 'ts`.`customer_id,ts`.`subscription_id,ts`.`date_add', '', 'auto', '', '', 2147483647, 0, 'BxPaymentGridSbsList', 'modules/boonex/payment/classes/BxPaymentGridSbsList.php'),
('bx_payment_grid_sbs_list_all', 'Sql', 'SELECT `ttp`.`id` AS `id`, `ttp`.`client_id` AS `client_id`, `tac`.`email` AS `client_email`, `ttp`.`seller_id` AS `seller_id`, `ttp`.`items` AS `items`, `ts`.`date_add` AS `date_add`, `ts`.`date_next` AS `date_next`, `ts`.`status` AS `status`, `ts`.`reason` AS `reason` FROM (SELECT `id`, `pending_id`, `customer_id`, `subscription_id`, `date_add`, `date_next`, `status`, '''' AS `reason` FROM `bx_payment_subscriptions` UNION SELECT `id`, `pending_id`, `customer_id`, `subscription_id`, `date_add`, `date_next`, ''canceled'' AS `status`, `reason` FROM `bx_payment_subscriptions_deleted`) AS `ts` LEFT JOIN `bx_payment_transactions_pending` AS `ttp` ON `ts`.`pending_id`=`ttp`.`id` LEFT JOIN `sys_profiles` AS `tpc` ON `ttp`.`client_id`=`tpc`.`id` LEFT JOIN `sys_accounts` AS `tac` ON `tpc`.`account_id`=`tac`.`id` WHERE 1 AND `ttp`.`type`=''recurring'' ', 'bx_payment_subscriptions', 'id', 'date_add', '', '', 100, NULL, 'start', '', 'tac`.`email,ts`.`customer_id,ts`.`subscription_id,ts`.`date_add', '', 'auto', '', '', 192, 0, 'BxPaymentGridSbsAdministration', 'modules/boonex/payment/classes/BxPaymentGridSbsAdministration.php'),
('bx_payment_grid_sbs_history', 'Sql', 'SELECT `tt`.`id` AS `id`, `ttp`.`client_id` AS `client_id`, `tt`.`seller_id` AS `seller_id`, `tt`.`module_id` AS `module_id`, `tt`.`item_id` AS `item_id`, `tt`.`item_count` AS `item_count`, `tt`.`amount` AS `amount`, `tt`.`currency` AS `currency`, `tt`.`date` AS `date` FROM `bx_payment_transactions` AS `tt` LEFT JOIN `bx_payment_transactions_pending` AS `ttp` ON `tt`.`pending_id`=`ttp`.`id` WHERE 1 AND `ttp`.`type`=''recurring'' ', 'bx_payment_transactions', 'id', 'date', '', '', 100, NULL, 'start', '', 'ttp`.`order,tt`.`license,tt`.`amount,tt`.`date', '', 'auto', '', '', 2147483647, 0, 'BxPaymentGridSbsHistory', 'modules/boonex/payment/classes/BxPaymentGridSbsHistory.php'),

('bx_payment_grid_orders_history', 'Sql', 'SELECT `tt`.`id` AS `id`, `tt`.`seller_id` AS `seller_id`, `tt`.`module_id` AS `module_id`, `tt`.`item_id` AS `item_id`, `ttp`.`order` AS `transaction`, `tt`.`license` AS `license`, `tt`.`amount` AS `amount`, `tt`.`currency` AS `currency`, `tt`.`date` AS `date` FROM `bx_payment_transactions` AS `tt` LEFT JOIN `bx_payment_transactions_pending` AS `ttp` ON `tt`.`pending_id`=`ttp`.`id` WHERE 1 AND `ttp`.`type`=''single'' ', 'bx_payment_transactions', 'id', 'date', '', '', 100, NULL, 'start', '', 'ttp`.`order,tt`.`license,tt`.`amount,tt`.`date', '', 'auto', '', '', 2147483647, 0, 'BxPaymentGridHistory', 'modules/boonex/payment/classes/BxPaymentGridHistory.php'),
('bx_payment_grid_orders_processed', 'Sql', 'SELECT `tt`.`id` AS `id`, `tt`.`client_id` AS `client_id`, `tt`.`seller_id` AS `seller_id`, `tt`.`author_id` AS `author_id`, `tt`.`module_id` AS `module_id`, `tt`.`item_id` AS `item_id`, `tt`.`item_count` AS `item_count`, `ttp`.`order` AS `transaction`, `ttp`.`error_msg` AS `error_msg`, `ttp`.`provider` AS `provider`, `tt`.`license` AS `license`, `tt`.`amount` AS `amount`, `tt`.`currency` AS `currency`, `tt`.`date` AS `date` FROM `bx_payment_transactions` AS `tt` LEFT JOIN `bx_payment_transactions_pending` AS `ttp` ON `tt`.`pending_id`=`ttp`.`id` LEFT JOIN `sys_profiles` AS `tup` ON `tt`.`client_id`=`tup`.`id` LEFT JOIN `sys_accounts` AS `tua` ON `tup`.`account_id`=`tua`.`id` WHERE 1 ', 'bx_payment_transactions', 'id', 'date', '', '', 100, NULL, 'start', '', 'ttp`.`order,tt`.`license,tt`.`amount,tt`.`date,tua`.`name,tua`.`email', '', 'auto', '', '', 2147483647, 0, 'BxPaymentGridProcessed', 'modules/boonex/payment/classes/BxPaymentGridProcessed.php'),
('bx_payment_grid_orders_pending', 'Sql', 'SELECT `tt`.`id` AS `id`, `tt`.`client_id` AS `client_id`, `tt`.`seller_id` AS `seller_id`, `tt`.`items` AS `items`, `tt`.`amount` AS `amount`, `tt`.`currency` AS `currency`, `tt`.`order` AS `transaction`, `tt`.`error_msg` AS `error_msg`, `tt`.`provider` AS `provider`, `tt`.`date` AS `date` FROM `bx_payment_transactions_pending` AS `tt` LEFT JOIN `sys_profiles` AS `tup` ON `tt`.`client_id`=`tup`.`id` LEFT JOIN `sys_accounts` AS `tua` ON `tup`.`account_id`=`tua`.`id` WHERE 1 AND (ISNULL(`tt`.`order`) OR (NOT ISNULL(`tt`.`order`) AND `tt`.`error_code`<>''0'')) ', 'bx_payment_transactions_pending', 'id', 'date', '', '', 100, NULL, 'start', '', 'tt`.`order,tt`.`amount,tt`.`date,tua`.`name,tua`.`email', '', 'auto', '', '', 2147483647, 0, 'BxPaymentGridPending', 'modules/boonex/payment/classes/BxPaymentGridPending.php'),

('bx_payment_grid_commissions', 'Sql', 'SELECT * FROM `bx_payment_commissions` WHERE 1 ', 'bx_payment_commissions', 'id', 'order', 'active', '', 100, NULL, 'start', '', 'name', 'caption,description', 'auto', '', '', 192, 1, 'BxPaymentGridCommissions', 'modules/boonex/payment/classes/BxPaymentGridCommissions.php'),
('bx_payment_grid_invoices', 'Sql', 'SELECT * FROM `bx_payment_invoices` WHERE 1 ', 'bx_payment_invoices', 'id', '', '', '', 100, NULL, 'start', '', '', '', 'auto', '', '', 2147483647, 1, 'BxPaymentGridInvoices', 'modules/boonex/payment/classes/BxPaymentGridInvoices.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_payment_grid_providers', 'order', '', '2%', 0, '0', '', 1),
('bx_payment_grid_providers', 'switcher', '', '8%', 0, '0', '', 2),
('bx_payment_grid_providers', 'caption', '_bx_payment_grid_column_title_pdrs_caption', '20%', 1, '16', '', 3),
('bx_payment_grid_providers', 'description', '_bx_payment_grid_column_title_pdrs_description', '30%', 1, '32', '', 4),
('bx_payment_grid_providers', 'for_visitor', '_bx_payment_grid_column_title_pdrs_for_visitor', '8%', 0, '8', '', 5),
('bx_payment_grid_providers', 'for_single', '_bx_payment_grid_column_title_pdrs_for_single', '8%', 0, '8', '', 6),
('bx_payment_grid_providers', 'for_recurring', '_bx_payment_grid_column_title_pdrs_for_recurring', '8%', 0, '8', '', 7),
('bx_payment_grid_providers', 'single_seller', '_bx_payment_grid_column_title_pdrs_single_seller', '8%', 0, '8', '', 8),
('bx_payment_grid_providers', 'time_tracker', '_bx_payment_grid_column_title_pdrs_time_tracker', '8%', 0, '8', '', 9),

('bx_payment_grid_carts', 'checkbox', '', '2%', 0, '', '', 1),
('bx_payment_grid_carts', 'vendor_id', '_bx_payment_grid_column_title_crts_vendor_id', '40%', 0, '36', '', 2),
('bx_payment_grid_carts', 'items_count', '_bx_payment_grid_column_title_crts_items_count', '20%', 0, '16', '', 3),
('bx_payment_grid_carts', 'items_price', '_bx_payment_grid_column_title_crts_items_price', '20%', 0, '16', '', 4),
('bx_payment_grid_carts', 'actions', '', '18%', 0, '', '', 5),

('bx_payment_grid_cart', 'checkbox', '', '5%', 0, '', '', 1),
('bx_payment_grid_cart', 'title', '_bx_payment_grid_column_title_crt_title', '25%', 0, '24', '', 2),
('bx_payment_grid_cart', 'description', '_bx_payment_grid_column_title_crt_description', '45%', 0, '48', '', 3),
('bx_payment_grid_cart', 'quantity', '_bx_payment_grid_column_title_crt_quantity', '10%', 0, '16', '', 4),
('bx_payment_grid_cart', 'price_single', '_bx_payment_grid_column_title_crt_price', '5%', 0, '16', '', 5),
('bx_payment_grid_cart', 'actions', '', '10%', 0, '', '', 6),

('bx_payment_grid_sbs_list_my', 'checkbox', '', '2%', 0, '0', '', 1),
('bx_payment_grid_sbs_list_my', 'seller_id', '_bx_payment_grid_column_title_sbs_seller_id', '16%', 0, '0', '', 2),
('bx_payment_grid_sbs_list_my', 'items', '_bx_payment_grid_column_title_sbs_items', '30%', 0, '', '', 3),
('bx_payment_grid_sbs_list_my', 'date_add', '_bx_payment_grid_column_title_sbs_date_add', '14%', 0, '10', '', 4),
('bx_payment_grid_sbs_list_my', 'date_next', '_bx_payment_grid_column_title_sbs_date_next', '14%', 0, '10', '', 5),
('bx_payment_grid_sbs_list_my', 'status', '_bx_payment_grid_column_title_sbs_status', '6%', 0, '8', '', 6),
('bx_payment_grid_sbs_list_my', 'actions', '', '18%', 0, '0', '', 7),

('bx_payment_grid_sbs_list_all', 'seller_id', '_bx_payment_grid_column_title_sbs_seller_id', '12%', 0, '0', '', 1),
('bx_payment_grid_sbs_list_all', 'client_id', '_bx_payment_grid_column_title_sbs_client_id', '12%', 0, '0', '', 2),
('bx_payment_grid_sbs_list_all', 'client_email', '_bx_payment_grid_column_title_sbs_client_email', '15%', 0, '24', '', 3),
('bx_payment_grid_sbs_list_all', 'items', '_bx_payment_grid_column_title_sbs_items', '15%', 0, '', '', 4),
('bx_payment_grid_sbs_list_all', 'date_add', '_bx_payment_grid_column_title_sbs_date_add', '12%', 0, '10', '', 5),
('bx_payment_grid_sbs_list_all', 'date_next', '_bx_payment_grid_column_title_sbs_date_next', '12%', 0, '10', '', 6),
('bx_payment_grid_sbs_list_all', 'status', '_bx_payment_grid_column_title_sbs_status', '6%', 0, '8', '', 7),
('bx_payment_grid_sbs_list_all', 'actions', '', '16%', 0, '0', '', 8),

('bx_payment_grid_sbs_history', 'seller_id', '_bx_payment_grid_column_title_sbs_seller_id', '24%', 0, '0', '', 1),
('bx_payment_grid_sbs_history', 'item_id', '_bx_payment_grid_column_title_sbs_item_id', '44%', 0, '', '', 2),
('bx_payment_grid_sbs_history', 'amount', '_bx_payment_grid_column_title_sbs_amount', '10%', 1, '10', '', 3),
('bx_payment_grid_sbs_history', 'date', '_bx_payment_grid_column_title_sbs_date', '10%', 0, '10', '', 4),
('bx_payment_grid_sbs_history', 'actions', '', '12%', 0, '', '', 5),

('bx_payment_grid_orders_history', 'seller_id', '_bx_payment_grid_column_title_ods_seller_id', '24%', 0, '0', '', 1),
('bx_payment_grid_orders_history', 'transaction', '_bx_payment_grid_column_title_ods_transaction', '22%', 0, '18', '', 2),
('bx_payment_grid_orders_history', 'item', '_bx_payment_grid_column_title_ods_item', '22%', 0, '18', '', 3),
('bx_payment_grid_orders_history', 'amount', '_bx_payment_grid_column_title_ods_amount', '10%', 1, '10', '', 4),
('bx_payment_grid_orders_history', 'date', '_bx_payment_grid_column_title_ods_date', '10%', 0, '10', '', 5),
('bx_payment_grid_orders_history', 'actions', '', '12%', 0, '', '', 6),

('bx_payment_grid_orders_processed', 'checkbox', '', '2%', 0, '0', '', 1),
('bx_payment_grid_orders_processed', 'client_id', '_bx_payment_grid_column_title_ods_client_id', '16%', 0, '0', '', 2),
('bx_payment_grid_orders_processed', 'author_id', '_bx_payment_grid_column_title_ods_author_id', '16%', 0, '0', '', 3),
('bx_payment_grid_orders_processed', 'transaction', '_bx_payment_grid_column_title_ods_transaction', '10%', 0, '8', '', 4),
('bx_payment_grid_orders_processed', 'item', '_bx_payment_grid_column_title_ods_item', '20%', 0, '', '', 5),
('bx_payment_grid_orders_processed', 'amount', '_bx_payment_grid_column_title_ods_amount', '10%', 1, '10', '', 6),
('bx_payment_grid_orders_processed', 'date', '_bx_payment_grid_column_title_ods_date', '10%', 0, '10', '', 7),
('bx_payment_grid_orders_processed', 'actions', '', '16%', 0, '0', '', 8),

('bx_payment_grid_orders_pending', 'checkbox', '', '2%', 0, '', '', 1),
('bx_payment_grid_orders_pending', 'client_id', '_bx_payment_grid_column_title_ods_client_id', '25%', 0, '0', '', 2),
('bx_payment_grid_orders_pending', 'transaction', '_bx_payment_grid_column_title_ods_transaction', '25%', 0, '25', '', 3),
('bx_payment_grid_orders_pending', 'amount', '_bx_payment_grid_column_title_ods_amount', '14%', 1, '14', '', 4),
('bx_payment_grid_orders_pending', 'date', '_bx_payment_grid_column_title_ods_date', '14%', 0, '14', '', 5),
('bx_payment_grid_orders_pending', 'actions', '', '20%', 0, '', '', 6),

('bx_payment_grid_commissions', 'order', '', '2%', 0, '0', '', 1),
('bx_payment_grid_commissions', 'switcher', '', '8%', 0, '0', '', 2),
('bx_payment_grid_commissions', 'caption', '_bx_payment_grid_column_title_cms_caption', '15%', 1, '16', '', 3),
('bx_payment_grid_commissions', 'description', '_bx_payment_grid_column_title_cms_description', '20%', 1, '16', '', 4),
('bx_payment_grid_commissions', 'acl_id', '_bx_payment_grid_column_title_cms_acl_id', '15%', 0, '16', '', 5),
('bx_payment_grid_commissions', 'percentage', '_bx_payment_grid_column_title_cms_percentage', '10%', 0, '0', '', 6),
('bx_payment_grid_commissions', 'installment', '_bx_payment_grid_column_title_cms_installment', '10%', 0, '0', '', 7),
('bx_payment_grid_commissions', 'actions', '', '20%', 0, '0', '', 8),

('bx_payment_grid_invoices', 'checkbox', '', '2%', 0, '0', '', 1),
('bx_payment_grid_invoices', 'commissionaire_id', '_bx_payment_grid_column_title_inv_commissionaire_id', '10%', 1, '0', '', 2),
('bx_payment_grid_invoices', 'committent_id', '_bx_payment_grid_column_title_inv_committent_id', '10%', 1, '0', '', 3),
('bx_payment_grid_invoices', 'name', '_bx_payment_grid_column_title_inv_name', '8%', 1, '0', '', 4),
('bx_payment_grid_invoices', 'period_start', '_bx_payment_grid_column_title_inv_period_start', '10%', 0, '0', '', 5),
('bx_payment_grid_invoices', 'period_end', '_bx_payment_grid_column_title_inv_period_end', '10%', 0, '0', '', 6),
('bx_payment_grid_invoices', 'amount', '_bx_payment_grid_column_title_inv_amount', '6%', 0, '0', '', 7),
('bx_payment_grid_invoices', 'date_issue', '_bx_payment_grid_column_title_inv_date_issue', '10%', 0, '0', '', 8),
('bx_payment_grid_invoices', 'date_due', '_bx_payment_grid_column_title_inv_date_due', '10%', 0, '0', '', 9),
('bx_payment_grid_invoices', 'status', '_bx_payment_grid_column_title_inv_status', '6%', 0, '8', '', 10),
('bx_payment_grid_invoices', 'actions', '', '18%', 0, '0', '', 11);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_payment_grid_carts', 'bulk', 'delete', '_bx_payment_grid_action_title_crts_delete', '', 0, 1, 1),
('bx_payment_grid_carts', 'single', 'continue', '_bx_payment_grid_action_title_crts_continue', 'far credit-card', 1, 0, 1),
('bx_payment_grid_carts', 'single', 'delete', '_bx_payment_grid_action_title_crts_delete', 'remove', 1, 1, 2),

('bx_payment_grid_cart', 'bulk', 'checkout', '_bx_payment_grid_action_title_crt_checkout', '', 0, 0, 1),
('bx_payment_grid_cart', 'single', 'delete', '_bx_payment_grid_action_title_crt_delete', 'remove', 1, 1, 1),
('bx_payment_grid_cart', 'single', 'quantity_sub', '_bx_payment_grid_action_title_crt_quantity_sub', 'minus', 1, 0, 2),
('bx_payment_grid_cart', 'single', 'quantity_add', '_bx_payment_grid_action_title_crt_quantity_add', 'plus', 1, 0, 3),

('bx_payment_grid_sbs_list_my', 'single', 'view_order', '_bx_payment_grid_action_title_sbs_view_order', 'ellipsis-h', 1, 0, 1),
('bx_payment_grid_sbs_list_my', 'single', 'actions', '_bx_payment_grid_action_title_sbs_actions', 'cog', 1, 0, 2),

('bx_payment_grid_sbs_list_all', 'single', 'view_order', '_bx_payment_grid_action_title_sbs_view_order', 'ellipsis-h', 1, 0, 1),
('bx_payment_grid_sbs_list_all', 'single', 'cancel', '_bx_payment_grid_action_title_sbs_cancel', 'ban', 1, 1, 2),
('bx_payment_grid_sbs_list_all', 'single', 'delete', '_bx_payment_grid_action_title_sbs_delete', 'times', 1, 1, 3),

('bx_payment_grid_sbs_history', 'single', 'view_order', '_bx_payment_grid_action_title_sbs_view_order', 'ellipsis-h', 1, 0, 1),

('bx_payment_grid_orders_history', 'single', 'view_order', '_bx_payment_grid_action_title_ods_view_order', 'ellipsis-h', 1, 0, 1),

('bx_payment_grid_orders_processed', 'independent', 'add', '_bx_payment_grid_action_title_ods_add', '', 0, 0, 1),
('bx_payment_grid_orders_processed', 'bulk', 'cancel', '_bx_payment_grid_action_title_ods_cancel', '', 0, 1, 1),
('bx_payment_grid_orders_processed', 'single', 'view_order', '_bx_payment_grid_action_title_ods_view_order', 'ellipsis-h', 1, 0, 1),
('bx_payment_grid_orders_processed', 'single', 'cancel', '_bx_payment_grid_action_title_ods_cancel', 'times', 1, 1, 2),

('bx_payment_grid_orders_pending', 'bulk', 'cancel', '_bx_payment_grid_action_title_ods_cancel', '', 0, 1, 1),
('bx_payment_grid_orders_pending', 'single', 'view_order', '_bx_payment_grid_action_title_ods_view_order', 'ellipsis-h', 1, 0, 1),
('bx_payment_grid_orders_pending', 'single', 'process', '_bx_payment_grid_action_title_ods_process', 'sync', 1, 0, 2),
('bx_payment_grid_orders_pending', 'single', 'cancel', '_bx_payment_grid_action_title_ods_cancel', 'times', 1, 1, 3),

('bx_payment_grid_commissions', 'independent', 'add', '_bx_payment_grid_action_title_cms_add', '', 0, 0, 1),
('bx_payment_grid_commissions', 'bulk', 'delete', '_bx_payment_grid_action_title_cms_delete', '', 0, 1, 1),
('bx_payment_grid_commissions', 'single', 'edit', '_bx_payment_grid_action_title_cms_edit', 'pencil-alt', 1, 0, 1),
('bx_payment_grid_commissions', 'single', 'delete', '_bx_payment_grid_action_title_cms_delete', 'remove', 1, 1, 2),

('bx_payment_grid_invoices', 'bulk', 'delete', '_bx_payment_grid_action_title_inv_delete', '', 0, 1, 1),
('bx_payment_grid_invoices', 'single', 'pay', '_bx_payment_grid_action_title_inv_pay', 'credit-card', 1, 0, 1),
('bx_payment_grid_invoices', 'single', 'edit', '_bx_payment_grid_action_title_inv_edit', 'pencil-alt', 1, 0, 2),
('bx_payment_grid_invoices', 'single', 'delete', '_bx_payment_grid_action_title_inv_delete', 'remove', 1, 1, 3);


-- FORMS
INSERT INTO `sys_objects_form` (`object`, `module`, `title`, `action`, `form_attrs`, `submit_name`, `table`, `key`, `uri`, `uri_title`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_payment_form_details', @sName, '_bx_payment_form_details_form', '', '', 'submit', '', 'id', '', '', 'a:1:{s:14:"checker_helper";s:33:"BxPaymentDetailsFormCheckerHelper";}', 0, 1, 'BxPaymentFormDetails', 'modules/boonex/payment/classes/BxPaymentFormDetails.php'),

('bx_payment_form_pendings', @sName, '_bx_payment_form_pendings_form', '', '', 'do_submit', 'bx_payment_transactions_pending', 'id', '', '', '', 0, 1, 'BxPaymentFormView', 'modules/boonex/payment/classes/BxPaymentFormView.php'),
('bx_payment_form_processed', @sName, '_bx_payment_form_processed_form', '', '', 'do_submit', 'bx_payment_transactions', 'id', '', '', '', 0, 1, 'BxPaymentFormView', 'modules/boonex/payment/classes/BxPaymentFormView.php'),

('bx_payment_form_commissions', @sName, '_bx_payment_form_commissions_form', '', '', 'do_submit', 'bx_payment_commissions', 'id', '', '', '', 0, 1, 'BxPaymentFormCommissions', 'modules/boonex/payment/classes/BxPaymentFormCommissions.php'),
('bx_payment_form_invoices', @sName, '_bx_payment_form_invoices_form', '', '', 'do_submit', 'bx_payment_invoices', 'id', '', '', '', 0, 1, 'BxPaymentFormInvoices', 'modules/boonex/payment/classes/BxPaymentFormInvoices.php'),

-- FORMS: Recurly
('bx_payment_form_rcrl_card', @sName, '_bx_payment_form_rcrl_card', '', '', 'do_submit', '', '', '', '', '', 0, 1, '', ''),

-- FORMS: Stripe
('bx_payment_form_strp_details', @sName, '_bx_payment_form_strp_details', '', '', 'do_submit', '', '', '', '', '', 0, 1, '', ''),
('bx_payment_form_strp_card', @sName, '_bx_payment_form_strp_card', '', '', 'do_submit', '', '', '', '', '', 0, 1, '', '');


INSERT INTO `sys_form_displays` (`display_name`, `module`, `object`, `title`, `view_mode`) VALUES
('bx_payment_form_details_edit', @sName, 'bx_payment_form_details', '_bx_payment_form_details_display_edit', 0),

('bx_payment_form_pendings_process', @sName, 'bx_payment_form_pendings', '_bx_payment_form_pendings_display_process', 0),
('bx_payment_form_processed_add', @sName, 'bx_payment_form_processed', '_bx_payment_form_processed_display_add', 0),

('bx_payment_form_commissions_add', @sName, 'bx_payment_form_commissions', '_bx_payment_form_commissions_display_add', 0),
('bx_payment_form_commissions_edit', @sName, 'bx_payment_form_commissions', '_bx_payment_form_commissions_display_edit', 0),

('bx_payment_form_invoices_edit', @sName, 'bx_payment_form_invoices', '_bx_payment_form_invoices_display_edit', 0),

-- FORMS: Recurly
('bx_payment_form_rcrl_card_add', @sName, 'bx_payment_form_rcrl_card', '_bx_payment_form_rcrl_card_display_add', 0),

-- FORMS: Stripe
('bx_payment_form_strp_details_edit', @sName, 'bx_payment_form_strp_details', '_bx_payment_form_strp_details_display_edit', 0),
('bx_payment_form_strp_card_add', @sName, 'bx_payment_form_strp_card', '_bx_payment_form_strp_card_display_add', 0);

INSERT INTO `sys_form_inputs` (`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES
('bx_payment_form_pendings', @sName, 'id', '0', '', 0, 'hidden', '_bx_payment_form_pendings_input_id_sys', '', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_payment_form_pendings', @sName, 'seller_id', '0', '', 0, 'hidden', '_bx_payment_form_pendings_input_seller_id_sys', '', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_payment_form_pendings', @sName, 'order', '', '', 0, 'text', '_bx_payment_form_pendings_input_order_sys', '_bx_payment_form_pendings_input_order', '', 1, 0, 0, '', '', '', 'Avail', '', '_bx_payment_form_pendings_input_order_err', 'Xss', '', 0, 0),
('bx_payment_form_pendings', @sName, 'controls', '', 'do_submit,do_cancel', 0, 'input_set', '', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_payment_form_pendings', @sName, 'do_submit', '_bx_payment_form_pendings_input_process', '', 0, 'submit', '_bx_payment_form_pendings_input_process_sys', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_payment_form_pendings', @sName, 'do_cancel', '_bx_payment_form_pendings_input_cancel', '', 0, 'button', '_bx_payment_form_pendings_input_cancel_sys', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 0, 0),

('bx_payment_form_processed', @sName, 'seller_id', '0', '', 0, 'hidden', '_bx_payment_form_processed_input_seller_id_sys', '', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_payment_form_processed', @sName, 'client_id', '0', '', 0, 'hidden', '_bx_payment_form_processed_input_client_id_sys', '', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_payment_form_processed', @sName, 'client', '0', '', 0, 'custom', '_bx_payment_form_processed_input_client_sys', '_bx_payment_form_processed_input_client', '', 0, 0, 0, '', '', '', 'Avail', '', '_bx_payment_form_processed_input_client_err', 'Xss', '', 0, 0),
('bx_payment_form_processed', @sName, 'order', '0', '', 0, 'text', '_bx_payment_form_processed_input_order_sys', '_bx_payment_form_processed_input_order', '', 0, 0, 0, '', '', '', 'Avail', '', '_bx_payment_form_processed_input_order_err', 'Xss', '', 0, 0),
('bx_payment_form_processed', @sName, 'module_id', '0', '', 0, 'select', '_bx_payment_form_processed_input_module_id_sys', '_bx_payment_form_processed_input_module_id', '', 0, 0, 0, '', '', '', 'Avail', '', '_bx_payment_form_processed_input_module_id_err', 'Int', '', 0, 0),
('bx_payment_form_processed', @sName, 'items', '0', '', 0, 'custom', '_bx_payment_form_processed_input_items_sys', '_bx_payment_form_processed_input_items', '', 0, 0, 0, '', '', '', '', '', '_bx_payment_form_processed_input_items_err', '', '', 0, 0),
('bx_payment_form_processed', @sName, 'controls', '', 'do_submit,do_cancel', 0, 'input_set', '', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_payment_form_processed', @sName, 'do_submit', '_bx_payment_form_processed_input_add', '', 0, 'submit', '_bx_payment_form_processed_input_add_sys', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_payment_form_processed', @sName, 'do_cancel', '_bx_payment_form_processed_input_cancel', '', 0, 'button', '_bx_payment_form_processed_input_cancel_sys', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 0, 0),

('bx_payment_form_commissions', @sName, 'caption', '0', '', 0, 'text_translatable', '_bx_payment_form_commissions_input_caption_sys', '_bx_payment_form_commissions_input_caption', '', 1, 0, 0, '', '', '', 'AvailTranslatable', 'a:1:{i:0;s:7:"caption";}', '_bx_payment_form_commissions_input_caption_err', 'Xss', '', 0, 0),
('bx_payment_form_commissions', @sName, 'description', '0', '', 0, 'textarea_translatable', '_bx_payment_form_commissions_input_description_sys', '_bx_payment_form_commissions_input_description', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_payment_form_commissions', @sName, 'acl_id', '0', '', 0, 'select', '_bx_payment_form_commissions_input_acl_id_sys', '_bx_payment_form_commissions_input_acl_id', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_payment_form_commissions', @sName, 'percentage', '0', '', 0, 'text', '_bx_payment_form_commissions_input_percentage_sys', '_bx_payment_form_commissions_input_percentage', '', 0, 0, 0, '', '', '', '', '', '', 'Float', '', 0, 0),
('bx_payment_form_commissions', @sName, 'installment', '0', '', 0, 'text', '_bx_payment_form_commissions_input_installment_sys', '_bx_payment_form_commissions_input_installment', '', 0, 0, 0, '', '', '', '', '', '', 'Float', '', 0, 0),
('bx_payment_form_commissions', @sName, 'controls', '', 'do_submit,do_cancel', 0, 'input_set', '', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_payment_form_commissions', @sName, 'do_submit', '_bx_payment_form_commissions_input_submit', '', 0, 'submit', '_bx_payment_form_commissions_input_submit_sys', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_payment_form_commissions', @sName, 'do_cancel', '_bx_payment_form_commissions_input_cancel', '', 0, 'button', '_bx_payment_form_commissions_input_cancel_sys', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 0, 0),

('bx_payment_form_invoices', @sName, 'amount', '0', '', 0, 'text', '_bx_payment_form_invoices_input_amount_sys', '_bx_payment_form_invoices_input_amount', '', 1, 0, 0, '', '', '', 'Avail', '', '_bx_payment_form_invoices_input_amount_err', 'Float', '', 0, 0),
('bx_payment_form_invoices', @sName, 'date_due', '', '', 0, 'datepicker', '_bx_payment_form_invoices_input_date_due_sys', '_bx_payment_form_invoices_input_date_due', '', 1, 0, 0, '', '', '', 'Avail', '', '_bx_payment_form_invoices_input_date_due_err', 'DateUtc', '', 0, 0),
('bx_payment_form_invoices', @sName, 'status', '', '', 0, 'select', '_bx_payment_form_invoices_input_status_sys', '_bx_payment_form_invoices_input_status', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_payment_form_invoices', @sName, 'controls', '', 'do_submit,do_cancel', 0, 'input_set', '', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_payment_form_invoices', @sName, 'do_submit', '_bx_payment_form_invoices_input_submit', '', 0, 'submit', '_bx_payment_form_invoices_input_submit_sys', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_payment_form_invoices', @sName, 'do_cancel', '_bx_payment_form_invoices_input_cancel', '', 0, 'button', '_bx_payment_form_invoices_input_cancel_sys', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 0, 0),

-- FORMS: Recurly
('bx_payment_form_rcrl_card', @sName, 'pending_id', '0', '', 0, 'hidden', '_bx_payment_form_rcrl_card_input_pending_id_sys', '', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_payment_form_rcrl_card', @sName, 'item', '', '', 0, 'hidden', '_bx_payment_form_rcrl_card_input_item_sys', '', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_payment_form_rcrl_card', @sName, 'token', '', '', 0, 'hidden', '_bx_payment_form_rcrl_card_input_token_sys', '', '', 0, 0, 0, 'a:1:{s:12:"data-recurly";s:5:"token";}', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_payment_form_rcrl_card', @sName, 'first_name', '', '', 0, 'text', '_bx_payment_form_rcrl_card_input_first_name_sys', '_bx_payment_form_rcrl_card_input_first_name', '', 1, 0, 0, 'a:1:{s:12:"data-recurly";s:10:"first_name";}', '', '', 'Avail', '', '_bx_payment_form_rcrl_card_input_first_name_err', 'Xss', '', 0, 0),
('bx_payment_form_rcrl_card', @sName, 'last_name', '', '', 0, 'text', '_bx_payment_form_rcrl_card_input_last_name_sys', '_bx_payment_form_rcrl_card_input_last_name', '', 1, 0, 0, 'a:1:{s:12:"data-recurly";s:9:"last_name";}', '', '', 'Avail', '', '_bx_payment_form_rcrl_card_input_last_name_err', 'Xss', '', 0, 0),
('bx_payment_form_rcrl_card', @sName, 'email', '', '', 0, 'text', '_bx_payment_form_rcrl_card_input_email_sys', '_bx_payment_form_rcrl_card_input_email', '', 1, 0, 0, '', '', '', 'Email', '', '', 'Xss', '', 0, 0),
('bx_payment_form_rcrl_card', @sName, 'card_number', '', '', 0, 'custom', '_bx_payment_form_rcrl_card_input_card_number_sys', '_bx_payment_form_rcrl_card_input_card_number', '_bx_payment_form_rcrl_card_input_card_number_inf', 1, 0, 0, 'a:1:{s:12:"data-recurly";s:6:"number";}', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_payment_form_rcrl_card', @sName, 'card_expire', '', '', 0, 'custom', '_bx_payment_form_rcrl_card_input_card_expire_sys', '_bx_payment_form_rcrl_card_input_card_expire', '_bx_payment_form_rcrl_card_input_card_expire_inf', 1, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_payment_form_rcrl_card', @sName, 'card_cvv', '', '', 0, 'custom', '_bx_payment_form_rcrl_card_input_card_cvv_sys', '_bx_payment_form_rcrl_card_input_card_cvv', '_bx_payment_form_rcrl_card_input_card_cvv_inf', 1, 0, 0, 'a:1:{s:12:"data-recurly";s:3:"cvv";}', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_payment_form_rcrl_card', @sName, 'controls', '', 'do_submit,do_cancel', 0, 'input_set', '', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_payment_form_rcrl_card', @sName, 'do_submit', '_bx_payment_form_rcrl_card_input_submit', '', 0, 'submit', '_bx_payment_form_rcrl_card_input_submit_sys', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_payment_form_rcrl_card', @sName, 'do_cancel', '_bx_payment_form_rcrl_card_input_cancel', '', 0, 'button', '_bx_payment_form_rcrl_card_input_cancel_sys', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 0, 0),

-- FORMS: Stripe
('bx_payment_form_strp_details', @sName, 'item_id', '', '', 0, 'select', '_bx_payment_form_strp_details_input_item_id_sys', '_bx_payment_form_strp_details_input_item_id', '', 1, 0, 0, '', '', '', 'Avail', '', '_bx_payment_form_strp_details_input_item_id_err', 'Int', '', 0, 0),
('bx_payment_form_strp_details', @sName, 'controls', '', 'do_submit,do_cancel', 0, 'input_set', '', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_payment_form_strp_details', @sName, 'do_submit', '_bx_payment_form_strp_details_input_submit', '', 0, 'submit', '_bx_payment_form_strp_details_input_submit_sys', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_payment_form_strp_details', @sName, 'do_cancel', '_bx_payment_form_strp_details_input_cancel', '', 0, 'button', '_bx_payment_form_strp_details_input_cancel_sys', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 0, 0),

('bx_payment_form_strp_card', @sName, 'card_number', '', '', 0, 'text', '_bx_payment_form_strp_card_input_card_number_sys', '_bx_payment_form_strp_card_input_card_number', '_bx_payment_form_strp_card_input_card_number_inf', 1, 0, 0, '', '', '', 'Avail', '', '_bx_payment_form_strp_card_input_card_number_err', 'Xss', '', 0, 0),
('bx_payment_form_strp_card', @sName, 'card_expire', '', '', 0, 'text', '_bx_payment_form_strp_card_input_card_expire_sys', '_bx_payment_form_strp_card_input_card_expire', '_bx_payment_form_strp_card_input_card_expire_inf', 1, 0, 0, '', '', '', 'Avail', '', '_bx_payment_form_strp_card_input_card_expire_err', 'Xss', '', 0, 0),
('bx_payment_form_strp_card', @sName, 'card_cvv', '', '', 0, 'text', '_bx_payment_form_strp_card_input_card_cvv_sys', '_bx_payment_form_strp_card_input_card_cvv', '_bx_payment_form_strp_card_input_card_cvv_inf', 1, 0, 0, '', '', '', 'Avail', '', '_bx_payment_form_strp_card_input_card_cvv_err', 'Xss', '', 0, 0),
('bx_payment_form_strp_card', @sName, 'controls', '', 'do_submit,do_cancel', 0, 'input_set', '', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_payment_form_strp_card', @sName, 'do_submit', '_bx_payment_form_strp_card_input_submit', '', 0, 'submit', '_bx_payment_form_strp_card_input_submit_sys', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_payment_form_strp_card', @sName, 'do_cancel', '_bx_payment_form_strp_card_input_cancel', '', 0, 'button', '_bx_payment_form_strp_card_input_cancel_sys', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 0, 0);


INSERT INTO `sys_form_display_inputs` (`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES
('bx_payment_form_pendings_process', 'id', 2147483647, 1, 1),
('bx_payment_form_pendings_process', 'seller_id', 2147483647, 1, 2),
('bx_payment_form_pendings_process', 'order', 2147483647, 1, 3),
('bx_payment_form_pendings_process', 'controls', 2147483647, 1, 4),
('bx_payment_form_pendings_process', 'do_submit', 2147483647, 1, 5),
('bx_payment_form_pendings_process', 'do_cancel', 2147483647, 1, 6),

('bx_payment_form_processed_add', 'seller_id', 2147483647, 1, 2),
('bx_payment_form_processed_add', 'client_id', 2147483647, 1, 3),
('bx_payment_form_processed_add', 'client', 2147483647, 1, 4),
('bx_payment_form_processed_add', 'order', 2147483647, 1, 5),
('bx_payment_form_processed_add', 'module_id', 2147483647, 1, 6),
('bx_payment_form_processed_add', 'items', 2147483647, 1, 7),
('bx_payment_form_processed_add', 'controls', 2147483647, 1, 8),
('bx_payment_form_processed_add', 'do_submit', 2147483647, 1, 9),
('bx_payment_form_processed_add', 'do_cancel', 2147483647, 1, 10),

('bx_payment_form_commissions_add', 'caption', 2147483647, 1, 1),
('bx_payment_form_commissions_add', 'description', 2147483647, 1, 2),
('bx_payment_form_commissions_add', 'acl_id', 2147483647, 1, 3),
('bx_payment_form_commissions_add', 'percentage', 2147483647, 1, 4),
('bx_payment_form_commissions_add', 'installment', 2147483647, 1, 5),
('bx_payment_form_commissions_add', 'controls', 2147483647, 1, 6),
('bx_payment_form_commissions_add', 'do_submit', 2147483647, 1, 7),
('bx_payment_form_commissions_add', 'do_cancel', 2147483647, 1, 8),

('bx_payment_form_commissions_edit', 'caption', 2147483647, 1, 1),
('bx_payment_form_commissions_edit', 'description', 2147483647, 1, 2),
('bx_payment_form_commissions_edit', 'acl_id', 2147483647, 1, 3),
('bx_payment_form_commissions_edit', 'percentage', 2147483647, 1, 4),
('bx_payment_form_commissions_edit', 'installment', 2147483647, 1, 5),
('bx_payment_form_commissions_edit', 'controls', 2147483647, 1, 6),
('bx_payment_form_commissions_edit', 'do_submit', 2147483647, 1, 7),
('bx_payment_form_commissions_edit', 'do_cancel', 2147483647, 1, 8),

('bx_payment_form_invoices_edit', 'amount', 2147483647, 1, 1),
('bx_payment_form_invoices_edit', 'date_due', 2147483647, 1, 2),
('bx_payment_form_invoices_edit', 'status', 2147483647, 1, 3),
('bx_payment_form_invoices_edit', 'controls', 2147483647, 1, 4),
('bx_payment_form_invoices_edit', 'do_submit', 2147483647, 1, 5),
('bx_payment_form_invoices_edit', 'do_cancel', 2147483647, 1, 6),

-- FORMS: Recurly
('bx_payment_form_rcrl_card_add', 'pending_id', 2147483647, 1, 1),
('bx_payment_form_rcrl_card_add', 'item', 2147483647, 1, 2),
('bx_payment_form_rcrl_card_add', 'token', 2147483647, 1, 3),
('bx_payment_form_rcrl_card_add', 'first_name', 2147483647, 1, 4),
('bx_payment_form_rcrl_card_add', 'last_name', 2147483647, 1, 5),
('bx_payment_form_rcrl_card_add', 'email', 2147483647, 1, 6),
('bx_payment_form_rcrl_card_add', 'card_number', 2147483647, 1, 7),
('bx_payment_form_rcrl_card_add', 'card_expire', 2147483647, 1, 8),
('bx_payment_form_rcrl_card_add', 'card_cvv', 2147483647, 1, 9),
('bx_payment_form_rcrl_card_add', 'controls', 2147483647, 1, 10),
('bx_payment_form_rcrl_card_add', 'do_submit', 2147483647, 1, 11),
('bx_payment_form_rcrl_card_add', 'do_cancel', 2147483647, 1, 12),

-- FORMS: Stripe
('bx_payment_form_strp_details_edit', 'item_id', 2147483647, 1, 1),
('bx_payment_form_strp_details_edit', 'controls', 2147483647, 1, 2),
('bx_payment_form_strp_details_edit', 'do_submit', 2147483647, 1, 3),
('bx_payment_form_strp_details_edit', 'do_cancel', 2147483647, 1, 4),

('bx_payment_form_strp_card_add', 'card_number', 2147483647, 1, 1),
('bx_payment_form_strp_card_add', 'card_expire', 2147483647, 1, 2),
('bx_payment_form_strp_card_add', 'card_cvv', 2147483647, 1, 3),
('bx_payment_form_strp_card_add', 'controls', 2147483647, 1, 4),
('bx_payment_form_strp_card_add', 'do_submit', 2147483647, 1, 5),
('bx_payment_form_strp_card_add', 'do_cancel', 2147483647, 1, 6);


-- PRE-VALUES
INSERT INTO `sys_form_pre_lists`(`key`, `title`, `module`, `use_for_sets`, `extendable`) VALUES
('bx_payment_currencies', '_bx_payment_pre_lists_currencies', 'bx_payment', '0', '0');

INSERT INTO `sys_form_pre_values`(`Key`, `Value`, `Order`, `LKey`, `LKey2`) VALUES
('bx_payment_currencies', 'AUD', 1, 'AUD', 'A&#36;'),
('bx_payment_currencies', 'CAD', 2, 'CAD', 'C&#36;'),
('bx_payment_currencies', 'EUR', 3, 'EUR', '&#8364;'),
('bx_payment_currencies', 'GBP', 4, 'GBP', '&#163;'),
('bx_payment_currencies', 'USD', 5, 'USD', '&#36;'),
('bx_payment_currencies', 'JPY', 6, 'YEN', '&#165;');

INSERT INTO `sys_form_pre_lists`(`key`, `title`, `module`, `use_for_sets`, `extendable`) VALUES
('bx_payment_reasons_cancel', '_bx_payment_pre_lists_reasons_cancel', 'bx_payment', '0', '1');

INSERT INTO `sys_form_pre_values`(`Key`, `Value`, `Order`, `LKey`, `LKey2`) VALUES
('bx_payment_reasons_cancel', 'rc_0', 7, '_bx_payment_pre_values_rc_0', ''),
('bx_payment_reasons_cancel', 'rc_1', 1, '_bx_payment_pre_values_rc_1', ''),
('bx_payment_reasons_cancel', 'rc_2', 2, '_bx_payment_pre_values_rc_2', ''),
('bx_payment_reasons_cancel', 'rc_3', 3, '_bx_payment_pre_values_rc_3', ''),
('bx_payment_reasons_cancel', 'rc_4', 4, '_bx_payment_pre_values_rc_4', ''),
('bx_payment_reasons_cancel', 'rc_5', 5, '_bx_payment_pre_values_rc_5', ''),
('bx_payment_reasons_cancel', 'rc_6', 6, '_bx_payment_pre_values_rc_6', '');

-- STUDIO PAGE & WIDGET
INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, @sName, '_bx_payment', '_bx_payment', 'bx_payment@modules/boonex/payment/|std-icon.svg');
SET @iPageId = LAST_INSERT_ID();

SET @iParentPageId = (SELECT `id` FROM `sys_std_pages` WHERE `name` = 'home');
SET @iParentPageOrder = (SELECT MAX(`order`) FROM `sys_std_pages_widgets` WHERE `page_id` = @iParentPageId);
INSERT INTO `sys_std_widgets` (`page_id`, `module`, `type`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`) VALUES
(@iPageId, @sName, 'extensions', '{url_studio}module.php?name=bx_payment', '', 'bx_payment@modules/boonex/payment/|std-icon.svg', '_bx_payment', '', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:18:"TemplStudioModules";}');
INSERT INTO `sys_std_pages_widgets` (`page_id`, `widget_id`, `order`) VALUES
(@iParentPageId, LAST_INSERT_ID(), IF(ISNULL(@iParentPageOrder), 1, @iParentPageOrder + 1));
