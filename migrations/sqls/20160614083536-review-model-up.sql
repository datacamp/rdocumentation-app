DROP TABLE IF EXISTS `Comments`;

CREATE TABLE `Reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `rating` TINYINT NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `text` TEXT COLLATE utf8_unicode_ci DEFAULT NULL,
  `reviewable` varchar(255) NOT NULL,
  `reviewable_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `user_id` int(11) NOT NULL REFERENCES Users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
