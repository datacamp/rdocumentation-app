# ************************************************************
# Sequel Pro SQL dump
# Version 4541
#
# http://www.sequelpro.com/
# https://github.com/sequelpro/sequelpro
#
# Host: 192.168.99.100 (MySQL 5.7.12)
# Database: rdoc
# Generation Time: 2016-06-03 10:50:37 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Dump of table Aliases
# ------------------------------------------------------------

DROP TABLE IF EXISTS `Aliases`;

CREATE TABLE `Aliases` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `topic_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `topic_id` (`topic_id`),
  CONSTRAINT `Aliases_ibfk_1` FOREIGN KEY (`topic_id`) REFERENCES `Topics` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;



# Dump of table Arguments
# ------------------------------------------------------------

DROP TABLE IF EXISTS `Arguments`;

CREATE TABLE `Arguments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `description` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `topic_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `topic_id` (`topic_id`),
  CONSTRAINT `Arguments_ibfk_1` FOREIGN KEY (`topic_id`) REFERENCES `Topics` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;



# Dump of table Collaborations
# ------------------------------------------------------------

DROP TABLE IF EXISTS `Collaborations`;

CREATE TABLE `Collaborations` (
  `author_id` int(11) NOT NULL,
  `authored_version_id` int(11) NOT NULL,
  PRIMARY KEY (`author_id`,`authored_version_id`),
  KEY `authored_version_id` (`authored_version_id`),
  CONSTRAINT `Collaborations_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `Collaborators` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Collaborations_ibfk_2` FOREIGN KEY (`authored_version_id`) REFERENCES `PackageVersions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;



# Dump of table Collaborators
# ------------------------------------------------------------

DROP TABLE IF EXISTS `Collaborators`;

CREATE TABLE `Collaborators` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `Collaborators_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;



# Dump of table Dependencies
# ------------------------------------------------------------

DROP TABLE IF EXISTS `Dependencies`;

CREATE TABLE `Dependencies` (
  `dependency_version` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `version_comparator` enum('<','<=','=','>=','>') COLLATE utf8_unicode_ci DEFAULT NULL,
  `type` enum('depends','imports','suggests','enhances') COLLATE utf8_unicode_ci DEFAULT NULL,
  `dependency_name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `dependant_version_id` int(11) NOT NULL,
  PRIMARY KEY (`dependency_name`,`dependant_version_id`),
  KEY `dependant_version_id` (`dependant_version_id`),
  CONSTRAINT `Dependencies_ibfk_1` FOREIGN KEY (`dependency_name`) REFERENCES `Packages` (`name`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Dependencies_ibfk_2` FOREIGN KEY (`dependant_version_id`) REFERENCES `PackageVersions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;



# Dump of table Packages
# ------------------------------------------------------------

DROP TABLE IF EXISTS `Packages`;

CREATE TABLE `Packages` (
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `latest_version_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `Packages_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;



# Dump of table PackageVersions
# ------------------------------------------------------------

DROP TABLE IF EXISTS `PackageVersions`;

CREATE TABLE `PackageVersions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `package_name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `version` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `description` text COLLATE utf8_unicode_ci NOT NULL,
  `release_date` datetime DEFAULT NULL,
  `license` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `url` text COLLATE utf8_unicode_ci,
  `copyright` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `maintainer_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `package_versions_package_name_version` (`package_name`,`version`),
  KEY `maintainer_id` (`maintainer_id`),
  CONSTRAINT `PackageVersions_ibfk_1` FOREIGN KEY (`package_name`) REFERENCES `Packages` (`name`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `PackageVersions_ibfk_2` FOREIGN KEY (`maintainer_id`) REFERENCES `Collaborators` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;



# Dump of table Sections
# ------------------------------------------------------------

DROP TABLE IF EXISTS `Sections`;

CREATE TABLE `Sections` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `description` text COLLATE utf8_unicode_ci,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `topic_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `topic_id` (`topic_id`),
  CONSTRAINT `Sections_ibfk_1` FOREIGN KEY (`topic_id`) REFERENCES `Topics` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;



# Dump of table Tags
# ------------------------------------------------------------

DROP TABLE IF EXISTS `Tags`;

CREATE TABLE `Tags` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `topic_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `topic_id` (`topic_id`),
  CONSTRAINT `Tags_ibfk_1` FOREIGN KEY (`topic_id`) REFERENCES `Topics` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;



# Dump of table Topics
# ------------------------------------------------------------

DROP TABLE IF EXISTS `Topics`;

CREATE TABLE `Topics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `title` text COLLATE utf8_unicode_ci NOT NULL,
  `description` text COLLATE utf8_unicode_ci,
  `usage` text COLLATE utf8_unicode_ci,
  `details` text COLLATE utf8_unicode_ci,
  `value` text COLLATE utf8_unicode_ci,
  `references` text COLLATE utf8_unicode_ci,
  `note` text COLLATE utf8_unicode_ci,
  `author` text COLLATE utf8_unicode_ci,
  `seealso` text COLLATE utf8_unicode_ci,
  `examples` text COLLATE utf8_unicode_ci,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `package_version_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `topics_name_package_version_id` (`name`,`package_version_id`),
  KEY `package_version_id` (`package_version_id`),
  CONSTRAINT `Topics_ibfk_1` FOREIGN KEY (`package_version_id`) REFERENCES `PackageVersions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;




/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
