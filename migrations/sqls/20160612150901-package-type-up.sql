CREATE TABLE `Repositories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

INSERT INTO Repositories (name) VALUES ('cran'),('bioconductor'),('github');

ALTER TABLE `Packages` ADD COLUMN `type_id` int(11) NOT NULL;

UPDATE `Packages` SET `type_id` = (SELECT id from `Repositories` Where `name` = 'cran');

ALTER TABLE `Packages` ADD CONSTRAINT fk_type_id FOREIGN KEY (type_id) REFERENCES Repositories(id);
