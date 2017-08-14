/* Replace with your SQL commands */
ALTER TABLE `PackageVersions` DROP COLUMN `parser_version`;

CREATE TABLE `ParsingJobs` (
  `package_name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `package_version` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `parser_version` int(11) DEFAULT 0,
  `parsed_at` datetime NOT NULL,
  `parsing_status` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `error` text COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY(`package_name`, `package_version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

INSERT INTO `ParsingJobs` (`package_name`, `package_version`, `parsed_at`, `parsing_status`)
SELECT `package_name`, `version`, NOW(), "succes"
FROM  `PackageVersions`
