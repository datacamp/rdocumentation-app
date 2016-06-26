var dbm = global.dbm || require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
  db.addIndex('Reviews', 'review_user', ['reviewable', 'reviewable_id', 'user_id'], true, callback);
};

exports.down = function(db, callback) {
  callback();
};
