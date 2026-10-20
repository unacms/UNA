--
-- MariaDB vector tables. The RC3 upgrade script runs this file when the server
-- is MariaDB 11.7 or newer. UUID and VECTOR are not available before that.
-- One table per embedding width. A VECTOR column has a fixed width, so 1024 and 384 cannot share a table.
--

DROP TABLE IF EXISTS `sys_agents_vector_mariadb_1024`, `sys_agents_vector_mariadb_384`;

CREATE TABLE IF NOT EXISTS `sys_agents_vector_mariadb_1024` (
  `id` uuid NOT NULL,
  `content` text,
  `sourceType` varchar(255),
  `sourceName` varchar(255),
  `metadata` json,
  `embedding` vector(1024) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sourceType` (`sourceType`),
  VECTOR INDEX (`embedding`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `sys_agents_vector_mariadb_384` (
  `id` uuid NOT NULL,
  `content` text,
  `sourceType` varchar(255),
  `sourceName` varchar(255),
  `metadata` json,
  `embedding` vector(384) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sourceType` (`sourceType`),
  VECTOR INDEX (`embedding`)
) ENGINE=InnoDB;
