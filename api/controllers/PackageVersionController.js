/**
 * PackageVersionController
 *
 * @description :: Server-side logic for managing packageversions
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {


  importDescription: function(req, res) {
    var result = PackageVersion.createWithDescriptionFile({input: req.body});
    result.then(function(value) {
      //console.log(value.dependencies);
      res.json(value);
    }).catch(function(err){
        return res.negotiate(err);
    });
  },


  findByNameVersion: function(req, res) {
    var packageName = req.param('name');
    var packageVersion = req.param('version');


    PackageVersion.findOne({
      where: {
        package_name: packageName,
        version: packageVersion
      },
      include: [{ model: Collaborator, as: 'maintainer' }]
    }).then(function(version) {
      res.ok(version);
    }).catch(function(err) {
      return res.negotiate(err);
    });

  }

};

