const { Pool } = require("pg");
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
