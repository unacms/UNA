-- UNA-Migration-Min-System-Version: 15.0.0-RC3
-- API v2 Idempotency-Key (BxDolApiV2Idempotency): the first answer to a signed-in write, replayed for a day.
-- scope: sha256 of the credential; fingerprint: sha256 of the request; status NULL while it runs.
CREATE TABLE IF NOT EXISTS `sys_api_idempotency` (
  `scope` binary(32) NOT NULL,
  `key` varchar(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `fingerprint` binary(32) NOT NULL,
  `status` smallint(5) unsigned DEFAULT NULL,
  `headers` text,
  `body` mediumblob,
  `added` int(10) unsigned NOT NULL,
  PRIMARY KEY (`scope`, `key`),
  KEY `added` (`added`)
) ENGINE=InnoDB;
