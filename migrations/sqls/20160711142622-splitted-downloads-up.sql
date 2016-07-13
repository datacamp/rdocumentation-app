/* Replace with your SQL commands */
ALTER TABLE DownloadStatistics
ADD (`last_month_downloads_direct` int(11) NOT NULL,
     `last_month_downloads_indirect` int(11) NOT NULL,
     `date` DATE NOT NULL,);
