const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "proctoring",
  password: "danikek2008",
  port: 5432
});

module.exports = pool;