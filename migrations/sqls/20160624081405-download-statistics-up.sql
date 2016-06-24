CREATE TABLE `DownloadStatistics` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `package_name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `last_month_downloads` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  UNIQUE KEY `package` (`package_name`),
  FOREIGN KEY (`package_name`) REFERENCES `Packages` (`name`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
