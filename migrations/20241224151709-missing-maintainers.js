// 'use strict';

// var dbm;
// var type;
// var seed;
// var fs = require('fs');
// var path = require('path');
// var Promise;

// /**
//   * We receive the dbmigrate dependency from dbmigrate initially.
//   * This enables us to not have to rely on NODE_PATH.
//   */
// exports.setup = function(options, seedLink) {
//   dbm = options.dbmigrate;
//   type = dbm.dataType;
//   seed = seedLink;
//   Promise = options.Promise;
// };

// function readSQLFile(filePath) {
//   return new Promise((resolve, reject) => {
//     fs.readFile(filePath, { encoding: 'utf-8' }, (err, data) => {
//       if (err) return reject(err);
//       resolve(data);
//     });
//   });
// }

// exports.up = function(db) {
//   var filePath = path.join(__dirname, 'sqls', '20241224151709-missing-maintainers-up.sql');
//   return readSQLFile(filePath).then(data => db.runSql(data));
// };

// exports.down = function(db) {
//   var filePath = path.join(__dirname, 'sqls', '20241224151709-missing-maintainers-down.sql');
//   return readSQLFile(filePath).then(data => db.runSql(data));
// };

// exports._meta = {
//   "version": 1
// };