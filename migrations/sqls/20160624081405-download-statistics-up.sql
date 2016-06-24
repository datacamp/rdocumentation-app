CREATE TABLE `DownloadStatistics` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `package_name` varchar(255) NOT NULL,
  `last_month_downloads` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  UNIQUE KEY `package` (`package_name`),
  CONSTRAINT `DownloadStatistics_ibfk_1` FOREIGN KEY (`package_name`) REFERENCES `Packages` (`name`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;
