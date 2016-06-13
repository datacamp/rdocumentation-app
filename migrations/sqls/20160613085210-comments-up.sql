CREATE TABLE `Comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `description` TEXT COLLATE utf8_unicode_ci NOT NULL,
  `commentable` varchar(255) NOT NULL,
  `commentable_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `user_id` int(11) NOT NULL REFERENCES Users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
