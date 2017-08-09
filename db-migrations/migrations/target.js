
exports.up = function(knex) {

  return knex.schema.createTable('target', function (table) {
    table.string('id').primary();
    table.integer('last_followers_page');
    table.integer('last_followers_page');
    table.integer('last_friends_page');
    table.string('followers_next_cursor');
    table.string('friends_next_cursor');
  });

  return knex.schema.createTable('affinity', function (table) {
    table.string('id').primary();
    table.integer('follows');
    table.integer('followed_by');
  });
};

exports.down = function(knex) {

  return knex.schema.dropTable('target');
  return knex.schema.dropTable('affinity');
};
