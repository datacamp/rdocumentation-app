CREATE TABLE `ApiTokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `token` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `can_create` BOOL NOT NULL DEFAULT 0,
  `can_update` BOOL NOT NULL DEFAULT 0,
  `can_delete` BOOL NOT NULL DEFAULT 0,
  `expire_at` datetime NOT NULL,
  UNIQUE KEY `token_unq` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
