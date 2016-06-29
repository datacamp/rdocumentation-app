DROP FUNCTION IF EXISTS ORDER_VERSION;

CREATE FUNCTION ORDER_VERSION (v varchar(255))
RETURNS decimal
DETERMINISTIC
BEGIN
  DECLARE replaced varchar(255);
  DECLARE CONTINUE HANDLER FOR 1411
     RETURN 1;
  SET replaced = REPLACE(v, '-', '.');
  RETURN INET_ATON(replaced);
END;


ALTER TABLE Packages ADD CONSTRAINT fk_latest_version_id FOREIGN KEY (latest_version_id) REFERENCES PackageVersions(id);


UPDATE Packages AS p
INNER JOIN (
  SELECT id, v.version, v.package_name
  FROM PackageVersions v
  INNER JOIN
    (SELECT v.package_name, MAX(ORDER_VERSION(v.version)) as inet_version
    FROM PackageVersions v
    GROUP BY v.package_name) lv
  ON v.package_name = lv.package_name
  AND ORDER_VERSION(v.version) = lv.inet_version
) AS l
ON l.package_name = p.name
SET p.latest_version_id = l.id;
