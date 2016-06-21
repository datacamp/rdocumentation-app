CREATE TABLE `TaskViews` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(255) NOT NULL,
  `url` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  UNIQUE KEY `task_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `TaskViewPackages` (
  `task_id` int(11) NOT NULL,
  `package_name` varchar(255) NOT NULL,
  PRIMARY KEY (`task_id`,`package_name`),
  CONSTRAINT `TaskViews_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `TaskViews` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `TaskViewPackages_ibfk_1` FOREIGN KEY (`package_name`) REFERENCES `Packages` (`name`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
