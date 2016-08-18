/* Replace with your SQL commands */
--
-- Table structure for table `BiocDownloadStatistics`
--

DROP TABLE IF EXISTS `BiocDownloadStatistics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `BiocDownloadStatistics` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `package_name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `distinct_ips` int(11) NOT NULL,
  `downloads` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `date` DATE NOT NULL,
  FOREIGN KEY (`package_name`) REFERENCES `Packages` (`name`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE UNIQUE INDEX bioc_package_month ON BiocDownloadStatistics(package_name,date);
