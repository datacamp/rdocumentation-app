/* Replace with your SQL commands */

ALTER TABLE Aliases DROP FOREIGN KEY `Aliases_ibfk_1`;

ALTER TABLE Aliases ADD CONSTRAINT `Aliases_ibfk_1` FOREIGN KEY (`topic_id`)
            REFERENCES `Topics` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE Arguments DROP FOREIGN KEY `Arguments_ibfk_1`;

ALTER TABLE Arguments ADD CONSTRAINT `Arguments_ibfk_1` FOREIGN KEY (`topic_id`)
            REFERENCES `Topics` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE Sections DROP FOREIGN KEY `Sections_ibfk_1`;

ALTER TABLE Sections ADD CONSTRAINT `Sections_ibfk_1` FOREIGN KEY (`topic_id`)
            REFERENCES `Topics` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

DELETE FROM Aliases WHERE topic_id IS NULL;
DELETE FROM Arguments WHERE topic_id IS NULL;
DELETE FROM Sections WHERE topic_id IS NULL;
