const { Pool } = require("pg");

// const username = "senecamanu";
// const password = "senecamanu";
// const port = "5432";
// const db = "jubelio";

// const connectionString = `postgres://${username}:${password}@jubelio-code-test.cajdxpz9jd7y.ap-southeast-1.rds.amazonaws.com:${port}/${db}`;
// const connectionString = `postgres://${username}:${password}@jubelio.cajdxpz9jd7y.ap-southeast-1.rds.amazonaws.com:${port}/${db}`;

// const pool = new Pool({
//   connectionString
// });

const pool = new Pool();

const query = async (text, params) => {
  try {
    const query = await pool.query(text, params);
    return {
      success: true,
      response: query
    };
  } catch (err) {
    return {
      success: false,
      error: err
    };
  }
};

module.exports = {
  query
};
