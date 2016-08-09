/**
 * Dependency.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {


  attributes: {

    dependency_version: {
      type: Sequelize.STRING
    },

    version_comparator: {
      type: Sequelize.ENUM('<', '<=', '=', '>=', '>')
    },

    type: {
      type: Sequelize.ENUM('depends', 'imports', 'suggests', 'enhances', 'linkingto'),
      allowNull: true
    }

  },

  associations: function() {
  },

  options: {
    underscored: true,
    timestamps: false,

    classMethods: {
      findByDependant: function(dependant_package_name) {
        return sequelize.query("SELECT DISTINCT d.dependency_name from Dependencies d INNER JOIN PackageVersions p on d.dependant_version_id = p.id WHERE p.package_name = ?;",{ replacements: [dependant_package_name], type: sequelize.QueryTypes.SELECT}).then(function(data){

          return data;
        });
      },
      findByDependingOn: function(depending_on_package_name) {
        return sequelize.query("SELECT DISTINCT p.package_name from Dependencies d INNER JOIN PackageVersions p on d.dependant_version_id = p.id WHERE d.dependency_name = ?;",{ replacements: [depending_on_package_name], type: sequelize.QueryTypes.SELECT}).then(function(data){

          return data;
        });
      },

      findIndirectReverseDependencies: function(package) {
        console.log('saerch reverse');
        var query = "SELECT  " +
           "   firstlevel.package_name as direct_reverse_dependencies,  " +
           "   secondlevel.package_name as indirect_reverse_dependencies  " +
           "   FROM " +
           "   (SELECT DISTINCT v.package_name FROM Dependencies d INNER JOIN PackageVersions v ON d.`dependant_version_id` = v.id INNER JOIN DownloadStatistics s ON s.`package_name` = v.`package_name`  " +
           "    WHERE d.`dependency_name` = 'Rcpp' ORDER BY s.`direct_downloads` LIMIT 100) firstlevel " +
           "   LEFT OUTER JOIN  " +
           "   (SELECT DISTINCT d.dependency_name, v.package_name FROM Dependencies d INNER JOIN PackageVersions v ON d.`dependant_version_id` = v.id WHERE d.dependency_name IN  " +
           "     (SELECT DISTINCT v.package_name FROM Dependencies d INNER JOIN PackageVersions v ON d.`dependant_version_id` = v.id WHERE d.`dependency_name` = 'Rcpp')) secondlevel " +
           "   ON secondlevel.`dependency_name` = firstlevel.package_name; ";
        return sequelize.query(query,{
          replacements: [package],
          type: sequelize.QueryTypes.SELECT
        });
      },

      findByDependantForIndependentDownloads: function(package){
        return sequelize.query("SELECT DISTINCT b.package_name FROM Dependencies a,PackageVersions b where a.dependency_name = :name and a.dependant_version_id=b.id and a.type!='enhances'",{ replacements: { name: package }, type: sequelize.QueryTypes.SELECT });
      }
    }
  }

};
