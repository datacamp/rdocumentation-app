DROP TABLE IF EXISTS `Percentiles`;

CREATE TABLE `Percentiles` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `percentile` double(5,2) NOT NULL,
  `value` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  UNIQUE (percentile)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;