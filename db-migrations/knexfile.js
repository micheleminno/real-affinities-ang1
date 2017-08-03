module.exports = {
  development: {
    client: "mysql",
    connection: {
      database: "test",
      host:     "mysql",
      user:     "test",
      password: "test",
    },
  },
  production: {
    client: "mysql",
    connection: {
      database: "production",
      host:     "mysql",
      user:     "production",
      password: "production",
    },
  },
};
