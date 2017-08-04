
exports.up = function(knex) {
  return knex.schema.createTable('target', function (table) {
    table.increments();
    table.string('name');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('target');
};
