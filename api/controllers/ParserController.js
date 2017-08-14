module.exports = {
  list: function(req, res) {
    var limit = Utils.parseLimit(req),
      offset = Utils.parseSkip(req),
      parser_version = req.param('parser_version');

    sequelize.query(`SELECT p.name as name, pv.version as version FROM DownloadStatistics ds, Packages p, PackageVersions pv, ParsingJobs job
      WHERE ds.date > DATE(NOW() - INTERVAL 1 MONTH)
      && p.latest_version_id = pv.id
      && ds.package_name = p.name
      && job.package_name = pv.package_name
      && job.package_version = pv.version
      && job.parser_version < :parser_version
      GROUP BY ds.package_name
      ORDER BY SUM(ds.direct_downloads) DESC LIMIT :limit OFFSET :offset`,
      { replacements: { parser_version: parser_version, limit:limit, offset:offset }, type: sequelize.QueryTypes.SELECT }
    ).then(function(packages) {
      return res.json(packages);
    }).catch(function(err) {
      return res.negotiate(err);
    });


  }
}
