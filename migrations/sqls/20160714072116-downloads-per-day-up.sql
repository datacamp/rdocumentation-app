/* Replace with your SQL commands */
ALTER TABLE `DownloadStatistics`
DROP `last_month_downloads_direct`,
DROP `last_month_downloads_indirect`,
DROP `last_month_downloads`;

ALTER TABLE DownloadStatistics
ADD (`direct_downloads` int(11) NOT NULL,
     `indirect_downloads` int(11) NOT NULL,
     `date` DATE NOT NULL);

CREATE INDEX package_name_index ON DownloadStatistics(package_name);
CREATE UNIQUE INDEX package_month ON DownloadStatistics(package_name,date);
ALTER TABLE rdoc.DownloadStatistics DROP INDEX package;
