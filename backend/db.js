const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "proctoring",
  password: "c2900a8bdd",
  port: 5432,
});

module.exports = pool;
