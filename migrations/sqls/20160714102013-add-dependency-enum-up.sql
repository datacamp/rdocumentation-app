/* Replace with your SQL commands */

ALTER TABLE Dependencies CHANGE type type ENUM('depends','imports','suggests','enhances', 'linkingto');
