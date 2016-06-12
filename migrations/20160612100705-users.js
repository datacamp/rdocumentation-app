'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db, cb) {
  db.createTable('Users', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    username: { type: 'string', unique: true, notNull: true},
    password: { type: 'string', notNull: true },
    created_at: { type: 'datetime', notNull: true},
    updated_at: { type: 'datetime', notNull: true}
  }, cb);
};

exports.down = function(db, cb) {
  db.dropTable('Users', { ifExists: true }, cb);
};
