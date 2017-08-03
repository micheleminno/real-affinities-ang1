module.exports = {
  development: {
    client: "mysql",
    connection: {
      database: "real-affinities-test",
      host:     "mysql",
      user:     "test",
      password: "test",
    },
  },
  production: {
    client: "mysql",
    connection: {
      database: "real-affinities",
      host:     "mysql",
      user:     "production",
      password: "production",
    },
  },
};
