SET @sName = 'bx_analytics';

-- TABLES

-- One row per visit: the visitor, the client it came from and how it arrived
CREATE TABLE IF NOT EXISTS `bx_analytics_sessions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `visitor` binary(16) NOT NULL,
  `profile_id` int(11) unsigned NOT NULL DEFAULT '0',
  `platform` varchar(16) NOT NULL DEFAULT '',
  `app` varchar(64) NOT NULL DEFAULT '',
  `app_version` varchar(32) NOT NULL DEFAULT '',
  `started` int(11) unsigned NOT NULL DEFAULT '0',
  `last_seen` int(11) unsigned NOT NULL DEFAULT '0',
  `duration` int(11) unsigned NOT NULL DEFAULT '0',
  `pageviews` smallint(5) unsigned NOT NULL DEFAULT '0',
  `events` smallint(5) unsigned NOT NULL DEFAULT '0',
  `errors` smallint(5) unsigned NOT NULL DEFAULT '0',
  `bounce` tinyint(4) unsigned NOT NULL DEFAULT '1',
  `hostname` varchar(128) NOT NULL DEFAULT '',
  `entry_path` varchar(255) NOT NULL DEFAULT '',
  `exit_path` varchar(255) NOT NULL DEFAULT '',
  `referrer` varchar(255) NOT NULL DEFAULT '',
  `referrer_host` varchar(128) NOT NULL DEFAULT '',
  `channel` varchar(16) NOT NULL DEFAULT '',
  `utm_source` varchar(128) NOT NULL DEFAULT '',
  `utm_medium` varchar(128) NOT NULL DEFAULT '',
  `utm_campaign` varchar(128) NOT NULL DEFAULT '',
  `utm_term` varchar(128) NOT NULL DEFAULT '',
  `utm_content` varchar(128) NOT NULL DEFAULT '',
  `country` char(2) NOT NULL DEFAULT '',
  `region` varchar(64) NOT NULL DEFAULT '',
  `city` varchar(64) NOT NULL DEFAULT '',
  `lat` decimal(4,1) DEFAULT NULL,
  `lng` decimal(4,1) DEFAULT NULL,
  `language` varchar(16) NOT NULL DEFAULT '',
  `browser` varchar(32) NOT NULL DEFAULT '',
  `browser_version` varchar(16) NOT NULL DEFAULT '',
  `os` varchar(32) NOT NULL DEFAULT '',
  `os_version` varchar(16) NOT NULL DEFAULT '',
  `device` varchar(16) NOT NULL DEFAULT '',
  `screen` varchar(16) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  -- the visitor's open visit; read in this order, retention cohorts need no sort
  KEY `visitor` (`visitor`, `last_seen`, `started`, `platform`, `profile_id`),
  -- covers the key figures and their chart (no row is read for them)
  KEY `started` (`started`, `platform`, `visitor`, `profile_id`, `pageviews`, `bounce`, `duration`),
  KEY `last_seen` (`last_seen`),
  KEY `platform_seen` (`platform`, `last_seen`),
  -- a member's visits; with the last hit and the platform it pages the members list alone
  KEY `profile_id` (`profile_id`, `started`, `last_seen`, `platform`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One row per pageview or event; visitor, profile and platform are copied from the session
CREATE TABLE IF NOT EXISTS `bx_analytics_events` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `session_id` bigint(20) unsigned NOT NULL,
  `visitor` binary(16) NOT NULL,
  `profile_id` int(11) unsigned NOT NULL DEFAULT '0',
  `platform` varchar(16) NOT NULL DEFAULT '',
  `ts` int(11) unsigned NOT NULL DEFAULT '0',
  `type` varchar(16) NOT NULL DEFAULT 'pageview',
  `name` varchar(64) NOT NULL DEFAULT '',
  `hostname` varchar(128) NOT NULL DEFAULT '',
  `path` varchar(255) NOT NULL DEFAULT '',
  `title` varchar(255) NOT NULL DEFAULT '',
  `module` varchar(32) NOT NULL DEFAULT '',
  `object_id` int(11) unsigned NOT NULL DEFAULT '0',
  `context_id` int(11) unsigned NOT NULL DEFAULT '0',
  `value` double NOT NULL DEFAULT '0',
  `engaged` int(11) unsigned NOT NULL DEFAULT '0',
  `props` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ts` (`ts`, `type`, `platform`),
  -- covers pages and the events list by type and period
  KEY `type_ts` (`type`, `ts`, `platform`, `path`, `name`, `module`, `visitor`, `session_id`, `engaged`),
  KEY `platform` (`platform`, `ts`),
  KEY `session_id` (`session_id`, `ts`),
  -- covers one page (a filter, a goal, a funnel step, the Query chart) over a period, on a platform too
  KEY `path` (`type`, `path`, `ts`, `platform`, `session_id`, `visitor`, `engaged`),
  -- the same for page titles: the titles tab, a title filter
  KEY `title` (`type`, `title`, `ts`, `platform`, `session_id`, `visitor`, `engaged`),
  KEY `name` (`type`, `name`, `ts`),
  -- a site action about something: forgetting a deleted profile finds its creation by it
  KEY `object` (`type`, `name`, `object_id`),
  -- a member's events: forgetting a deleted profile, the member's actions in a period
  KEY `profile_id` (`profile_id`, `ts`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A random salt per day for cookieless visitor ids; cron deletes old ones
CREATE TABLE IF NOT EXISTS `bx_analytics_salts` (
  `day` date NOT NULL,
  `salt` binary(32) NOT NULL,
  PRIMARY KEY (`day`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rate limits of the public collector: hits per address and minute, new visits per address
-- and hour. The key is a keyed hash of the kind and the address with the day's salt, never
-- the address; `bucket` is the minute's or hour's start. Cron deletes buckets over 2 hours old
CREATE TABLE IF NOT EXISTS `bx_analytics_limits` (
  `key` binary(8) NOT NULL,
  `bucket` int(11) unsigned NOT NULL,
  `hits` int(11) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`key`, `bucket`),
  KEY `bucket` (`bucket`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Bots and agents per day: crawlers, AI fetchers, link previews and scripts don't run the
-- tracker, so they are counted on the server and kept as daily totals, not as visits
CREATE TABLE IF NOT EXISTS `bx_analytics_bots` (
  `day` date NOT NULL,
  `bot` varchar(64) NOT NULL,
  `category` varchar(16) NOT NULL DEFAULT '',
  `platform` varchar(16) NOT NULL DEFAULT '',
  `hits` int(11) unsigned NOT NULL DEFAULT '0',
  `last_seen` int(11) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`day`, `bot`, `platform`),
  KEY `category` (`category`, `day`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pages bots asked for, per day and bot category
CREATE TABLE IF NOT EXISTS `bx_analytics_bot_pages` (
  `day` date NOT NULL,
  `category` varchar(16) NOT NULL DEFAULT '',
  `path_hash` binary(8) NOT NULL,
  `path` varchar(255) NOT NULL DEFAULT '',
  `hits` int(11) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`day`, `category`, `path_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Goals: a page (path, * for any characters) or an event (name, or name@module) that
-- counts as a conversion
CREATE TABLE IF NOT EXISTS `bx_analytics_goals` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(128) NOT NULL DEFAULT '',
  `type` varchar(16) NOT NULL DEFAULT 'page',
  `pattern` varchar(255) NOT NULL DEFAULT '',
  `added` int(11) unsigned NOT NULL DEFAULT '0',
  `order` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Funnels: steps as a JSON list of {type, pattern}, matched in order within a visit
CREATE TABLE IF NOT EXISTS `bx_analytics_funnels` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(128) NOT NULL DEFAULT '',
  `steps` text NOT NULL,
  `added` int(11) unsigned NOT NULL DEFAULT '0',
  `order` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Revenue ledger: one row per money movement the payment module reports (a sale, a renewal,
-- a refund or a reversal of a processed order), with the amount in the site's default
-- currency and the platform and traffic source of the buyer. Pruning never touches it.
-- A subscription's trial is registered at the full price although nothing was charged: those
-- rows have the kind `trial` and no revenue report reads them. A transaction has one charge
-- row (sale, renewal or trial) and at most one negation (refund or reversal), hence the
-- unique key on the payment module, transaction and kind.
CREATE TABLE IF NOT EXISTS `bx_analytics_revenue` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `ts` int(11) unsigned NOT NULL DEFAULT '0',
  `kind` varchar(16) NOT NULL DEFAULT '',
  `cash` tinyint(4) unsigned NOT NULL DEFAULT '1',
  `payment` varchar(32) NOT NULL DEFAULT '',
  `pending_id` int(11) unsigned NOT NULL DEFAULT '0',
  `transaction_id` int(11) unsigned NOT NULL DEFAULT '0',
  `order` varchar(32) NOT NULL DEFAULT '',
  `module_id` int(11) unsigned NOT NULL DEFAULT '0',
  `module` varchar(32) NOT NULL DEFAULT '',
  `item_id` int(11) unsigned NOT NULL DEFAULT '0',
  `item_count` int(11) unsigned NOT NULL DEFAULT '0',
  `seller_id` int(11) unsigned NOT NULL DEFAULT '0',
  `author_id` int(11) unsigned NOT NULL DEFAULT '0',
  `client_id` int(11) unsigned NOT NULL DEFAULT '0',
  `provider` varchar(32) NOT NULL DEFAULT '',
  `type` varchar(16) NOT NULL DEFAULT '',
  `amount` decimal(14,4) NOT NULL DEFAULT '0',
  `currency` varchar(4) NOT NULL DEFAULT '',
  `rate` double NOT NULL DEFAULT '1',
  `amount_default` decimal(14,4) DEFAULT NULL,
  `platform` varchar(16) NOT NULL DEFAULT '',
  `session_id` bigint(20) unsigned NOT NULL DEFAULT '0',
  `first_channel` varchar(16) NOT NULL DEFAULT '',
  `first_referrer_host` varchar(128) NOT NULL DEFAULT '',
  `first_utm_campaign` varchar(128) NOT NULL DEFAULT '',
  `last_channel` varchar(16) NOT NULL DEFAULT '',
  `last_referrer_host` varchar(128) NOT NULL DEFAULT '',
  `last_utm_campaign` varchar(128) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `movement` (`payment`, `transaction_id`, `kind`),
  KEY `ts` (`cash`, `ts`, `platform`),
  KEY `pending` (`payment`, `pending_id`),
  KEY `module` (`module_id`, `ts`),
  KEY `seller` (`seller_id`, `ts`),
  KEY `client` (`client_id`, `ts`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subscriptions as the ledger sees them: plan, price per period and per month (MRR) in the
-- default currency, when they started, were first and last paid, and were cancelled
CREATE TABLE IF NOT EXISTS `bx_analytics_subscriptions` (
  `payment` varchar(32) NOT NULL DEFAULT '',
  `pending_id` int(11) unsigned NOT NULL DEFAULT '0',
  `subscription_id` varchar(32) NOT NULL DEFAULT '',
  `client_id` int(11) unsigned NOT NULL DEFAULT '0',
  `seller_id` int(11) unsigned NOT NULL DEFAULT '0',
  `module_id` int(11) unsigned NOT NULL DEFAULT '0',
  `module` varchar(32) NOT NULL DEFAULT '',
  `item_id` int(11) unsigned NOT NULL DEFAULT '0',
  `provider` varchar(32) NOT NULL DEFAULT '',
  `period` int(11) unsigned NOT NULL DEFAULT '1',
  `period_unit` varchar(16) NOT NULL DEFAULT '',
  `trial` int(11) unsigned NOT NULL DEFAULT '0',
  `amount_default` decimal(14,4) DEFAULT NULL,
  `mrr_default` decimal(14,4) DEFAULT NULL,
  `status` varchar(16) NOT NULL DEFAULT '',
  `started` int(11) unsigned NOT NULL DEFAULT '0',
  `first_paid` int(11) unsigned NOT NULL DEFAULT '0',
  `last_paid` int(11) unsigned NOT NULL DEFAULT '0',
  `paid_count` int(11) unsigned NOT NULL DEFAULT '0',
  `canceled` int(11) unsigned NOT NULL DEFAULT '0',
  `reason` varchar(255) NOT NULL DEFAULT '',
  `platform` varchar(16) NOT NULL DEFAULT '',
  PRIMARY KEY (`payment`, `pending_id`),
  KEY `paid` (`first_paid`, `canceled`),
  KEY `started` (`started`),
  KEY `canceled` (`canceled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Client errors grouped by fingerprint (kind, normalized message, top frame, HTTP status),
-- with a sample stack. `created` is server time, for the limit of new groups an hour;
-- `first_seen` and `last_seen` are when the errors happened.
CREATE TABLE IF NOT EXISTS `bx_analytics_errors` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `fingerprint` binary(16) NOT NULL,
  `kind` varchar(16) NOT NULL DEFAULT 'js',
  `message` varchar(255) NOT NULL DEFAULT '',
  `source` varchar(255) NOT NULL DEFAULT '',
  `line` int(11) unsigned NOT NULL DEFAULT '0',
  `col` int(11) unsigned NOT NULL DEFAULT '0',
  `status_code` smallint(5) unsigned NOT NULL DEFAULT '0',
  `stack` text NOT NULL,
  `stack_ts` int(11) unsigned NOT NULL DEFAULT '0',
  `first_seen` int(11) unsigned NOT NULL DEFAULT '0',
  `last_seen` int(11) unsigned NOT NULL DEFAULT '0',
  `occurrences` int(11) unsigned NOT NULL DEFAULT '0',
  `fatal` tinyint(4) unsigned NOT NULL DEFAULT '0',
  `status` varchar(16) NOT NULL DEFAULT 'open',
  `status_changed` int(11) unsigned NOT NULL DEFAULT '0',
  `created` int(11) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `fingerprint` (`fingerprint`),
  KEY `created` (`created`),
  KEY `last_seen` (`last_seen`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One row per error report from a client (repeats on one page counted in `repeats`). The
-- client's columns are copied, so an error outside a visit (`session_id` 0) still has them.
CREATE TABLE IF NOT EXISTS `bx_analytics_error_hits` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `error_id` int(11) unsigned NOT NULL,
  `ts` int(11) unsigned NOT NULL DEFAULT '0',
  `session_id` bigint(20) unsigned NOT NULL DEFAULT '0',
  `visitor` binary(16) NOT NULL,
  `profile_id` int(11) unsigned NOT NULL DEFAULT '0',
  `platform` varchar(16) NOT NULL DEFAULT '',
  `app_version` varchar(32) NOT NULL DEFAULT '',
  `browser` varchar(32) NOT NULL DEFAULT '',
  `os` varchar(32) NOT NULL DEFAULT '',
  `device` varchar(16) NOT NULL DEFAULT '',
  `country` char(2) NOT NULL DEFAULT '',
  `path` varchar(255) NOT NULL DEFAULT '',
  `route` varchar(128) NOT NULL DEFAULT '',
  `repeats` smallint(5) unsigned NOT NULL DEFAULT '1',
  `fatal` tinyint(4) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `ts` (`ts`, `platform`),
  KEY `error_id` (`error_id`, `ts`),
  KEY `profile_id` (`profile_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Web vitals and app timings: one row per sampled page view or screen, NULL for what wasn't
-- measured; milliseconds, CLS in thousandths. No visitor or member is stored.
CREATE TABLE IF NOT EXISTS `bx_analytics_vitals` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `ts` int(11) unsigned NOT NULL DEFAULT '0',
  `session_id` bigint(20) unsigned NOT NULL DEFAULT '0',
  `platform` varchar(16) NOT NULL DEFAULT '',
  `device` varchar(16) NOT NULL DEFAULT '',
  `path` varchar(255) NOT NULL DEFAULT '',
  `route` varchar(128) NOT NULL DEFAULT '',
  `nav` varchar(16) NOT NULL DEFAULT '',
  `ttfb` mediumint(8) unsigned DEFAULT NULL,
  `fcp` mediumint(8) unsigned DEFAULT NULL,
  `lcp` mediumint(8) unsigned DEFAULT NULL,
  `inp` mediumint(8) unsigned DEFAULT NULL,
  `cls` smallint(5) unsigned DEFAULT NULL,
  `screen_load` mediumint(8) unsigned DEFAULT NULL,
  `app_start` mediumint(8) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ts` (`ts`, `platform`),
  KEY `route` (`route`, `ts`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- STUDIO: page & widget
INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, @sName, '_bx_analytics', '_bx_analytics', 'bx_analytics@modules/boonex/analytics/|std-icon.svg');

SET @iPageId = LAST_INSERT_ID();

INSERT INTO `sys_std_widgets` (`page_id`, `module`, `type`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`, `featured`) 
VALUES(@iPageId, @sName, 'extensions', '{url_studio}module.php?name=bx_analytics', '', 'bx_analytics@modules/boonex/analytics/|std-icon.svg', '_bx_analytics', '', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:18:"TemplStudioModules";}', 0);

SET @iParentPageId = (SELECT `id` FROM `sys_std_pages` WHERE `name` = 'home');
SET @iParentPageOrder = (SELECT IFNULL(MAX(`order`), 0) + 1 FROM `sys_std_pages_widgets` WHERE `page_id` = @iParentPageId);

INSERT INTO `sys_std_pages_widgets` (`page_id`, `widget_id`, `order`) VALUES
(@iParentPageId, LAST_INSERT_ID(), @iParentPageOrder);
